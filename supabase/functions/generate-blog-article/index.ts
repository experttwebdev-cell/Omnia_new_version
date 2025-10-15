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
        title: requestData.keywords?.[0] ? `Guide Complet : ${requestData.keywords[0]}` : `Guide ${requestData.category}`,
        category: requestData.category,
        subcategory: requestData.subcategory,
        keywords: requestData.keywords || [],
        meta_description: `Découvrez notre guide complet sur ${requestData.category || requestData.keywords?.[0]}. Conseils d'experts, comparatifs et sélection des meilleurs produits.`
      };
    } else {
      const { data: categories } = await supabase
        .from('shopify_products')
        .select('category, sub_category')
        .limit(100);

      const uniqueCategories = [...new Set(categories?.map(p => p.category).filter(Boolean))];
      const randomCategory = uniqueCategories[Math.floor(Math.random() * uniqueCategories.length)];

      topicData = {
        title: `Guide d'Achat ${randomCategory} 2025`,
        category: randomCategory,
        keywords: [randomCategory, 'guide achat', 'comparatif', 'meilleur'],
        meta_description: `Guide complet pour choisir votre ${randomCategory}. Conseils d'experts, comparatifs et sélection 2025.`
      };
    }

    // TOUJOURS chercher des produits pour générer l'article
    let data = null;

    // Essai 1: Recherche par titre contenant le mot-clé
    if (topicData.category) {
      const { data: titleData } = await supabase
        .from('shopify_products')
        .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
        .not('image_url', 'is', null)
        .ilike('title', `%${topicData.category}%`)
        .limit(50);

      if (titleData && titleData.length > 0) {
        data = titleData;
      }
    }

    // Essai 2: Recherche par catégorie si la recherche par titre n'a rien donné
    if ((!data || data.length === 0) && topicData.category) {
      const { data: categoryData } = await supabase
        .from('shopify_products')
        .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
        .not('image_url', 'is', null)
        .ilike('category', `%${topicData.category}%`)
        .limit(50);

      if (categoryData && categoryData.length > 0) {
        data = categoryData;
      }
    }

    // Essai 3: Fallback - prendre n'importe quels produits avec images
    if (!data || data.length === 0) {
      console.log(`No products found for category "${topicData.category}", using fallback`);
      const { data: fallbackData } = await supabase
        .from('shopify_products')
        .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
        .not('image_url', 'is', null)
        .limit(50);

      data = fallbackData;
    }

    const maxProducts = requestData.internal_linking ? (requestData.max_internal_links || 10) : 10;
    const relatedProducts = data?.slice(0, maxProducts) || [];

    if (relatedProducts.length === 0) {
      throw new Error(`Aucun produit trouvé dans votre catalogue. Veuillez d'abord importer des produits depuis Shopify avec des images.`);
    }

    console.log(`Found ${relatedProducts.length} products for article generation`);

    const { data: storeData } = await supabase
      .from('shopify_stores')
      .select('shopify_store_url')
      .limit(1)
      .maybeSingle();

    const storeUrl = storeData?.shopify_store_url || 'decora-home.fr';
    const storeBaseUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const productsForPrompt = relatedProducts.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      handle: p.handle,
      image: p.image_url,
      description: p.body_html ? p.body_html.replace(/<[^>]*>/g, '').substring(0, 200) : `${p.title} - Produit de qualité pour votre intérieur`,
      color: p.ai_color || '',
      material: p.ai_material || '',
      category: p.category || topicData.category
    }));

    const langMap: Record<string, string> = { fr: 'français', en: 'English', es: 'español', de: 'Deutsch' };
    const lang = langMap[requestData.language] || 'français';

    const systemPrompt = `Tu es un rédacteur SEO EXPERT. Créer un article professionnel de ${requestData.word_count_min}-${requestData.word_count_max} mots en ${lang} avec les produits fournis.`;

    const userPrompt = `Article: "${topicData.title}"\nMots-clés: ${topicData.keywords.join(', ')}\nProduits (${relatedProducts.length}): ${JSON.stringify(productsForPrompt.slice(0, 3))}\nGénère un article HTML complet avec tous les produits intégrés.`;

    const articleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000
      }),
    });

    if (!articleResponse.ok) {
      const errorText = await articleResponse.text();
      throw new Error(`OpenAI failed: ${errorText}`);
    }

    const articleResult = await articleResponse.json();
    let content = articleResult.choices[0].message.content.trim();

    if (content.startsWith('```html')) {
      content = content.replace(/^```html\n/, '').replace(/\n```$/, '');
    }

    const wordCount = content.split(/\s+/).length;

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          title: topicData.title,
          content: content,
          excerpt: topicData.meta_description,
          target_keywords: topicData.keywords,
          related_product_ids: relatedProducts.map(p => p.id),
          word_count: wordCount,
          language: requestData.language
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});