// supabase/functions/omnia-chat/index.ts
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// 🧠 --- CONFIGURATION MULTI-SECTEURS ---
const sectorConfig = {
  meubles: {
    name: "meubles et décoration",
    keywords: [
      "canapé", "table", "chaise", "lit", "meuble", "fauteuil", "commode", "armoire",
      "étagère", "buffet", "bibliothèque", "décoration", "mobilier", "siège", "bureau",
      "sofa", "divan", "tabouret", "banquette", "pouf", "rangement", "dressing"
    ],
    attributes: ["style", "material", "color", "room", "dimensions"],
    styles: ["scandinave", "moderne", "industriel", "rustique", "minimaliste", "contemporain", "vintage", "classique"],
    materials: ["bois", "cuir", "tissu", "métal", "verre", "marbre", "rotin"],
    rooms: ["salon", "chambre", "cuisine", "bureau", "salle à manger", "salle de bain", "entrée", "jardin"]
  },
  montres: {
    name: "montres et accessoires", 
    keywords: [
      "montre", "bracelet", "cadran", "aiguille", "chronographe", "automatique", "quartz",
      "boitier", "bracelet cuir", "bracelet métal", "diamants", "waterproof", "étanche"
    ],
    attributes: ["style", "material", "color", "gender", "movement", "diameter"],
    styles: ["classique", "sport", "luxe", "vintage", "moderne", "minimaliste"],
    materials: ["acier", "or", "titane", "céramique", "cuir", "caoutchouc"],
    genders: ["homme", "femme", "unisexe"]
  },
  pret_a_porter: {
    name: "prêt-à-porter",
    keywords: [
      "chemise", "pantalon", "robe", "jupe", "veste", "manteau", "pull", "t-shirt",
      "jeans", "costume", "cravate", "chaussures", "baskets", "escarpins", "accessoires"
    ],
    attributes: ["style", "material", "color", "size", "season", "occasion"],
    styles: ["casual", "formel", "sportswear", "chic", "bohème", "streetwear"],
    materials: ["coton", "lin", "soie", "laine", "denim", "cuir", "synthétique"],
    occasions: ["travail", "soirée", "quotidien", "sport", "vacances"]
  }
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  storeId?: string;
  sessionToken?: string;
}

interface RetailerSettings {
  assistant_name: string;
  theme_color: string;
  greeting_message: string;
  show_products: boolean;
  cart_enabled: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  ai_enhanced_description?: string;
  price: number;
  image_url: string;
  product_url: string;
  style?: string;
  room?: string;
  category?: string;
  vendor?: string;
  handle?: string;
  shop_name?: string;
  currency?: string;
  compare_at_price?: number;
  inventory_quantity?: number;
  enrichment_status?: string;
}

const retailerCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

// 🧠 --- DÉTECTION DE SECTEUR ---
function detectSector(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const [sector, config] of Object.entries(sectorConfig)) {
    if (config.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return sector;
    }
  }
  
  return "meubles";
}

// 🧠 --- DÉTECTION D'INTENT ---
function detectIntent(message: string, sector: string): string {
  const config = sectorConfig[sector];
  const lowerMessage = message.toLowerCase();
  
  const hasProductKeywords = config.keywords.some(k => lowerMessage.includes(k));
  const hasAttributes = config.attributes.some(attr => {
    const attrKeywords = config[attr] || [];
    return attrKeywords.some(keyword => lowerMessage.includes(keyword));
  });
  
  const hasPrice = /(\d+)\s*(€|euro|euros|dh|dirham|mad)/i.test(lowerMessage);
  const hasSearchWords = /(cherche|recherche|trouve|veux|voudrais|besoin|disponible|acheter)/i.test(lowerMessage);
  
  return (hasProductKeywords || hasAttributes || hasPrice || hasSearchWords) ? "product_search" : "greeting";
}

// 🔄 --- APPEL DEEPSEEK ---
async function callDeepSeek(messages: any[], temperature = 0.7, maxTokens = 500, retries = 2): Promise<any> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔁 DeepSeek API call attempt ${attempt + 1}/${retries + 1}`);

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ DeepSeek API call successful');
      return data;
    } catch (error) {
      console.error(`❌ DeepSeek attempt ${attempt + 1} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

// 🎯 --- EXTRACTION KEYWORDS PAR SECTEUR ---
function extractSectorKeywords(message: string, sector: string) {
  const lowerMessage = message.toLowerCase();
  const config = sectorConfig[sector];
  
  const attributes: any = {
    intent: "product_search",
    sector: sector
  };

  // Détection du type de produit
  for (const keyword of config.keywords) {
    if (lowerMessage.includes(keyword)) {
      attributes.type = keyword;
      break;
    }
  }

  // Détection des attributs spécifiques
  config.attributes.forEach(attr => {
    const values = config[attr] || [];
    for (const value of values) {
      if (lowerMessage.includes(value.toLowerCase())) {
        attributes[attr] = value;
        break;
      }
    }
  });

  // Détection du budget
  const priceMatch = lowerMessage.match(/(\d+)\s*(€|euro|euros|dh|dirham|mad)/i);
  if (priceMatch) {
    attributes.budget = priceMatch[1];
  }

  return attributes;
}

// 🛍️ --- RECHERCHE PRODUITS MULTI-SECTEURS ---
async function searchShopifyProducts(supabase: any, filters: any, storeId?: string, sector?: string): Promise<Product[]> {
  try {
    let query = supabase
      .from('shopify_products')
      .select(`
        id,
        title,
        description,
        price,
        compare_at_price,
        currency,
        image_url,
        product_type,
        vendor,
        handle,
        shop_name,
        inventory_quantity,
        status,
        tags,
        style,
        room,
        category,
        material,
        color,
        ai_color,
        ai_material,
        ai_vision_analysis,
        enrichment_status
      `)
      .eq('status', 'active')
      .limit(20);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const searchConditions = [];

    if (filters.type) {
      searchConditions.push(
        `title.ilike.%${filters.type}%`,
        `product_type.ilike.%${filters.type}%`,
        `category.ilike.%${filters.type}%`,
        `tags.ilike.%${filters.type}%`
      );
    }

    if (sector === 'meubles') {
      if (filters.style) searchConditions.push(`style.ilike.%${filters.style}%`);
      if (filters.room) searchConditions.push(`room.ilike.%${filters.room}%`);
      if (filters.material) {
        searchConditions.push(
          `material.ilike.%${filters.material}%`,
          `ai_material.ilike.%${filters.material}%`
        );
      }
    } else if (sector === 'montres') {
      if (filters.style) searchConditions.push(`style.ilike.%${filters.style}%`);
      if (filters.material) {
        searchConditions.push(
          `material.ilike.%${filters.material}%`,
          `tags.ilike.%${filters.material}%`
        );
      }
      if (filters.gender) searchConditions.push(`tags.ilike.%${filters.gender}%`);
    } else if (sector === 'pret_a_porter') {
      if (filters.style) searchConditions.push(`style.ilike.%${filters.style}%`);
      if (filters.material) searchConditions.push(`material.ilike.%${filters.material}%`);
      if (filters.occasion) searchConditions.push(`tags.ilike.%${filters.occasion}%`);
    }

    if (filters.color) {
      searchConditions.push(
        `color.ilike.%${filters.color}%`,
        `ai_color.ilike.%${filters.color}%`,
        `tags.ilike.%${filters.color}%`
      );
    }

    if (searchConditions.length > 0) {
      query = query.or(searchConditions.join(','));
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Product search error:', error);
      return [];
    }

    return sortProductsByRelevance(data || [], filters, sector);
  } catch (error) {
    console.error('❌ Search error:', error);
    return [];
  }
}

// 🎯 --- TRI PAR PERTINENCE ---
function sortProductsByRelevance(products: any[], filters: any, sector?: string) {
  return products.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.enrichment_status === 'enriched') scoreA += 10;
    if (b.enrichment_status === 'enriched') scoreB += 10;

    if (filters.type) {
      if (a.title?.toLowerCase().includes(filters.type)) scoreA += 8;
      if (b.title?.toLowerCase().includes(filters.type)) scoreB += 8;
      if (a.product_type?.toLowerCase().includes(filters.type)) scoreA += 6;
      if (b.product_type?.toLowerCase().includes(filters.type)) scoreB += 6;
      if (a.tags?.toLowerCase().includes(filters.type)) scoreA += 4;
      if (b.tags?.toLowerCase().includes(filters.type)) scoreB += 4;
    }

    if (sector === 'meubles') {
      if (filters.style && a.style?.toLowerCase().includes(filters.style)) scoreA += 5;
      if (filters.style && b.style?.toLowerCase().includes(filters.style)) scoreB += 5;
      if (filters.room && a.room?.toLowerCase().includes(filters.room)) scoreA += 4;
      if (filters.room && b.room?.toLowerCase().includes(filters.room)) scoreB += 4;
    } else if (sector === 'montres') {
      if (filters.style && a.style?.toLowerCase().includes(filters.style)) scoreA += 6;
      if (filters.style && b.style?.toLowerCase().includes(filters.style)) scoreB += 6;
      if (filters.material && a.material?.toLowerCase().includes(filters.material)) scoreA += 5;
      if (filters.material && b.material?.toLowerCase().includes(filters.material)) scoreB += 5;
    } else if (sector === 'pret_a_porter') {
      if (filters.style && a.style?.toLowerCase().includes(filters.style)) scoreA += 6;
      if (filters.style && b.style?.toLowerCase().includes(filters.style)) scoreB += 6;
      if (filters.occasion && a.tags?.toLowerCase().includes(filters.occasion)) scoreA += 4;
      if (filters.occasion && b.tags?.toLowerCase().includes(filters.occasion)) scoreB += 4;
    }

    if (filters.material) {
      if (a.material?.toLowerCase().includes(filters.material)) scoreA += 3;
      if (b.material?.toLowerCase().includes(filters.material)) scoreB += 3;
      if (a.ai_material?.toLowerCase().includes(filters.material)) scoreA += 2;
      if (b.ai_material?.toLowerCase().includes(filters.material)) scoreB += 2;
    }

    if (filters.color) {
      if (a.color?.toLowerCase().includes(filters.color)) scoreA += 3;
      if (b.color?.toLowerCase().includes(filters.color)) scoreB += 3;
      if (a.ai_color?.toLowerCase().includes(filters.color)) scoreA += 2;
      if (b.ai_color?.toLowerCase().includes(filters.color)) scoreB += 2;
    }

    if (a.inventory_quantity > 0) scoreA += 2;
    if (b.inventory_quantity > 0) scoreB += 2;

    return scoreB - scoreA;
  });
}

// 💬 --- GÉNÉRATION RÉPONSE PRODUITS ---
function generateProductResponse(message: string, products: Product[], filters: any, sector: string): string {
  const config = sectorConfig[sector];
  
  if (products.length === 0) {
    const noProductMessages = {
      meubles: `Je n'ai pas trouvé de meubles correspondant exactement à votre recherche. 
Souhaitez-vous que je vous montre d'autres styles ou préférez-vous préciser (style, couleur, pièce...) ?`,
      montres: `Je n'ai pas trouvé de montres correspondant à vos critères.
Voulez-vous que j'élargisse la recherche ou préférez-vous préciser (style, matériau, budget...) ?`,
      pret_a_porter: `Je n'ai pas trouvé de vêtements correspondant à votre description.
Souhaitez-vous que je vous propose d'autres options ou voulez-vous affiner votre recherche (style, occasion, taille...) ?`
    };

    return noProductMessages[sector] || noProductMessages.meubles;
  }

  const productCount = products.length;
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && !['intent', 'sector'].includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const baseMessages = {
    meubles: `J'ai trouvé ${productCount} meuble${productCount > 1 ? 's' : ''} qui correspondent à votre recherche ! ${activeFilters ? `(filtres: ${activeFilters})` : ''}`,
    montres: `Parfait ! ${productCount} montre${productCount > 1 ? 's' : ''} correspondente${productCount > 1 ? 'nt' : ''} à vos critères. ${activeFilters ? `(filtres: ${activeFilters})` : ''}`,
    pret_a_porter: `Super ! ${productCount} article${productCount > 1 ? 's' : ''} de prêt-à-porter correspondente${productCount > 1 ? 'nt' : ''} à votre style. ${activeFilters ? `(filtres: ${activeFilters})` : ''}`
  };

  let response = baseMessages[sector] || baseMessages.meubles;
  
  const advice = {
    meubles: "\n\n💡 Conseil : N'hésitez pas à me demander des suggestions d'association ou des conseils d'agencement !",
    montres: "\n\n💡 Conseil : Je peux vous aider à choisir en fonction de l'occasion ou de votre style vestimentaire !", 
    pret_a_porter: "\n\n💡 Conseil : Demandez-moi des conseils d'association ou des tenues complètes !"
  };

  response += advice[sector] || advice.meubles;
  response += `\n\nVoici ma sélection :`;

  return response;
}

// 🎯 --- RÉPONSE DE BIENVENUE ---
function generateWelcomeMessage(sector: string, retailerSettings?: RetailerSettings | null): string {
  const sectorMessages = {
    meubles: [
      "Bonjour ! 🛋️ Je suis votre expert en meubles et décoration. Comment puis-je vous aider à créer l'intérieur de vos rêves ?",
      "Salut ! 👋 Spécialiste en mobilier, je peux vous aider à trouver les meilleures pièces pour votre maison. Que cherchez-vous ?",
      "Bienvenue ! 🏠 En tant que conseiller en décoration, je suis là pour vous guider vers les meubles parfaits. Dites-moi tout !"
    ],
    montres: [
      "Bonjour ! ⌚ Expert en horlogerie, je peux vous aider à trouver la montre qui vous correspond. Quel style recherchez-vous ?", 
      "Salut ! 👑 Spécialiste des montres de qualité, je suis là pour vous conseiller. Parlez-moi de vos préférences !",
      "Bienvenue ! 💎 Passionné de montres, je peux vous guider vers la pièce idéale. Quelle occasion cherchez-vous à célébrer ?"
    ],
    pret_a_porter: [
      "Bonjour ! 👗 Experte en mode, je peux vous aider à composer des tenues parfaites. Quel look recherchez-vous ?",
      "Salut ! 👔 Spécialiste du prêt-à-porter, je suis là pour vous conseiller sur votre style. Décrivez-moi vos envies !", 
      "Bienvenue ! 🛍️ Conseillère en mode, je peux vous trouver les pièces qui vous mettront en valeur. Quel est votre projet ?"
    ]
  };

  if (retailerSettings?.greeting_message) {
    return retailerSettings.greeting_message;
  }

  const messages = sectorMessages[sector] || sectorMessages.meubles;
  return messages[Math.floor(Math.random() * messages.length)];
}

// 🧠 --- FONCTION PRINCIPALE ---
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log('=== 💬 OMNIA CHAT REQUEST ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, history = [], storeId, sessionToken } = await req.json() as ChatRequest;

    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    console.log('📝 Message:', message.substring(0, 100));
    console.log('🏪 Store ID:', storeId);

    // Détection du secteur
    const sector = detectSector(message);
    console.log('🎯 Secteur détecté:', sector);

    // Détection de l'intent
    const intent = detectIntent(message, sector);
    console.log('🎯 Intent détecté:', intent);

    let responseMessage: string;
    let products: Product[] = [];
    let selectedProduct: Product | null = null;

    switch (intent) {
      case 'product_search':
        console.log('🔍 Searching products for:', message);
        const filters = extractSectorKeywords(message, sector);
        products = await searchShopifyProducts(supabase, filters, storeId, sector);
        console.log(`✅ Found ${products.length} products`);
        
        responseMessage = generateProductResponse(message, products, filters, sector);
        break;

      case 'greeting':
      default:
        responseMessage = generateWelcomeMessage(sector);
        break;
    }

    console.log('✅ Response generated');

    return new Response(
      JSON.stringify({
        message: responseMessage,
        intent,
        products: products.slice(0, 8),
        selectedProduct,
        sector,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('❌ AI Chat error:', error);
    return new Response(
      JSON.stringify({
        error: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});