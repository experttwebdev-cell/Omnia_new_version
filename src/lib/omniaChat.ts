import { supabase, getEnvVar } from "./supabase";
import { searchProducts, extractFiltersFromQuery, type ProductSearchFilters } from "./productSearch";

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
  product_url?: string;
}

interface ChatResponse {
  role: "assistant";
  content: string;
  intent: "simple_chat" | "product_chat" | "product_show";
  products: Product[];
  mode: "conversation" | "product_show";
  sector: string;
}

//
// 🧠 DÉTECTION D'INTENTION - 3 TYPES
//
async function detectIntent(userMessage: string): Promise<"simple_chat" | "product_chat" | "product_show"> {
  const msg = userMessage.toLowerCase().trim();
  
  console.log("🧠 Analyse intention pour:", msg);

  // 1. CHAT SIMPLE - Salutations basiques
  const simpleChatKeywords = [
    "bonjour", "salut", "hello", "coucou", "hey", "hi", 
    "comment ça va", "ça va", "how are you", "bien et toi",
    "merci", "thanks", "thank you", "de rien", "au revoir", "bye"
  ];

  // 2. INTENTION PRODUIT - Discussion sur produits
  const productChatKeywords = [
    "caractéristique", "spécification", "description", "matériau", "couleur",
    "dimension", "taille", "poids", "qualité", "avantage", "inconvénient",
    "durable", "résistant", "entretien", "garantie", "livraison",
    "comment est", "est-ce que", "quelle est", "quelles sont"
  ];

  // 3. RECHERCHE PRODUIT - Montrer des produits
  const productShowKeywords = [
    "cherche", "trouve", "trouver", "acheter", "voir", "recherche", 
    "disponible", "propose", "conseille", "recommande", "suggère",
    "montre", "présente", "affiche", "donne", "veux", "voudrais",
    "je veux", "je voudrais", "j'aimerais", "donne-moi", "montre-moi"
  ];

  // Mots-clés produits
  const productKeywords = [
    "table", "chaise", "canapé", "canape", "montre", "robe", "bureau",
    "armoire", "lit", "fauteuil", "meuble", "décor", "décoration",
    "accessoire", "bijou", "vêtement", "vetement", "mobilier"
  ];

  // 🔥 LOGIQUE DE DÉTECTION
  const isSimpleChat = simpleChatKeywords.some(word => msg.includes(word));
  const isProductChat = productChatKeywords.some(word => msg.includes(word));
  const hasShowIntent = productShowKeywords.some(word => msg.includes(word));
  const hasProductKeyword = productKeywords.some(word => msg.includes(word));

  console.log("🔍 Intent - Simple:", isSimpleChat, "ProductChat:", isProductChat, "Show:", hasShowIntent, "Product:", hasProductKeyword);

  // 1. Chat simple prioritaire
  if (isSimpleChat && !hasProductKeyword) {
    console.log("🎯 Décision: CHAT SIMPLE");
    return "simple_chat";
  }

  // 2. Discussion produit (questions sur caractéristiques)
  if (isProductChat && hasProductKeyword) {
    console.log("🎯 Décision: DISCUSSION PRODUIT");
    return "product_chat";
  }

  // 3. Affichage produit (recherche concrète)
  if (hasShowIntent && hasProductKeyword) {
    console.log("🎯 Décision: AFFICHAGE PRODUIT");
    return "product_show";
  }

  // 4. Fallback: si produit mentionné mais intention floue → discussion
  if (hasProductKeyword) {
    console.log("🎯 Décision: DISCUSSION PRODUIT (fallback)");
    return "product_chat";
  }

  console.log("🎯 Décision: CHAT SIMPLE (fallback)");
  return "simple_chat";
}

//
// ⚙️ APPEL DEEPSEEK
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 300): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  
  if (!supabaseUrl) {
    return "Bonjour ! Je suis OmnIA. Comment puis-je vous aider ?";
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        model: "deepseek-chat",
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

    return "Je suis OmnIA. Comment puis-je vous aider ?";

  } catch (err) {
    console.error("❌ Erreur callDeepSeek:", err);
    
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
    
    if (lastMessage.includes("bonjour")) {
      return "Bonjour ! 👋 Je suis OmnIA, votre assistant shopping. Que recherchez-vous aujourd'hui ?";
    }
    
    return "Je suis OmnIA, votre assistant shopping. Décrivez-moi ce que vous cherchez !";
  }
}

//
// 💬 GESTIONNAIRE CHAT SIMPLE
//
async function handleSimpleChat(userMessage: string): Promise<ChatResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Tu es OmnIA, assistant e-commerce friendly. 
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
    sector: "meubles"
  };
}

//
// 🛍️ GESTIONNAIRE DISCUSSION PRODUIT
//
async function handleProductChat(userMessage: string, sector: string): Promise<ChatResponse> {
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Tu es OmnIA, expert e-commerce spécialisé en ${sector}.
Réponds aux questions sur les produits de manière informative et utile.
Donne des conseils pratiques. Max 100 mots.`
    },
    { role: "user", content: userMessage },
  ];

  const response = await callDeepSeek(messages, 120);

  return {
    role: "assistant",
    content: response,
    intent: "product_chat",
    products: [], // Pas de produits à afficher
    mode: "conversation",
    sector: sector
  };
}

//
// 🎯 GESTIONNAIRE AFFICHAGE PRODUIT
//
async function handleProductShow(userMessage: string, searchFilters: ProductSearchFilters, storeId?: string): Promise<ChatResponse> {
  console.log("🛍️ Recherche produits pour affichage...");
  
  const result = await searchProducts(searchFilters, storeId);
  const products = result.products;
  
  let response = "";
  
  if (products.length === 0) {
    response = `Je n'ai pas trouvé de produits correspondant à "${userMessage}". 

Pour affiner la recherche :
• Précisez la couleur, le style ou le matériau
• Indiquez votre budget maximum  
• Décrivez le type de produit recherché

Je suis là pour vous aider !`;
  } else {
    const productCount = products.length;
    const promoCount = products.filter(p => 
      p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
    ).length;

    if (productCount <= 3) {
      const productNames = products.map(p => p.title).join(", ");
      response = `J'ai trouvé ${productCount} produit(s) correspondant à votre recherche : ${productNames}. ${
        promoCount > 0 ? `📢 ${promoCount} en promotion ! ` : ''
      }Que pensez-vous de ces options ?`;
    } else {
      response = `J'ai trouvé ${productCount} produits correspondant à "${userMessage}". ${
        promoCount > 0 ? `📢 ${promoCount} sont en promotion ! ` : ''
      }Je vous présente les meilleures options ci-dessous.`;
    }
  }

  return {
    role: "assistant",
    content: response,
    intent: "product_show",
    products: products,
    mode: "product_show",
    sector: "meubles"
  };
}

//
// 🧩 FONCTION PRINCIPALE OMNIA
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string,
  onChunk?: (text: string) => void
): Promise<ChatResponse> {
  console.log("🚀 [OMNIA] Message reçu:", userMessage);

  const msg = userMessage.toLowerCase().trim();

  try {
    // 🔥 DÉTECTION INTENTION
    const intent = await detectIntent(userMessage);
    console.log("🎯 Intention finale:", intent);

    // Détection secteur
    let sector = "meubles";
    if (["montre", "bracelet", "bijou"].some(x => msg.includes(x))) {
      sector = "montres";
    } else if (["robe", "chemise", "vêtement"].some(x => msg.includes(x))) {
      sector = "pret_a_porter";
    }

    // 🔥 ROUTAGE PAR TYPE D'INTENTION
    switch (intent) {
      case "simple_chat":
        return await handleSimpleChat(userMessage);

      case "product_chat":
        return await handleProductChat(userMessage, sector);

      case "product_show":
        // Utiliser la nouvelle lib de recherche
        const searchFilters = extractFiltersFromQuery(userMessage);
        searchFilters.query = userMessage; // Garder la requête originale
        searchFilters.limit = 9;
        searchFilters.sortBy = 'relevance';
        
        return await handleProductShow(userMessage, searchFilters, storeId);

      default:
        return await handleSimpleChat(userMessage);
    }

  } catch (error) {
    console.error("❌ [OMNIA] Erreur globale:", error);
    
    return {
      role: "assistant",
      content: "Bonjour ! Je suis OmnIA. Comment puis-je vous aider aujourd'hui ?",
      intent: "simple_chat",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }
}

// 🆕 Fonctions utilitaires
export async function getProductImages(productExternalId: string): Promise<any[]> {
  try {
    const { data } = await supabase
      .from("shopify_products")
      .select("url, alt_text, position")
      .eq("item_type", "image")
      .eq("parent_external_id", productExternalId)
      .order("position", { ascending: true });

    return data || [];
  } catch (error) {
    return [];
  }
}