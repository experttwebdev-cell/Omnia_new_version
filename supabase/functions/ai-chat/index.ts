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

// Extract filters from user query
function extractFiltersFromQuery(query: string): ProductSearchFilters {
  const filters: ProductSearchFilters = {};
  const normalized = normalizeText(query);
  const lowerQuery = query.toLowerCase();

  // Colors (French and English)
  const colors = ['blanc', 'noir', 'gris', 'beige', 'bois', 'marron', 'bleu', 'vert', 'rouge', 'jaune', 'orange', 'rose', 'violet', 'white', 'black', 'gray', 'brown', 'blue', 'green', 'red', 'yellow', 'pink', 'purple'];
  const foundColor = colors.find(c => normalized.includes(normalizeText(c)));
  if (foundColor) {
    filters.color = foundColor;
  }

  // Materials (French and English)
  const materials = ['bois', 'metal', 'métal', 'verre', 'marbre', 'cuir', 'tissu', 'plastique', 'ceramique', 'céramique', 'wood', 'metal', 'glass', 'marble', 'leather', 'fabric', 'plastic', 'ceramic'];
  const foundMaterial = materials.find(m => normalized.includes(normalizeText(m)));
  if (foundMaterial) {
    filters.material = foundMaterial;
  }

  // Styles (French)
  const styles = ['moderne', 'contemporain', 'classique', 'vintage', 'scandinave', 'industriel', 'rustique', 'tendance', 'elegant', 'élégant', 'design', 'minimaliste'];
  const foundStyle = styles.find(s => normalized.includes(normalizeText(s)));
  if (foundStyle) {
    filters.style = foundStyle;
  }

  // Rooms (French)
  const rooms = ['salon', 'chambre', 'cuisine', 'salle de bain', 'bureau', 'jardin', 'terrasse', 'entree', 'entrée'];
  const foundRoom = rooms.find(r => normalized.includes(normalizeText(r)));
  if (foundRoom) {
    filters.room = foundRoom;
  }

  // Extract main search query
  filters.query = query;
  filters.status = 'active';
  filters.limit = 12;

  return filters;
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
    if (filters.query) {
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

    query = query
      .order('created_at', { ascending: false })
      .limit(filters.limit || 12);

    const { data, error } = await query;

    if (error) {
      console.error('❌ [SEARCH] Database error:', error);
      throw error;
    }

    console.log(`✅ [SEARCH] Found ${data?.length || 0} products`);
    return data || [];

  } catch (error) {
    console.error('❌ [SEARCH] Search failed:', error);
    return [];
  }
}

// Detect user intent
async function detectIntent(userMessage: string): Promise<"simple_chat" | "product_chat" | "product_show"> {
  const msg = normalizeText(userMessage);

  console.log("🧠 Analyzing intent for:", msg);

  // Strong show keywords (French)
  const strongShowKeywords = [
    "montre", "montrez", "montre-moi", "affiche", "voir les", "liste", "catalogue",
    "collection", "gamme", "modeles", "articles", "produits",
    "choix", "options", "selection", "vos"
  ];

  // Product chat keywords (questions, advice)
  const productChatKeywords = [
    "avez-vous", "est-ce que vous avez", "proposez-vous", "vendez-vous",
    "disponible", "disponibilite", "en stock", "livraison", "delai",
    "caracteristique", "specification", "description", "materiau", "couleur",
    "dimension", "taille", "poids", "qualite", "avantage", "inconvenient",
    "durable", "resistant", "entretien", "garantie", "fonctionnement",
    "comment est", "est-ce que", "quelle est", "quelles sont", "c'est quoi",
    "conseil", "avis", "recommandation", "meilleur"
  ];

  // Simple chat keywords
  const simpleChatKeywords = [
    "bonjour", "salut", "hello", "coucou", "hey", "hi",
    "comment ca va", "ca va", "merci", "au revoir", "bye",
    "ok", "d'accord", "parfait", "super", "genial"
  ];

  // Product keywords (multi-sector, French)
  const productKeywords = [
    // Furniture
    "table", "chaise", "canape", "fauteuil", "meuble", "armoire", "lit", "bureau",
    "decor", "decoration", "mobilier", "lampe", "miroir", "coussin", "tapisserie", "tabouret",
    "buffet", "console", "etagere", "commode", "coiffeuse", "paravent",
    // Fashion
    "montre", "robe", "chemise", "pantalon", "jupe", "sac", "bijou", "bijoux", "vetement",
    "chaussure", "accessoire", "ceinture", "cravate", "lunettes",
    // Electronics
    "telephone", "smartphone", "ordinateur", "tablette", "casque", "ecouteurs"
  ];

  const hasProductKeyword = productKeywords.some(word => msg.includes(word));
  const hasStrongShowIntent = strongShowKeywords.some(word => msg.includes(word));
  const hasChatIntent = productChatKeywords.some(word => msg.includes(word));
  const isSimpleChat = simpleChatKeywords.some(word => msg.includes(word));

  console.log("🔍 Intent analysis - Product:", hasProductKeyword, "Show:", hasStrongShowIntent, "Chat:", hasChatIntent, "Simple:", isSimpleChat);

  // Priority: product_show > product_chat > simple_chat
  if (hasProductKeyword && hasStrongShowIntent) {
    console.log("🎯 Decision: PRODUCT_SHOW");
    return "product_show";
  }

  if (hasProductKeyword && hasChatIntent) {
    console.log("🎯 Decision: PRODUCT_CHAT");
    return "product_chat";
  }

  if (hasProductKeyword) {
    console.log("🎯 Decision: PRODUCT_SHOW (default for product keyword)");
    return "product_show";
  }

  if (isSimpleChat) {
    console.log("🎯 Decision: SIMPLE_CHAT");
    return "simple_chat";
  }

  console.log("🎯 Decision: PRODUCT_CHAT (fallback)");
  return "product_chat";
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
      const searchFilters = extractFiltersFromQuery(userMessage);
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

    const searchFilters = extractFiltersFromQuery(userMessage);
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
