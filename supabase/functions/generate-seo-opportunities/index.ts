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

  // Traiter les 3 premières catégories les plus peuplées
  const topCategories = Array.from(categoryGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  for (const [category, categoryProducts] of topCategories) {
    if (categoryProducts.length < 3) continue;

    try {
      const opportunities = await generateCategoryOpportunities(
        category, 
        categoryProducts, 
        language, 
        apiKey, 
        config
      );
      
      allOpportunities.push(...opportunities);
      
      // Limiter le nombre total d'opportunités
      if (allOpportunities.length >= 8) break;
      
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

  return allOpportunities.sort((a, b) => (b.seo_opportunity_score || 50) - (a.seo_opportunity_score || 50));
}

// 🔥 CORRECTION : Génération par catégorie
async function generateCategoryOpportunities(
  category: string, 
  products: Product[], 
  language: string, 
  apiKey: string,
  config: any
): Promise<any[]> {
  
  const sampleProducts = products.slice(0, 5);
  const keywords = extractKeywords(products);
  const colors = [...new Set(products.map(p => p.ai_color).filter(Boolean))].slice(0, 3);
  const materials = [...new Set(products.map(p => p.ai_material).filter(Boolean))].slice(0, 3);

  const prompt = `${config.expert}

${config.analyze}
- Catégorie: ${category}
- Nombre de produits: ${products.length}
- Produits: ${sampleProducts.map(p => p.title).join(', ')}
- Mots-clés: ${keywords.slice(0, 8).join(', ')}
- Couleurs: ${colors.join(', ') || 'N/A'}
- Matériaux: ${materials.join(', ') || 'N/A'}
- Langue: ${language}

${config.generate}

IMPORTANT:
- Pas de marques ou noms de vendeurs
- Basé uniquement sur catégories et caractéristiques produits
- 2-3 opportunités maximum
- Types variés: guides, comparaisons, conseils

Format de réponse JSON:
{
  "opportunities": [
    {
      "article_title": "Titre SEO",
      "meta_description": "Description meta",
      "intro_excerpt": "Introduction",
      "type": "category-guide|comparison|how-to|product-spotlight|seasonal",
      "primary_keywords": ["mot1", "mot2"],
      "secondary_keywords": ["mot3", "mot4"],
      "structure": {"h2_sections": ["Section1", "Section2"]},
      "seo_opportunity_score": 85,
      "difficulty": "easy|medium|hard",
      "estimated_word_count": 2000
    }
  ]
}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

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
          { role: "system", content: "Réponds UNIQUEMENT en JSON valide." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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

    // 🔥 CORRECTION : Parsing robuste du JSON
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]);
    }

    if (!parsed.opportunities || !Array.isArray(parsed.opportunities)) {
      throw new Error("Invalid opportunities format");
    }

    // Ajouter les IDs de produits liés
    return parsed.opportunities.map((opp: any) => ({
      ...opp,
      product_ids: products.map(p => p.id),
      product_count: products.length,
      category: category
    }));

  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Error generating for category ${category}:`, error);
    return generateFallbackForCategory(category, products, language);
  }
}

// 🔥 CORRECTION : Fonctions utilitaires
function extractKeywords(products: Product[]): string[] {
  const allWords = products.flatMap(p => [
    p.title,
    p.category,
    p.sub_category,
    p.product_type,
    ...(p.tags ? p.tags.split(',').map(t => t.trim()) : [])
  ].filter(Boolean));

  const wordCount = new Map<string, number>();
  allWords.forEach(word => {
    const cleanWord = word.toLowerCase().trim();
    if (cleanWord.length > 3) {
      wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
    }
  });

  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

function generateFallbackOpportunities(products: Product[], language: string): any[] {
  console.log("🔄 Generating fallback opportunities");
  
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const mainCategory = categories[0] || 'Produits';
  
  return [{
    article_title: language === 'fr' 
      ? `Guide Complet : ${mainCategory}` 
      : `Complete Guide: ${mainCategory}`,
    meta_description: language === 'fr'
      ? `Découvrez notre sélection de ${products.length} ${mainCategory.toLowerCase()} et nos conseils d'experts.`
      : `Discover our selection of ${products.length} ${mainCategory.toLowerCase()} and expert advice.`,
    intro_excerpt: language === 'fr'
      ? `Notre guide vous aide à choisir parmi ${products.length} produits ${mainCategory.toLowerCase()} adaptés à vos besoins.`
      : `Our guide helps you choose from ${products.length} ${mainCategory.toLowerCase()} products suited to your needs.`,
    type: 'category-guide',
    primary_keywords: [mainCategory, 'guide', 'conseils'],
    secondary_keywords: ['achat', 'comparaison', 'meilleur'],
    structure: {
      h2_sections: language === 'fr' 
        ? ['Introduction', 'Notre Sélection', 'Conseils d\'Achat', 'FAQ']
        : ['Introduction', 'Our Selection', 'Buying Tips', 'FAQ']
    },
    seo_opportunity_score: 75,
    difficulty: 'medium',
    estimated_word_count: 1800,
    product_ids: products.slice(0, 10).map(p => p.id),
    product_count: products.length,
    category: mainCategory
  }];
}

function generateFallbackForCategory(category: string, products: Product[], language: string): any[] {
  return [{
    article_title: `${category} - Guide et Sélection`,
    meta_description: `Découvrez nos ${products.length} produits ${category} et nos conseils.`,
    intro_excerpt: `Explorez notre gamme de ${products.length} produits ${category} soigneusement sélectionnés.`,
    type: 'category-guide',
    primary_keywords: [category, 'guide', 'achat'],
    secondary_keywords: ['conseils', 'sélection', 'meilleur'],
    structure: { h2_sections: ['Introduction', 'Sélection', 'Conseils', 'Conclusion'] },
    seo_opportunity_score: 70,
    difficulty: 'easy',
    estimated_word_count: 1500,
    product_ids: products.map(p => p.id),
    product_count: products.length,
    category: category
  }];
}

async function saveOpportunitiesToDatabase(opportunities: any[], supabase: any, language: string) {
  const opportunitiesToInsert = opportunities.map(opp => ({
    title: opp.article_title,
    description: opp.intro_excerpt || opp.meta_description,
    type: opp.type,
    target_keywords: [...(opp.primary_keywords || []), ...(opp.secondary_keywords || [])],
    related_product_ids: opp.product_ids || [],
    product_language: language,
    category: opp.category,
    score: opp.seo_opportunity_score || 50,
    estimated_word_count: opp.estimated_word_count || 2000,
    difficulty: opp.difficulty || 'medium',
    status: 'identified'
  }));

  const { error } = await supabase
    .from('blog_opportunities')
    .upsert(opportunitiesToInsert, {
      onConflict: 'title',
      ignoreDuplicates: true
    });

  if (error) {
    console.error('Error saving opportunities:', error);
  } else {
    console.log(`✅ Saved ${opportunities.length} opportunities to database`);
  }
}