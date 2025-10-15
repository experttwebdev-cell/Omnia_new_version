import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BlogRequest {
  mode: 'manual' | 'automatic';
  category?: string;
  subcategory?: string;
  keywords?: string[];
  language: string;
  word_count_min: number;
  word_count_max: number;
  output_format: 'markdown' | 'html';
  internal_linking: boolean;
  max_internal_links: number;
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
      throw new Error("OpenAI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const requestData: BlogRequest = await req.json();

    let topicData: any;

    if (requestData.mode === 'manual') {
      topicData = {
        category: requestData.category,
        subcategory: requestData.subcategory,
        keywords: requestData.keywords || []
      };
    } else {
      const { data: categories } = await supabase
        .from('shopify_products')
        .select('category, sub_category')
        .limit(100);

      const uniqueCategories = [...new Set(categories?.map(p => p.category).filter(Boolean))];
      const randomCategory = uniqueCategories[Math.floor(Math.random() * uniqueCategories.length)];

      const topicPrompt = `Tu es un expert SEO en e-commerce.
Génère un sujet d'article de blog à fort potentiel SEO pour la catégorie: ${randomCategory}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "title": "titre de l'article",
  "meta_description": "description méta (150-160 caractères)",
  "keywords": ["mot-clé1", "mot-clé2", "mot-clé3"]
}`;

      const topicResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Tu es un expert en SEO et marketing de contenu. Tu réponds UNIQUEMENT en JSON valide." },
            { role: "user", content: topicPrompt }
          ],
          temperature: 0.8,
          max_tokens: 300
        }),
      });

      if (!topicResponse.ok) {
        throw new Error(`OpenAI topic generation failed: ${topicResponse.statusText}`);
      }

      const topicResult = await topicResponse.json();
      const topicText = topicResult.choices[0].message.content.trim();

      const jsonMatch = topicText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from topic response");
      }

      topicData = JSON.parse(jsonMatch[0]);
      topicData.category = randomCategory;
    }

    let relatedProducts = [];
    if (requestData.internal_linking) {
      const query = supabase
        .from('shopify_products')
        .select('id, shopify_id, title, handle')
        .limit(requestData.max_internal_links * 2);

      if (topicData.category) {
        query.eq('category', topicData.category);
      }

      const { data } = await query;
      relatedProducts = data || [];
    }

    const productLinksInfo = relatedProducts.length > 0
      ? `\n\nProduits disponibles pour liens internes (utilise maximum ${requestData.max_internal_links}):\n${
          relatedProducts.map(p => `- ${p.title} (ID: ${p.shopify_id})`).join('\n')
        }`
      : '';

    const articlePrompt = `Tu es un rédacteur SEO expert spécialisé dans l'e-commerce.

Sujet: ${topicData.title || 'Article sur ' + topicData.category}
Catégorie: ${topicData.category}
${topicData.subcategory ? `Sous-catégorie: ${topicData.subcategory}` : ''}
Mots-clés principaux: ${topicData.keywords.join(', ')}
Langue: ${requestData.language === 'fr' ? 'Français' : requestData.language}
Longueur: ${requestData.word_count_min}-${requestData.word_count_max} mots
${productLinksInfo}

Instructions:
1. Crée un article de blog SEO-optimisé, engageant et informatif
2. Structure: Introduction, 3-5 sections avec sous-titres H2/H3, conclusion
3. Intègre naturellement les mots-clés sans sur-optimisation
4. Ton professionnel mais accessible
5. ${requestData.internal_linking ? `Ajoute ${requestData.max_internal_links} liens internes vers les produits mentionnés ci-dessus en utilisant le format [PRODUCT:shopify_id] dans le texte` : 'Pas de liens internes'}
6. Format de sortie: ${requestData.output_format === 'html' ? 'HTML propre avec balises sémantiques' : 'Markdown'}

Génère l'article complet maintenant:`;

    const articleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Tu es un rédacteur SEO expert. Tu crées du contenu optimisé, engageant et de haute qualité." },
          { role: "user", content: articlePrompt }
        ],
        temperature: 0.7,
        max_tokens: 3000
      }),
    });

    if (!articleResponse.ok) {
      throw new Error(`OpenAI article generation failed: ${articleResponse.statusText}`);
    }

    const articleResult = await articleResponse.json();
    let content = articleResult.choices[0].message.content.trim();

    const productLinks: Array<{ product_id: string; shopify_id: string; title: string }> = [];

    if (requestData.internal_linking) {
      const linkPattern = /\[PRODUCT:(\d+)\]/g;
      let match;

      while ((match = linkPattern.exec(content)) !== null) {
        const shopifyId = match[1];
        const product = relatedProducts.find(p => p.shopify_id === shopifyId);

        if (product) {
          productLinks.push({
            product_id: product.id,
            shopify_id: product.shopify_id,
            title: product.title
          });

          const storeUrl = Deno.env.get("SHOPIFY_STORE_URL") || "your-store.myshopify.com";
          const productUrl = `https://${storeUrl}/products/${product.handle}`;
          content = content.replace(
            match[0],
            requestData.output_format === 'html'
              ? `<a href="${productUrl}" class="product-link">${product.title}</a>`
              : `[${product.title}](${productUrl})`
          );
        } else {
          content = content.replace(match[0], '');
        }
      }
    }

    const { data: article, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        title: topicData.title || `Article sur ${topicData.category}`,
        content: content,
        meta_description: topicData.meta_description || '',
        target_keywords: topicData.keywords || [],
        category: topicData.category,
        subcategory: topicData.subcategory || null,
        language: requestData.language,
        word_count: content.split(/\s+/).length,
        format: requestData.output_format,
        product_links: productLinks,
        status: 'draft',
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error(`Failed to save article: ${insertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        article_id: article.id,
        title: article.title,
        word_count: article.word_count,
        internal_links: productLinks.length,
        message: 'Blog article generated successfully'
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
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