import { supabase, getEnvVar } from "./supabase";

// ✅ Interfaces
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ProductAttributes {
  intent: string;
  type?: string;
  style?: string;
  color?: string;
  material?: string;
  maxPrice?: number;
  searchPromo?: boolean;
  sector?: "meubles" | "montres" | "pret_a_porter";
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
  item_type?: string;
  external_id?: string;
}

interface ChatResponse {
  role: "assistant";
  content: string;
  intent: "conversation" | "product_show";
  products: Product[];
  mode: "conversation" | "product_show";
  sector: string;
}

//
// ⚙️ 1. APPEL DEEPSEEK SIMPLE (SANS STREAMING)
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 300): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  
  if (!supabaseUrl) {
    console.error("❌ VITE_SUPABASE_URL manquante");
    return "Bonjour ! Je suis OmnIA, votre assistant shopping. Comment puis-je vous aider ?";
  }

  try {
    console.log("📤 Appel DeepSeek avec", messages.length, "messages");
    
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
        stream: false // ⚠️ IMPORTANT: mode JSON normal
      }),
    });

    console.log("📥 Status réponse:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erreur HTTP:", response.status, errorText);
      throw new Error(`Erreur ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Réponse DeepSeek reçue");

    // 🔥 Extraction du contenu de la réponse
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    }

    // Fallback si structure différente
    return "Je suis OmnIA. Comment puis-je vous aider dans vos recherches shopping ?";

  } catch (err) {
    console.error("❌ Erreur callDeepSeek:", err);
    
    // ✅ Réponses de fallback intelligentes
    const lastUserMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
    
    if (lastUserMessage.includes("bonjour") || lastUserMessage.includes("salut") || lastUserMessage.includes("hello")) {
      return "Bonjour ! 👋 Je suis OmnIA, votre assistant shopping. Je peux vous aider à trouver des meubles, montres ou vêtements. Que recherchez-vous aujourd'hui ?";
    }
    
    if (lastUserMessage.includes("merci")) {
      return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. Bonne journée !";
    }
    
    return "Je suis OmnIA, votre assistant shopping. Décrivez-moi ce que vous cherchez et je vous trouverai les meilleurs produits !";
  }
}

//
// 🧠 2. DÉTECTION D'INTENTION SIMPLIFIÉE
//
async function detectIntent(userMessage: string): Promise<"chat" | "product_search"> {
  const msg = userMessage.toLowerCase().trim();
  
  // Mots-clés de recherche produit
  const searchKeywords = [
    "cherche", "trouve", "trouver", "acheter", "voir", "recherche", 
    "disponible", "propose", "conseille", "recommande", "suggère",
    "montre", "présente", "affiche", "donne", "veux", "voudrais"
  ];
  
  // Mots-clés de produits
  const productKeywords = [
    "table", "chaise", "canapé", "canape", "montre", "robe", "bureau",
    "armoire", "lit", "fauteuil", "meuble", "décor", "décoration",
    "accessoire", "bijou", "vêtement", "vetement", "mobilier", "chemise",
    "pantalon", "jupe", "sac", "bijoux", "horloge", "lampe", "coussin"
  ];

  const hasSearchIntent = searchKeywords.some(word => msg.includes(word));
  const hasProductKeyword = productKeywords.some(word => msg.includes(word));
  
  // Logique simple : si produit + recherche → recherche produit
  if (hasSearchIntent && hasProductKeyword) {
    return "product_search";
  }
  
  // Si mention produit sans question → recherche
  if (hasProductKeyword && !msg.includes('?')) {
    return "product_search";
  }
  
  return "chat";
}

//
// 🔍 3. RECHERCHE PRODUIT OPTIMISÉE
//
async function searchProducts(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  console.log("🔍 Recherche produits avec filtres:", filters);

  try {
    let query = supabase
      .from("shopify_products")
      .select(`
        id, title, price, compare_at_price, ai_color, ai_material, 
        ai_shape, image_url, handle, category, sub_category, tags, 
        vendor, currency, product_url, item_type, external_id
      `)
      .eq("status", "active")
      .eq("item_type", "product")
      .limit(20);

    // Filtres de base
    if (storeId) query = query.eq("store_id", storeId);
    
    // Filtre par type/catégorie
    if (filters.type) {
      query = query.or(`title.ilike.%${filters.type}%,category.ilike.%${filters.type}%,tags.ilike.%${filters.type}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Erreur Supabase:", error);
      return [];
    }

    let results = data || [];
    console.log(`📦 ${results.length} produits trouvés avant filtrage`);

    // Fonction de matching
    const match = (fieldValue?: string, searchValue?: string) => 
      fieldValue?.toLowerCase().includes(searchValue?.toLowerCase() || "");

    // Filtrage avancé
    if (filters.color) {
      results = results.filter(p => 
        match(p.ai_color, filters.color) || 
        match(p.title, filters.color) ||
        match(p.tags, filters.color)
      );
    }
    
    if (filters.material) {
      results = results.filter(p => 
        match(p.ai_material, filters.material) || 
        match(p.title, filters.material) ||
        match(p.tags, filters.material)
      );
    }
    
    if (filters.maxPrice) {
      results = results.filter(p => {
        const price = Number(p.price) || 0;
        return price > 0 && price <= filters.maxPrice!;
      });
    }
    
    if (filters.searchPromo) {
      results = results.filter(p => 
        p.compare_at_price && 
        Number(p.compare_at_price) > Number(p.price)
      );
    }

    // Tri par pertinence (promo d'abord, puis prix)
    results.sort((a, b) => {
      const aHasPromo = a.compare_at_price && Number(a.compare_at_price) > Number(a.price);
      const bHasPromo = b.compare_at_price && Number(b.compare_at_price) > Number(b.price);
      
      if (aHasPromo && !bHasPromo) return -1;
      if (!aHasPromo && bHasPromo) return 1;
      
      return (Number(a.price) || 0) - (Number(b.price) || 0);
    });

    console.log(`✅ ${results.length} produits après filtrage`);
    return results.slice(0, 9); // Limiter à 9 produits

  } catch (error) {
    console.error("❌ Erreur recherche produits:", error);
    return [];
  }
}

//
// ✨ 4. GÉNÉRATION RÉPONSE IA POUR PRODUITS
//
async function generateProductPresentation(
  products: Product[],
  userMessage: string,
  sector: string
): Promise<string> {
  if (!products.length) {
    return `Je n'ai pas trouvé de produits correspondant à "${userMessage}". 

Pour affiner la recherche, vous pouvez préciser :
• Une couleur spécifique
• Un style (moderne, classique, industriel)
• Votre budget maximum
• Des matériaux particuliers

Je suis là pour vous aider !`;
  }

  // ✅ Réponse simple et efficace sans appel IA
  const productCount = products.length;
  const promoCount = products.filter(p => 
    p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
  ).length;

  if (productCount <= 3) {
    const productNames = products.map(p => p.title).join(", ");
    return `J'ai trouvé ${productCount} produit(s) correspondant à votre recherche : ${productNames}. ${
      promoCount > 0 ? `📢 ${promoCount} en promotion ! ` : ''
    }Que pensez-vous de ces options ?`;
  } else {
    return `J'ai trouvé ${productCount} produits correspondant à "${userMessage}". ${
      promoCount > 0 ? `📢 ${promoCount} sont en promotion ! ` : ''
    }Je vous présente les meilleures options. Souhaitez-vous filtrer par couleur, prix ou style ?`;
  }
}

//
// 🧩 5. FONCTION PRINCIPALE OMNIA - VERSION STABLE
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string,
  onChunk?: (text: string) => void
): Promise<ChatResponse> {
  console.log("🚀 [OMNIA] Message reçu:", userMessage);

  const msg = userMessage.toLowerCase().trim();

  // ✅ RÉPONSES IMMÉDIATES pour salutations
  if (["bonjour", "salut", "hello", "coucou", "hey", "hi", "bonsoir"].some(greet => msg.includes(greet))) {
    return {
      role: "assistant",
      content: "Bonjour ! 👋 Je suis OmnIA, votre assistant shopping. Je peux vous aider à trouver des meubles, montres ou vêtements. Que recherchez-vous aujourd'hui ?",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }

  // ✅ RÉPONSES IMMÉDIATES pour remerciements
  if (["merci", "thanks", "thank you"].some(thank => msg.includes(thank))) {
    return {
      role: "assistant",
      content: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions. Bonne journée !",
      intent: "conversation",
      products: [],
      mode: "conversation", 
      sector: "meubles"
    };
  }

  try {
    // Détection d'intention
    const intent = await detectIntent(userMessage);
    console.log("🎯 Intention détectée:", intent);

    // Configuration des filtres
    const filters: ProductAttributes = { 
      intent: "product_search", 
      sector: "meubles" 
    };

    // Détection du secteur
    if (["montre", "bracelet", "bijou", "horlogerie", "chrono", "boitier"].some(x => msg.includes(x))) {
      filters.sector = "montres";
    } else if (["robe", "chemise", "pantalon", "vêtement", "vetement", "mode", "sac", "chaussure", "pull", "t-shirt"].some(x => msg.includes(x))) {
      filters.sector = "pret_a_porter";
    }

    // Types de produits
    const productTypes = [
      "table", "chaise", "canapé", "canape", "lit", "armoire", "bureau",
      "fauteuil", "commode", "étagère", "etagere", "buffet", "console",
      "lampe", "coussin", "tapisserie", "miroir", "tabouret"
    ];
    filters.type = productTypes.find(t => msg.includes(t)) || undefined;

    // Couleurs
    const colors = [
      "blanc", "noir", "gris", "beige", "bois", "doré", "doré", "marron",
      "bleu", "vert", "rouge", "jaune", "argent", "cuivre", "naturel",
      "rose", "violet", "orange", "turquoise", "bordeaux"
    ];
    filters.color = colors.find(c => msg.includes(c)) || undefined;

    // Matériaux
    const materials = [
      "bois", "metal", "métal", "verre", "marbre", "travertin", "cuir",
      "tissu", "velours", "chenille", "acier", "fer", "rotin", "plastique",
      "céramique", "pierre", "coton", "lin", "soie"
    ];
    filters.material = materials.find(m => msg.includes(m)) || undefined;

    // Promotions
    const promoKeywords = ["promo", "réduction", "solde", "offre", "soldé", "solder", "discount"];
    if (promoKeywords.some(p => msg.includes(p))) {
      filters.searchPromo = true;
    }

    // Prix maximum
    const priceMatch = msg.match(/(moins de|max|sous|budget|jusqu'à|jusqua|maximum)\s*(\d+)/);
    if (priceMatch) {
      filters.maxPrice = Number(priceMatch[2]);
    }

    // 🔥 MODE CONVERSATION SIMPLE
    if (intent === "chat") {
      console.log("💬 Mode conversation activé");
      
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Tu es OmnIA, assistant e-commerce friendly et professionnel. 
Réponds en français de manière concise et utile (60-100 mots max).
Sois chaleureux et engageant.`
        },
        { role: "user", content: userMessage },
      ];

      const chatResponse = await callDeepSeek(messages, 150);
      
      return {
        role: "assistant",
        content: chatResponse,
        intent: "conversation",
        products: [],
        mode: "conversation",
        sector: filters.sector || "meubles",
      };
    }

    // 🔥 MODE RECHERCHE PRODUIT
    console.log("🛍️ Mode recherche produit activé");
    const products = await searchProducts(filters, storeId);
    const aiResponse = await generateProductPresentation(products, userMessage, filters.sector || "meubles");

    return {
      role: "assistant",
      content: aiResponse,
      intent: "product_show", 
      products,
      mode: "product_show",
      sector: filters.sector || "meubles",
    };

  } catch (error) {
    console.error("❌ [OMNIA] Erreur globale:", error);
    
    // ✅ FALLBACK GARANTI - Jamais d'erreur utilisateur
    return {
      role: "assistant", 
      content: "Bonjour ! Je suis OmnIA. Décrivez-moi ce que vous cherchez (meuble, montre, vêtement) et je vous aiderai à trouver le produit parfait !",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }
}

// 🆕 Fonction utilitaire pour les images produit
export async function getProductImages(productExternalId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("shopify_products")
      .select("url, alt_text, position")
      .eq("item_type", "image")
      .eq("parent_external_id", productExternalId)
      .order("position", { ascending: true });

    if (error) {
      console.error("❌ Erreur récupération images:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Erreur getProductImages:", error);
    return [];
  }
}

// 🆕 Fonction pour produits similaires
export async function getSimilarProducts(productId: string, sector: string, limit = 4): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("shopify_products")
      .select("*")
      .eq("status", "active")
      .eq("item_type", "product")
      .neq("id", productId)
      .limit(limit);

    if (error) {
      console.error("❌ Erreur produits similaires:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("❌ Erreur getSimilarProducts:", error);
    return [];
  }
}