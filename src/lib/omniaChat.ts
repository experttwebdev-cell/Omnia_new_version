import { supabase, getEnvVar } from "./supabase";

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
}

//
// ⚙️ 1. STREAMING DIRECT VIA DEEPSEEK PROXY - AMÉLIORÉ
//
async function streamDeepSeek(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<void> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({
        messages,
        model: "deepseek-chat",
        temperature: 0.7,
        stream: true,
        max_tokens: 250
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body for stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Garder la dernière ligne incomplète dans le buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content;
            if (chunk) {
              onChunk(chunk);
            }
          } catch (e) {
            // Ignorer les lignes JSON invalides
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Stream error:", error);
    throw error;
  }
}

//
// ⚙️ 2. Fallback classique avec nouveau système (DeepSeek → GPT-3.5 → GPT-4o-mini)
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 150): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  const anonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");

  console.log("🔧 [callDeepSeek] Starting request to ai-chat edge function");
  console.log("🔧 [callDeepSeek] Supabase URL:", supabaseUrl);
  console.log("🔧 [callDeepSeek] Anon Key:", anonKey ? "✓ Present" : "✗ Missing");

  try {
    const lastUserMessage = messages.filter(m => m.role === "user").pop()?.content || "";
    console.log("📤 [callDeepSeek] Sending message:", lastUserMessage);

    const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
        "Content-Type": "application/json",
        "Cache-Control": "no-cache"
      },
      body: JSON.stringify({
        message: lastUserMessage,
        conversationId: null,
        storeId: null
      }),
    });

    console.log("📥 [callDeepSeek] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [callDeepSeek] HTTP error:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log("📦 [callDeepSeek] Response data:", data);

    const content = data?.reply || "Je n'ai pas pu générer de réponse pour le moment.";

    console.log(`✅ AI responded via ${data.provider} (${data.model}) in ${data.duration}`);

    return content.trim();
  } catch (err) {
    console.error("❌ [callDeepSeek] Full error:", err);
    console.error("❌ [callDeepSeek] Error message:", err instanceof Error ? err.message : String(err));
    console.error("❌ [callDeepSeek] Error stack:", err instanceof Error ? err.stack : "No stack trace");
    return "Je cherche encore la meilleure réponse pour vous…";
  }
}

//
// 🧠 3. Détection d'intention améliorée
//
async function detectIntent(userMessage: string): Promise<"chat" | "product_search"> {
  const msg = userMessage.toLowerCase().trim();
  
  // Mots-clés de recherche
  const searchKeywords = [
    "cherche", "trouve", "trouver", "acheter", "voir", "recherche", 
    "disponible", "propose", "conseille", "recommande", "suggère"
  ];
  
  // Mots-clés de produits (étendus)
  const productKeywords = [
    "table", "chaise", "canapé", "canape", "montre", "robe", "bureau",
    "armoire", "lit", "fauteuil", "meuble", "décor", "décoration",
    "accessoire", "bijou", "vêtement", "vetement", "mobilier"
  ];

  const hasSearchIntent = searchKeywords.some(word => msg.includes(word));
  const hasProductKeyword = productKeywords.some(word => msg.includes(word));
  const hasQuestionMark = msg.includes('?');
  
  // Logique améliorée de détection
  if ((hasSearchIntent && hasProductKeyword) || 
      (hasProductKeyword && !hasQuestionMark) ||
      (hasSearchIntent && !hasQuestionMark)) {
    return "product_search";
  }
  
  return "chat";
}

//
// 🔍 4. Recherche produit Supabase OPTIMISÉE
//
async function searchProducts(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  console.log("🔍 [OMNIA SEARCH] Filters:", filters);

  let query = supabase
    .from("shopify_products")
    .select(`
      id, title, price, compare_at_price, ai_color, ai_material, 
      ai_shape, image_url, handle, category, sub_category, tags, 
      vendor, currency, product_url, item_type, external_id
    `)
    .eq("status", "active")
    .eq("item_type", "product") // 🔥 FILTRE IMPORTANT : seulement les produits
    .limit(25);

  // Filtres de base
  if (storeId) query = query.eq("store_id", storeId);
  if (filters.type) {
    query = query.or(`title.ilike.%${filters.type}%,category.ilike.%${filters.type}%,tags.ilike.%${filters.type}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("❌ Supabase search error:", error);
    return [];
  }

  let results = data || [];
  
  // Fonction de matching améliorée
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

  // Tri par pertinence (promo d'abord, puis prix croissant)
  results.sort((a, b) => {
    const aHasPromo = a.compare_at_price && Number(a.compare_at_price) > Number(a.price);
    const bHasPromo = b.compare_at_price && Number(b.compare_at_price) > Number(b.price);
    
    if (aHasPromo && !bHasPromo) return -1;
    if (!aHasPromo && bHasPromo) return 1;
    
    return (Number(a.price) || 0) - (Number(b.price) || 0);
  });

  console.log(`✅ [OMNIA SEARCH] ${results.length} produits trouvés`);
  return results.slice(0, 12); // Augmenté à 12 résultats max
}

//
// ✨ 5. Génération de réponse IA améliorée
//
async function generateProductPresentation(
  products: Product[],
  userMessage: string,
  sector: string,
  onChunk?: (text: string) => void
): Promise<string> {
  if (!products.length) {
    const noProductMessage = `Je n'ai trouvé aucun produit correspondant à "${userMessage}". 🛋️  

Souhaitez-vous préciser :
• La couleur souhaitée ?
• Le style (moderne, classique, industriel) ?
• Votre budget maximum ?
• Des matériaux particuliers ?

Je peux vous aider à affiner votre recherche !`;

    if (onChunk) {
      // Stream le message d'erreur aussi
      const chunks = noProductMessage.split(' ');
      for (const chunk of chunks) {
        onChunk(chunk + ' ');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return "";
    }
    return noProductMessage;
  }

  const systemPrompt = `Tu es OmnIA, expert e-commerce spécialisé dans le secteur "${sector}".
Tu présentes des produits de manière engageante, naturelle et professionnelle.

RÈGLES IMPORTANTES :
• Réponse en français naturel (120-150 mots maximum)
• Mentionne les promotions quand elles existent
• Sois enthousiaste mais authentique
• Termine par une question ouverte pour engager la conversation
• Ne liste pas les produits comme une énumération
• Crée un flux conversationnel naturel`;

  const productData = products.map((p, index) => ({
    nom: p.title,
    prix: `${p.price}${p.currency || "€"}`,
    promotion: p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
      ? `(Promo : ${Math.round(100 - (Number(p.price) / Number(p.compare_at_price)) * 100)}% de réduction)`
      : null,
    couleur: p.ai_color,
    matériau: p.ai_material,
    catégorie: p.category,
    url: p.product_url
  }));

  const userPrompt = `Demande du client : "${userMessage}"

PRODUITS À PRÉSENTER :
${JSON.stringify(productData, null, 2)}

Génère une réponse engageante qui présente ces produits naturellement.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // 🌊 Streaming si disponible
  if (onChunk) {
    try {
      await streamDeepSeek(messages, onChunk);
      return "";
    } catch (err) {
      console.error("Stream error, falling back...:", err);
      // Fallback automatique
    }
  }

  // Fallback normal
  return await callDeepSeek(messages, 200);
}

//
// 🧩 6. FONCTION PRINCIPALE AMÉLIORÉE
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string,
  onChunk?: (text: string) => void
): Promise<{
  role: "assistant";
  content: string;
  intent: "conversation" | "product_show";
  products: Product[];
  mode: "conversation" | "product_show";
  sector: string;
}> {
  console.log("🚀 [OMNIA] Message reçu:", userMessage);

  const intent = await detectIntent(userMessage);
  console.log("🎯 [OMNIA] Intent détecté:", intent);
  const msg = userMessage.toLowerCase().trim();

  // Configuration des filtres améliorée
  const filters: ProductAttributes = { 
    intent: "product_search", 
    sector: "meubles" 
  };

  // Détection du secteur
  if (["montre", "bracelet", "bijou", "horlogerie"].some(x => msg.includes(x))) {
    filters.sector = "montres";
  } else if (["robe", "chemise", "pantalon", "vêtement", "vetement", "mode"].some(x => msg.includes(x))) {
    filters.sector = "pret_a_porter";
  }

  // Types de produits (étendus)
  const productTypes = [
    "table", "chaise", "canapé", "canape", "lit", "armoire", "bureau",
    "fauteuil", "commode", "étagère", "etagere", "buffet", "console"
  ];
  filters.type = productTypes.find(t => msg.includes(t)) || undefined;

  // Couleurs (étendues)
  const colors = [
    "blanc", "noir", "gris", "beige", "bois", "doré", "doré", "marron",
    "bleu", "vert", "rouge", "jaune", "argent", "cuivre", "naturel"
  ];
  filters.color = colors.find(c => msg.includes(c)) || undefined;

  // Matériaux (étendus)
  const materials = [
    "bois", "metal", "métal", "verre", "marbre", "travertin", "cuir",
    "tissu", "velours", "chenille", "acier", "fer", "rotin"
  ];
  filters.material = materials.find(m => msg.includes(m)) || undefined;

  // Détection promotions
  const promoKeywords = ["promo", "réduction", "solde", "offre", "soldé", "solder"];
  if (promoKeywords.some(p => msg.includes(p))) {
    filters.searchPromo = true;
  }

  // Détection prix maximum
  const priceMatch = msg.match(/(moins de|max|sous|budget|jusqu'à|jusqua)\s*(\d+)/);
  if (priceMatch) {
    filters.maxPrice = Number(priceMatch[2]);
  }

  // Mode conversation simple
  if (intent === "chat") {
    console.log("💬 [OMNIA] Mode conversation activé");
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `Tu es OmnIA, assistant e-commerce amical et professionnel.
Réponds de manière concise, naturelle et utile (80-120 mots maximum).`
      },
      { role: "user", content: userMessage },
    ];

    const chatResponse = await callDeepSeek(messages, 120);
    console.log("✅ [OMNIA] Réponse conversation générée:", chatResponse.substring(0, 50) + "...");

    return {
      role: "assistant",
      content: chatResponse,
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: filters.sector || "meubles",
    };
  }

  // 🔍 RECHERCHE PRODUIT
  console.log("🔍 [OMNIA] Mode recherche produit activé, filters:", filters);
  const products = await searchProducts(filters, storeId);
  console.log(`📦 [OMNIA] ${products.length} produits trouvés`);

  const aiResponse = await generateProductPresentation(
    products,
    userMessage,
    filters.sector || "meubles",
    onChunk
  );
  console.log("✅ [OMNIA] Présentation produits générée:", aiResponse.substring(0, 50) + "...");

  return {
    role: "assistant",
    content: aiResponse,
    intent: "product_show",
    products,
    mode: "product_show",
    sector: filters.sector || "meubles",
  };
}

// 🆕 Fonction utilitaire pour récupérer les images d'un produit
export async function getProductImages(productExternalId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("shopify_products")
    .select("url, alt_text, position")
    .eq("item_type", "image")
    .eq("parent_external_id", productExternalId)
    .order("position", { ascending: true });

  if (error) {
    console.error("❌ Error fetching product images:", error);
    return [];
  }

  return data || [];
}