import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API key not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestData = await req.json();

    // ======================================================
    // 🔁 MODE AUTO : générer un article pour chaque opportunité SEO
    // ======================================================
    if (requestData.mode === "auto") {
      console.log("🧠 MODE AUTO : génération d’articles pour toutes les opportunités non publiées...");
      const { data: opportunities, error: oppError } = await supabase
        .from("blog_opportunities")
        .select("*")
        .neq("status", "published")
        .limit(requestData.limit || 5);

      if (oppError) throw oppError;
      if (!opportunities?.length) {
        return new Response(JSON.stringify({
          success: false,
          message: "Aucune opportunité SEO à traiter."
        }), { status: 200, headers: corsHeaders });
      }

      const results = [];
      for (const opp of opportunities) {
        console.log(`📝 Génération d’article pour ${opp.title} (${opp.category})`);

        const genReq = {
          mode: "manual",
          category: opp.category,
          subcategory: opp.sub_category,
          keywords: opp.target_keywords || [],
          language: "fr",
          word_count_min: 1800,
          word_count_max: 2500,
          opportunity_id: opp.id
        };

        const res = await generateSingleArticle(genReq, supabase, openaiKey);
        if (res.success) {
          await supabase
            .from("blog_opportunities")
            .update({
              status: "published",
              article_id: res.article_id,
              updated_at: new Date().toISOString()
            })
            .eq("id", opp.id);
        }
        results.push(res);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `${results.length} opportunités traitées.`,
        results
      }), { status: 200, headers: corsHeaders });
    }

    // ======================================================
    // ✍️ MODE MANUEL : Générer un seul article
    // ======================================================
    const result = await generateSingleArticle(requestData, supabase, openaiKey);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || "Unknown error"
    }), { status: 500, headers: corsHeaders });
  }
});


// ============================================================================
// 🧩 Fonction de génération d'un seul article
// ============================================================================
async function generateSingleArticle(requestData, supabase, openaiKey) {
  try {
    const category = requestData.category || "Mobilier";
    const title = requestData.keywords?.[0]
      ? `Guide Complet : ${requestData.keywords[0]}`
      : `Guide ${category}`;
    const keywords = requestData.keywords?.length
      ? requestData.keywords
      : [category, "guide achat", "comparatif"];
    const minWords = requestData.word_count_min || 1800;
    const maxWords = requestData.word_count_max || 2500;

    console.log(`🎯 Génération d’article pour ${title}`);

    // Recherche de produits liés
    const { data: products, error: prodError } = await supabase
      .from("shopify_products")
      .select("id, title, handle, image_url, price, category, ai_color, ai_material, body_html")
      .ilike("category", `%${category}%`)
      .limit(20);

    if (prodError) throw prodError;
    if (!products?.length) throw new Error(`Aucun produit trouvé pour la catégorie ${category}`);

    // Construction du prompt pour OpenAI
    const productNames = products.map(p => p.title).join(", ");
    const prompt = `
Rédige un article SEO HTML complet intitulé "${title}".
Intègre les produits suivants : ${productNames}.
Langue : Français.
Longueur : ${minWords}-${maxWords} mots.
Inclure les mots-clés : ${keywords.join(", ")}.
Structure : <h2>, <h3>, paragraphes HTML.
Termine par un appel à l’action engageant.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Tu es un rédacteur SEO expert en mobilier et décoration." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 12000
      })
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      throw new Error(`OpenAI Error: ${err}`);
    }

    const result = await aiResponse.json();
    let html = result.choices[0].message.content.trim();
    html = html.replace(/^```html\n?/, "").replace(/```$/, "").trim();

    // Enregistrement de l’article
    const { data: savedArticle, error: saveError } = await supabase
      .from("blog_articles")
      .insert([{
        title,
        content: html,
        meta_description: `Découvrez nos conseils pour choisir votre ${category}.`,
        target_keywords: keywords,
        related_product_ids: products.map(p => p.id),
        author: "AI Blog Writer",
        published: true,
        sync_status: "published",
        language: "fr",
        content_quality_score: 90,
        opportunity_id: requestData.opportunity_id || null
      }])
      .select()
      .single();

    if (saveError) throw saveError;

    console.log(`✅ Article sauvegardé : ${savedArticle.id}`);
    return { success: true, article_id: savedArticle.id, article: savedArticle };

  } catch (err) {
    console.error("Erreur génération article:", err);
    return { success: false, error: err.message };
  }
}
