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
        .select('id, shopify_id, title, handle, seo_title')
        .limit(requestData.max_internal_links * 3);

      if (topicData.category) {
        query.eq('category', topicData.category);
      }

      const { data } = await query;
      relatedProducts = data?.slice(0, requestData.max_internal_links) || [];
    }

    const { data: storeData } = await supabase
      .from('shopify_stores')
      .select('shopify_store_url')
      .limit(1)
      .single();

    const storeUrl = storeData?.shopify_store_url || 'decora-home.fr';
    const storeBaseUrl = storeUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

    const productExamples = relatedProducts.map(p => p.title).join('", "');

    const articlePrompt = `Tu es un rédacteur SEO expert spécialisé en décoration d'intérieur et ameublement. Tu crées des articles structurés comme de véritables articles de presse professionnels.

INFORMATIONS OBLIGATOIRES À UTILISER:
Catégorie principale: ${topicData.category}
${topicData.subcategory ? `Sous-catégorie: ${topicData.subcategory}` : ''}
Mots-clés SEO OBLIGATOIRES à intégrer naturellement: ${topicData.keywords.join(', ')}
Langue: ${requestData.language === 'fr' ? 'Français' : requestData.language}
Longueur cible: ${requestData.word_count_min}-${requestData.word_count_max} mots
Produits disponibles: [${productExamples}]

STRUCTURE ARTICLE DE PRESSE PROFESSIONNELLE (HTML):

1. TITRE PRINCIPAL <h1>
   - Titre accrocheur intégrant les mots-clés principaux
   - Entre 50-70 caractères optimisé SEO

2. CHAPEAU / INTRODUCTION (2-3 paragraphes)
   - Résumé captivant de l'article
   - Intégrer naturellement les mots-clés: ${topicData.keywords.join(', ')}
   - Style journalistique engageant

3. IMAGE D'EN-TÊTE
   - <img> avec alt optimisé SEO incluant les mots-clés
   - src="https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg" (utiliser un ID aléatoire valide)
   - Légende <figcaption> descriptive

4. TABLE DES MATIÈRES CLIQUABLE
   <nav class="table-of-contents">
   <ul>
     <li><a href="#section-1">Titre Section 1</a></li>
     ...
   </ul>
   </nav>

5. CORPS DE L'ARTICLE (5-7 SECTIONS)
   Chaque section doit avoir:
   - <h2 id="section-X"> avec ancre pour navigation
   - 2-3 paragraphes <p> riches et informatifs
   - <h3> pour les sous-sections
   - IMAGE ILLUSTRATIVE avec <img> Pexels + <figcaption>
   - Listes <ul>/<ol> pour conseils pratiques
   - Intégrer NATURELLEMENT les mots-clés: ${topicData.keywords.join(', ')}
   - Citations ou encadrés <blockquote> si pertinent

   THÉMATIQUES SUGGÉRÉES:
   - Introduction au sujet (contexte catégorie: ${topicData.category})
   - Tendances actuelles en ${topicData.category}
   - Guide pratique et conseils d'expert
   - Erreurs courantes à éviter
   - Inspiration et idées créatives
   - Conseils d'achat et critères de sélection

6. IMAGES PEXELS
   - Utiliser 3-5 images pertinentes de Pexels
   - Format: <figure><img src="https://images.pexels.com/photos/[ID]/pexels-photo-[ID].jpeg" alt="description avec mots-clés" /><figcaption>Légende descriptive</figcaption></figure>
   - Alt text optimisé avec mots-clés naturels

7. LIENS INTERNES PRODUITS (${requestData.max_internal_links} liens)
   Intégrer naturellement avec ancres variées:
   - "Découvrez notre collection de <a href="https://${storeBaseUrl}/products/[handle]">[nom produit]</a>"
   - "Un <a href="https://${storeBaseUrl}/products/[handle]">[nom produit]</a> apporte élégance et fonctionnalité"
   - "Explorez nos <a href="https://${storeBaseUrl}/products/[handle]">[nom produit]</a> pour un style unique"

8. SECTION FAQ <h2>
   Questions/réponses format journalistique:
   <div class="faq-item">
     <h3>Question pratique ?</h3>
     <p>Réponse détaillée et utile</p>
   </div>
   (4-6 questions pertinentes)

9. CONCLUSION PROFESSIONNELLE
   - Résumé des points clés
   - Call-to-action subtil vers ${storeBaseUrl}
   - Encouragement à l'action

10. TAGS SEO
    <div class="tags">
    <span class="tag">#tag1</span>
    <span class="tag">#tag2</span>
    ...
    </div>

RÈGLES STRICTES:
✓ UTILISER OBLIGATOIREMENT les mots-clés: ${topicData.keywords.join(', ')}
✓ RESPECTER la catégorie: ${topicData.category}
${topicData.subcategory ? `✓ MENTIONNER la sous-catégorie: ${topicData.subcategory}` : ''}
✓ HTML sémantique professionnel (<article>, <section>, <figure>, <nav>)
✓ Ton journalistique: informatif, expert, engageant, accessible
✓ Intégration naturelle des mots-clés (densité 1-2%, pas de keyword stuffing)
✓ 3-5 images Pexels avec alt optimisés
✓ Structure hiérarchique claire H1 > H2 > H3
✓ Paragraphes riches (80-150 mots)
✓ Exemples concrets, données, conseils actionnables

Génère maintenant l'article complet en HTML avec toutes les sections, images Pexels et liens internes:`;

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
            content: "Tu es un rédacteur SEO expert et journaliste spécialisé en décoration d'intérieur. Tu crées des articles de presse professionnels en HTML, structurés avec titres, sous-titres, images Pexels, et liens internes. Tu respectes STRICTEMENT les mots-clés, catégories et sous-catégories fournis."
          },
          { role: "user", content: articlePrompt }
        ],
        temperature: 0.7,
        max_tokens: 4500
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

    const productLinks: Array<{ product_id: string; shopify_id: string; title: string; handle: string }> = [];

    if (requestData.internal_linking) {
      for (const product of relatedProducts) {
        const productUrl = `https://${storeBaseUrl}/products/${product.handle}`;

        const linkRegex = new RegExp(`href=[\"']https://${storeBaseUrl.replace('.', '\\.')}/products/\\[handle\\][\"']`, 'g');
        const hasPlaceholder = content.match(linkRegex);

        if (hasPlaceholder && productLinks.length < requestData.max_internal_links) {
          content = content.replace(
            `href=\"https://${storeBaseUrl}/products/[handle]\"`,
            `href=\"${productUrl}\"`
          );
          content = content.replace(/\[nom produit\]/, product.title);

          productLinks.push({
            product_id: product.id,
            shopify_id: product.shopify_id,
            title: product.title,
            handle: product.handle
          });
        }
      }
    }

    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

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
        message: 'Article de blog généré avec succès'
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