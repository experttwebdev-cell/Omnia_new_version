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

    let relatedProducts = [];
    if (requestData.internal_linking) {
      const query = supabase
        .from('shopify_products')
        .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
        .limit(requestData.max_internal_links * 2);

      if (topicData.category) {
        query.ilike('category', `%${topicData.category}%`);
      }

      const { data } = await query;
      relatedProducts = data?.slice(0, requestData.max_internal_links) || [];
    }

    const { data: storeData } = await supabase
      .from('shopify_stores')
      .select('shopify_store_url')
      .limit(1)
      .maybeSingle();

    const storeUrl = storeData?.shopify_store_url || 'decora-home.fr';
    const storeBaseUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const productsForPrompt = relatedProducts.map(p => ({
      title: p.title,
      price: p.price,
      handle: p.handle,
      image: p.image_url,
      description: p.body_html ? p.body_html.replace(/<[^>]*>/g, '').substring(0, 200) : `${p.title} - Produit de qualité pour votre intérieur`,
      color: p.ai_color || '',
      material: p.ai_material || ''
    }));

    const langMap: Record<string, string> = { fr: 'français', en: 'English', es: 'español', de: 'Deutsch' };
    const lang = langMap[requestData.language] || 'français';

    const systemPrompt = `Tu es un rédacteur SEO EXPERT et journaliste spécialisé en décoration d'intérieur.

MISSION : Créer un article de blog PROFESSIONNEL de ${requestData.word_count_min}-${requestData.word_count_max} mots en ${lang}.

RÈGLES ABSOLUES :
1. Contenu 100% COMPLET - ZÉRO placeholder, ZÉRO [Content for...], ZÉRO texte à compléter
2. Chaque paragraphe : minimum 120 mots de contenu RÉEL et INFORMATIF
3. Style journalistique professionnel, ton expert mais accessible
4. Intégration NATURELLE des mots-clés (densité 1-2%)
5. Structure HTML sémantique parfaite`;

    const userPrompt = `Rédige un article complet en ${lang} sur : "${topicData.title}"

MOTS-CLÉS À INTÉGRER : ${topicData.keywords.join(', ')}
CATÉGORIE : ${topicData.category}
${topicData.subcategory ? `SOUS-CATÉGORIE : ${topicData.subcategory}` : ''}

PRODUITS DISPONIBLES (${relatedProducts.length}) :
${JSON.stringify(productsForPrompt, null, 2)}

STRUCTURE REQUISE :

<article>
  <h1>[Titre optimisé SEO 50-70 caractères avec mot-clé principal]</h1>

  <p>[Introduction captivante 2-3 paragraphes, minimum 300 mots total]</p>

  <figure>
    <img src="https://images.pexels.com/photos/6585760/pexels-photo-6585760.jpeg" alt="[Description SEO avec mots-clés]" />
    <figcaption>[Légende descriptive]</figcaption>
  </figure>

  <nav class="table-of-contents">
    <h2>Sommaire</h2>
    <ul>
      <li><a href="#introduction">Introduction</a></li>
      <li><a href="#tendances">Tendances ${topicData.category} 2025</a></li>
      <li><a href="#guide-achat">Guide d'Achat : Critères Essentiels</a></li>
      <li><a href="#selection-produits">Notre Sélection de Produits</a></li>
      <li><a href="#comparatif">Comparatif Détaillé</a></li>
      <li><a href="#conseils-entretien">Conseils d'Entretien</a></li>
      <li><a href="#faq">Questions Fréquentes</a></li>
    </ul>
  </nav>

  <h2 id="introduction">Introduction au ${topicData.category}</h2>
  <p>[Minimum 200 mots : contexte, importance du choix, enjeux, statistiques si pertinent]</p>

  <h3>Pourquoi bien choisir son ${topicData.category} ?</h3>
  <p>[Minimum 150 mots : impact sur l'intérieur, durabilité, budget]</p>

  <figure>
    <img src="https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg" alt="[Alt SEO]" />
    <figcaption>[Légende]</figcaption>
  </figure>

  <h2 id="tendances">Tendances ${topicData.category} 2025</h2>
  <p>[Minimum 250 mots : tendances actuelles, couleurs, matériaux, styles populaires]</p>

  <h3>Matériaux en Vogue</h3>
  <p>[Minimum 150 mots : détail des matériaux tendance]</p>

  <h3>Palettes de Couleurs Populaires</h3>
  <p>[Minimum 150 mots : couleurs phares]</p>

  <h2 id="guide-achat">Guide d'Achat : Critères Essentiels</h2>
  <p>[Minimum 200 mots : introduction aux critères]</p>

  <h3>Budget et Rapport Qualité-Prix</h3>
  <p>[Minimum 150 mots]</p>

  <h3>Dimensions et Adaptation à l'Espace</h3>
  <p>[Minimum 150 mots]</p>

  <h3>Qualité et Durabilité</h3>
  <p>[Minimum 150 mots]</p>

  <figure>
    <img src="https://images.pexels.com/photos/1457847/pexels-photo-1457847.jpeg" alt="[Alt SEO]" />
    <figcaption>[Légende]</figcaption>
  </figure>

  <h2 id="selection-produits">Notre Sélection de Produits ${topicData.category}</h2>
  <p>Nous avons sélectionné pour vous ${relatedProducts.length} produits qui se distinguent par leur qualité, leur design et leur excellent rapport qualité-prix.</p>

${relatedProducts.map((product, idx) => `
  <div class="product-card" data-product-id="${product.id}">
    <a href="https://${storeBaseUrl}/products/${product.handle}" target="_blank" rel="noopener" class="product-link">
      <div class="product-image">
        <img src="${product.image_url || 'https://images.pexels.com/photos/1350789/pexels-photo-1350789.jpeg'}"
             alt="${product.title} - ${product.category}"
             loading="lazy" />
      </div>
      <div class="product-details">
        <h3 class="product-title">${idx + 1}. ${product.title}</h3>
        <p class="product-price">${product.price}€</p>
        <p class="product-description">[Rédige une description UNIQUE de 40-60 mots pour ce produit basée sur : ${product.title}${product.ai_color ? ` (couleur: ${product.ai_color})` : ''}${product.ai_material ? ` (matériau: ${product.ai_material})` : ''}. Mentionne ses avantages, son style, pourquoi il est recommandé]</p>

        <div class="product-features">
          <ul>
            <li>✓ [Caractéristique 1]</li>
            <li>✓ [Caractéristique 2]</li>
            <li>✓ [Caractéristique 3]</li>
          </ul>
        </div>

        <div class="product-cta-wrapper">
          <span class="product-cta">Voir le produit →</span>
        </div>
      </div>
    </a>
  </div>
`).join('\n')}

  <h2 id="comparatif">Comparatif Détaillé</h2>
  <p>[Minimum 300 mots : analyse comparative des produits, avantages/inconvénients, meilleur pour différents besoins]</p>

  <h3>Meilleur Rapport Qualité-Prix</h3>
  <p>[Minimum 120 mots : recommandation argumentée]</p>

  <h3>Meilleur pour Petits Espaces</h3>
  <p>[Minimum 120 mots]</p>

  <h2 id="conseils-entretien">Conseils d'Entretien et Durabilité</h2>
  <p>[Minimum 250 mots : entretien, nettoyage, préservation]</p>

  <h3>Entretien Quotidien</h3>
  <p>[Minimum 120 mots]</p>

  <h3>Entretien Approfondi</h3>
  <p>[Minimum 120 mots]</p>

  <figure>
    <img src="https://images.pexels.com/photos/2062431/pexels-photo-2062431.jpeg" alt="[Alt SEO]" />
    <figcaption>[Légende]</figcaption>
  </figure>

  <h2 id="faq">Questions Fréquentes</h2>

  <div class="faq-item">
    <h3>[Question pertinente 1 sur ${topicData.category} ?]</h3>
    <p>[Réponse détaillée 80-120 mots]</p>
  </div>

  <div class="faq-item">
    <h3>[Question pertinente 2 ?]</h3>
    <p>[Réponse détaillée 80-120 mots]</p>
  </div>

  <div class="faq-item">
    <h3>[Question pertinente 3 ?]</h3>
    <p>[Réponse détaillée 80-120 mots]</p>
  </div>

  <div class="faq-item">
    <h3>[Question pertinente 4 ?]</h3>
    <p>[Réponse détaillée 80-120 mots]</p>
  </div>

  <div class="faq-item">
    <h3>[Question pertinente 5 ?]</h3>
    <p>[Réponse détaillée 80-120 mots]</p>
  </div>

  <h2>Conclusion</h2>
  <p>[Minimum 200 mots : résumé des points clés, recommandations finales, encouragement à l'action avec mention subtile de ${storeBaseUrl}]</p>

  <div class="tags">
    <span class="tag">#${topicData.keywords[0]}</span>
    <span class="tag">#${topicData.keywords[1] || 'décoration'}</span>
    <span class="tag">#guide</span>
    <span class="tag">#comparatif</span>
  </div>
</article>

EXIGENCES CRITIQUES :
- Remplis TOUS les [...] avec du contenu RÉEL, UNIQUE et INFORMATIF
- Respecte les minimums de mots pour chaque section
- Intègre naturellement les mots-clés : ${topicData.keywords.join(', ')}
- Chaque description de produit doit être UNIQUE et DÉTAILLÉE (40-60 mots)
- Les 3 caractéristiques par produit doivent être SPÉCIFIQUES et CONCRÈTES
- Les questions FAQ doivent être PERTINENTES pour ${topicData.category}
- Utilise un ton professionnel, expert mais accessible
- ZÉRO placeholder, ZÉRO [Content for...], ZÉRO texte générique

Génère maintenant l'article HTML COMPLET :`;

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
      throw new Error(`OpenAI article generation failed: ${articleResponse.statusText} - ${errorText}`);
    }

    const articleResult = await articleResponse.json();
    let content = articleResult.choices[0].message.content.trim();

    if (content.startsWith('```html')) {
      content = content.replace(/^```html\n/, '').replace(/\n```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const productLinks = relatedProducts.map(product => ({
      product_id: product.id,
      shopify_id: product.shopify_id,
      title: product.title,
      handle: product.handle,
      image_url: product.image_url || '',
      price: product.price,
      category: product.category || topicData.category,
      link_type: 'product_card'
    }));

    const validationErrors: string[] = [];
    const contentIssues: string[] = [];

    const placeholderPatterns = [
      /\[Content for [^\]]+\]/gi,
      /\[À compléter\]/gi,
      /\[Description ici\]/gi,
      /\[Texte ici\]/gi,
      /\[TODO[^\]]*\]/gi,
      /\[Caractéristique \d+\]/gi,
      /\[Rédige une description/gi,
      /\[Question pertinente/gi,
      /\[Réponse détaillée/gi,
      /\[Minimum \d+ mots/gi,
      /placeholder content/gi
    ];

    for (const pattern of placeholderPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        validationErrors.push(`Placeholder detected: ${matches[0]}`);
        contentIssues.push(`Found ${matches.length} placeholder(s)`);
      }
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < requestData.word_count_min * 0.8) {
      validationErrors.push(`Word count ${wordCount} is below minimum (${requestData.word_count_min} required)`);
    }

    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;

    if (h1Count === 0) {
      validationErrors.push('Missing H1 title');
    } else if (h1Count > 1) {
      validationErrors.push(`Multiple H1 tags (${h1Count})`);
    }

    if (h2Count < 5) {
      contentIssues.push(`Only ${h2Count} H2 sections (6+ recommended)`);
    }

    let contentQualityScore = 100;
    if (validationErrors.length > 0) contentQualityScore -= 30;
    if (contentIssues.length > 0) contentQualityScore -= (contentIssues.length * 5);
    if (wordCount < requestData.word_count_min) contentQualityScore -= 10;
    if (h2Count < 5) contentQualityScore -= 5;
    contentQualityScore = Math.max(0, contentQualityScore);

    const hasPlaceholders = validationErrors.some(err => err.includes('Placeholder') || err.includes('placeholder'));
    const articleStatus = hasPlaceholders || contentQualityScore < 70 ? 'needs_review' : 'draft';

    const { data: article, error: insertError } = await supabase
      .from('blog_articles')
      .insert({
        title: topicData.title,
        content: content,
        meta_description: topicData.meta_description,
        target_keywords: topicData.keywords,
        category: topicData.category,
        subcategory: topicData.subcategory || null,
        language: requestData.language,
        word_count: wordCount,
        format: 'html',
        product_links: productLinks,
        status: articleStatus,
        generated_at: new Date().toISOString(),
        content_quality_score: contentQualityScore,
        content_issues: contentIssues,
        validation_errors: validationErrors,
        has_placeholders: hasPlaceholders,
        language_validated: true
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
        content_quality_score: contentQualityScore,
        has_placeholders: hasPlaceholders,
        language_validated: true,
        validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
        message: contentQualityScore >= 90
          ? `Article de qualité exceptionnelle généré (${wordCount} mots, score ${contentQualityScore}/100)`
          : validationErrors.length > 0
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