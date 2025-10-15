import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Campaign {
  id: string;
  store_id: string;
  topic_niche: string;
  target_audience: string;
  word_count_min: number;
  word_count_max: number;
  writing_style: string;
  tone: string;
  keywords: string[];
  content_structure: string;
  internal_linking_enabled: boolean;
  max_internal_links: number;
  image_integration_enabled: boolean;
  product_links_enabled: boolean;
  seo_optimization_enabled: boolean;
  auto_publish: boolean;
  language: string;
  frequency: string;
}

interface Product {
  id: string;
  shopify_id: string;
  title: string;
  handle: string;
  category: string;
  sub_category: string;
  price: number;
  seo_title: string;
  seo_description: string;
}

function buildPrompt(
  campaign: Campaign,
  languageName: string,
  products: Product[],
  storeUrl: string
): string {
  const isShowcaseKeyword = campaign.keywords.some(k =>
    k.toLowerCase().includes('vitrine') ||
    k.toLowerCase().includes('showcase') ||
    k.toLowerCase().includes('collection')
  );

  const productList = products.length > 0
    ? products.map(p => `- ${p.title} (${p.category}${p.sub_category ? ' - ' + p.sub_category : ''})`).join('\n')
    : '';

  const productLinksInstructions = campaign.product_links_enabled && products.length > 0
    ? `\n\nPRODUITS DISPONIBLES A INTEGRER:\n${productList}\n\nVous DEVEZ integrer naturellement ${Math.min(campaign.max_internal_links, products.length)} liens vers ces produits dans l'article.\nFormat des liens: <a href="https://${storeUrl}/products/[product-handle]" class="product-link">[product-title]</a>\nIntegrez les liens de maniere contextuelle dans le contenu, pas seulement en liste.`
    : '';

  const imageInstructions = campaign.image_integration_enabled
    ? `\n\nIMAGES:\nAjoutez 3-5 images pertinentes avec des URLs Unsplash basees sur le sujet de l'article.\nFormat: <img src="https://images.unsplash.com/photo-[ID]?w=800" alt="[description avec mots-cles]" class="article-image" />\nLes images doivent etre DIRECTEMENT liees au sujet: ${campaign.topic_niche} et aux mots-cles: ${campaign.keywords.join(', ')}\nPour les meubles, montrez des meubles. Pour la decoration, montrez de la decoration.`
    : '';

  const titleGuidance = isShowcaseKeyword
    ? `\nATTENTION TITRE: Le sujet contient un mot-cle de type "vitrine/showcase". Creez un titre ATTRACTIF et CAPTIVANT qui donne envie de decouvrir la collection, PAS un titre de guide generique.\nExemples de bons titres:\n- "Decouvrez Notre Collection Exclusive de ${campaign.topic_niche}"\n- "${campaign.topic_niche}: Les Plus Belles Pieces de l'Annee"\n- "Inspiration ${campaign.topic_niche}: Trouvez Votre Style Ideal"\nEVITEZ les titres qui commencent par "Guide", "Comment", "Le Guide Complet".`
    : `\nCREEZ un titre accrocheur et varie. N'utilisez PAS toujours le meme format. Variez entre questions, declarations, promesses de valeur.`;

  return `Vous etes un expert en redaction SEO et specialiste de ${campaign.topic_niche}.

OBJECTIF : Generer un article HTML complet, structure, et SEO-friendly avec integration de produits.

INFORMATIONS DE BASE:
- Sujet principal: ${campaign.topic_niche}
- Public cible: ${campaign.target_audience || "Audience generale interessee par " + campaign.topic_niche}
- Style d'ecriture: ${campaign.writing_style}
- Ton: ${campaign.tone}
- Langue: ${languageName}
- Nombre de mots: ${campaign.word_count_min}-${campaign.word_count_max} mots
- Mots-cles principaux OBLIGATOIRES: ${campaign.keywords.join(", ")}
${campaign.content_structure ? `- Structure demandee: ${campaign.content_structure}` : ''}${titleGuidance}${productLinksInstructions}${imageInstructions}

STRUCTURE HTML ATTENDUE:

1. Titre H1 captivant et unique
2. Introduction engageante (2-3 paragraphes)
3. Sections principales avec <h2 id="section-X"> (IDs pour ancres)
4. Sous-sections avec <h3> et <h4>
5. Integration naturelle des produits dans le contenu
6. Images contextuelles et pertinentes
7. Listes a puces et numerotees
8. Conclusion avec call-to-action
9. Section FAQ (4-6 questions)

SECTIONS RECOMMANDEES (VARIEZ selon le sujet):
${isShowcaseKeyword
  ? `- Presentation de la Collection
- Pieces Phares et Coups de Coeur
- Tendances et Styles
- Comment Choisir le Parfait ${campaign.topic_niche}
- Inspiration et Idees d'Amenagement`
  : `- Introduction au Sujet
- Avantages et Benefices
- Guide de Selection
- Conseils Pratiques
- Erreurs a Eviter`}
- Questions Frequentes (FAQ)
- Conclusion

INTEGRATION DES MOTS-CLES:
- Utilisez TOUS les mots-cles: ${campaign.keywords.join(", ")}
- Densite naturelle: 2-3% par mot-cle principal
- Variez les formulations et synonymes
- Integrez dans les titres, premiers paragraphes, et naturellement dans le contenu

OPTIMISATION SEO:
- Meta description captivante avec mot-cle principal
- Structure semantique claire (H1 > H2 > H3)
- Alt text optimise sur toutes les images
- Liens internes contextuels
- Contenu unique et informatif

TONALITE & STYLE:
- ${campaign.writing_style} et ${campaign.tone}
- Langage fluide et naturel
- Approche conseil expert
- Exemples concrets
- Credibilite et autorite

FORMAT DE SORTIE REQUIS - Retournez UNIQUEMENT un objet JSON valide:
{
  "title": "Titre unique et captivant (50-70 caracteres) - VARIEZ LE FORMAT",
  "content": "Contenu HTML complet avec produits integres et images pertinentes",
  "meta_description": "Description SEO engageante de 150-160 caracteres",
  "focus_keyword": "${campaign.keywords[0]}",
  "keywords": ${JSON.stringify(campaign.keywords)}
}

CRITERES DE QUALITE OBLIGATOIRES:
- Titre UNIQUE qui ne ressemble pas a tous les autres articles
- ${campaign.word_count_min}-${campaign.word_count_max} mots
- TOUS les mots-cles integres naturellement
- ${campaign.product_links_enabled ? campaign.max_internal_links + ' liens produits integres' : 'Pas de liens produits'}
- ${campaign.image_integration_enabled ? '3-5 images pertinentes au sujet' : 'Pas d\'images'}
- HTML valide et bien structure
- Contenu original et de haute qualite

IMPORTANT: Ecrivez ENTIEREMENT en ${languageName}. Le contenu doit etre pertinent, engage le lecteur, et respecte EXACTEMENT les mots-cles fournis.`;
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaign_id } = await req.json();

    if (!campaign_id) {
      throw new Error("Campaign ID is required");
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("blog_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    const typedCampaign = campaign as unknown as Campaign;

    const { data: store } = await supabase
      .from("shopify_stores")
      .select("*")
      .eq("id", typedCampaign.store_id)
      .single();

    if (!store) {
      throw new Error("Store configuration not found");
    }

    const apiKey = store.openai_api_key || openaiApiKey;
    const storeUrl = store.shopify_store_url || store.store_url || '';

    let relatedProducts: Product[] = [];

    if (typedCampaign.product_links_enabled) {
      const { data: productsData } = await supabase
        .from("shopify_products")
        .select("id, shopify_id, title, handle, category, sub_category, price, seo_title, seo_description")
        .eq("store_id", typedCampaign.store_id)
        .limit(typedCampaign.max_internal_links * 3);

      if (productsData && productsData.length > 0) {
        const keywords = typedCampaign.keywords.map(k => k.toLowerCase());
        const topicWords = typedCampaign.topic_niche.toLowerCase().split(' ');

        const scoredProducts = productsData.map(p => {
          let score = 0;
          const productText = `${p.title} ${p.category} ${p.sub_category} ${p.seo_title}`.toLowerCase();

          keywords.forEach(keyword => {
            if (productText.includes(keyword)) score += 3;
          });

          topicWords.forEach(word => {
            if (word.length > 3 && productText.includes(word)) score += 1;
          });

          return { product: p as Product, score };
        });

        scoredProducts.sort((a, b) => b.score - a.score);
        relatedProducts = scoredProducts
          .slice(0, typedCampaign.max_internal_links)
          .map(sp => sp.product);
      }
    }

    const languageNames: { [key: string]: string } = {
      fr: "French",
      en: "English",
      es: "Spanish",
      de: "German"
    };

    const languageName = languageNames[typedCampaign.language] || "English";
    const prompt = buildPrompt(typedCampaign, languageName, relatedProducts, storeUrl);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert SEO content writer who creates high-quality, engaging blog articles. You write in ${languageName}. Always return valid JSON with properly formatted HTML content that uses semantic tags and proper heading hierarchy.`
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const articleData = JSON.parse(content);

    let finalContent = articleData.content;
    const productLinks: Array<{ product_id: string; shopify_id: string; title: string; handle: string }> = [];

    if (relatedProducts.length > 0) {
      relatedProducts.forEach(product => {
        const productUrl = `https://${storeUrl}/products/${product.handle}`;
        const placeholderPattern = new RegExp(`\\[product-handle\\]`, 'g');
        const titlePattern = new RegExp(`\\[product-title\\]`, 'g');

        if (finalContent.includes('[product-handle]') && productLinks.length < typedCampaign.max_internal_links) {
          finalContent = finalContent.replace(placeholderPattern, product.handle).replace(titlePattern, product.title);

          productLinks.push({
            product_id: product.id,
            shopify_id: product.shopify_id,
            title: product.title,
            handle: product.handle
          });
        }
      });
    }

    const wordCount = finalContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

    const { data: newArticle, error: insertError } = await supabase
      .from("blog_articles")
      .insert({
        store_id: typedCampaign.store_id,
        campaign_id: campaign_id,
        title: articleData.title,
        content: finalContent,
        meta_description: articleData.meta_description,
        focus_keyword: articleData.focus_keyword,
        keywords: articleData.keywords,
        target_keywords: typedCampaign.keywords,
        status: "draft",
        language: typedCampaign.language,
        word_count: wordCount,
        format: 'html',
        product_links: productLinks,
        category: relatedProducts[0]?.category || '',
        subcategory: relatedProducts[0]?.sub_category || '',
        author: 'AI Campaign',
        tags: typedCampaign.keywords.slice(0, 5).join(', ')
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (typedCampaign.auto_publish && newArticle) {
      try {
        const syncResponse = await fetch(`${supabaseUrl}/functions/v1/sync-blog-to-shopify`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId: newArticle.id }),
        });

        if (syncResponse.ok) {
          await supabase
            .from("blog_campaigns")
            .update({
              articles_published: (campaign.articles_published || 0) + 1,
            })
            .eq("id", campaign_id);
        }
      } catch (syncError) {
        console.error('Auto-publish failed:', syncError);
      }
    }

    const now = new Date();
    let nextExecution = new Date(now);

    switch (typedCampaign.frequency) {
      case "daily":
        nextExecution.setDate(nextExecution.getDate() + 1);
        break;
      case "weekly":
        nextExecution.setDate(nextExecution.getDate() + 7);
        break;
      case "bi-weekly":
        nextExecution.setDate(nextExecution.getDate() + 14);
        break;
      case "monthly":
        nextExecution.setMonth(nextExecution.getMonth() + 1);
        break;
    }

    await supabase
      .from("blog_campaigns")
      .update({
        articles_generated: (campaign.articles_generated || 0) + 1,
        last_execution: now.toISOString(),
        next_execution: nextExecution.toISOString(),
      })
      .eq("id", campaign_id);

    await supabase
      .from("campaign_execution_log")
      .insert({
        campaign_id: campaign_id,
        execution_time: now.toISOString(),
        status: "success",
        articles_generated: 1,
      });

    return new Response(
      JSON.stringify({
        success: true,
        article: newArticle,
        message: "Article generated successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error executing campaign:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
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