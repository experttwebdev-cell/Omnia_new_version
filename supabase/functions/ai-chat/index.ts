import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// 🧩 --- CONFIGURATION SUPABASE ---
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// 🧠 --- DÉTECTION AUTOMATIQUE DE SECTEUR ---
function detectSector(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  
  for (const [sector, config] of Object.entries(sectorConfig)) {
    if (config.keywords.some(keyword => lowerMessage.includes(keyword))) {
      return sector;
    }
  }
  
  // Si aucun secteur détecté, on utilise le contexte ou on retourne "meubles" par défaut
  return "meubles";
}

// 🧠 --- INTENTS DYNAMIQUES PAR SECTEUR ---
function getSectorIntents(sector: string) {
  const baseIntents = {
    ChatIntent: {
      name: "ChatIntent",
      description: "Répond de manière naturelle et fluide aux messages généraux.",
      system_prompt: `
Tu es OmnIA, un assistant commercial spécialisé dans ${sectorConfig[sector].name}.
Ton rôle est d'accueillir, conseiller et aider les visiteurs.
Reste professionnel, convivial et pertinent.
Si le message contient une intention d'achat, renvoie vers ProductChatIntent.
`
    },
    ProductChatIntent: {
      name: "ProductChatIntent",
      description: "Analyse le message utilisateur pour détecter les attributs recherchés.",
      system_prompt: `
Tu es un assistant e-commerce intelligent pour ${sectorConfig[sector].name}.
Analyse le message de l'utilisateur et détecte s'il recherche un produit spécifique.
Retourne un objet JSON structuré avec les attributs pertinents pour ce secteur.
Ne donne rien d'autre en sortie.
`
    }
  };

  // Prompt spécifique par secteur pour l'extraction d'attributs
  const sectorPrompts = {
    meubles: `
Retourne un objet JSON avec les attributs suivants :
{
  "intent": "product_search",
  "type": "...", 
  "style": "...",
  "material": "...",
  "color": "...", 
  "room": "...",
  "budget": "..."
}`,

    montres: `
Retourne un objet JSON avec les attributs suivants :
{
  "intent": "product_search", 
  "type": "...",
  "style": "...", 
  "material": "...",
  "color": "...",
  "gender": "...",
  "movement": "..."
}`,

    pret_a_porter: `
Retourne un objet JSON avec les attributs suivants :
{
  "intent": "product_search",
  "type": "...",
  "style": "...",
  "material": "...", 
  "color": "...",
  "size": "...",
  "occasion": "..."
}`
  };

  return {
    ...baseIntents,
    ProductChatIntent: {
      ...baseIntents.ProductChatIntent,
      system_prompt: baseIntents.ProductChatIntent.system_prompt + sectorPrompts[sector]
    }
  };
}

// 🧠 --- FONCTION PRINCIPALE OMNIA CHAT ---
export async function OmnIAChat(
  userMessage: string, 
  history: any[] = [], 
  storeId?: string, 
  settings?: any
) {
  try {
    // Détection du secteur
    const sector = detectSector(userMessage);
    console.log('🎯 Secteur détecté:', sector);
    
    const intents = getSectorIntents(sector);
    const intentName = await detectIntent(userMessage, sector);
    console.log('🎯 Intent détecté:', intentName);

    // 🔍 Chat général
    if (intentName === "ChatIntent") {
      return {
        role: "assistant",
        content: generateSectorWelcomeMessage(sector, settings),
        products: [],
        mode: 'conversation',
        sector: sector
      };
    }

    // 🛍️ Recherche produit
    if (intentName === "ProductChatIntent") {
      const parsed = await extractProductAttributes(userMessage, sector);
      console.log('🔍 Attributs extraits:', parsed);
      
      const products = await searchShopifyProducts(parsed, storeId, sector);
      console.log(`📦 Produits trouvés: ${products.length}`);
      
      return {
        role: "assistant",
        content: generateSectorProductResponse(userMessage, products, parsed, sector),
        products: products.slice(0, 8),
        mode: 'product_show',
        searchFilters: parsed,
        sector: sector
      };
    }

    // Fallback
    return {
      role: "assistant",
      content: "Je comprends que vous cherchez quelque chose. Pouvez-vous me donner plus de détails sur ce que vous recherchez ?",
      products: [],
      mode: 'conversation',
      sector: sector
    };

  } catch (error) {
    console.error('❌ Erreur dans OmnIAChat:', error);
    return {
      role: "assistant", 
      content: "Je rencontre quelques difficultés techniques. Pouvez-vous reformuler votre demande ?",
      products: [],
      mode: 'conversation',
      sector: 'meubles'
    };
  }
}

// 🎯 --- DÉTECTION D'INTENT PAR SECTEUR ---
async function detectIntent(userMessage: string, sector: string): Promise<string> {
  const config = sectorConfig[sector];
  const lowerMessage = userMessage.toLowerCase();
  
  const hasProductKeywords = config.keywords.some(k => lowerMessage.includes(k));
  const hasAttributes = config.attributes.some(attr => {
    const attrKeywords = config[attr] || [];
    return attrKeywords.some(keyword => lowerMessage.includes(keyword));
  });
  
  const hasPrice = /(\d+)\s*(€|euro|euros|dh|dirham|mad)/i.test(lowerMessage);
  const hasSearchWords = /(cherche|recherche|trouve|veux|voudrais|besoin|disponible|acheter)/i.test(lowerMessage);
  
  return (hasProductKeywords || hasAttributes || hasPrice || hasSearchWords) ? "ProductChatIntent" : "ChatIntent";
}

// 🎯 --- MESSAGE DE BIENVENUE PAR SECTEUR ---
function generateSectorWelcomeMessage(sector: string, settings?: any) {
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

  if (settings?.chat_welcome_message) {
    return settings.chat_welcome_message;
  }

  const messages = sectorMessages[sector] || sectorMessages.meubles;
  return messages[Math.floor(Math.random() * messages.length)];
}

// 🧠 --- EXTRACTION D'ATTRIBUTS INTELLIGENTE ---
async function extractProductAttributes(userMessage: string, sector: string) {
  const intents = getSectorIntents(sector);
  
  const body = {
    model: "deepseek-chat", 
    messages: [
      { 
        role: "system", 
        content: intents.ProductChatIntent.system_prompt
      },
      { 
        role: "user", 
        content: userMessage 
      },
    ],
    temperature: 0.1,
    max_tokens: 500
  };

  try {
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!deepseekKey) {
      console.warn("DeepSeek API key not configured, using fallback");
      return extractSectorKeywords(userMessage, sector);
    }

    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${deepseekKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) throw new Error(`API error: ${resp.status}`);

    const data = await resp.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      return { ...extractSectorKeywords(userMessage, sector), ...parsed };
    } catch {
      return extractSectorKeywords(userMessage, sector);
    }
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return extractSectorKeywords(userMessage, sector);
  }
}

// 🎯 --- EXTRACTION DE KEYWORDS PAR SECTEUR ---
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

  // Détection des attributs spécifiques au secteur
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

// 🛍️ --- RECHERCHE INTELLIGENTE MULTI-SECTEURS ---
async function searchShopifyProducts(filters: any, storeId?: string, sector?: string) {
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
        enrichment_status,
        raw_data
      `)
      .eq('status', 'active')
      .limit(20);

    // Filtre par boutique
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    // Application des filtres intelligents
    const searchConditions = [];

    // Filtre par type de produit
    if (filters.type) {
      searchConditions.push(
        `title.ilike.%${filters.type}%`,
        `product_type.ilike.%${filters.type}%`, 
        `category.ilike.%${filters.type}%`,
        `tags.ilike.%${filters.type}%`
      );
    }

    // Filtres spécifiques au secteur
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

    // Filtre couleur multi-secteurs
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

    const { data: products, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return [];
    }

    // Tri par pertinence selon le secteur
    return sortProductsByRelevance(products || [], filters, sector);
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

// 🎯 --- TRI INTELLIGENT PAR PERTINENCE ---
function sortProductsByRelevance(products: any[], filters: any, sector?: string) {
  return products.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    // Bonus pour produits enrichis par IA
    if (a.enrichment_status === 'enriched') scoreA += 10;
    if (b.enrichment_status === 'enriched') scoreB += 10;

    // Correspondance sur le type
    if (filters.type) {
      if (a.title?.toLowerCase().includes(filters.type)) scoreA += 8;
      if (b.title?.toLowerCase().includes(filters.type)) scoreB += 8;
      if (a.product_type?.toLowerCase().includes(filters.type)) scoreA += 6;
      if (b.product_type?.toLowerCase().includes(filters.type)) scoreB += 6;
      if (a.tags?.toLowerCase().includes(filters.type)) scoreA += 4;
      if (b.tags?.toLowerCase().includes(filters.type)) scoreB += 4;
    }

    // Points selon le secteur
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

    // Correspondance matériau/couleur
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

    // Produits en stock prioritaires
    if (a.inventory_quantity > 0) scoreA += 2;
    if (b.inventory_quantity > 0) scoreB += 2;

    return scoreB - scoreA;
  });
}

// 💬 --- GÉNÉRATION DE RÉPONSE INTELLIGENTE ---
function generateSectorProductResponse(userMessage: string, products: any[], filters: any, sector: string) {
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
  
  // Ajout de conseils spécifiques au secteur
  const advice = {
    meubles: "\n\n💡 Conseil : N'hésitez pas à me demander des suggestions d'association ou des conseils d'agencement !",
    montres: "\n\n💡 Conseil : Je peux vous aider à choisir en fonction de l'occasion ou de votre style vestimentaire !", 
    pret_a_porter: "\n\n💡 Conseil : Demandez-moi des conseils d'association ou des tenues complètes !"
  };

  response += advice[sector] || advice.meubles;
  response += `\n\nVoici ma sélection :`;

  return response;
}

// 🎯 --- FONCTION POUR OBTENIR UN PRODUIT SPÉCIFIQUE ---
export async function getProductById(productId: string, storeId?: string) {
  try {
    let query = supabase
      .from('shopify_products')
      .select('*')
      .eq('id', productId)
      .eq('status', 'active')
      .single();

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data: product, error } = await query;

    if (error) {
      console.error('Error fetching product:', error);
      return null;
    }

    return product;
  } catch (error) {
    console.error('Get product error:', error);
    return null;
  }
}

// 🚀 --- SERVEUR EDGE FUNCTION ---
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { message, products, history, storeId, settings } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await OmnIAChat(message, history || [], storeId, settings);

    return new Response(
      JSON.stringify({
        success: true,
        response: result.content,
        products: result.products || [],
        mode: result.mode || 'conversation',
        searchFilters: result.searchFilters,
        sector: result.sector
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in ai-chat function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        response: "Désolé, une erreur s'est produite. Pouvez-vous reformuler votre demande ?"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});