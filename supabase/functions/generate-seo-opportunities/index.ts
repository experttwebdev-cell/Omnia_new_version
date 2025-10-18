import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🎯 Edge Function called");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("🔑 Keys check:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      hasDeepseek: !!deepseekKey,
      hasOpenAI: !!openaiKey,
    });

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    if (!deepseekKey && !openaiKey) {
      throw new Error("Missing AI API keys (DeepSeek or OpenAI required)");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    console.log("📥 Parsing request body...");
    const requestBody = await req.json();
    const language = requestBody.language || "fr";
    let products = requestBody.products || [];
    console.log(`📦 Products received: ${products.length}`);

    // 🔍 Si pas de produits dans la requête, récupérer depuis la DB
    if (!products || products.length === 0) {
      console.log("📦 Récupération des produits depuis la base de données...");
      const { data, error: productError } = await supabase
        .from("shopify_products")
        .select("id, title, category, sub_category, product_type, tags, seo_title, seo_description, ai_color, ai_material, image_url")
        .limit(150);

      if (productError) throw productError;
      products = data || [];
    }

    if (!products?.length) {
      return respond(200, {
        success: true,
        message: "Aucun produit à analyser",
        opportunities: [],
      });
    }

    console.log(`🚀 ${products.length} produits trouvés. Génération des opportunités SEO...`);

    // ⚡ 1️⃣ Générer les opportunités avec DeepSeek ou OpenAI
    const aiKey = deepseekKey || openaiKey;
    const useDeepSeek = !!deepseekKey;

    console.log(`🤖 Using AI provider: ${useDeepSeek ? 'DeepSeek' : 'OpenAI'}`);
    console.log("🚀 Calling AI API...");

    const opportunities = await generateOpportunities(products, language, aiKey, useDeepSeek);

    console.log(`✅ AI responded with ${opportunities.length} opportunities`);

    if (!opportunities.length) {
      return respond(200, {
        success: true,
        message: "Aucune opportunité générée",
        opportunities: [],
      });
    }

    // ⚡ 2️⃣ Enregistrer les opportunités (sans générer les articles automatiquement)
    const created = [];
    for (const opp of opportunities) {
      try {
        // Associer des produits featured
        const featuredProducts = opp.featured_products || [];

        const { data: inserted, error: insertError } = await supabase
          .from("blog_opportunities")
          .insert({
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
            featured_products: featuredProducts,
            status: "pending",
            language: language,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        created.push({
          opportunity: inserted,
          featured_products_count: featuredProducts.length,
        });
      } catch (err) {
        console.error("❌ Erreur lors du traitement d'une opportunité :", err);
      }
    }

    return respond(200, {
      success: true,
      message: `${created.length} opportunités créées avec succès.`,
      opportunities: created,
    });
  } catch (error) {
    console.error("💥 Error:", error);
    return respond(500, {
      success: false,
      error: error.message,
    });
  }
});

// ===========================================================
// ✳️ Fonction de génération d'opportunités
// ===========================================================
async function generateOpportunities(products, language, apiKey, useDeepSeek = true) {
  // Analyser les produits pour extraire les informations clés
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const subCategories = [...new Set(products.map((p) => p.sub_category).filter(Boolean))];
  const colors = [...new Set(products.map((p) => p.ai_color).filter(Boolean))];
  const materials = [...new Set(products.map((p) => p.ai_material).filter(Boolean))];

  const productSummary = products.slice(0, 10).map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    sub_category: p.sub_category,
  }));

  const prompt = `Expert SEO: génère 5 opportunités d'articles de blog.

PRODUITS (${products.length} total):
${productSummary.map((p) => `- [${p.id}] ${p.title}`).join("\n")}

Catégories: ${categories.slice(0, 5).join(", ")}
Couleurs: ${colors.slice(0, 5).join(", ")}
Matériaux: ${materials.slice(0, 5).join(", ")}

JSON requis (5 opportunités):
{
  "opportunities": [
    {
      "article_title": "Titre SEO optimisé",
      "meta_description": "Description 150-160 caractères",
      "intro_excerpt": "Introduction 2-3 phrases",
      "type": "buying-guide",
      "primary_keywords": ["mot-clé 1", "mot-clé 2"],
      "secondary_keywords": ["mot-clé 3"],
      "structure": {"h2_sections": ["Intro", "Guide", "Conseils", "Recommandations", "Conclusion"]},
      "seo_opportunity_score": 85,
      "difficulty": "easy",
      "estimated_word_count": 2000,
      "featured_products": [{"id": "product_id", "title": "Product", "relevance": "Pertinent car..."}]
    }
  ]
}

Types: store-guide, buying-guide, comparison, top-10, industry-topic
Difficulty: easy, medium, hard`;

  const apiUrl = useDeepSeek
    ? "https://api.deepseek.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const model = useDeepSeek ? "deepseek-chat" : "gpt-3.5-turbo";

  console.log(`📡 Calling ${model} at ${apiUrl}`);
  console.log(`📝 Prompt length: ${prompt.length} chars`);

  const requestBody = {
    model: model,
    messages: [
      {
        role: "system",
        content: "Expert SEO. Réponds en JSON strict.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: useDeepSeek ? { type: "json_object" } : undefined,
  };

  const startTime = Date.now();

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`⏱️ API response time: ${duration}s`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API error: ${response.status} - ${errorText}`);
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  console.log("📥 Parsing AI response...");
  const data = await response.json();
  let content = data.choices[0].message.content.trim();

  console.log(`📄 Response content length: ${content.length} chars`);

  // Nettoyer le contenu si nécessaire
  content = content.replace(/^```json\n?/, "").replace(/```$/, "").trim();

  console.log("🔍 Parsing JSON...");
  const json = JSON.parse(content);
  const opportunities = json.opportunities || [];

  console.log(`✅ Parsed ${opportunities.length} opportunities`);
  return opportunities;
}

// ===========================================================
// Helper Response
// ===========================================================
function respond(status, data) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
