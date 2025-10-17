import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase config missing");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { message, history = [], storeId = null, stream = false } = await req.json();

    if (!message) throw new Error("Message is required");

    // Détecter attributs
    const attributes = extractAttributes(message);
    const intent = detectIntent(message, attributes);
    const sector = detectSector(message);

    console.log("🧭 Intent:", intent, "| Sector:", sector);

    let responseText = "";
    let products: any[] = [];
    let summary = null;

    // Cas 1 : simple chat / accueil
    if (intent === "chat") {
      responseText =
        sector === "meubles"
          ? "Bonjour 👋 ! Vous cherchez un meuble en particulier ? Table, canapé, chaise… ?"
          : sector === "montres"
          ? "Bonjour 👋 ! Vous cherchez une montre connectée ou classique ?"
          : "Bonjour 👋 ! Que puis-je vous aider à trouver aujourd’hui ?";
    }

    // Cas 2 : recherche floue
    else if (intent === "product_chat") {
      responseText = await callDeepSeek(
        `Tu es OmnIA, un conseiller ${sector}. Le client dit : "${message}". 
Pose-lui une seule question pour préciser son besoin (style, budget, couleur...).`,
        supabaseUrl,
        stream
      );
    }

    // Cas 3 : recherche précise
    else if (intent === "product_show") {
      products = await searchProducts(attributes, storeId, supabase);
      summary = generateProductSummary(products);

      responseText = await generateResponse(
        message,
        products,
        attributes,
        supabaseUrl,
        openaiKey,
        stream
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        response: responseText,
        summary,
        products: products.slice(0, 6),
        totalProducts: products.length,
        intent,
        sector,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Error in ai-chat:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
        response: "Désolé, je n’ai pas compris. Pouvez-vous reformuler ?",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});

// --- 🔍 Helpers ---

function detectIntent(message: string, attr: any) {
  const greet = /\b(bonjour|salut|hey|coucou)\b/i.test(message);
  const hasType = !!attr.type;
  const hasDetails = attr.color || attr.material || attr.maxPrice;
  if (greet) return "chat";
  if (hasType && !hasDetails) return "product_chat";
  if (hasType && hasDetails) return "product_show";
  return "chat";
}

function detectSector(message: string) {
  if (/montre|bracelet|chronographe/i.test(message)) return "montres";
  if (/chemise|robe|t-shirt|vêtement/i.test(message)) return "mode";
  return "meubles";
}

function extractAttributes(message: string) {
  const msg = message.toLowerCase();
  const find = (arr: string[]) => arr.find((v) => msg.includes(v));
  const types = ["table basse", "table", "chaise", "canapé", "lit", "commode"];
  const colors = ["blanc", "noir", "beige", "gris", "bois", "marron"];
  const materials = ["bois", "métal", "verre", "marbre", "travertin"];
  const styles = ["moderne", "scandinave", "industriel", "vintage"];
  const attributes: any = {
    type: find(types),
    color: find(colors),
    material: find(materials),
    style: find(styles),
  };
  const priceMatch = msg.match(/moins de\s*(\d+)/);
  if (priceMatch) attributes.maxPrice = parseInt(priceMatch[1]);
  return attributes;
}

async function searchProducts(filters: any, storeId: string, supabase: any) {
  let query = supabase.from("shopify_products").select("*").eq("status", "active");
  if (storeId) query = query.eq("store_id", storeId);
  if (filters.type) query = query.ilike("chat_text", `%${filters.type}%`);
  const { data } = await query.limit(12);
  return data || [];
}

function generateProductSummary(products: any[]) {
  if (!products.length) return null;
  const sum = {
    total: products.length,
    styles: new Set(),
    colors: new Set(),
    materials: new Set(),
    hasPromo: false,
  };
  for (const p of products) {
    if (p.style) sum.styles.add(p.style);
    if (p.ai_color) sum.colors.add(p.ai_color);
    if (p.ai_material) sum.materials.add(p.ai_material);
    if (p.compare_at_price && Number(p.compare_at_price) > Number(p.price))
      sum.hasPromo = true;
  }
  return {
    total: sum.total,
    styles: [...sum.styles],
    colors: [...sum.colors],
    materials: [...sum.materials],
    hasPromo: sum.hasPromo,
  };
}

// --- 🚀 AI calls ---

async function callDeepSeek(prompt: string, supabaseUrl: string, stream: boolean) {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: prompt }], stream }),
    });
    return await res.text();
  } catch (err) {
    console.error("DeepSeek error:", err);
    return "Désolé, le service est lent. Pouvez-vous préciser votre recherche ?";
  }
}

async function generateResponse(
  message: string,
  products: any[],
  filters: any,
  supabaseUrl: string,
  openaiKey?: string,
  stream = false
) {
  if (!products.length)
    return "Je n’ai trouvé aucun produit correspondant à votre recherche.";

  const items = products.slice(0, 3).map(
    (p) =>
      `${p.title} (${p.price}€${p.compare_at_price ? ` au lieu de ${p.compare_at_price}€` : ""})`
  );

  const prompt = `Tu es OmnIA, conseiller déco. Le client dit : "${message}". 
Produits disponibles : ${items.join(", ")}.
Rédige une réponse persuasive (<80 mots) mentionnant les promos et finis par une question.`;

  // ⚙️ Appel prioritaire via proxy DeepSeek
  let res = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 250,
      stream,
    }),
  });

  if (res.ok) return await res.text();

  // 🔁 Fallback OpenAI si DeepSeek échoue
  if (openaiKey) {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    return d.choices?.[0]?.message?.content || "Voici quelques suggestions.";
  }

  return "Voici quelques articles susceptibles de vous plaire.";
}
