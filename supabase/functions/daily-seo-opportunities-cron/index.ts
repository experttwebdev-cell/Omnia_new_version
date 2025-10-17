import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
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
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OpenAI API key not configured");
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log("🚀 Starting Daily SEO Opportunities & Article Generation...");
    // 1️⃣ Charger les produits
    const { data: products, error: fetchError } = await supabase.from("shopify_products").select("id, title, category, sub_category, product_type, tags, seo_title, seo_description, ai_color, ai_material, image_url, body_html, price").limit(500);
    if (fetchError) throw fetchError;
    if (!products?.length) return respond(200, {
      success: true,
      message: "No products available."
    });
    console.log(`✅ Found ${products.length} products`);
    // 2️⃣ Récupérer les infos de la boutique
    const { data: store } = await supabase.from("shopify_stores").select("store_name, domain, language").limit(1).maybeSingle();
    const storeName = store?.store_name || "Notre boutique";
    const language = store?.language || "fr";
    // 3️⃣ Générer les opportunités avec GPT-4o-mini
    const analysisPrompt = `
En tant qu'expert SEO e-commerce, génère 5 idées d'articles basées sur ce catalogue :
Boutique : ${storeName}
Nombre de produits : ${products.length}
Catégories principales : ${[
      ...new Set(products.map((p)=>p.category).filter(Boolean))
    ].join(", ")}

Pour chaque idée :
- article_title
- meta_description (150 caractères)
- intro_excerpt
- type (category-guide|comparison|focus|trend|buying-guide)
- primary_keywords
- secondary_keywords
- estimated_word_count
- difficulty (easy|medium|hard)
- seo_opportunity_score (0-100)
- structure.h2_sections (4 à 6 titres)
Réponds uniquement en JSON valide.
`;
    console.log("🤖 Calling OpenAI for opportunities...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un expert SEO e-commerce. Réponds uniquement en JSON valide sans texte additionnel."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: {
          type: "json_object"
        }
      })
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const result = await response.json();
    const aiResponse = result.choices[0].message.content.trim();
    let opportunitiesData;
    try {
      opportunitiesData = JSON.parse(aiResponse);
    } catch  {
      opportunitiesData = {
        opportunities: generateFallbackOpportunities(products)
      };
    }
    const opportunities = opportunitiesData.opportunities?.slice(0, 5) || [];
    console.log(`📊 ${opportunities.length} SEO opportunities generated`);
    const createdResults = [];
    // 4️⃣ Boucler sur chaque opportunité pour créer article + update DB
    for (const opp of opportunities){
      try {
        const relatedProducts = findRelatedProducts(products, opp);
        const productIds = relatedProducts.map((p)=>p.id);
        const { data: inserted, error: insertError } = await supabase.from("blog_opportunities").insert({
          article_title: opp.article_title,
          meta_description: opp.meta_description,
          intro_excerpt: opp.intro_excerpt,
          type: opp.type,
          primary_keywords: opp.primary_keywords,
          secondary_keywords: opp.secondary_keywords,
          estimated_word_count: opp.estimated_word_count,
          difficulty: opp.difficulty,
          seo_opportunity_score: opp.seo_opportunity_score,
          structure: opp.structure,
          product_ids: productIds,
          language,
          status: "identified",
          generated_at: new Date().toISOString()
        }).select().single();
        if (insertError) throw insertError;
        // 5️⃣ Générer l’article complet
        const article = await generateArticleFromOpportunity(inserted, relatedProducts, supabase, openaiKey);
        if (article.success) {
          await supabase.from("blog_opportunities").update({
            status: "published",
            article_id: article.article_id,
            updated_at: new Date().toISOString()
          }).eq("id", inserted.id);
        }
        createdResults.push({
          opportunity: inserted,
          article: article
        });
      } catch (err) {
        console.error("❌ Error during opportunity/article creation:", err);
      }
    }
    console.log("🎉 Daily SEO Opportunity job completed");
    return respond(200, {
      success: true,
      message: `${createdResults.length} articles generated and published.`,
      results: createdResults
    });
  } catch (err) {
    console.error("💥 Global Error:", err);
    return respond(500, {
      success: false,
      error: err.message
    });
  }
});
// ==============================
// 🧠 Article Generation Function
// ==============================
async function generateArticleFromOpportunity(opportunity, products, supabase, openaiKey) {
  try {
    const productList = products.slice(0, 6).map((p)=>`${p.title} (${p.price}€)`).join(", ");
    const prompt = `
Rédige un article HTML complet intitulé "${opportunity.article_title}".
Langue: Français.
Inclure les produits: ${productList}.
Structure H2: ${JSON.stringify(opportunity.structure?.h2_sections || [])}.
Longueur: ${opportunity.estimated_word_count || 1800} mots.
Style: professionnel, fluide, optimisé SEO.
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
            content: "Tu es un rédacteur SEO expert spécialisé en mobilier et décoration."
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
    if (!aiResponse.ok) throw new Error(`OpenAI Article Error: ${aiResponse.statusText}`);
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
    console.log(`✅ Article created: ${article.id}`);
    return {
      success: true,
      article_id: article.id
    };
  } catch (error) {
    console.error("❌ Error generating article:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
// ==============================
// 🧩 Helpers
// ==============================
function respond(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
function generateFallbackOpportunities(products) {
  const cat = [
    ...new Set(products.map((p)=>p.category).filter(Boolean))
  ][0] || "Produits";
  return [
    {
      article_title: `Guide Complet pour Choisir ${cat}`,
      meta_description: `Découvrez nos conseils et les meilleurs ${cat.toLowerCase()} du moment.`,
      intro_excerpt: `Notre guide vous aide à choisir le ${cat.toLowerCase()} parfait.`,
      type: "category-guide",
      primary_keywords: [
        cat,
        "guide",
        "achat"
      ],
      secondary_keywords: [
        "comparaison",
        "meilleur",
        "tendances"
      ],
      estimated_word_count: 2000,
      difficulty: "medium",
      seo_opportunity_score: 80,
      structure: {
        h2_sections: [
          "Introduction",
          "Conseils",
          "Produits",
          "Conclusion"
        ]
      }
    }
  ];
}
function findRelatedProducts(products, opportunity) {
  const keywords = [
    ...opportunity.primary_keywords || [],
    ...opportunity.secondary_keywords || []
  ].map((kw)=>kw.toLowerCase());
  if (!keywords.length) return products.slice(0, 6);
  return products.filter((p)=>{
    const text = [
      p.title,
      p.category,
      p.sub_category,
      p.product_type,
      ...p.tags || []
    ].filter(Boolean).join(" ").toLowerCase();
    return keywords.some((kw)=>text.includes(kw));
  }).slice(0, 8);
}
