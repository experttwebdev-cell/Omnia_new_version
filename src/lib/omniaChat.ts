import { supabase, getEnvVar } from "./supabase";
import { searchProducts, extractFiltersFromQuery, type ProductSearchFilters } from "./productSearch";
import type { Database } from "./database.types";

type Product = Database['public']['Tables']['shopify_products']['Row'];

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

interface ChatResponse {
  role: "assistant";
  content: string;
  intent: "conversation" | "product_show";
  products: Product[];
  mode: "conversation" | "product_show";
  sector: string;
}

//
// ⚙️ 1. APPEL DEEPSEEK SIMPLE
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 300): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  
  if (!supabaseUrl) {
    return "Bonjour ! Je suis OmnIA, votre assistant shopping. Comment puis-je vous aider ?";
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
    console.error("Erreur callDeepSeek:", err);
    
    const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || "";
    
    if (lastMessage.includes("bonjour")) {
      return "Bonjour ! 👋 Je suis OmnIA, votre assistant shopping. Que recherchez-vous aujourd'hui ?";
    }
    
    return "Je suis OmnIA, votre assistant shopping. Décrivez-moi ce que vous cherchez !";
  }
}

//
// 🧠 2. DÉTECTION D'INTENTION
//
async function detectIntent(userMessage: string): Promise<"chat" | "product_search"> {
  const msg = userMessage.toLowerCase().trim();
  
  const searchKeywords = [
    "cherche", "trouve", "trouver", "acheter", "voir", "recherche", 
    "disponible", "propose", "conseille", "recommande", "suggère",
    "montre", "présente", "affiche", "donne", "veux", "voudrais"
  ];
  
  const productKeywords = [
    "table", "chaise", "canapé", "canape", "montre", "robe", "bureau",
    "armoire", "lit", "fauteuil", "meuble", "décor", "décoration",
    "accessoire", "bijou", "vêtement", "vetement", "mobilier", "chemise",
    "pantalon", "jupe", "sac", "bijoux", "horloge", "lampe", "coussin"
  ];

  const hasSearchIntent = searchKeywords.some(word => msg.includes(word));
  const hasProductKeyword = productKeywords.some(word => msg.includes(word));
  
  if (hasSearchIntent && hasProductKeyword) {
    return "product_search";
  }
  
  if (hasProductKeyword && !msg.includes('?')) {
    return "product_search";
  }
  
  return "chat";
}

async function searchProductsForChat(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  console.log("🔍 Recherche produits avec:", filters);

  try {
    const searchFilters: ProductSearchFilters = {
      status: 'active',
      limit: 12,
      sortBy: 'relevance'
    };

    if (filters.type) {
      searchFilters.query = filters.type;
    }

    if (filters.color) {
      searchFilters.color = filters.color;
    }

    if (filters.material) {
      searchFilters.material = filters.material;
    }

    if (filters.maxPrice) {
      searchFilters.maxPrice = filters.maxPrice;
    }

    if (filters.searchPromo) {
      searchFilters.hasPromo = true;
    }

    const result = await searchProducts(searchFilters, storeId);

    console.log(`📦 ${result.products.length} produits trouvés`);
    return result.products;

  } catch (error) {
    console.error("❌ Erreur searchProducts:", error);
    return [];
  }
}

//
// ✨ 4. GÉNÉRATION RÉPONSE POUR PRODUITS
//
async function generateProductPresentation(
  products: Product[],
  userMessage: string,
  sector: string
): Promise<string> {
  if (!products.length) {
    return `Je n'ai pas trouvé de produits correspondant à "${userMessage}". 

Pour affiner la recherche :
• Précisez la couleur, le style ou le matériau
• Indiquez votre budget maximum
• Décrivez le type de produit recherché

Je suis là pour vous aider !`;
  }

  // Réponse simple avec les produits trouvés
  const productCount = products.length;
  const promoCount = products.filter(p => 
    p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
  ).length;

  if (productCount === 1) {
    return `J'ai trouvé 1 produit correspondant à votre recherche : "${products[0].title}". ${
      promoCount > 0 ? '📢 Il est en promotion ! ' : ''
    }Souhaitez-vous en savoir plus ?`;
  } else {
    return `J'ai trouvé ${productCount} produits correspondant à "${userMessage}". ${
      promoCount > 0 ? `📢 ${promoCount} sont en promotion ! ` : ''
    }Je vous présente les meilleures options ci-dessous.`;
  }
}

//
// 🧩 5. FONCTION PRINCIPALE OMNIA - VERSION COMPLÈTE
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string,
  onChunk?: (text: string) => void
): Promise<ChatResponse> {
  console.log("🚀 [OMNIA] Message reçu:", userMessage);

  const msg = userMessage.toLowerCase().trim();

  // ✅ RÉPONSES IMMÉDIATES
  if (["bonjour", "salut", "hello", "coucou", "hey"].some(greet => msg.includes(greet))) {
    return {
      role: "assistant",
      content: "Bonjour ! 👋 Je suis OmnIA, votre assistant shopping. Je peux vous aider à trouver des meubles, montres ou vêtements. Que recherchez-vous aujourd'hui ?",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }

  if (["merci", "thanks"].some(thank => msg.includes(thank))) {
    return {
      role: "assistant",
      content: "Avec plaisir ! 😊 N'hésitez pas si vous avez d'autres questions.",
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: "meubles"
    };
  }

  try {
    const intent = await detectIntent(userMessage);
    console.log("🎯 Intention:", intent);

    // Configuration des filtres
    const filters: ProductAttributes = { 
      intent: "product_search", 
      sector: "meubles" 
    };

    // 🔥 DÉTECTION DU TYPE DE PRODUIT
    const productTypes = [
      "table", "chaise", "canapé", "canape", "lit", "armoire", "bureau",
      "fauteuil", "commode", "étagère", "etagere", "buffet", "console",
      "lampe", "coussin", "miroir", "tabouret", "meuble"
    ];
    
    // Trouver le type de produit dans le message
    const foundType = productTypes.find(t => msg.includes(t));
    if (foundType) {
      filters.type = foundType;
      console.log("🎯 Type détecté:", foundType);
    }

    // Détection secteur
    if (["montre", "bracelet", "bijou", "horlogerie"].some(x => msg.includes(x))) {
      filters.sector = "montres";
    } else if (["robe", "chemise", "pantalon", "vêtement", "vetement", "mode"].some(x => msg.includes(x))) {
      filters.sector = "pret_a_porter";
    }

    // Détection couleurs
    const colors = ["blanc", "noir", "gris", "beige", "bois", "marron", "bleu", "vert", "rouge"];
    const foundColor = colors.find(c => msg.includes(c));
    if (foundColor) filters.color = foundColor;

    // Détection matériaux
    const materials = ["bois", "metal", "métal", "verre", "marbre", "cuir", "tissu"];
    const foundMaterial = materials.find(m => msg.includes(m));
    if (foundMaterial) filters.material = foundMaterial;

    // Promotions
    if (["promo", "réduction", "solde", "soldé"].some(p => msg.includes(p))) {
      filters.searchPromo = true;
    }

    // Prix
    const priceMatch = msg.match(/(\d+)\s*(€|euros|euro)/);
    if (priceMatch) {
      filters.maxPrice = Number(priceMatch[1]);
    }

    // 🔥 MODE CONVERSATION
    if (intent === "chat") {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: `Tu es OmnIA, assistant e-commerce. Réponds brièvement en français.`
        },
        { role: "user", content: userMessage },
      ];

      const chatResponse = await callDeepSeek(messages, 100);
      
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
    console.log("🔍 Lancement recherche avec filtres:", filters);
    const products = await searchProductsForChat(filters, storeId);
    console.log(`📦 ${products.length} produits trouvés`);

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
    console.error("❌ [OMNIA] Erreur:", error);
    
    return {
      role: "assistant",
      content: "Je suis OmnIA, votre assistant shopping. Décrivez-moi ce que vous cherchez (ex: table en bois, montre élégante, robe d'été) et je vous aiderai !",
      intent: "conversation",
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