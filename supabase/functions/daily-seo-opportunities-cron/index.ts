import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// 🔥 CORRECTION : Interface pour typer les données
interface Product {
  id: string;
  title: string;
  category: string | null;
  sub_category: string | null;
  product_type: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  ai_color: string | null;
  ai_material: string | null;
}

interface Opportunity {
  article_title: string;
  meta_description: string;
  intro_excerpt: string;
  type: string;
  primary_keywords: string[];
  secondary_keywords: string[];
  product_count: number;
  estimated_word_count: number;
  seo_opportunity_score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  structure: {
    h2_sections: string[];
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      console.error("❌ OpenAI API key not configured");
      return new Response(
        JSON.stringify({
          error: "OpenAI API key not configured",
          success: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🚀 Starting SEO opportunities generation...");

    // 🔥 CORRECTION : Meilleure récupération des produits
    const { data: products, error: fetchError } = await supabase
      .from('shopify_products')
      .select('id, title, category, sub_category, product_type, tags, seo_title, seo_description, ai_color, ai_material')
      .limit(500); // Limite pour éviter les timeouts

    if (fetchError) {
      console.error("❌ Error fetching products:", fetchError);
      throw fetchError;
    }

    if (!products || products.length === 0) {
      console.log("ℹ️ No products found in database");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No products to process",
          opportunities_generated: 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Found ${products.length} products`);

    // 🔥 CORRECTION : Récupération plus robuste des données de la boutique
    const { data: store, error: storeError } = await supabase
      .from('shopify_stores')
      .select('store_name, domain, language')
      .limit(1)
      .maybeSingle();

    if (storeError) {
      console.warn("⚠️ Could not fetch store info:", storeError);
    }

    const storeName = store?.store_name || store?.domain || 'Notre boutique';
    const language = store?.language || 'fr';

    console.log(`🏪 Store: ${storeName}, Language: ${language}`);

    // 🔥 CORRECTION : Préparation des données avec gestion des null
    const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];
    const subCategories = [...new Set(products.map(p => p.sub_category).filter(Boolean))] as string[];
    const colors = [...new Set(products.map(p => p.ai_color).filter(Boolean))].slice(0, 8) as string[];
    const materials = [...new Set(products.map(p => p.ai_material).filter(Boolean))].slice(0, 8) as string[];
    
    const allTags = products.flatMap(p => p.tags || []).filter(Boolean);
    const popularTags = [...new Set(allTags)].slice(0, 10) as string[];

    const randomProduct = products[Math.floor(Math.random() * products.length)];

    // 🔥 CORRECTION : Prompt simplifié et plus robuste
    const analysisPrompt = `En tant qu'expert SEO e-commerce, génère 5 opportunités d'articles de blog basées sur ce catalogue:

Boutique: ${storeName}
Nombre de produits: ${products.length}
Catégories principales: ${categories.join(', ')}
Tags populaires: ${popularTags.join(', ')}

Génère 5 opportunités variées:
1. Un guide de catégorie
2. Un article de comparaison  
3. Un focus produit
4. Un article sur les tendances
5. Un guide d'achat

Pour chaque opportunité, fournis au format JSON:
- article_title
- meta_description (150 caractères max)
- intro_excerpt
- type
- primary_keywords (3-5 mots)
- secondary_keywords (5-8 mots)  
- estimated_word_count
- difficulty (easy/medium/hard)
- seo_opportunity_score (0-100)
- structure.h2_sections (4-6 sections)

Réponds UNIQUEMENT en JSON valide.`;

    console.log("🤖 Calling OpenAI API...");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un expert SEO e-commerce. Réponds UNIQUEMENT en JSON valide, sans texte supplémentaire."
          },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ OpenAI API error:", response.status, errorText);
      throw new Error(`OpenAI API failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ OpenAI response received");

    const aiResponse = result.choices[0].message.content.trim();
    console.log("AI Response:", aiResponse);

    // 🔥 CORRECTION : Parsing plus robuste du JSON
    let opportunitiesData;
    try {
      opportunitiesData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error("❌ Failed to parse AI response:", parseError);
      // Fallback: générer des opportunités basiques
      opportunitiesData = {
        opportunities: generateFallbackOpportunities(products, storeName, language)
      };
    }

    if (!opportunitiesData.opportunities || !Array.isArray(opportunitiesData.opportunities)) {
      console.error("❌ Invalid opportunities structure");
      opportunitiesData.opportunities = generateFallbackOpportunities(products, storeName, language);
    }

    console.log(`📊 Generated ${opportunitiesData.opportunities.length} opportunities`);

    // 🔥 CORRECTION : Ne pas supprimer les anciennes opportunités automatiquement
    // On laisse l'utilisateur gérer la suppression manuellement

    const insertedOpportunities = [];

    for (const opp of opportunitiesData.opportunities.slice(0, 5)) {
      try {
        // 🔥 CORRECTION : Logique de matching des produits améliorée
        const relatedProducts = findRelatedProducts(products, opp);
        const productIds = relatedProducts.slice(0, 10).map(p => p.id);

        const opportunityData = {
          article_title: opp.article_title || `Article SEO - ${new Date().toLocaleDateString()}`,
          meta_description: opp.meta_description || "Article optimisé SEO généré automatiquement",
          intro_excerpt: opp.intro_excerpt || "Découvrez notre guide complet...",
          type: opp.type || 'category-guide',
          primary_keywords: Array.isArray(opp.primary_keywords) ? opp.primary_keywords : ['guide', 'achat', 'conseils'],
          secondary_keywords: Array.isArray(opp.secondary_keywords) ? opp.secondary_keywords : [],
          product_ids: productIds,
          product_count: productIds.length,
          estimated_word_count: opp.estimated_word_count || 2000,
          seo_opportunity_score: opp.seo_opportunity_score || 75,
          difficulty: opp.difficulty || 'medium',
          structure: opp.structure || { h2_sections: ['Introduction', 'Produits', 'Conseils', 'Conclusion'] },
          status: 'identified',
          language: language,
          generated_at: new Date().toISOString()
        };

        const { data, error: insertError } = await supabase
          .from('blog_opportunities')
          .insert(opportunityData)
          .select()
          .single();

        if (insertError) {
          console.error("❌ Error inserting opportunity:", insertError);
        } else {
          insertedOpportunities.push(data);
          console.log(`✅ Inserted opportunity: ${opportunityData.article_title}`);
        }
      } catch (oppError) {
        console.error("❌ Error processing opportunity:", oppError);
      }
    }

    console.log("🎉 SEO opportunities generation completed");

    return new Response(
      JSON.stringify({
        success: true,
        message: "SEO opportunities generated successfully",
        opportunities_generated: insertedOpportunities.length,
        total_products: products.length,
        opportunities: insertedOpportunities
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("💥 Error in SEO opportunities function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// 🔥 CORRECTION : Fonction de fallback pour générer des opportunités basiques
function generateFallbackOpportunities(products: Product[], storeName: string, language: string): Opportunity[] {
  console.log("🔄 Generating fallback opportunities...");
  
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const mainCategory = categories[0] || 'Produits';
  
  return [
    {
      article_title: `Guide Complet pour Choisir ${mainCategory}`,
      meta_description: `Découvrez notre sélection de ${products.length} ${mainCategory.toLowerCase()} et nos conseils d'experts pour faire le bon choix.`,
      intro_excerpt: `Notre guide vous aide à naviguer parmi ${products.length} ${mainCategory.toLowerCase()} pour trouver celui qui correspond à vos besoins.`,
      type: 'category-guide',
      primary_keywords: [mainCategory, 'guide', 'achat'],
      secondary_keywords: ['conseils', 'comparaison', 'meilleur'],
      product_count: Math.min(products.length, 10),
      estimated_word_count: 2000,
      seo_opportunity_score: 80,
      difficulty: 'medium',
      structure: {
        h2_sections: ['Introduction', 'Notre Sélection', 'Conseils d\'Achat', 'FAQ']
      }
    },
    {
      article_title: `Top 5 ${mainCategory} en ${new Date().getFullYear()}`,
      meta_description: `Découvrez notre sélection des 5 meilleurs ${mainCategory.toLowerCase()} cette année basée sur nos tests et avis clients.`,
      intro_excerpt: `Nous avons testé et comparé ${products.length} ${mainCategory.toLowerCase()} pour vous présenter les 5 meilleurs modèles.`,
      type: 'comparison',
      primary_keywords: [mainCategory, 'top', 'comparaison'],
      secondary_keywords: ['meilleur', 'avis', 'test'],
      product_count: 5,
      estimated_word_count: 1500,
      seo_opportunity_score: 75,
      difficulty: 'easy',
      structure: {
        h2_sections: ['Notre Méthodologie', 'Les 5 Produits Sélectionnés', 'Tableau Comparatif', 'Notre Choix']
      }
    }
  ];
}

// 🔥 CORRECTION : Fonction améliorée pour trouver les produits liés
function findRelatedProducts(products: Product[], opportunity: Opportunity): Product[] {
  const keywords = [
    ...(opportunity.primary_keywords || []),
    ...(opportunity.secondary_keywords || [])
  ].map(kw => kw.toLowerCase());

  if (keywords.length === 0) {
    return products.slice(0, 5);
  }

  return products.filter(product => {
    const productText = [
      product.title,
      product.category,
      product.sub_category,
      product.product_type,
      ...(product.tags || [])
    ].filter(Boolean).join(' ').toLowerCase();

    return keywords.some(keyword => 
      productText.includes(keyword.toLowerCase())
    );
  }).slice(0, 10);
}