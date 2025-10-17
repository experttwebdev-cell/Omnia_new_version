import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// 🔍 Détection d’intent simple
function detectIntent(message: string, attributes: any): "chat" | "product_chat" | "product_show" {
  const isGreeting = /\b(bonjour|salut|hey|coucou)\b/i.test(message);
  const hasProductType = !!attributes.type;
  const hasDetails = attributes.color || attributes.material || attributes.maxPrice;
  if (isGreeting) return "chat";
  if (hasProductType && !hasDetails) return "product_chat";
  if (hasProductType && hasDetails) return "product_show";
  return "chat";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey)
      throw new Error("Supabase configuration missing");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { message, history = [], storeId = null } = await req.json();
    if (!message) throw new Error("Message is required");

    const attributes = await extractAttributes(message);
    const intent = detectIntent(message, attributes);
    console.log("🧭 Intent detected:", intent, attributes);

    let responseText = "";
    let products: any[] = [];
    let summary = null;

    // 🧠 Intent routing
    if (intent === "chat") {
      responseText = "Bonjour 👋, que puis-je trouver pour vous aujourd’hui ?";
    } else if (intent === "product_chat") {
      responseText = await callDeepSeek(
        `Tu es OmnIA, un conseiller déco chaleureux. Le client dit: "${message}". 
        Réponds en 1 phrase naturelle, engageante et pose une question pour affiner son besoin.`,
        supabaseUrl
      );
    } else if (intent === "product_show") {
      products = await searchProducts(attributes, storeId, supabase);
      summary = generateProductSummary(products);
      responseText = await generateResponse(message, products, attributes, supabaseUrl, openaiKey);
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        summary,
        products: products.slice(0, 6),
        totalProducts: products.length,
        intent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Error in ai-chat:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        response:
          "Je suis désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?",
        success: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function extractAttributes(message: string) {
  const msg = message.toLowerCase();
  const attributes: any = { intent: "product_search" };
  const find = (arr: string[]) => arr.find((v) => msg.includes(v));
  const types = ["table basse", "table", "chaise", "canapé", "lit", "commode", "armoire", "bureau"];
  const styles = ["scandinave", "moderne", "industriel", "classique", "vintage"];
  const colors = ["blanc", "noir", "beige", "gris", "bois", "marron"];
  const materials = ["bois", "métal", "verre", "marbre", "travertin", "acier"];
  attributes.type = find(types);
  attributes.style = find(styles);
  attributes.color = find(colors);
  attributes.material = find(materials);
  const priceMatch = msg.match(/(?:moins de|max|sous)\s*(\d+)/);
  if (priceMatch) attributes.maxPrice = parseInt(priceMatch[1]);
  return attributes;
}

async function searchProducts(filters: any, storeId: string | null, supabase: any) {
  let query = supabase.from("shopify_products").select("*").eq("status", "active").limit(20);
  if (storeId) query = query.eq("store_id", storeId);
  if (filters.type) query = query.ilike("chat_text", `%${filters.type}%`);
  const { data, error } = await query;
  if (error) return [];
  let results = data || [];
  const match = (f?: string, val?: string) => f?.toLowerCase().includes(val?.toLowerCase() || "");
  if (filters.style) results = results.filter((p) => match(p.style, filters.style));
  if (filters.material) results = results.filter((p) => match(p.ai_material, filters.material));
  if (filters.color) results = results.filter((p) => match(p.ai_color, filters.color));
  if (filters.maxPrice) results = results.filter((p) => Number(p.price) <= filters.maxPrice);
  return results.slice(0, 8);
}

function generateProductSummary(products: any[]) {
  if (!products?.length) return null;
  const summary = {
    total: products.length,
    materials: [...new Set(products.map((p) => p.ai_material).filter(Boolean))],
    styles: [...new Set(products.map((p) => p.style).filter(Boolean))],
    colors: [...new Set(products.map((p) => p.ai_color).filter(Boolean))],
    hasPromo: products.some((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price)),
  };
  return summary;
}

// 🚀 Génération via ton proxy DeepSeek
async function callDeepSeek(prompt: string, supabaseUrl: string): Promise<string> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6,
        max_tokens: 250,
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Je réfléchis à la meilleure option pour vous...";
  } catch (e) {
    console.error("⚠️ DeepSeek proxy error:", e);
    return "Désolé, le service est temporairement lent. Pouvez-vous préciser votre besoin ?";
  }
}

// 🔥 Réponse produit persuasive
async function generateResponse(message: string, products: any[], filters: any, supabaseUrl: string, openaiKey?: string) {
  if (!products.length)
    return "Je n'ai trouvé aucun produit correspondant à votre recherche.";

  const productsData = products.slice(0, 3).map((p) => ({
    titre: p.title,
    prix: `${p.price}${p.currency || "€"}`,
    promo: p.compare_at_price && Number(p.compare_at_price) > Number(p.price),
    reduction: p.compare_at_price
      ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100)
      : null,
    materiau: p.ai_material,
    style: p.style,
    couleur: p.ai_color,
  }));

  const prompt = `
Tu es OmnIA, expert déco. Le client dit : "${message}".
Voici les produits : ${JSON.stringify(productsData, null, 2)}.
Rédige une réponse courte (≤80 mots), persuasive, naturelle, mentionnant les promos et terminez par une question ouverte.
`;

  const res = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 250,
    }),
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "Voici quelques articles qui pourraient vous plaire !";
}
