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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    if (!deepseekKey && !openaiKey) {
      throw new Error("Missing AI API keys (DeepSeek or OpenAI required)");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const requestBody = await req.json();
    const language = requestBody.language || "fr";
    let products = requestBody.products || [];

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

    const opportunities = await generateOpportunities(products, language, aiKey, useDeepSeek);

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

  const productSummary = products.slice(0, 20).map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    sub_category: p.sub_category,
  }));

  const prompt = `
Tu es un expert SEO e-commerce francophone. Analyse les produits suivants pour identifier des opportunités d'articles de blog optimisés SEO.

📊 ANALYSE DU CATALOGUE:
- ${products.length} produits disponibles
- Catégories: ${categories.join(", ") || "Non spécifié"}
- Sous-catégories: ${subCategories.slice(0, 10).join(", ") || "Non spécifié"}
- Couleurs disponibles: ${colors.slice(0, 10).join(", ") || "Non spécifié"}
- Matériaux: ${materials.slice(0, 10).join(", ") || "Non spécifié"}

🎯 EXEMPLES DE PRODUITS:
${productSummary.map((p) => `- ${p.title} (${p.category || "Sans catégorie"})`).join("\n")}

📝 MISSION:
Génère EXACTEMENT 5 idées structurées d'articles SEO optimisés. Pour chaque article:
1. Identifie 3-5 produits pertinents à mettre en avant (utilise leurs IDs)
2. Crée un titre accrocheur et optimisé SEO
3. Définis une structure claire avec sections H2
4. Choisis des mots-clés pertinents

IMPORTANT: Pour featured_products, utilise UNIQUEMENT des IDs de produits existants dans la liste ci-dessus.

Format de réponse (JSON STRICT):
{
  "opportunities": [
    {
      "article_title": "Titre optimisé SEO avec mot-clé principal",
      "meta_description": "Description SEO 150-160 caractères engageante",
      "intro_excerpt": "Introduction captivante de 2-3 phrases pour attirer le lecteur",
      "type": "store-guide|buying-guide|comparison|top-10|industry-topic",
      "primary_keywords": ["mot-clé principal", "variante mot-clé"],
      "secondary_keywords": ["mot-clé secondaire 1", "mot-clé secondaire 2"],
      "structure": {
        "h2_sections": ["Section 1: Introduction", "Section 2: Guide pratique", "Section 3: Conseils d'experts", "Section 4: Nos recommandations", "Section 5: Conclusion"]
      },
      "seo_opportunity_score": 85,
      "difficulty": "easy|medium|hard",
      "estimated_word_count": 2000,
      "featured_products": [
        {"id": "product_id_1", "title": "Nom du produit 1", "relevance": "Pourquoi ce produit est pertinent"},
        {"id": "product_id_2", "title": "Nom du produit 2", "relevance": "Pourquoi ce produit est pertinent"}
      ]
    }
  ]
}

TYPES D'ARTICLES:
- store-guide: Guide complet de la boutique/collection
- buying-guide: Guide d'achat pratique
- comparison: Comparaison de produits/styles
- top-10: Liste des meilleurs produits
- industry-topic: Tendances et actualités du secteur

Réponds UNIQUEMENT avec le JSON, sans texte additionnel.`;

  const apiUrl = useDeepSeek
    ? "https://api.deepseek.com/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const model = useDeepSeek ? "deepseek-chat" : "gpt-4o";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "system",
          content: "Tu es un expert SEO e-commerce. Réponds UNIQUEMENT en JSON valide, sans markdown ni texte additionnel.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: useDeepSeek ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  let content = data.choices[0].message.content.trim();

  // Nettoyer le contenu si nécessaire
  content = content.replace(/^```json\n?/, "").replace(/```$/, "").trim();

  const json = JSON.parse(content);
  return json.opportunities || [];
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
