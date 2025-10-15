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
      let query = supabase
        .from('shopify_products')
        .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
        .not('image_url', 'is', null)
        .limit(50);

      if (topicData.category) {
        query = query.or(`category.ilike.%${topicData.category}%,title.ilike.%${topicData.category}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Product query error:', error);
      }

      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from('shopify_products')
          .select('id, shopify_id, title, handle, seo_title, image_url, price, vendor, category, sub_category, ai_color, ai_material, body_html')
          .not('image_url', 'is', null)
          .limit(requestData.max_internal_links * 2);

        relatedProducts = fallbackData?.slice(0, requestData.max_internal_links) || [];
      } else {
        relatedProducts = data.slice(0, requestData.max_internal_links);
      }
    }

    if (relatedProducts.length === 0) {
      throw new Error(`Aucun produit trouvé pour la catégorie "${topicData.category}". Impossible de générer un article sans produits.`);
    }

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

    const systemPrompt = `Tu es un rédacteur SEO EXPERT et journaliste professionnel spécialisé en décoration d'intérieur.

MISSION : Créer un article de PRESSE PROFESSIONNELLE de ${requestData.word_count_min}-${requestData.word_count_max} mots en ${lang}.

RÈGLES ABSOLUES :
1. Contenu 100% COMPLET - ZÉRO placeholder, ZÉRO texte à compléter
2. Style JOURNALISTIQUE haut de gamme (comme Maison & Travaux, Elle Décoration)
3. Chaque paragraphe : minimum 150 mots de contenu RÉEL et EXPERT
4. Intégration NATURELLE des mots-clés
5. UTILISE UNIQUEMENT LES IMAGES DES PRODUITS FOURNIS - AUCUNE IMAGE EXTERNE`;

    const productsHtml = relatedProducts.map((product, idx) => `
  <div class="product-showcase">
    <a href="https://${storeBaseUrl}/products/${product.handle}" target="_blank" rel="noopener" class="product-link">
      <div class="product-image-wrapper">
        <img src="${product.image_url}"
             alt="${product.title} - ${product.category}"
             class="product-image"
             loading="lazy" />
      </div>
      <div class="product-content">
        <h3 class="product-name">${idx + 1}. ${product.title}</h3>
        <p class="product-price">${product.price} €</p>
        <p class="product-desc">[DESCRIPTION_${idx + 1}]</p>
        <ul class="product-features">
          <li>✓ [FEATURE_${idx + 1}_1]</li>
          <li>✓ [FEATURE_${idx + 1}_2]</li>
          <li>✓ [FEATURE_${idx + 1}_3]</li>
        </ul>
        <span class="product-cta">Découvrir ce produit →</span>
      </div>
    </a>
  </div>`).join('\n\n');

    const userPrompt = `Rédige un article de PRESSE PROFESSIONNELLE complet en ${lang} : "${topicData.title}"

MOTS-CLÉS : ${topicData.keywords.join(', ')}
CATÉGORIE : ${topicData.category}

🎯 PRODUITS À INTÉGRER (${relatedProducts.length}) :
${JSON.stringify(productsForPrompt, null, 2)}

📰 STRUCTURE ARTICLE DE PRESSE :

<article class="blog-article">

  <header class="article-header">
    <h1 class="article-title">[Titre journalistique accrocheur 60-80 caractères intégrant "${topicData.keywords[0]}"]</h1>
    <p class="article-lead">[Chapeau journalistique captivant de 3-4 lignes résumant l'article]</p>
    <div class="article-meta">
      <time>Publié le [DATE]</time>
      <span class="reading-time">[X] min de lecture</span>
    </div>
  </header>

  <div class="article-intro">
    <p>[Introduction journalistique riche et engageante de 250+ mots. Contextualise le sujet, pose la problématique, annonce ce que le lecteur va découvrir. Intègre naturellement les mots-clés : ${topicData.keywords.join(', ')}]</p>
    <p>[Deuxième paragraphe d'introduction : statistiques, tendances du marché, importance du sujet pour le lecteur]</p>
  </div>

  <nav class="table-of-contents">
    <h2>Au sommaire</h2>
    <ol>
      <li><a href="#contexte">Le Marché ${topicData.category} en 2025</a></li>
      <li><a href="#tendances">Tendances et Innovations</a></li>
      <li><a href="#criteres">Les Critères de Choix Essentiels</a></li>
      <li><a href="#selection">Notre Sélection Experte de ${relatedProducts.length} Produits</a></li>
      <li><a href="#comparatif">Analyse Comparative Détaillée</a></li>
      <li><a href="#guide-achat">Guide d'Achat Pratique</a></li>
      <li><a href="#entretien">Entretien et Durabilité</a></li>
      <li><a href="#faq">Vos Questions d'Expert</a></li>
    </ol>
  </nav>

  <section id="contexte">
    <h2>Le Marché ${topicData.category} en 2025 : État des Lieux</h2>
    <p>[300+ mots : Analyse du marché, chiffres clés, évolution, attentes des consommateurs. Style journalistique informatif et expert.]</p>

    <h3>Pourquoi Ce Guide Est Essentiel ?</h3>
    <p>[200+ mots : Enjeux du choix, impact sur l'intérieur, investissement, erreurs courantes à éviter]</p>
  </section>

  <section id="tendances">
    <h2>Tendances et Innovations ${topicData.category} 2025</h2>
    <p>[250+ mots : Introduction aux tendances phares de l'année]</p>

    <h3>Matériaux et Finitions en Vogue</h3>
    <p>[200+ mots : Détail des matériaux tendance, durabilité, esthétique]</p>

    <h3>Styles et Design Dominants</h3>
    <p>[200+ mots : Styles populaires, influences, palettes de couleurs]</p>
  </section>

  <section id="criteres">
    <h2>Les Critères de Choix Essentiels</h2>
    <p>[250+ mots : Introduction aux critères de sélection]</p>

    <h3>Budget et Rapport Qualité-Prix</h3>
    <p>[180+ mots : Fourchettes de prix, ce qui justifie un prix élevé, pièges à éviter]</p>

    <h3>Dimensions et Adaptation à l'Espace</h3>
    <p>[180+ mots : Comment mesurer, prendre en compte la circulation, configurations]</p>

    <h3>Qualité de Fabrication et Durabilité</h3>
    <p>[180+ mots : Signes de qualité, matériaux robustes, garanties, labels]</h3>
  </section>

  <section id="selection" class="product-section">
    <h2>Notre Sélection Experte : ${relatedProducts.length} ${topicData.category} d'Exception</h2>
    <p class="section-intro">Notre équipe d'experts en décoration d'intérieur a testé et sélectionné ${relatedProducts.length} produits qui se distinguent par leur qualité exceptionnelle, leur design soigné et leur excellent rapport qualité-prix. Chaque produit a été évalué selon des critères stricts : matériaux, finitions, confort, durabilité et esthétique.</p>

${productsHtml}

  </section>

  <section id="comparatif">
    <h2>Analyse Comparative Détaillée</h2>
    <p>[350+ mots : Comparaison approfondie des ${relatedProducts.length} produits présentés. Analyse objective des forces/faiblesses de chacun. Recommandations selon différents profils (budget, espace, style)]</p>

    <h3>Le Meilleur Rapport Qualité-Prix</h3>
    <p>[150+ mots : Recommandation argumentée avec références aux produits présentés]</p>

    <h3>Le Choix Premium</h3>
    <p>[150+ mots : Le produit haut de gamme et pourquoi il vaut l'investissement]</p>

    <h3>L'Option pour Petits Budgets</h3>
    <p>[150+ mots : Solution accessible sans compromis sur la qualité]</p>
  </section>

  <section id="guide-achat">
    <h2>Guide d'Achat Pratique</h2>
    <p>[250+ mots : Conseils pratiques pour l'achat, où acheter, garanties, livraison, montage]</p>

    <h3>Check-list Avant Achat</h3>
    <ul class="checklist">
      <li>[Point important 1 - détaillé en 1-2 phrases]</li>
      <li>[Point important 2 - détaillé en 1-2 phrases]</li>
      <li>[Point important 3 - détaillé en 1-2 phrases]</li>
      <li>[Point important 4 - détaillé en 1-2 phrases]</li>
      <li>[Point important 5 - détaillé en 1-2 phrases]</li>
    </ul>
  </section>

  <section id="entretien">
    <h2>Entretien et Préservation de Votre ${topicData.category}</h2>
    <p>[250+ mots : Introduction aux bonnes pratiques d'entretien]</p>

    <h3>Entretien Quotidien</h3>
    <p>[180+ mots : Gestes simples du quotidien pour préserver]</p>

    <h3>Nettoyage en Profondeur</h3>
    <p>[180+ mots : Techniques de nettoyage approfondi selon les matériaux]</p>

    <h3>Prévenir l'Usure Prématurée</h3>
    <p>[150+ mots : Astuces pour prolonger la durée de vie]</p>
  </section>

  <section id="faq" class="faq-section">
    <h2>Vos Questions d'Expert sur ${topicData.category}</h2>

    <div class="faq-item">
      <h3>[Question pertinente 1 sur ${topicData.category} ?]</h3>
      <p>[Réponse experte détaillée 120-150 mots]</p>
    </div>

    <div class="faq-item">
      <h3>[Question pertinente 2 ?]</h3>
      <p>[Réponse experte détaillée 120-150 mots]</p>
    </div>

    <div class="faq-item">
      <h3>[Question pertinente 3 ?]</h3>
      <p>[Réponse experte détaillée 120-150 mots]</p>
    </div>

    <div class="faq-item">
      <h3>[Question pertinente 4 ?]</h3>
      <p>[Réponse experte détaillée 120-150 mots]</p>
    </div>

    <div class="faq-item">
      <h3>[Question pertinente 5 ?]</h3>
      <p>[Réponse experte détaillée 120-150 mots]</p>
    </div>

    <div class="faq-item">
      <h3>[Question pertinente 6 ?]</h3>
      <p>[Réponse experte détaillée 120-150 mots]</p>
    </div>
  </section>

  <section class="article-conclusion">
    <h2>Notre Verdict Final</h2>
    <p>[250+ mots : Conclusion journalistique synthétisant les points clés, récapitulant les meilleures options selon différents profils, encourageant à l'action avec mention naturelle de ${storeBaseUrl} pour découvrir les produits présentés]</p>
  </section>

  <footer class="article-footer">
    <div class="article-tags">
      <span class="tag">#${topicData.keywords[0]}</span>
      <span class="tag">#${topicData.keywords[1] || 'décoration'}</span>
      <span class="tag">#guide2025</span>
      <span class="tag">#expertdeco</span>
    </div>
  </footer>

</article>

⚠️ INSTRUCTIONS CRITIQUES :

1. DESCRIPTIONS PRODUITS : Remplace chaque [DESCRIPTION_X] par une description UNIQUE de 50-80 mots pour le produit correspondant. Utilise les infos fournies : titre, prix, couleur, matériau, description.

2. CARACTÉRISTIQUES : Remplace chaque [FEATURE_X_Y] par une caractéristique SPÉCIFIQUE et CONCRÈTE du produit (pas générique).

3. CONTENU : Remplis TOUS les [...] avec du contenu RÉEL, INFORMATIF et EXPERT. Respecte les minimums de mots.

4. STYLE : Ton journalistique haut de gamme, style magazine déco professionnel.

5. IMAGES : N'ajoute AUCUNE image externe. Utilise UNIQUEMENT les images des ${relatedProducts.length} produits fournis.

6. MOTS-CLÉS : Intègre naturellement : ${topicData.keywords.join(', ')}

7. RÉFÉRENCES PRODUITS : Dans les sections comparatives et guide d'achat, fais référence AUX PRODUITS PRÉSENTÉS par leur nom.

Génère maintenant l'article HTML COMPLET de qualité presse professionnelle :`;

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
      /\[DESCRIPTION_\d+\]/gi,
      /\[FEATURE_\d+_\d+\]/gi,
      /\[Question pertinente/gi,
      /\[Réponse/gi,
      /\[DATE\]/gi,
      /\[X\] min/gi,
      /placeholder/gi
    ];

    for (const pattern of placeholderPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        validationErrors.push(`Placeholder detected: ${matches[0]}`);
      }
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

    if (wordCount < requestData.word_count_min * 0.8) {
      validationErrors.push(`Word count ${wordCount} is below minimum`);
    }

    const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (content.match(/<h2[^>]*>/gi) || []).length;

    if (h1Count === 0) {
      validationErrors.push('Missing H1 title');
    } else if (h1Count > 1) {
      validationErrors.push(`Multiple H1 tags`);
    }

    if (h2Count < 6) {
      contentIssues.push(`Only ${h2Count} H2 sections`);
    }

    let contentQualityScore = 100;
    if (validationErrors.length > 0) contentQualityScore -= 30;
    if (contentIssues.length > 0) contentQualityScore -= (contentIssues.length * 5);
    if (wordCount < requestData.word_count_min) contentQualityScore -= 10;
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
        products_integrated: relatedProducts.length,
        content_quality_score: contentQualityScore,
        has_placeholders: hasPlaceholders,
        language_validated: true,
        validation_warnings: validationErrors.length > 0 ? validationErrors : undefined,
        message: contentQualityScore >= 90
          ? `Article de presse professionnel généré : ${wordCount} mots, ${relatedProducts.length} produits intégrés, score ${contentQualityScore}/100`
          : validationErrors.length > 0
          ? 'Article généré avec avertissements'
          : `Article généré : ${wordCount} mots, ${relatedProducts.length} produits`
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