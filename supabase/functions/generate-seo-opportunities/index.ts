import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};
Deno.serve(async (req)=>{
  if (req.method === "OPTIONS") return new Response(null, {
    status: 200,
    headers: corsHeaders
  });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!supabaseUrl || !supabaseKey || !deepseekKey || !openaiKey) {
      throw new Error("Missing required API keys or Supabase credentials");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // 🔍 Récupérer les produits
    const { data: products, error: productError } = await supabase.from("shopify_products").select("id, title, category, sub_category, product_type, tags, seo_title, seo_description, ai_color, ai_material").limit(150);
    if (productError) throw productError;
    if (!products?.length) {
      return respond(200, {
        success: true,
        message: "Aucun produit à analyser",
        opportunities: []
      });
    }
    console.log(`🚀 ${products.length} produits trouvés. Génération des opportunités SEO via DeepSeek...`);
    // ⚡ 1️⃣ Générer les opportunités avec DeepSeek
    const opportunities = await generateOpportunities(products, "fr", deepseekKey);
    if (!opportunities.length) {
      return respond(200, {
        success: true,
        message: "Aucune opportunité générée"
      });
    }
    // ⚡ 2️⃣ Sauvegarder les opportunités et générer automatiquement les articles
    const created = [];
    for (const opp of opportunities){
      try {
        const { data: inserted, error: insertError } = await supabase.from("blog_opportunities").insert({
          title: opp.article_title,
          meta_description: opp.meta_description,
          intro_excerpt: opp.intro_excerpt,
          type: opp.type,
          primary_keywords: opp.primary_keywords,
          secondary_keywords: opp.secondary_keywords,
          structure: opp.structure,
          seo_opportunity_score: opp.seo_opportunity_score,
          difficulty: opp.difficulty,
          estimated_word_count: opp.estimated_word_count,
          status: "pending",
          language: "fr"
        }).select().single();
        if (insertError) throw insertError;
        // ⚡ 3️⃣ Générer l’article associé directement
        const article = await generateArticleFromOpportunity(inserted, supabase, openaiKey);
        if (article.success) {
          await supabase.from("blog_opportunities").update({
            status: "published",
            article_id: article.article_id,
            updated_at: new Date().toISOString()
          }).eq("id", inserted.id);
        }
        created.push({
          opportunity: inserted,
          article
        });
      } catch (err) {
        console.error("❌ Erreur lors du traitement d'une opportunité :", err);
      }
    }
    return respond(200, {
      success: true,
      message: `${created.length} opportunités créées et articles générés.`,
      results: created
    });
  } catch (error) {
    console.error("💥 Error:", error);
    return respond(500, {
      success: false,
      error: error.message
    });
  }
});
// ===========================================================
// ✳️ Fonction de génération d'opportunités (DeepSeek)
// ===========================================================
async function generateOpportunities(products, language, apiKey) {
  const prompt = `
Tu es un expert SEO e-commerce francophone. Analyse les produits suivants pour identifier des opportunités d’articles de blog optimisés SEO.

Produits:
${products.slice(0, 10).map((p)=>p.title).join("\n")}

Génère EXACTEMENT 5 idées structurées d’articles SEO au format JSON:
{
  "opportunities": [
    {
      "article_title": "Titre optimisé SEO",
      "meta_description": "Description courte 150-160 caractères",
      "intro_excerpt": "Introduction 2-3 phrases engageantes",
      "type": "category-guide|comparison|how-to|top-10|industry-topic",
      "primary_keywords": ["mot1", "mot2"],
      "secondary_keywords": ["mot3", "mot4"],
      "structure": { "h2_sections": ["Section 1", "Section 2", "Section 3"] },
      "seo_opportunity_score": 85,
      "difficulty": "medium",
      "estimated_word_count": 2000
    }
  ]
}`;
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "Tu es un expert SEO. Réponds uniquement en JSON valide."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: {
        type: "json_object"
      }
    })
  });
  if (!response.ok) throw new Error(`DeepSeek error: ${response.status}`);
  const data = await response.json();
  const json = JSON.parse(data.choices[0].message.content);
  return json.opportunities || [];
}
// ===========================================================
// 🧠 Fonction de génération d’article à partir d’une opportunité
// ===========================================================
async function generateArticleFromOpportunity(opportunity, supabase, openaiKey) {
  try {
    const category = opportunity.primary_keywords?.[0] || "Mobilier";
    // Récupérer produits liés
    const { data: products } = await supabase.from("shopify_products").select("id, title, image_url, price, body_html, category").ilike("category", `%${category}%`).limit(10);
    const productList = products?.map((p)=>p.title).join(", ") || "aucun produit disponible";
    const prompt = `
Rédige un article HTML complet intitulé "${opportunity.article_title}".
Langue: français.
Thématique: ${category}.
Mots-clés: ${opportunity.primary_keywords?.join(", ") || ""}
Produits mentionnés: ${productList}.
Longueur: ${opportunity.estimated_word_count || 1800} mots.
Structure basée sur: ${JSON.stringify(opportunity.structure.h2_sections)}.
Style naturel, fluide, optimisé SEO.
`;
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un rédacteur SEO expert en mobilier et décoration intérieure."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });
    if (!aiResponse.ok) throw new Error(`OpenAI Error: ${aiResponse.statusText}`);
    const result = await aiResponse.json();
    let html = result.choices[0].message.content.trim();
    html = html.replace(/^```html\n?/, "").replace(/```$/, "").trim();
    const { data: article, error: insertError } = await supabase.from("blog_articles").insert([
      {
        title: opportunity.article_title,
        content: html,
        meta_description: opportunity.meta_description,
        target_keywords: opportunity.primary_keywords,
        author: "AI Blog Writer",
        published: true,
        sync_status: "published",
        language: "fr",
        content_quality_score: 90,
        opportunity_id: opportunity.id
      }
    ]).select().single();
    if (insertError) throw insertError;
    console.log(`✅ Article créé: ${article.id}`);
    return {
      success: true,
      article_id: article.id,
      article
    };
  } catch (err) {
    console.error("Erreur génération article:", err);
    return {
      success: false,
      error: err.message
    };
  }
}
// ===========================================================
// Helper Response
// ===========================================================
function respond(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
