import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  compare_at_price?: string;
  ai_color?: string;
  ai_material?: string;
  ai_shape?: string;
  image_url?: string;
  category?: string;
  sub_category?: string;
  tags?: string;
  handle?: string;
  vendor?: string;
  currency?: string;
  description?: string;
  product_type?: string;
  style?: string;
  room?: string;
}

interface ProductSearchFilters {
  query?: string;
  category?: string;
  subCategory?: string;
  color?: string;
  material?: string;
  style?: string;
  room?: string;
  limit?: number;
  status?: string;
}

interface ChatResponse {
  role: "assistant";
  content: string;
  intent: "simple_chat" | "product_chat" | "product_show" | "conversation";
  products: Product[];
  mode: "conversation" | "product_show";
  sector: string;
}

// Initialize Supabase client
function getSupabaseClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials");
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Normalize text for search (handle accents)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .trim();
}

// Extract context from conversation history
function extractContextFromHistory(history: ChatMessage[]): string {
  // Get last 3 user messages to extract context
  const recentUserMessages = history
    .filter(msg => msg.role === 'user')
    .slice(-3)
    .map(msg => msg.content)
    .join(' ');

  return recentUserMessages;
}

// Extract filters from user query
function extractFiltersFromQuery(query: string, history: ChatMessage[] = []): ProductSearchFilters {
  const filters: ProductSearchFilters = {};
  const normalized = normalizeText(query);

  // Check if query is a pronoun reference (show me, show it, etc.)
  const pronounReferences = ['la', 'le', 'les', 'celle', 'celui', 'celles', 'ceux', 'ca', 'ça'];
  const hasPronounReference = pronounReferences.some(word => normalized.includes(word));

  // If pronoun reference, extract context from history
  let searchQuery = query;
  if (hasPronounReference && history.length > 0) {
    const context = extractContextFromHistory(history);
    console.log('🔄 Pronoun detected, using context:', context);
    searchQuery = context + ' ' + query;
  }

  const searchNormalized = normalizeText(searchQuery);

  // Generic request keywords (show all products)
  const genericKeywords = ['produits', 'articles', 'catalogue', 'collection', 'tout', 'tous', 'tes', 'vos'];
  const isGenericRequest = genericKeywords.some(word => searchNormalized.includes(word));

  // Colors (French and English)
  const colors = ['blanc', 'noir', 'gris', 'beige', 'bois', 'marron', 'bleu', 'vert', 'rouge', 'jaune', 'orange', 'rose', 'violet', 'white', 'black', 'gray', 'brown', 'blue', 'green', 'red', 'yellow', 'pink', 'purple'];
  const foundColor = colors.find(c => searchNormalized.includes(normalizeText(c)));
  if (foundColor) {
    filters.color = foundColor;
  }

  // Materials (French and English)
  const materials = ['bois', 'metal', 'métal', 'verre', 'marbre', 'cuir', 'tissu', 'plastique', 'ceramique', 'céramique', 'wood', 'metal', 'glass', 'marble', 'leather', 'fabric', 'plastic', 'ceramic'];
  const foundMaterial = materials.find(m => searchNormalized.includes(normalizeText(m)));
  if (foundMaterial) {
    filters.material = foundMaterial;
  }

  // Styles (French)
  const styles = ['moderne', 'contemporain', 'classique', 'vintage', 'scandinave', 'industriel', 'rustique', 'tendance', 'elegant', 'élégant', 'design', 'minimaliste'];
  const foundStyle = styles.find(s => searchNormalized.includes(normalizeText(s)));
  if (foundStyle) {
    filters.style = foundStyle;
  }

  // Rooms (French)
  const rooms = ['salon', 'chambre', 'cuisine', 'salle de bain', 'bureau', 'jardin', 'terrasse', 'entree', 'entrée'];
  const foundRoom = rooms.find(r => searchNormalized.includes(normalizeText(r)));
  if (foundRoom) {
    filters.room = foundRoom;
  }

  // Product categories (French)
  const categories = ['canape', 'table', 'chaise', 'fauteuil', 'meuble', 'armoire', 'lit', 'bureau', 'lampe', 'miroir'];
  const foundCategory = categories.find(c => searchNormalized.includes(c));
  if (foundCategory) {
    filters.query = foundCategory;
  } else if (isGenericRequest) {
    // Generic request - show all products (no query filter)
    filters.query = '';
  } else {
    // Use the combined query for search
    filters.query = searchQuery;
  }

  filters.status = 'active';
  filters.limit = 12;

  console.log('📋 Extracted filters:', filters);
  return filters;
}

// Calculate relevance score for a product
function calculateRelevanceScore(product: Product, searchQuery: string): number {
  const query = normalizeText(searchQuery);
  const terms = query.split(' ').filter(term => term.length > 2);

  let score = 0;

  // Product type keywords that should give MASSIVE boost
  const productTypes = [
    'table', 'chaise', 'canape', 'fauteuil', 'armoire', 'lit', 'bureau',
    'lampe', 'miroir', 'commode', 'buffet', 'etagere', 'tabouret'
  ];

  // Check if query mentions a specific product type
  const mentionedType = productTypes.find(type => terms.includes(type));

  if (mentionedType) {
    // User is looking for a SPECIFIC product type (e.g., "table")
    // Check if THIS product matches that type
    const title = normalizeText(product.title || '');
    const category = normalizeText(product.category || '');
    const subCategory = normalizeText(product.sub_category || '');

    // MEGA BOOST if product title/category matches the searched type
    if (title.includes(mentionedType) || category === mentionedType || subCategory.includes(mentionedType)) {
      score += 1000; // Prioritize exact type matches
    } else if (category.includes(mentionedType) || title.split(' ').some(word => word === mentionedType)) {
      score += 800; // Close match
    } else {
      // This product is NOT the type user is looking for - penalize heavily
      score -= 500;
    }
  }

  // Category match (100 points)
  if (product.category) {
    const category = normalizeText(product.category);
    if (terms.some(term => category.includes(term))) {
      score += 100;
      // Exact category match bonus (500 points)
      if (terms.some(term => category === term)) {
        score += 500;
      }
    }
  }

  // Sub-category match (80 points)
  if (product.sub_category) {
    const subCat = normalizeText(product.sub_category);
    if (terms.some(term => subCat.includes(term))) {
      score += 80;
    }
  }

  // Title match (50 points)
  if (product.title) {
    const title = normalizeText(product.title);
    const titleWords = title.split(' ');
    let titleMatches = 0;

    for (const term of terms) {
      if (titleWords.some(word => word.includes(term) || term.includes(word))) {
        titleMatches++;
      }
    }

    score += titleMatches * 50;

    // Exact title match bonus (200 points)
    if (terms.some(term => titleWords.includes(term))) {
      score += 200;
    }
  }

  // Tags match (30 points)
  if (product.tags) {
    const tags = normalizeText(product.tags);
    const tagCount = terms.filter(term => tags.includes(term)).length;
    score += tagCount * 30;
  }

  // AI attributes match (20 points each)
  const aiFields = [product.ai_material, product.ai_color, product.ai_shape, product.style, product.room];
  for (const field of aiFields) {
    if (field) {
      const normalized = normalizeText(field);
      if (terms.some(term => normalized.includes(term))) {
        score += 20;
      }
    }
  }

  // Description match (10 points)
  if (product.description) {
    const desc = normalizeText(product.description);
    const descMatches = terms.filter(term => desc.includes(term)).length;
    score += descMatches * 10;
  }

  return score;
}

// Search products in database
async function searchProducts(filters: ProductSearchFilters, storeId?: string): Promise<Product[]> {
  console.log('🔍 [SEARCH] Searching with filters:', filters);

  try {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('shopify_products')
      .select('*')
      .eq('status', filters.status || 'active');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    // Build search conditions
    if (filters.query && filters.query.trim().length > 0) {
      const searchTerms = normalizeText(filters.query).split(' ').filter(term => term.length > 2);

      if (searchTerms.length > 0) {
        // Create OR conditions for each search term across multiple fields
        const orConditions = searchTerms.flatMap(term => [
          `title.ilike.%${term}%`,
          `description.ilike.%${term}%`,
          `tags.ilike.%${term}%`,
          `category.ilike.%${term}%`,
          `sub_category.ilike.%${term}%`,
          `product_type.ilike.%${term}%`,
          `vendor.ilike.%${term}%`,
          `ai_color.ilike.%${term}%`,
          `ai_material.ilike.%${term}%`,
          `ai_shape.ilike.%${term}%`,
          `style.ilike.%${term}%`,
          `room.ilike.%${term}%`,
          `chat_text.ilike.%${term}%`
        ]).join(',');

        query = query.or(orConditions);
      }
    }
    // If no query, return all active products (generic request)

    // Apply additional filters
    if (filters.color) {
      query = query.or(`ai_color.ilike.%${filters.color}%,title.ilike.%${filters.color}%`);
    }

    if (filters.material) {
      query = query.or(`ai_material.ilike.%${filters.material}%,title.ilike.%${filters.material}%`);
    }

    if (filters.style) {
      query = query.or(`style.ilike.%${filters.style}%,tags.ilike.%${filters.style}%`);
    }

    if (filters.room) {
      query = query.or(`room.ilike.%${filters.room}%,tags.ilike.%${filters.room}%`);
    }

    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }

    if (filters.subCategory) {
      query = query.ilike('sub_category', `%${filters.subCategory}%`);
    }

    // Get more products for scoring (3x limit)
    query = query.limit((filters.limit || 12) * 3);

    const { data, error } = await query;

    if (error) {
      console.error('❌ [SEARCH] Database error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('✅ [SEARCH] Found 0 products');
      return [];
    }

    // Calculate relevance scores and sort
    const searchQuery = filters.query || '';
    const scoredProducts = data.map(product => ({
      ...product,
      _relevance_score: calculateRelevanceScore(product, searchQuery)
    }));

    // Sort by relevance score (descending)
    scoredProducts.sort((a, b) => b._relevance_score - a._relevance_score);

    // Return top results
    const results = scoredProducts.slice(0, filters.limit || 12);

    console.log(`✅ [SEARCH] Found ${data.length} products, returning top ${results.length} by relevance`);
    console.log('🎯 [SEARCH] Top 3 scores:', results.slice(0, 3).map(p => ({
      title: p.title,
      score: p._relevance_score,
      category: p.category
    })));

    return results;

  } catch (error) {
    console.error('❌ [SEARCH] Search failed:', error);
    return [];
  }
}

// Detect user intent
async function detectIntent(userMessage: string): Promise<"simple_chat" | "product_chat" | "product_show"> {
  const msg = normalizeText(userMessage);

  console.log("🧠 Analyzing intent for:", msg);

  // 1. SIMPLE_CHAT - Salutations, remerciements, questions générales (PAS de produits)
  const simpleChatKeywords = [
    "bonjour", "salut", "hello", "coucou", "hey", "hi",
    "comment ca va", "ca va", "merci", "thanks", "au revoir", "bye",
    "ok", "d'accord", "parfait", "super", "genial",
    "qui es-tu", "ton nom", "tu fais quoi", "comment tu t'appelles"
  ];

  // 2. PRODUCT_SHOW - Le client veut VOIR et ACHETER des produits (intention forte d'affichage)
  const productShowKeywords = [
    "montre", "montrez", "montre-moi", "affiche", "voir", "regarder",
    "liste", "catalogue", "collection", "gamme", "selection",
    "produits", "articles", "modeles", "vos", "tes",
    "je veux", "je cherche", "acheter", "trouver", "panier"
  ];

  // 3. PRODUCT_CHAT - Discussion sur produits (conseils, info, promo, tendances - SANS affichage)
  const productChatKeywords = [
    // Questions d'information
    "avez-vous", "proposez-vous", "vendez-vous", "est-ce que vous avez",
    "parle-moi", "raconte", "dis-moi", "explique",
    // Promotions et tendances
    "promo", "promotion", "solde", "reduction", "offre", "bon plan",
    "tendance", "nouveau", "nouveaute", "actualite", "quoi de neuf",
    "populaire", "best-seller", "plus vendu", "en vogue",
    // Questions de conseil
    "conseil", "avis", "recommandation", "suggestion", "guide",
    "comment choisir", "lequel", "quelle", "quel est le meilleur",
    "difference", "comparer", "comparaison",
    // Caractéristiques
    "caracteristique", "qualite", "materiau", "dimension",
    "comment est", "c'est comment", "fonctionnement",
    "avantage", "inconvenient", "durable", "resistant"
  ];

  // Product keywords (multi-sector, French) - Pour détecter qu'on parle de produits
  const productKeywords = [
    // Furniture
    "table", "chaise", "canape", "fauteuil", "meuble", "armoire", "lit", "bureau",
    "decor", "decoration", "mobilier", "lampe", "miroir", "coussin", "tapisserie", "tabouret",
    "buffet", "console", "etagere", "commode", "coiffeuse", "paravent",
    // Fashion
    "robe", "chemise", "pantalon", "jupe", "sac", "bijou", "bijoux", "vetement",
    "chaussure", "accessoire", "ceinture", "cravate", "lunettes",
    // Electronics
    "telephone", "smartphone", "ordinateur", "tablette", "casque", "ecouteurs"
  ];

  const isSimpleChat = simpleChatKeywords.some(word => msg.includes(word));
  const hasProductShowIntent = productShowKeywords.some(word => msg.includes(word));
  const hasProductChatIntent = productChatKeywords.some(word => msg.includes(word));
  const hasProductKeyword = productKeywords.some(word => msg.includes(word));

  console.log("🔍 Intent analysis - Simple:", isSimpleChat, "Show:", hasProductShowIntent, "Chat:", hasProductChatIntent, "HasProduct:", hasProductKeyword);

  // LOGIQUE DE DÉCISION (par priorité)

  // 1. Simple chat (pas de mention de produit)
  if (isSimpleChat && !hasProductKeyword && !hasProductShowIntent && !hasProductChatIntent) {
    console.log("🎯 Decision: SIMPLE_CHAT (salutation/général sans produit)");
    return "simple_chat";
  }

  // 2. Product show (intention forte de voir/acheter des produits)
  if (hasProductShowIntent) {
    console.log("🎯 Decision: PRODUCT_SHOW (veut voir/acheter produits)");
    return "product_show";
  }

  // 3. Product chat (discussion sur produits, promo, tendances, conseils)
  if (hasProductChatIntent || hasProductKeyword) {
    console.log("🎯 Decision: PRODUCT_CHAT (discussion produits/conseils)");
    return "product_chat";
  }

  // 4. Fallback: simple chat
  console.log("🎯 Decision: SIMPLE_CHAT (fallback)");
  return "simple_chat";
}

// Call DeepSeek API
async function callDeepSeek(messages: ChatMessage[], maxTokens = 300): Promise<string> {
  const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

  if (!deepseekKey) {
    return "Bonjour ! Je suis votre assistant commercial. Comment puis-je vous aider ?";
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: maxTokens,
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }

    return "Je suis votre assistant commercial. Comment puis-je vous aider ?";

  } catch (err) {
    console.error("❌ Error calling DeepSeek:", err);
    return "Je suis votre assistant commercial. Décrivez-moi ce que vous cherchez !";
  }
}

// Main OmnIA Chat function
async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string
): Promise<ChatResponse> {
  console.log("🚀 [OMNIA] Message received:", userMessage);

  const msg = normalizeText(userMessage);

  try {
    const intent = await detectIntent(userMessage);
    console.log("🎯 Final intent:", intent);

    // Simple chat handler
    if (intent === "simple_chat") {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Tu es un assistant commercial friendly et professionnel.
Réponds de manière concise et chaleureuse en français.
Max 50 mots. Sois naturel et engageant.`
        },
        { role: "user", content: userMessage },
      ];

      const response = await callDeepSeek(messages, 80);

      return {
        role: "assistant",
        content: response,
        intent: "simple_chat",
        products: [],
        mode: "conversation",
        sector: "général"
      };
    }

    // Product chat handler (conversation without showing products)
    if (intent === "product_chat") {
      const searchFilters = extractFiltersFromQuery(userMessage, history);
      const products = await searchProducts(searchFilters, storeId);

      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Tu es un vendeur expert et enthousiaste.

RÈGLES :
🚫 NE montre PAS les produits (pas de liste)
✅ Parle NATURELLEMENT des caractéristiques
✅ Donne des informations PRÉCISES basées sur les produits réels
✅ Termine par une question pour continuer la discussion`
        },
        {
          role: "user",
          content: `PRODUITS DISPONIBLES : ${JSON.stringify(products.map(p => ({
            nom: p.title,
            prix: p.price,
            matériau: p.ai_material,
            couleur: p.ai_color,
            catégorie: p.category
          })), null, 2)}

Question client : "${userMessage}"

Réponds naturellement sans lister les produits.`
        },
      ];

      const response = await callDeepSeek(messages, 200);

      return {
        role: "assistant",
        content: response,
        intent: "product_chat",
        products: [],
        mode: "conversation",
        sector: "général"
      };
    }

    // Product show handler (search and display products)
    console.log("🛍️ Searching products for display...");

    const searchFilters = extractFiltersFromQuery(userMessage, history);
    const products = await searchProducts(searchFilters, storeId);

    let response = "";

    if (products.length === 0) {
      response = `Je n'ai pas trouvé de produits correspondant à votre recherche "${userMessage}".

Pour affiner votre recherche :
• Essayez d'autres termes ou synonymes
• Précisez la couleur, le matériau ou le style
• Indiquez votre budget si vous en avez un

Je reste à votre disposition pour vous aider !`;
    } else {
      const productCount = products.length;
      const promoCount = products.filter(p =>
        p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
      ).length;

      response = `J'ai trouvé ${productCount} produit${productCount > 1 ? 's' : ''} correspondant à votre recherche. ${
        promoCount > 0 ? `📢 ${promoCount} en promotion ! ` : ''
      }Découvrez-les ci-dessous 👇`;
    }

    return {
      role: "assistant",
      content: response,
      intent: "product_show",
      products: products,
      mode: "product_show",
      sector: "général"
    };

  } catch (error) {
    console.error("❌ [OMNIA] Global error:", error);

    return {
      role: "assistant",
      content: "Je suis désolé, je rencontre un problème technique. Pouvez-vous réessayer dans un instant ?",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "général"
    };
  }
}

// Edge function handler
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { userMessage, history, storeId } = await req.json();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "userMessage is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const response = await OmnIAChat(userMessage, history || [], storeId);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("❌ Edge function error:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});