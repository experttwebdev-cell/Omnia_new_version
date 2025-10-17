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
  room?: string;
  shape?: string;
  dimensions?: string;
  maxPrice?: number;
  minPrice?: number;
  vendor?: string;
  searchPromo?: boolean;
}

interface ChatSettings {
  chat_tone?: string;
  chat_response_length?: string;
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
  description?: string;
  handle?: string;
  vendor?: string;
  currency?: string;
  status?: string;
}

//
// 🔹 Fonction principale : appelle le proxy DeepSeek via Supabase
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 120): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");

  const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: "deepseek-chat",
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ DeepSeek proxy error:", text);
    throw new Error(`Proxy error: ${text}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

//
// 🔹 Détection rapide d’intention
//
async function detectIntent(userMessage: string): Promise<"chat" | "product_search"> {
  const msg = userMessage.toLowerCase();
  const searchWords = ["cherche", "recherche", "veux", "voir", "trouver", "acheter"];
  const productWords = [
    "table",
    "chaise",
    "canapé",
    "fauteuil",
    "lit",
    "armoire",
    "commode",
    "meuble",
    "étagère",
    "bureau",
  ];

  const hasSearchIntent = searchWords.some((w) => msg.includes(w));
  const hasProduct = productWords.some((p) => msg.includes(p));

  return hasSearchIntent || hasProduct ? "product_search" : "chat";
}

//
// 🔹 Recherche produits depuis Supabase (corrigée et rapide)
//
async function searchProducts(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  console.log("🔍 [SEARCH] Filters:", filters);

  let query = supabase
    .from("shopify_products")
    .select(
      "id, title, price, compare_at_price, ai_color, ai_material, ai_shape, description, image_url, handle, category, sub_category, tags, vendor, currency"
    )
    .eq("status", "active")
    .limit(12);

  if (storeId) query = query.eq("store_id", storeId);

  // Recherche principale sur type
  if (filters.type) query = query.ilike("title", `%${filters.type}%`);

  const { data, error } = await query;

  if (error) {
    console.error("❌ Supabase query error:", error);
    return [];
  }

  let results = data || [];

  // Filtres secondaires (simplifiés mais efficaces)
  if (filters.color)
    results = results.filter((p) =>
      (p.ai_color || p.title || "").toLowerCase().includes(filters.color!.toLowerCase())
    );

  if (filters.material)
    results = results.filter((p) =>
      (p.ai_material || p.title || "").toLowerCase().includes(filters.material!.toLowerCase())
    );

  if (filters.maxPrice)
    results = results.filter((p) => Number(p.price) <= (filters.maxPrice || Infinity));

  if (filters.searchPromo)
    results = results.filter(
      (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
    );

  console.log("✅ [SEARCH] Found", results.length, "products");
  return results.slice(0, 8);
}

//
// 🔹 Présentation intelligente avec DeepSeek
//
async function generateProductPresentation(
  products: Product[],
  userMessage: string
): Promise<string> {
  if (!products.length) {
    return `Je n'ai trouvé aucun produit correspondant à votre recherche "${userMessage}". 😊\nSouhaitez-vous préciser le style, la couleur ou le budget ?`;
  }

  const systemPrompt = `Tu es OmnIA, un conseiller e-commerce expert en mobilier.
Présente les produits trouvés de manière engageante et concise.
- Réponds en français naturel
- Maximum 120 mots
- Mentionne les promos s'il y en a
- Termine par une question ouverte.`;

  const productData = products.map((p) => ({
    titre: p.title,
    prix: `${p.price} ${p.currency || "€"}`,
    promo:
      p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
        ? `Ancien prix ${p.compare_at_price}€`
        : null,
    couleur: p.ai_color,
    materiau: p.ai_material,
    categorie: p.category,
  }));

  const userPrompt = `Demande client : "${userMessage}"
Produits trouvés :
${JSON.stringify(productData, null, 2)}

Présente ces produits au client de manière naturelle.`;

  const response = await callDeepSeek(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    250
  );

  return response;
}

//
// 🔹 Fonction principale appelée par ton composant React
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string
) {
  console.log("🚀 [OMNIA] Message:", userMessage);

  const intent = await detectIntent(userMessage);

  if (intent === "chat") {
    const response = await callDeepSeek(
      [
        {
          role: "system",
          content:
            "Tu es OmnIA, un assistant amical et utile pour un site e-commerce de meubles. Réponds en 1 à 2 phrases maximum.",
        },
        { role: "user", content: userMessage },
      ],
      100
    );

    return {
      role: "assistant" as const,
      response,
      intent: "conversation",
      products: [],
      mode: "conversation",
    };
  }

  // Sinon recherche produit
  const filters: ProductAttributes = { intent: "product_search" };

  // Extraction rapide (type/couleur/matériau)
  const msg = userMessage.toLowerCase();
  const types = ["table", "chaise", "canapé", "lit", "armoire", "bureau"];
  filters.type = types.find((t) => msg.includes(t)) || undefined;
  const colors = ["blanc", "noir", "gris", "beige", "bois", "marron"];
  filters.color = colors.find((c) => msg.includes(c)) || undefined;
  const materials = ["bois", "métal", "verre", "marbre"];
  filters.material = materials.find((m) => msg.includes(m)) || undefined;

  const products = await searchProducts(filters, storeId);
  const aiResponse = await generateProductPresentation(products, userMessage);

  return {
    role: "assistant" as const,
    response: aiResponse,
    intent: "product_show",
    products,
    mode: "product_show",
  };
}
