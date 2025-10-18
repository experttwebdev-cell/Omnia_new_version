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

  // 1. PRODUCT_SHOW - Montrer des produits (mots forts)
  const strongShowKeywords = [
    "montre", "affiche", "voir les", "liste", "catalogue",
    "collection", "gamme", "modèles", "articles", "produits",
    "choix", "options", "sélection"
  ];

  // 2. PRODUCT_CHAT - Discussion sur produits (questions, conseils)
  const productChatKeywords = [
    "avez-vous", "est-ce que vous avez", "proposez-vous", "vendez-vous",
    "disponible", "disponibilité", "en stock", "livraison", "délai",
    "caractéristique", "spécification", "description", "matériau", "couleur",
    "dimension", "taille", "poids", "qualité", "avantage", "inconvénient",
    "durable", "résistant", "entretien", "garantie", "fonctionnement",
    "comment est", "est-ce que", "quelle est", "quelles sont", "c'est quoi",
    "fonctionne", "utilisation", "conseil", "avis", "recommandation",
    "différence entre", "comparer", "meilleur", "top", "quelle marque",
    "étanche", "résiste", "adapté pour", "convient pour", "conseillez-moi",
    "que pensez-vous", "pourriez-vous me dire"
  ];

  // 3. SIMPLE_CHAT - Salutations basiques
  const simpleChatKeywords = [
    "bonjour", "salut", "hello", "coucou", "hey", "hi", 
    "comment ça va", "ça va", "how are you", "bien et toi",
    "merci", "thanks", "thank you", "de rien", "au revoir", "bye",
    "ok", "d'accord", "parfait", "super", "génial", "parfait"
  ];

  // Mots-clés produits (multi-secteurs)
  const productKeywords = [
    // Meubles
    "table", "chaise", "canapé", "canape", "fauteuil", "meuble", "armoire", "lit", "bureau",
    "décor", "décoration", "mobilier", "lampe", "miroir", "coussin", "tapisserie", "tabouret",
    "buffet", "console", "étagère", "etagere", "commode", "coiffeuse", "paravent",
    // Mode
    "montre", "robe", "chemise", "pantalon", "jupe", "sac", "bijou", "bijoux", "vêtement", "vetement",
    "chaussure", "accessoire", "ceinture", "cravate", "lunettes", "sweat", "pull", "t-shirt",
    // Électronique
    "téléphone", "telephone", "smartphone", "ordinateur", "pc", "tablette", "casque", "écouteurs",
    "appareil photo", "camera", "tv", "télévision", "console", "jeu vidéo", "écran", "clavier",
    // Maison
    "électroménager", "electromenager", "cuisine", "salle de bain", "jardin", "bricolage",
    "machine à laver", "lave-vaisselle", "réfrigérateur", "four", "cuisinière"
  ];

  const hasProductKeyword = productKeywords.some(word => msg.includes(word));
  const hasStrongShowIntent = strongShowKeywords.some(word => msg.includes(word));
  const hasChatIntent = productChatKeywords.some(word => msg.includes(word));
  const isSimpleChat = simpleChatKeywords.some(word => msg.includes(word));

  console.log("🔍 Intent - Product:", hasProductKeyword, "Chat:", hasChatIntent, "Show:", hasStrongShowIntent, "Simple:", isSimpleChat);

  // 1. Product_show prioritaire (intention forte de montrer)
  if (hasProductKeyword && hasStrongShowIntent) {
    console.log("🎯 Décision: PRODUCT_SHOW (intention forte de montrer)");
    return "product_show";
  }

  // 2. Product_chat (discussion sur produits - questions, conseils)
  if (hasProductKeyword && hasChatIntent) {
    console.log("🎯 Décision: PRODUCT_CHAT (discussion produits)");
    return "product_chat";
  }

  // 3. Product_chat par défaut si produit mentionné
  if (hasProductKeyword) {
    console.log("🎯 Décision: PRODUCT_CHAT (produit détecté - fallback)");
    return "product_chat";
  }

  // 4. Simple_chat (salutations sans produit)
  if (isSimpleChat) {
    console.log("🎯 Décision: SIMPLE_CHAT (salutation)");
    return "simple_chat";
  }

  // 5. Fallback vers product_chat si ambigu
  console.log("🎯 Décision: PRODUCT_CHAT (fallback ambigu)");
  return "product_chat";
}

//
// ⚙️ APPEL DEEPSEEK
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 300): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  
  if (!supabaseUrl) {
    return "Bonjour ! Je suis votre assistant commercial. Comment puis-je vous aider ?";
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

    return "Je suis votre assistant commercial. Comment puis-je vous aider ?";

  } catch (err) {
    console.error("❌ Erreur callDeepSeek:", err);
    
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
    
    if (lastMessage.includes("bonjour")) {
      return "Bonjour ! 👋 Je suis votre assistant commercial. Que recherchez-vous aujourd'hui ?";
    }
    
    return "Je suis votre assistant commercial. Décrivez-moi ce que vous cherchez !";
  }
}

//
// 💬 GESTIONNAIRE SIMPLE_CHAT
//
async function handleSimpleChat(userMessage: string): Promise<ChatResponse> {
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

//
// 🛍️ GESTIONNAIRE PRODUCT_CHAT (discussion produits SANS affichage)
//
async function handleProductChat(userMessage: string): Promise<ChatResponse> {
  // 🔍 Recherche en arrière-plan pour avoir les infos réelles
  const searchFilters = extractFiltersFromQuery(userMessage);
  searchFilters.limit = 10;
  searchFilters.sortBy = 'relevance';
  
  const result = await searchProducts(searchFilters);
  const products = result.products;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `Tu es un vendeur expert et enthousiaste.

RÈGLES CRITIQUES :
🚫 NE montre PAS les produits (pas de liste, pas d'affichage)
🚫 NE dis PAS "voici nos produits" ou "je vous montre"
🚫 NE liste PAS les produits comme un catalogue
✅ Parle NATURELLEMENT des caractéristiques
✅ Donne des informations PRÉCISES basées sur les produits réels
✅ Sois CONVERSATIONNEL et ENGAGEANT
✅ Termine par une question pour continuer la discussion

Exemple de BON format :
"Oui, nous avons effectivement plusieurs modèles de tables en céramique. Certaines sont disponibles en finition mate avec piètement métallique, d'autres en version basse pour salon. Leur prix varie entre 200€ et 500€ selon les dimensions. Vous cherchez plutôt pour quel usage ?"

Exemple de MAUVAIS format :
"Voici nos produits : 
- Table A - 250€
- Table B - 300€
- Table C - 350€"

Toujours répondre de manière conversationnelle sans énumération.`
    },
    { 
      role: "user", 
      content: `INFORMATIONS PRODUITS RÉELS (à utiliser pour répondre mais NE PAS lister) :
${JSON.stringify(products.map(p => ({
  nom: p.title,
  prix: `${p.price}${p.currency || '€'}`,
  promotion: p.compare_at_price ? `Promo ${Math.round(100 - (Number(p.price) / Number(p.compare_at_price)) * 100)}%` : null,
  matériau: p.ai_material,
  couleur: p.ai_color,
  catégorie: p.category,
  caractéristiques: p.tags,
  disponibilité: "En stock"
})), null, 2)}

Question du client : "${userMessage}"

Réponds de manière NATURELLE sans montrer les produits. Utilise ces informations pour être précis mais ne les liste pas.`
    },
  ];

  const response = await callDeepSeek(messages, 200);

  return {
    role: "assistant",
    content: response,
    intent: "product_chat",
    products: [], // 🚫 IMPORTANT: tableau VIDE = pas d'affichage
    mode: "conversation",
    sector: "général"
  };
}

//
// 🎯 GESTIONNAIRE PRODUCT_SHOW (affichage produits)
//
async function handleProductShow(userMessage: string, storeId?: string): Promise<ChatResponse> {
  console.log("🛍️ Recherche produits pour affichage...");
  
  const searchFilters = extractFiltersFromQuery(userMessage);
  searchFilters.limit = 12;
  searchFilters.sortBy = 'relevance';

  const result = await searchProducts(searchFilters, storeId);
  const products = result.products;
  
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
    products: products, // ✅ IMPORTANT: produits à afficher
    mode: "product_show",
    sector: "général"
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

    // 🔥 ROUTAGE PAR TYPE D'INTENTION
    switch (intent) {
      case "simple_chat":
        return await handleSimpleChat(userMessage);

      case "product_chat":
        return await handleProductChat(userMessage);

      case "product_show":
        return await handleProductShow(userMessage, storeId);

      default:
        // Fallback vers product_chat
        return await handleProductChat(userMessage);
    }

  } catch (error) {
    console.error("❌ [OMNIA] Erreur globale:", error);
    
    return {
      role: "assistant",
      content: "Bonjour ! Je suis votre assistant commercial. Comment puis-je vous aider aujourd'hui ?",
      intent: "simple_chat",
      products: [],
      mode: "conversation",
      sector: "général"
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

export async function getSimilarProducts(productId: string, limit = 4): Promise<Product[]> {
  try {
    const { data } = await supabase
      .from("shopify_products")
      .select("*")
      .eq("status", "active")
      .eq("item_type", "product")
      .neq("id", productId)
      .limit(limit);

    return data || [];
  } catch (error) {
    return [];
  }
}