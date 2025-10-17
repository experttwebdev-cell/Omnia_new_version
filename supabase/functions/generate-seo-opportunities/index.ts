import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Product {
  id: string;
  title: string;
  category: string | null;
  sub_category: string | null;
  product_type: string | null;
  tags: string | null;
  seo_title: string | null;
  seo_description: string | null;
  ai_color?: string | null;
  ai_material?: string | null;
}

interface Opportunity {
  article_title: string;
  meta_description: string;
  intro_excerpt: string;
  type: 'category-guide' | 'comparison' | 'how-to' | 'product-spotlight' | 'seasonal';
  primary_keywords: string[];
  secondary_keywords: string[];
  structure: {
    h2_sections: string[];
  };
  seo_opportunity_score: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_word_count: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!deepseekKey) {
      return new Response(
        JSON.stringify({ 
          error: "DeepSeek API key not configured",
          success: false 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 🔥 CORRECTION : Gérer à la fois les appels cron et manuels
    let products: Product[] = [];
    let language = 'fr';
    let isCronCall = false;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        
        if (body.products && Array.isArray(body.products)) {
          // Appel manuel depuis le composant React
          products = body.products;
          language = body.language || 'fr';
        } else {
          // Appel cron - récupérer les produits depuis la base
          isCronCall = true;
          const { data: productsData, error: fetchError } = await supabase
            .from('shopify_products')
            .select('id, title, category, sub_category, product_type, tags, seo_title, seo_description, ai_color, ai_material')
            .limit(200);

          if (fetchError) throw fetchError;
          products = productsData || [];

          // Récupérer la langue de la boutique
          const { data: store } = await supabase
            .from('shopify_stores')
            .select('language')
            .limit(1)
            .maybeSingle();
          
          language = store?.language || 'fr';
        }
      } catch (parseError) {
        console.error("Error parsing request:", parseError);
        // Fallback pour les appels cron sans body
        isCronCall = true;
        const { data: productsData } = await supabase
          .from('shopify_products')
          .select('*')
          .limit(200);
        products = productsData || [];
      }
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No products to process",
          opportunities: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🚀 Processing ${products.length} products in ${language}`);

    // 🔥 CORRECTION : Logique unifiée de génération d'opportunités
    const opportunities = await generateOpportunities(products, language, deepseekKey);

    // 🔥 CORRECTION : Sauvegarde en base seulement pour les appels cron
    if (isCronCall) {
      await saveOpportunitiesToDatabase(opportunities, supabase, language);
    }

    return new Response(
      JSON.stringify({
        success: true,
        opportunities: opportunities,
        total_generated: opportunities.length,
        language: language
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("💥 Error in generate-seo-opportunities:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// 🔥 CORRECTION : Fonction principale de génération
async function generateOpportunities(products: Product[], language: string, apiKey: string): Promise<any[]> {
  const categoryGroups = new Map<string, Product[]>();
  const allOpportunities: any[] = [];

  // Grouper par catégorie
  products.forEach(product => {
    if (product.category) {
      if (!categoryGroups.has(product.category)) {
        categoryGroups.set(product.category, []);
      }
      categoryGroups.get(product.category)!.push(product);
    }
  });

  const languageConfig = {
    fr: {
      expert: "Expert SEO e-commerce spécialisé en contenu optimisé",
      analyze: "Analyse ces produits pour générer des opportunités de contenu:",
      generate: "Génère 2-3 idées d'articles SEO par catégorie"
    },
    en: {
      expert: "E-commerce SEO expert specialized in optimized content",
      analyze: "Analyze these products to generate content opportunities:",
      generate: "Generate 2-3 SEO article ideas per category"
    },
    es: {
      expert: "Experto en SEO para e-commerce especializado en contenido optimizado",
      analyze: "Analiza estos productos para generar oportunidades de contenido:",
      generate: "Genera 2-3 ideas de artículos SEO por categoría"
    },
    de: {
      expert: "E-Commerce-SEO-Experte spezialisiert auf optimierte Inhalte",
      analyze: "Analysieren Sie diese Produkte, um Content-Chancen zu generieren:",
      generate: "Generieren Sie 2-3 SEO-Artikel-Ideen pro Kategorie"
    },
    it: {
      expert: "Esperto SEO e-commerce specializzato in contenuti ottimizzati",
      analyze: "Analizza questi prodotti per generare opportunità di contenuto:",
      generate: "Genera 2-3 idee di articoli SEO per categoria"
    }
  };

  const config = languageConfig[language as keyof typeof languageConfig] || languageConfig.fr;

  // 🎯 Générer exactement 5 types d'opportunités
  const topCategory = Array.from(categoryGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)[0];

  if (topCategory) {
    const [category, categoryProducts] = topCategory;

    try {
      const opportunities = await generateFiveOpportunityTypes(
        category,
        categoryProducts,
        language,
        apiKey,
        config
      );

      allOpportunities.push(...opportunities);

      // Limiter strictement à 5 opportunités
      if (allOpportunities.length > 5) {
        return allOpportunities.slice(0, 5);
      }
      
    } catch (error) {
      console.error(`Error generating opportunities for category ${category}:`, error);
      // Continuer avec la catégorie suivante
      continue;
    }
  }

  // 🔥 CORRECTION : Générer des opportunités de fallback si nécessaire
  if (allOpportunities.length === 0) {
    return generateFallbackOpportunities(products, language);
  }

  return allOpportunities.slice(0, 5);
}

// 🎯 Nouvelle fonction pour générer exactement 5 types d'opportunités
async function generateFiveOpportunityTypes(
  category: string,
  products: Product[],
  language: string,
  apiKey: string,
  config: any
): Promise<any[]> {
  const sampleProducts = products.slice(0, 8);
  const keywords = extractKeywords(products);
  const colors = [...new Set(products.map(p => p.ai_color).filter(Boolean))].slice(0, 3);
  const materials = [...new Set(products.map(p => p.ai_material).filter(Boolean))].slice(0, 3);

  const productList = sampleProducts.map(p => ({
    id: p.id,
    title: p.title,
    type: p.product_type
  }));

  const typeTemplates = language === 'fr' ? {
    'store-guide': 'Guide de la Boutique',
    'buying-guide': 'Guide d\'Achat par Secteur',
    'comparison': 'Comparaison de Produits',
    'top-10': 'Top 10 des Meilleurs Produits',
    'industry-topic': 'Sujet sur l\'Activité'
  } : {
    'store-guide': 'Store Guide',
    'buying-guide': 'Sector Buying Guide',
    'comparison': 'Product Comparison',
    'top-10': 'Top 10 Best Products',
    'industry-topic': 'Industry Topic'
  };

  const prompt = `${config.expert}

Génère EXACTEMENT 5 opportunités d'articles, une pour chaque type ci-dessous:

Catégorie: ${category}
Produits disponibles: ${JSON.stringify(productList)}
Mots-clés: ${keywords.slice(0, 10).join(', ')}
Couleurs: ${colors.join(', ') || 'N/A'}
Matériaux: ${materials.join(', ') || 'N/A'}

TYPES REQUIS (1 article par type):
1. ${typeTemplates['store-guide']} - Vue d'ensemble de la boutique et de ses produits
2. ${typeTemplates['buying-guide']} - Guide d'achat basé sur le secteur/catégorie
3. ${typeTemplates['comparison']} - Comparaison détaillée de 3-5 produits spécifiques
4. ${typeTemplates['top-10']} - Classement des 10 meilleurs produits de la catégorie
5. ${typeTemplates['industry-topic']} - Article sur une tendance ou sujet lié à l'activité

IMPORTANT:
- Inclure les IDs et titres des produits pertinents pour chaque opportunité
- Inclure des images de produits (utiliser les IDs produits)
- Pas de marques ou vendeurs
- Langue: ${language}

Format JSON strict:
{
  "opportunities": [
    {
      "article_title": "Titre SEO optimisé",
      "meta_description": "Description meta 150-160 caractères",
      "intro_excerpt": "Introduction engageante 2-3 phrases",
      "type": "store-guide|buying-guide|comparison|top-10|industry-topic",
      "primary_keywords": ["mot1", "mot2", "mot3"],
      "secondary_keywords": ["mot4", "mot5"],
      "structure": {
        "h2_sections": ["Section 1", "Section 2", "Section 3"]
      },
      "featured_products": [
        {"id": "product-id", "title": "Product Title"}
      ],
      "seo_opportunity_score": 75,
      "difficulty": "easy|medium|hard",
      "estimated_word_count": 2000
    }
  ]
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Tu es un expert SEO. Réponds UNIQUEMENT en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const parsed = JSON.parse(content);

    if (parsed.opportunities && Array.isArray(parsed.opportunities)) {
      return parsed.opportunities.slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error('Error generating 5 opportunity types:', error);
    return generateFallbackOpportunities(products, language);
  }
}

// Helper pour extraire les mots-clés
function extractKeywords(products: Product[]): string[] {
  const keywords = new Set<string>();
  
  products.forEach(p => {
    if (p.tags) {
      p.tags.split(',').forEach(tag => keywords.add(tag.trim().toLowerCase()));
    }
    if (p.product_type) {
      keywords.add(p.product_type.toLowerCase());
    }
  });
  
  return Array.from(keywords).slice(0, 10);
}

// Génération d'opportunités de fallback
function generateFallbackOpportunities(products: Product[], language: string): any[] {
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const mainCategory = categories[0] || 'Products';
  
  const templates = language === 'fr' ? [
    {
      type: 'store-guide',
      article_title: `Guide Complet de Notre Boutique ${mainCategory}`,
      meta_description: `Découvrez notre sélection complète de ${mainCategory}. Guide d'achat, conseils et recommandations.`,
      intro_excerpt: `Explorez notre collection de ${mainCategory} et trouvez les produits parfaits pour vos besoins.`
    },
    {
      type: 'buying-guide',
      article_title: `Guide d'Achat ${mainCategory} : Comment Choisir`,
      meta_description: `Guide complet pour choisir vos ${mainCategory}. Critères, comparaisons et conseils d'experts.`,
      intro_excerpt: `Tout ce que vous devez savoir avant d'acheter vos ${mainCategory}.`
    },
    {
      type: 'comparison',
      article_title: `Comparatif des Meilleurs ${mainCategory}`,
      meta_description: `Comparaison détaillée des ${mainCategory} les plus populaires. Avantages, prix et recommandations.`,
      intro_excerpt: `Nous avons comparé les ${mainCategory} pour vous aider à faire le bon choix.`
    },
    {
      type: 'top-10',
      article_title: `Top 10 des Meilleurs ${mainCategory}`,
      meta_description: `Découvrez notre sélection des 10 meilleurs ${mainCategory}. Classement et avis détaillés.`,
      intro_excerpt: `Voici notre classement des ${mainCategory} incontournables.`
    },
    {
      type: 'industry-topic',
      article_title: `Tendances ${mainCategory} : Ce Qu'il Faut Savoir`,
      meta_description: `Les dernières tendances et innovations dans le secteur des ${mainCategory}.`,
      intro_excerpt: `Restez informé des évolutions du marché des ${mainCategory}.`
    }
  ] : [
    {
      type: 'store-guide',
      article_title: `Complete Guide to Our ${mainCategory} Store`,
      meta_description: `Discover our complete selection of ${mainCategory}. Buying guide, tips and recommendations.`,
      intro_excerpt: `Explore our ${mainCategory} collection and find the perfect products for your needs.`
    },
    {
      type: 'buying-guide',
      article_title: `${mainCategory} Buying Guide: How to Choose`,
      meta_description: `Complete guide to choosing your ${mainCategory}. Criteria, comparisons and expert advice.`,
      intro_excerpt: `Everything you need to know before buying your ${mainCategory}.`
    },
    {
      type: 'comparison',
      article_title: `Best ${mainCategory} Comparison`,
      meta_description: `Detailed comparison of the most popular ${mainCategory}. Features, prices and recommendations.`,
      intro_excerpt: `We compared ${mainCategory} to help you make the right choice.`
    },
    {
      type: 'top-10',
      article_title: `Top 10 Best ${mainCategory}`,
      meta_description: `Discover our selection of the 10 best ${mainCategory}. Rankings and detailed reviews.`,
      intro_excerpt: `Here is our ranking of must-have ${mainCategory}.`
    },
    {
      type: 'industry-topic',
      article_title: `${mainCategory} Trends: What You Need to Know`,
      meta_description: `Latest trends and innovations in the ${mainCategory} sector.`,
      intro_excerpt: `Stay informed about ${mainCategory} market developments.`
    }
  ];

  return templates.map((template, index) => ({
    ...template,
    id: `fallback-${index}`,
    primary_keywords: [mainCategory.toLowerCase()],
    secondary_keywords: ['guide', 'achat', 'comparaison'],
    structure: { h2_sections: ['Introduction', 'Analyse', 'Recommandations'] },
    seo_opportunity_score: 60,
    difficulty: 'medium' as const,
    estimated_word_count: 1500,
    featured_products: products.slice(0, 5).map(p => ({ id: p.id, title: p.title }))
  }));
}

// Sauvegarde en base de données
async function saveOpportunitiesToDatabase(opportunities: any[], supabase: any, language: string) {
  for (const opp of opportunities) {
    try {
      await supabase.from('blog_opportunities').insert({
        article_title: opp.article_title,
        meta_description: opp.meta_description,
        intro_excerpt: opp.intro_excerpt,
        type: opp.type,
        primary_keywords: opp.primary_keywords,
        secondary_keywords: opp.secondary_keywords,
        structure: opp.structure,
        seo_opportunity_score: opp.seo_opportunity_score,
        difficulty: opp.difficulty,
        estimated_word_count: opp.estimated_word_count,
        language: language
      });
    } catch (error) {
      console.error('Error saving opportunity:', error);
    }
  }
}