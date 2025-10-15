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

    const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
    const subCategories = [...new Set(products.map(p => p.sub_category).filter(Boolean))];
    const sampleTitles = products.slice(0, 10).map(p => p.title);
    const colors = [...new Set(products.map(p => p.ai_color).filter(Boolean))].slice(0, 8);
    const materials = [...new Set(products.map(p => p.ai_material).filter(Boolean))].slice(0, 8);

    const analysisPrompt = `Tu es un expert SEO e-commerce. Analyse ces données et génère 5-10 opportunités d'articles de blog à fort potentiel SEO.

Données du catalogue:
- ${products.length} produits
- Catégories: ${categories.join(', ')}
- Sous-catégories: ${subCategories.slice(0, 10).join(', ')}${subCategories.length > 10 ? '...' : ''}
- Exemples de titres de produits: ${sampleTitles.join(', ')}
- Couleurs disponibles: ${colors.length > 0 ? colors.join(', ') : 'N/A'}
- Matériaux disponibles: ${materials.length > 0 ? materials.join(', ') : 'N/A'}

IMPORTANT: Base tes opportunités UNIQUEMENT sur:
- Les catégories et sous-catégories
- Les titres de produits réels
- Les couleurs et matériaux
- Les caractéristiques des produits

N'utilise JAMAIS les noms de marques, vendeurs ou fabricants.

Pour chaque opportunité, fournis:
1. article_title: Titre SEO-optimisé basé sur catégorie/caractéristiques produits
2. meta_description: Meta description (150-160 caractères)
3. intro_excerpt: Extrait d'introduction (2-3 phrases)
4. type: Type d'article ('category-guide', 'comparison', 'how-to', 'product-spotlight', 'seasonal')
5. primary_keywords: Array de 3-5 mots-clés basés sur catégories et caractéristiques produits
6. secondary_keywords: Array de 5-10 mots-clés extraits des titres de produits
7. product_count: Nombre estimé de produits liés
8. estimated_word_count: Nombre de mots recommandé (1500-3000)
9. seo_opportunity_score: Score SEO sur 100 (potentiel de trafic)
10. difficulty: Difficulté ('easy', 'medium', 'hard')
11. structure: Objet avec h2_sections (array de 4-6 titres H2)

Réponds UNIQUEMENT avec un JSON valide:
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

    for (const opp of opportunitiesData.opportunities) {
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
        opportunities_generated: opportunitiesData.opportunities.length,
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