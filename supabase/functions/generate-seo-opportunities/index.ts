import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Product {
  id: string;
  title: string;
  category: string;
  sub_category: string;
  product_type: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  ai_color?: string;
  ai_material?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { products, language = 'fr' } = await req.json();

    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "Products array is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const categoryGroups = new Map<string, Product[]>();
    const subCategoryGroups = new Map<string, Product[]>();

    products.forEach((product: Product) => {
      if (product.category) {
        const key = product.category;
        if (!categoryGroups.has(key)) {
          categoryGroups.set(key, []);
        }
        categoryGroups.get(key)!.push(product);
      }

      if (product.category && product.sub_category) {
        const key = `${product.category}:${product.sub_category}`;
        if (!subCategoryGroups.has(key)) {
          subCategoryGroups.set(key, []);
        }
        subCategoryGroups.get(key)!.push(product);
      }
    });

    const allOpportunities = [];

    for (const [category, categoryProducts] of categoryGroups.entries()) {
      if (categoryProducts.length >= 3) {
        const sampleProducts = categoryProducts.slice(0, 5);
        const keywords = [...new Set(
          categoryProducts
            .flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
            .filter(Boolean)
        )].slice(0, 10);

        const prompt = `Tu es un expert SEO et rédacteur e-commerce spécialisé dans le mobilier et la décoration.

Analyse ces informations de produits :
- Catégorie : ${category}
- Nombre de produits : ${categoryProducts.length}
- Exemples de produits : ${sampleProducts.map(p => p.title).join(', ')}
- Mots-clés disponibles : ${keywords.join(', ')}
- Langue cible : ${language}

Génère 3 idées d'articles de blog SEO optimisés pour cette catégorie.

Pour chaque article, fournis :
1. **Titre SEO optimisé** (moins de 65 caractères)
2. **Meta description** (150-160 caractères)
3. **Type d'article** : choisir parmi "category-guide", "comparison", "how-to", "product-spotlight", "seasonal"
4. **Mots-clés principaux** (3-5 keywords)
5. **Mots-clés secondaires** (3-5 keywords)
6. **Structure de l'article** (4-6 sections H2)
7. **Appel à l'action** (CTA vers produit/catégorie)
8. **Niveau d'opportunité SEO** : score de 0 à 100 basé sur la pertinence et le potentiel
9. **Difficulté** : "easy", "medium", ou "hard"
10. **Extrait introductif** (2-3 phrases engageantes)
11. **Nombre de mots estimé**

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "opportunities": [
    {
      "article_title": "...",
      "meta_description": "...",
      "type": "category-guide",
      "primary_keywords": ["..."],
      "secondary_keywords": ["..."],
      "structure": {
        "h1": "...",
        "h2_sections": ["...", "..."],
        "cta": "..."
      },
      "seo_opportunity_score": 85,
      "difficulty": "medium",
      "intro_excerpt": "...",
      "estimated_word_count": 2500
    }
  ]
}

Le ton doit être naturel, engageant, et orienté conversion.`;

        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: "Tu es un expert SEO spécialisé dans l'e-commerce. Tu génères des idées d'articles de blog optimisés pour le référencement naturel."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
        });

        if (!openaiResponse.ok) {
          console.error("OpenAI API error:", await openaiResponse.text());
          continue;
        }

        const openaiData = await openaiResponse.json();
        const content = openaiData.choices[0].message.content;

        let parsedContent;
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedContent = JSON.parse(jsonMatch[0]);
          } else {
            parsedContent = JSON.parse(content);
          }
        } catch (e) {
          console.error("Failed to parse OpenAI response:", content);
          continue;
        }

        if (parsedContent.opportunities && Array.isArray(parsedContent.opportunities)) {
          parsedContent.opportunities.forEach((opp: any) => {
            allOpportunities.push({
              category: category,
              subcategory: '',
              product_ids: categoryProducts.map(p => p.id),
              article_title: opp.article_title,
              meta_description: opp.meta_description,
              type: opp.type,
              primary_keywords: opp.primary_keywords,
              secondary_keywords: opp.secondary_keywords,
              structure: opp.structure,
              seo_opportunity_score: opp.seo_opportunity_score,
              difficulty: opp.difficulty,
              intro_excerpt: opp.intro_excerpt,
              estimated_word_count: opp.estimated_word_count,
              product_count: categoryProducts.length,
            });
          });
        }
      }
    }

    for (const [key, subCatProducts] of subCategoryGroups.entries()) {
      if (subCatProducts.length >= 3 && allOpportunities.length < 20) {
        const [category, subCategory] = key.split(':');
        const sampleProducts = subCatProducts.slice(0, 3);
        const keywords = [...new Set(
          subCatProducts
            .flatMap(p => p.tags ? p.tags.split(',').map(t => t.trim()) : [])
            .filter(Boolean)
        )].slice(0, 8);

        const prompt = `Tu es un expert SEO et rédacteur e-commerce.

Analyse ces informations de produits :
- Catégorie : ${category}
- Sous-catégorie : ${subCategory}
- Nombre de produits : ${subCatProducts.length}
- Exemples : ${sampleProducts.map(p => p.title).join(', ')}
- Mots-clés : ${keywords.join(', ')}
- Langue : ${language}

Génère 1 idée d'article de blog SEO optimisé spécifiquement pour cette sous-catégorie.

Réponds en JSON avec le même format que précédemment (1 seule opportunité).`;

        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
                content: "Tu es un expert SEO. Réponds uniquement en JSON valide."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const content = openaiData.choices[0].message.content;

          try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

            if (parsedContent.opportunities && Array.isArray(parsedContent.opportunities)) {
              parsedContent.opportunities.forEach((opp: any) => {
                allOpportunities.push({
                  category: category,
                  subcategory: subCategory,
                  product_ids: subCatProducts.map(p => p.id),
                  article_title: opp.article_title,
                  meta_description: opp.meta_description,
                  type: opp.type,
                  primary_keywords: opp.primary_keywords,
                  secondary_keywords: opp.secondary_keywords,
                  structure: opp.structure,
                  seo_opportunity_score: opp.seo_opportunity_score,
                  difficulty: opp.difficulty,
                  intro_excerpt: opp.intro_excerpt,
                  estimated_word_count: opp.estimated_word_count,
                  product_count: subCatProducts.length,
                });
              });
            }
          } catch (e) {
            console.error("Failed to parse subcategory response:", content);
          }
        }
      }
    }

    allOpportunities.sort((a, b) => b.seo_opportunity_score - a.seo_opportunity_score);

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: allOpportunities,
        total: allOpportunities.length
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error("Error in generate-seo-opportunities:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});