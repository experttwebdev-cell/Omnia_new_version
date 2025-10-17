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
}

//
// ⚙️ 1. STREAMING DIRECT VIA DEEPSEEK PROXY
//
async function streamDeepSeek(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<void> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      model: "deepseek-chat",
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!response.body) {
    throw new Error("No response body for stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value);
    onChunk(text); // ⚡ envoie le texte partiel au fur et à mesure
  }
}

//
// ⚙️ 2. Fallback classique (si le stream ne répond pas)
//
async function callDeepSeek(messages: ChatMessage[], maxTokens = 120): Promise<string> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        model: "deepseek-chat",
        temperature: 0.7,
        max_tokens: maxTokens,
      }),
    });

    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ||
      data?.response ||
      "Je n’ai pas pu générer de réponse pour le moment.";
    return content;
  } catch (err) {
    console.error("❌ DeepSeek fallback error:", err);
    return "Je cherche encore la meilleure réponse pour vous…";
  }
}

//
// 🧠 3. Détection d’intention
//
async function detectIntent(userMessage: string): Promise<"chat" | "product_search"> {
  const msg = userMessage.toLowerCase();
  const hasSearchIntent = ["cherche", "trouver", "acheter", "voir", "recherche"].some((w) =>
    msg.includes(w)
  );
  const hasProductKeyword = ["table", "chaise", "canapé", "montre", "robe", "bureau"].some((w) =>
    msg.includes(w)
  );
  return hasSearchIntent || hasProductKeyword ? "product_search" : "chat";
}

//
// 🔍 4. Recherche produit Supabase
//
async function searchProducts(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  console.log("🔍 [OMNIA SEARCH] Filters:", filters);

  let query = supabase
    .from("shopify_products")
    .select(
      "id, title, price, compare_at_price, ai_color, ai_material, ai_shape, image_url, handle, category, sub_category, tags, vendor, currency"
    )
    .eq("status", "active")
    .limit(20);

  if (storeId) query = query.eq("store_id", storeId);
  if (filters.type) query = query.ilike("title", `%${filters.type}%`);

  const { data, error } = await query;
  if (error) {
    console.error("❌ Supabase error:", error);
    return [];
  }

  let results = data || [];
  const match = (f?: string, val?: string) =>
    f?.toLowerCase().includes(val?.toLowerCase() || "");

  if (filters.color)
    results = results.filter(
      (p) => match(p.ai_color, filters.color) || match(p.title, filters.color)
    );
  if (filters.material)
    results = results.filter(
      (p) => match(p.ai_material, filters.material) || match(p.title, filters.material)
    );
  if (filters.maxPrice)
    results = results.filter((p) => Number(p.price) <= filters.maxPrice!);
  if (filters.searchPromo)
    results = results.filter(
      (p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
    );

  console.log("✅ [OMNIA SEARCH] Results:", results.length);
  return results.slice(0, 8);
}

//
// ✨ 5. Génération de réponse IA pour les produits
//
async function generateProductPresentation(
  products: Product[],
  userMessage: string,
  sector: string,
  onChunk?: (text: string) => void
): Promise<string> {
  if (!products.length) {
    return `Je n’ai trouvé aucun produit correspondant à "${userMessage}". 🛋️  
Souhaitez-vous préciser la couleur, le style ou votre budget ?`;
  }

  const systemPrompt = `Tu es OmnIA, expert e-commerce du secteur "${sector}".
Réponds en français naturel (max 120 mots), présente les produits de manière engageante et professionnelle.
Mentionne les promotions s’il y en a, et termine par une question ouverte.`;

  const productData = products.map((p) => ({
    titre: p.title,
    prix: `${p.price}${p.currency || "€"}`,
    promo:
      p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
        ? `${Math.round(
            100 - (Number(p.price) / Number(p.compare_at_price)) * 100
          )}% de réduction`
        : null,
    couleur: p.ai_color,
    materiau: p.ai_material,
  }));

  const userPrompt = `Demande client : "${userMessage}"
Produits trouvés :
${JSON.stringify(productData, null, 2)}
Présente ces produits au client.`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  // 🌊 Si une fonction de stream est fournie, on stream la réponse
  if (onChunk) {
    try {
      await streamDeepSeek(messages, onChunk);
      return ""; // le texte est streamé directement
    } catch (err) {
      console.error("Stream error:", err);
    }
  }

  // sinon fallback normal
  return await callDeepSeek(messages, 250);
}

//
// 🧩 6. Fonction principale OmnIAChat (stream + fallback)
//
export async function OmnIAChat(
  userMessage: string,
  history: ChatMessage[] = [],
  storeId?: string,
  onChunk?: (text: string) => void
) {
  console.log("🚀 [OMNIA] Message reçu:", userMessage);

  const intent = await detectIntent(userMessage);
  const msg = userMessage.toLowerCase();

  const filters: ProductAttributes = { intent: "product_search", sector: "meubles" };

  if (["montre", "bracelet"].some((x) => msg.includes(x))) filters.sector = "montres";
  else if (["robe", "chemise", "pantalon"].some((x) => msg.includes(x)))
    filters.sector = "pret_a_porter";

  const types = ["table", "chaise", "canapé", "lit", "armoire", "bureau"];
  filters.type = types.find((t) => msg.includes(t)) || undefined;

  const colors = ["blanc", "noir", "gris", "beige", "bois", "doré", "marron"];
  filters.color = colors.find((c) => msg.includes(c)) || undefined;

  const materials = ["bois", "métal", "verre", "marbre", "travertin"];
  filters.material = materials.find((m) => msg.includes(m)) || undefined;

  const promo = ["promo", "réduction", "solde", "offre"];
  if (promo.some((p) => msg.includes(p))) filters.searchPromo = true;

  const price = msg.match(/(moins de|max|sous)\s*(\d+)/);
  if (price) filters.maxPrice = Number(price[2]);

  if (intent === "chat") {
    const chatResponse = await callDeepSeek(
      [
        {
          role: "system",
          content:
            "Tu es OmnIA, un assistant amical pour un site e-commerce. Réponds brièvement et naturellement.",
        },
        { role: "user", content: userMessage },
      ],
      120
    );

    return {
      role: "assistant" as const,
      content: chatResponse,
      intent: "conversation",
      products: [],
      mode: "conversation",
      sector: filters.sector,
    };
  }

  // 🔍 Recherche produit intelligente
  const products = await searchProducts(filters, storeId);
  const aiResponse = await generateProductPresentation(
    products,
    userMessage,
    filters.sector!,
    onChunk
  );

  return {
    role: "assistant" as const,
    content: aiResponse,
    intent: "product_show",
    products,
    mode: "product_show",
    sector: filters.sector,
  };
}
