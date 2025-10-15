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

      const topicPrompt = `Tu es un expert SEO en décoration, ameublement et aménagement intérieur.\nGénère un sujet d'article de blog à fort potentiel SEO pour la catégorie: ${randomCategory}\n\nLe sujet doit être informatif, engageant, et pertinent pour des clients cherchant des conseils en décoration d'intérieur.\n\nRéponds UNIQUEMENT avec un JSON valide dans ce format exact:\n{\n  \"title\": \"titre de l'article (question ou conseil pratique)\",\n  \"meta_description\": \"description méta (150-160 caractères)\",\n  \"keywords\": [\"mot-clé1\", \"mot-clé2\", \"mot-clé3\", \"mot-clé4\"]\n}`;

      const topicResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "Tu es un expert en SEO et décoration d'intérieur. Tu réponds UNIQUEMENT en JSON valide." },
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
        .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
        .limit(requestData.max_internal_links * 3);

      if (topicData.category) {
        query.eq('category', topicData.category);
      }

      const { data } = await query;
      relatedProducts = data?.slice(0, requestData.max_internal_links * 2) || [];
    }

    const { data: storeData } = await supabase
      .from('shopify_stores')
      .select('shopify_store_url')
      .limit(1)
      .single();

    const storeUrl = storeData?.shopify_store_url || 'decora-home.fr';
    const storeBaseUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const productExamples = relatedProducts.map(p => p.title).join('", "');

    const productDetailsForAI = relatedProducts.slice(0, requestData.max_internal_links).map(p => {
      const description = p.body_html ? p.body_html.replace(/<[^>]*>/g, '').substring(0, 150) : '';
      return `- ${p.title} (${p.price}€)${p.ai_color ? ` - Couleur: ${p.ai_color}` : ''}${p.ai_material ? ` - Matériau: ${p.ai_material}` : ''} - ${description}`;
    }).join('\n');

    const articlePrompt = `Tu es un rédacteur SEO expert spécialisé en décoration d'intérieur et ameublement. Tu crées des articles structurés comme de véritables articles de presse professionnels.\n\n⚠️ RÈGLE CRITIQUE: TU NE DOIS JAMAIS utiliser de placeholders comme "[Content for X]" ou "[Description ici]". TOUT le contenu doit être COMPLET et RÉDIGÉ ENTIÈREMENT.\n\nINFORMATIONS OBLIGATOIRES À UTILISER:\nCatégorie principale: ${topicData.category}\n${topicData.subcategory ? `Sous-catégorie: ${topicData.subcategory}` : ''}\nMots-clés SEO OBLIGATOIRES à intégrer naturellement: ${topicData.keywords.join(', ')}\nLangue: ${requestData.language === 'fr' ? 'Français' : requestData.language}\nLongueur cible: ${requestData.word_count_min}-${requestData.word_count_max} mots\n\nPRODUITS DISPONIBLES AVEC DÉTAILS COMPLETS:\n${productDetailsForAI}\n\nURL de base du magasin: https://${storeBaseUrl}\n\nSTRUCTURE ARTICLE DE PRESSE PROFESSIONNELLE (HTML):\n\n1. TITRE PRINCIPAL <h1> - EXACTEMENT UN SEUL H1 PAR ARTICLE\n   - Titre accrocheur intégrant les mots-clés principaux\n   - Entre 50-70 caractères optimisé SEO\n   - IMPORTANT: Un seul <h1> dans tout l'article (le titre principal)\n\n2. CHAPEAU / INTRODUCTION (2-3 paragraphes)\n   - Résumé captivant de l'article\n   - Intégrer naturellement les mots-clés: ${topicData.keywords.join(', ')}\n   - Style journalistique engageant\n\n3. IMAGE D'EN-TÊTE\n   - <img> avec alt optimisé SEO incluant les mots-clés\n   - src=\"https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg\" (utiliser un ID aléatoire valide)\n   - Légende <figcaption> descriptive\n\n4. TABLE DES MATIÈRES CLIQUABLE\n   <nav class=\"table-of-contents\">\n   <ul>\n     <li><a href=\"#section-1\">Titre Section 1</a></li>\n     ...\n   </ul>\n   </nav>\n\n5. CORPS DE L'ARTICLE (5-7 SECTIONS H2 avec sous-sections H3)\n   HIÉRARCHIE DES TITRES STRICTE:\n   - <h2 id=\"section-X\"> pour CHAQUE section principale (5-7 sections H2)\n   - <h3> UNIQUEMENT pour les sous-sections SOUS un H2 (jamais de H3 sans H2 parent)\n   - <h4> UNIQUEMENT pour les subdivisions SOUS un H3 (jamais de H4 sans H3 parent)\n   - NE JAMAIS sauter de niveau (pas de H1 → H3 directement)\n\n   Chaque section H2 doit avoir:\n   - Ancre id=\"section-X\" pour navigation\n   - 2-3 paragraphes <p> riches et informatifs (MINIMUM 100 mots par paragraphe)\n   - 1-3 sous-sections <h3> si approprié\n   - IMAGE ILLUSTRATIVE avec <img> Pexels + <figcaption>\n   - Listes <ul>/<ol> pour conseils pratiques\n   - Intégrer NATURELLEMENT les mots-clés: ${topicData.keywords.join(', ')}\n\n   ⚠️ IMPORTANT: Chaque section DOIT contenir du contenu COMPLET et DÉTAILLÉ.\n   JAMAIS de texte placeholder type \"[Content for...]\" ou \"[À compléter]\".\n   Rédige ENTIÈREMENT chaque section avec des informations concrètes et utiles.\n\n   THÉMATIQUES SUGGÉRÉES (chaque thématique = 1 section H2):\n   - Introduction au sujet (contexte catégorie: ${topicData.category})\n   - Tendances actuelles en ${topicData.category}\n   - Guide pratique et conseils d'expert\n   - Produits recommandés (SECTION H2 OBLIGATOIRE - voir point 6B)\n   - Erreurs courantes à éviter\n   - Inspiration et idées créatives\n   - Conseils d'achat et critères de sélection\n\n6A. IMAGES PEXELS DÉCORATIVES\n   - Utiliser 3-5 images pertinentes de Pexels\n   - Format: <figure><img src=\"https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg\" alt=\"description avec mots-clés\" /><figcaption>Légende descriptive</figcaption></figure>\n   - Alt text optimisé avec mots-clés naturels\n\n6B. SECTION PRODUITS RECOMMANDÉS (OBLIGATOIRE)\n   CRÉER une section <h2 id=\"produits-recommandes\">Nos Produits Recommandés</h2>\n\n   Pour CHAQUE produit de la liste, créer une CARTE PRODUIT avec cette structure HTML EXACTE:\n\n   <div class=\"product-card\" data-product-id=\"[PRODUCT_ID]\">\n     <div class=\"product-image\">\n       <img src=\"[PRODUCT_IMAGE_URL]\" alt=\"[PRODUCT_TITLE] - [CATEGORY]\" loading=\"lazy\" />\n     </div>\n     <div class=\"product-details\">\n       <h3 class=\"product-title\">[PRODUCT_TITLE]</h3>\n       <p class=\"product-price\">[PRODUCT_PRICE]€</p>\n       <p class=\"product-description\">[Description courte du produit basée sur ses caractéristiques]</p>\n       <a href=\"https://${storeBaseUrl}/products/[PRODUCT_HANDLE]\" class=\"product-cta\" target=\"_blank\" rel=\"noopener\">Découvrir ce produit</a>\n     </div>\n   </div>\n\n   REMPLACER les placeholders:\n   - [PRODUCT_ID] = ID du produit\n   - [PRODUCT_IMAGE_URL] = URL réelle de l'image du produit\n   - [PRODUCT_TITLE] = Titre exact du produit\n   - [CATEGORY] = Catégorie du produit\n   - [PRODUCT_PRICE] = Prix réel du produit\n   - [PRODUCT_HANDLE] = Handle exact du produit pour l'URL\n\n   Créer ${requestData.max_internal_links} cartes produits avec les détails réels fournis ci-dessus.\n\n7. LIENS INTERNES CONTEXTUELS ADDITIONNELS\n   EN PLUS de la section produits recommandés, intégrer 2-3 mentions de produits dans le texte:\n   - \"Découvrez notre collection de <a href=\"https://${storeBaseUrl}/products/[handle]\" class=\"inline-product-link\">[nom produit]</a>\"\n   - \"Un <a href=\"https://${storeBaseUrl}/products/[handle]\" class=\"inline-product-link\">[nom produit]</a> apporte élégance et fonctionnalité\"\n   - \"Explorez nos <a href=\"https://${storeBaseUrl}/products/[handle]\" class=\"inline-product-link\">[nom produit]</a> pour un style unique\"\n\n   Ces liens doivent s'intégrer NATURELLEMENT dans le contenu des sections H2.\n\n8. SECTION FAQ <h2 id=\"faq\">Questions Fréquentes</h2>\n   Questions/réponses format journalistique avec hiérarchie correcte:\n   <div class=\"faq-item\">\n     <h3>Question pratique ?</h3>\n     <p>Réponse détaillée et utile</p>\n   </div>\n   (4-6 questions pertinentes, chaque question en H3 sous le H2 \"Questions Fréquentes\")\n\n9. CONCLUSION PROFESSIONNELLE\n   - Résumé des points clés\n   - Call-to-action subtil vers ${storeBaseUrl}\n   - Encouragement à l'action\n\n10. TAGS SEO\n    <div class=\"tags\">\n    <span class=\"tag\">#tag1</span>\n    <span class=\"tag\">#tag2</span>\n    ...\n    </div>\n\nRÈGLES STRICTES ET NON-NÉGOCIABLES:\n\n🔴 HIÉRARCHIE DES TITRES (CRITIQUE POUR LE SEO):\n✓ EXACTEMENT UN SEUL <h1> dans tout l'article (le titre principal)\n✓ 5-7 sections <h2 id=\"section-X\"> pour les sections principales\n✓ <h3> UNIQUEMENT sous des <h2> (sous-sections)\n✓ <h4> UNIQUEMENT sous des <h3> (subdivisions)\n✓ NE JAMAIS sauter de niveau (interdit: H1→H3, H2→H4)\n✓ Chaque H2 doit avoir un id unique pour la navigation\n\n🔴 CONTENU PRODUITS (OBLIGATOIRE):\n✓ Créer une section H2 \"Nos Produits Recommandés\" avec ${requestData.max_internal_links} cartes produits\n✓ Utiliser les URLs d'images RÉELLES des produits (pas de placeholders)\n✓ Inclure titre exact, prix, et handle de chaque produit\n✓ Ajouter 2-3 liens produits contextuels dans le texte\n✓ Utiliser les données produits fournies ci-dessus\n\n🔴 SEO ET QUALITÉ:\n✓ UTILISER OBLIGATOIREMENT les mots-clés: ${topicData.keywords.join(', ')}\n✓ RESPECTER la catégorie: ${topicData.category}\n${topicData.subcategory ? `✓ MENTIONNER la sous-catégorie: ${topicData.subcategory}` : ''}\n✓ HTML sémantique professionnel (<article>, <section>, <figure>, <nav>)\n✓ Ton journalistique: informatif, expert, engageant, accessible\n✓ Intégration naturelle des mots-clés (densité 1-2%, pas de keyword stuffing)\n✓ 3-5 images Pexels avec alt optimisés\n✓ Paragraphes riches (80-150 mots)\n✓ Exemples concrets, données, conseils actionnables\n\nGénère maintenant l'article complet en HTML avec toutes les sections, images Pexels et liens internes:`;

    const articleResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
            content: "Tu es un rédacteur SEO expert et journaliste spécialisé en décoration d'intérieur. Tu crées des articles de presse professionnels en HTML, structurés avec titres, sous-titres, images Pexels, et liens internes. Tu respectes STRICTEMENT les mots-clés, catégories et sous-catégories fournis. Tu NE DOIS JAMAIS utiliser de placeholders - tout le contenu doit être entièrement rédigé."
          },
          { role: "user", content: articlePrompt }
        ],
        temperature: 0.7,
        max_tokens: 6000
      }),
    });

    if (!articleResponse.ok) {
      throw new Error(`OpenAI article generation failed: ${articleResponse.statusText}`);
    }

    const articleResult = await articleResponse.json();
    let content = articleResult.choices[0].message.content.trim();

    if (content.startsWith('```html')) {
      content = content.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const productLinks: Array<{
      product_id: string;
      shopify_id: string;
      title: string;
      handle: string;
      image_url: string;
      price: number;
      category: string;
      link_type: string;
    }> = [];

    if (requestData.internal_linking && relatedProducts.length > 0) {
      for (const product of relatedProducts.slice(0, requestData.max_internal_links)) {
        const productUrl = `https://${storeBaseUrl}/products/${product.handle}`;
        const productImageUrl = product.image_url || 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg';
        const productCategory = product.category || topicData.category;

        let productDescription = 'Découvrez ce produit de qualité exceptionnelle';
        if (product.body_html) {
          const cleanDesc = product.body_html.replace(/<[^>]*>/g, '').trim();
          if (cleanDesc.length > 0) {
            productDescription = cleanDesc.substring(0, 150) + (cleanDesc.length > 150 ? '...' : '');
          }
        }

        if (content.includes('[PRODUCT_ID]')) {
          content = content.replace('[PRODUCT_ID]', product.id);
          content = content.replace('[PRODUCT_IMAGE_URL]', productImageUrl);
          content = content.replace('[PRODUCT_TITLE]', product.title);
          content = content.replace('[CATEGORY]', productCategory);
          content = content.replace('[PRODUCT_PRICE]', product.price.toString());
          content = content.replace('[PRODUCT_HANDLE]', product.handle);
          content = content.replace('[Description courte du produit basée sur ses caractéristiques]', productDescription);

          productLinks.push({
            product_id: product.id,
            shopify_id: product.shopify_id,
            title: product.title,
            handle: product.handle,
            image_url: productImageUrl,
            price: product.price,
            category: productCategory,
            link_type: 'product_card'
          });
        }
      }

      const remainingProducts = relatedProducts.slice(requestData.max_internal_links);
      for (const product of remainingProducts) {
        const productUrl = `https://${storeBaseUrl}/products/${product.handle}`;

        if (content.includes('[handle]') || content.includes('[nom produit]')) {
          content = content.replace('[handle]', product.handle);
          content = content.replace('[nom produit]', product.title);

          if (!productLinks.find(p => p.product_id === product.id)) {
            productLinks.push({
              product_id: product.id,
              shopify_id: product.shopify_id,
              title: product.title,
              handle: product.handle,
              image_url: product.image_url || '',
              price: product.price,
              category: product.category || topicData.category,
              link_type: 'inline_link'
            });
          }
        }
      }
    }

    const validationErrors: string[] = [];

    const placeholderPatterns = [
      /\[Content for [^\]]+\]/gi,
      /\[À compléter\]/gi,
      /\[Description ici\]/gi,
      /\[Texte ici\]/gi,
      /\[TODO[^\]]*\]/gi,
      /\[PRODUCT_ID\]/g,
      /\[PRODUCT_TITLE\]/g,
      /\[PRODUCT_HANDLE\]/g,
      /\[handle\]/g,
      /\[nom produit\]/g
    ];

    for (const pattern of placeholderPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        validationErrors.push(`Found ${matches.length} placeholder(s): ${matches[0]}`);
      }
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < requestData.word_count_min * 0.7) {
      validationErrors.push(`Word count ${wordCount} is below minimum threshold (${Math.floor(requestData.word_count_min * 0.7)} words required)`);
    }

    const h1Matches = content.match(/<h1[^>]*>/gi) || [];
    const h2Matches = content.match(/<h2[^>]*>/gi) || [];
    const h3Matches = content.match(/<h3[^>]*>/gi) || [];

    let headingScore = 100;
    const headingIssues: string[] = [];

    if (h1Matches.length === 0) {
      headingIssues.push('Missing H1 title');
      headingScore -= 30;
    } else if (h1Matches.length > 1) {
      headingIssues.push(`Multiple H1 tags found (${h1Matches.length})`);
      headingScore -= 20;
    }

    if (h2Matches.length < 4) {
      headingIssues.push(`Only ${h2Matches.length} H2 sections (minimum 4 recommended)`);
      headingScore -= 15;
    }

    const headingStructure: any[] = [];
    const h1Regex = /<h1[^>]*(?:id=\"([^\"]*)\")?[^>]*>(.*?)<\/h1>/gi;
    const h2Regex = /<h2[^>]*(?:id=\"([^\"]*)\")?[^>]*>(.*?)<\/h2>/gi;
    const h3Regex = /<h3[^>]*(?:id=\"([^\"]*)\")?[^>]*>(.*?)<\/h3>/gi;

    let match;
    while ((match = h1Regex.exec(content)) !== null) {
      headingStructure.push({ level: 1, id: match[1] || '', text: match[2].replace(/<[^>]*>/g, '').trim() });
    }
    while ((match = h2Regex.exec(content)) !== null) {
      headingStructure.push({ level: 2, id: match[1] || '', text: match[2].replace(/<[^>]*>/g, '').trim() });
    }
    while ((match = h3Regex.exec(content)) !== null) {
      headingStructure.push({ level: 3, id: match[1] || '', text: match[2].replace(/<[^>]*>/g, '').trim() });
    }

    if (validationErrors.length > 0) {
      console.warn('Content validation warnings:', validationErrors);
    }

    const linkDensity = wordCount > 0 ? (productLinks.length / wordCount * 100).toFixed(2) : '0.00';

    const { data: article, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        title: topicData.title || `Guide ${topicData.category}`,
        content: content,
        meta_description: topicData.meta_description || '',
        target_keywords: topicData.keywords || [],
        category: topicData.category,
        subcategory: topicData.subcategory || null,
        language: requestData.language,
        word_count: wordCount,
        format: 'html',
        product_links: productLinks,
        status: validationErrors.length > 0 ? 'draft' : 'draft',
        generated_at: new Date().toISOString(),
        heading_structure: { headings: headingStructure },
        heading_hierarchy_score: Math.max(0, headingScore),
        heading_issues: headingIssues,
        heading_corrected: false,
        products_featured: productLinks.slice(0, 5),
        product_images_count: productLinks.length,
        internal_links_count: productLinks.length,
        link_density: parseFloat(linkDensity)
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
        heading_score: article.heading_hierarchy_score,
        validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
        message: validationErrors.length > 0
          ? 'Article généré avec avertissements de qualité'
          : 'Article de blog généré avec succès'
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
    console.error("Error generating blog article:", error);

    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("Detailed error:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: "Check Edge Function logs for more information"
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