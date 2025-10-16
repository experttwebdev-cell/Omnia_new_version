import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
      throw new Error("OpenAI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting daily SEO opportunities generation...");

    const { data: products, error: fetchError } = await supabase
      .from('shopify_products')
      .select('id, title, category, sub_category, product_type, tags, seo_title, seo_description, ai_color, ai_material');

    if (fetchError) {
      console.error("Error fetching products:", fetchError);
      throw fetchError;
    }

    if (!products || products.length === 0) {
      console.log("No products found in database");
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

    console.log(`Found ${products.length} products. Analyzing...`);

    const { data: store } = await supabase
      .from('shopify_stores')
      .select('store_name, domain')
      .limit(1)
      .maybeSingle();

    const storeName = store?.store_name || store?.domain || 'Notre boutique';

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const subCategories = [...new Set(products.map(p => p.sub_category).filter(Boolean))];
    const sampleTitles = products.slice(0, 10).map(p => p.title);
    const colors = [...new Set(products.map(p => p.ai_color).filter(Boolean))].slice(0, 8);
    const materials = [...new Set(products.map(p => p.ai_material).filter(Boolean))].slice(0, 8);
    const allTags = products.flatMap(p => p.tags || []).filter(Boolean);
    const popularTags = [...new Set(allTags)].slice(0, 10);

    const randomProduct = products[Math.floor(Math.random() * products.length)];

    const analysisPrompt = `Tu es un expert SEO e-commerce. G\u00e9n\u00e8re EXACTEMENT 5 opportunit\u00e9s d'articles de blog avec ces types sp\u00e9cifiques:

Donn\u00e9es du catalogue:
- ${products.length} produits
- Nom de la boutique: ${storeName}
- Cat\u00e9gories: ${categories.join(', ')}
- Sous-cat\u00e9gories: ${subCategories.slice(0, 10).join(', ')}${subCategories.length > 10 ? '...' : ''}
- Tags populaires: ${popularTags.join(', ')}
- Produit al\u00e9atoire: ${randomProduct.title}
- Couleurs disponibles: ${colors.length > 0 ? colors.join(', ') : 'N/A'}
- Mat\u00e9riaux disponibles: ${materials.length > 0 ? materials.join(', ') : 'N/A'}

G\u00c9N\u00c8RE EXACTEMENT CES 5 TYPES D'OPPORTUNIT\u00c9S (1 de chaque):

1. GUIDE G\u00c9N\u00c9RAL ('category-guide'):
   - Un guide complet sur la cat\u00e9gorie principale
   - Ex: "Guide Complet pour Choisir [Cat\u00e9gorie Principale]"
   - Doit couvrir plusieurs produits de la m\u00eame cat\u00e9gorie

2. ARTICLE PAR CAT\u00c9GORIE ('comparison'):
   - Article de comparaison sur une sous-cat\u00e9gorie sp\u00e9cifique
   - Ex: "Top 10 [Sous-Cat\u00e9gorie] en ${new Date().getFullYear()}"
   - Focus sur une sous-cat\u00e9gorie populaire

3. SPOTLIGHT PRODUIT AL\u00c9ATOIRE ('product-spotlight'):
   - Focus sur ce produit al\u00e9atoire: "${randomProduct.title}"
   - Article d\u00e9taill\u00e9 sur ses caract\u00e9ristiques, usage, avantages
   - Optimis\u00e9 pour le titre exact du produit

4. ARTICLE TENDANCE/NOUVEAUT\u00c9S ('seasonal'):
   - Bas\u00e9 sur les tags populaires: ${popularTags.slice(0, 3).join(', ')}
   - Ex: "Tendances [Tag] ${new Date().getFullYear()}: Ce Qu'il Faut Savoir"
   - Focus sur l'actualit\u00e9 et les nouveaut\u00e9s

5. ARTICLE SUR LA BOUTIQUE ('how-to'):
   - Article sur l'expertise de ${storeName}
   - Ex: "Pourquoi Choisir ${storeName} pour [Activit\u00e9/Cat\u00e9gorie]"
   - Met en avant l'expertise et la s\u00e9lection de produits

IMPORTANT:
- N'utilise JAMAIS les noms de marques ou vendeurs
- Base tout sur cat\u00e9gories, caract\u00e9ristiques, tags
- EXACTEMENT 5 opportunit\u00e9s, pas plus, pas moins

Pour chaque opportunit\u00e9, fournis:
1. article_title: Titre SEO-optimis\u00e9
2. meta_description: Meta description (150-160 caract\u00e8res)
3. intro_excerpt: Extrait d'introduction (2-3 phrases)
4. type: Type exact sp\u00e9cifi\u00e9 ci-dessus
5. primary_keywords: Array de 3-5 mots-cl\u00e9s
6. secondary_keywords: Array de 5-10 mots-cl\u00e9s
7. product_count: Nombre estim\u00e9 de produits li\u00e9s
8. estimated_word_count: Nombre de mots recommand\u00e9 (1500-3000)
9. seo_opportunity_score: Score SEO sur 100
10. difficulty: Difficult\u00e9 ('easy', 'medium', 'hard')
11. structure: Objet avec h2_sections (array de 4-6 titres H2)

R\u00e9ponds UNIQUEMENT avec un JSON valide:
{
  "opportunities": [...]
}`;

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
            content: "Tu es un expert SEO spécialisé en e-commerce. Tu réponds UNIQUEMENT en JSON valide."
          },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.8,
        max_tokens: 3000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API failed: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0].message.content.trim();

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from AI response");
    }

    const opportunitiesData = JSON.parse(jsonMatch[0]);

    if (!opportunitiesData.opportunities || !Array.isArray(opportunitiesData.opportunities)) {
      throw new Error("Invalid opportunities data structure");
    }

    console.log(`Generated ${opportunitiesData.opportunities.length} opportunities`);

    const { error: deleteError } = await supabase
      .from('blog_opportunities')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error("Error clearing old opportunities:", deleteError);
    }

    const limitedOpportunities = opportunitiesData.opportunities.slice(0, 5);

    for (const opp of limitedOpportunities) {
      const categoryProducts = products.filter(p =>
        (opp.primary_keywords.some((kw: string) =>
          p.title?.toLowerCase().includes(kw.toLowerCase()) ||
          p.category?.toLowerCase().includes(kw.toLowerCase()) ||
          p.sub_category?.toLowerCase().includes(kw.toLowerCase())
        ))
      );

      const productIds = categoryProducts.slice(0, 15).map(p => p.id);

      const { error: insertError } = await supabase
        .from('blog_opportunities')
        .insert({
          article_title: opp.article_title,
          meta_description: opp.meta_description,
          intro_excerpt: opp.intro_excerpt,
          type: opp.type,
          primary_keywords: opp.primary_keywords,
          secondary_keywords: opp.secondary_keywords,
          product_ids: productIds,
          product_count: productIds.length,
          estimated_word_count: opp.estimated_word_count,
          seo_opportunity_score: opp.seo_opportunity_score,
          difficulty: opp.difficulty,
          structure: opp.structure,
          status: 'identified',
          language: 'fr',
          generated_at: new Date().toISOString()
        });

      if (insertError) {
        console.error("Error inserting opportunity:", insertError);
      }
    }

    console.log("Daily SEO opportunities generation completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "SEO opportunities generated successfully",
        opportunities_generated: limitedOpportunities.length,
        total_products: products.length
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in daily SEO cron:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});