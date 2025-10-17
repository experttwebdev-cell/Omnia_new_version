import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Product {
  id: string;
  title: string;
  price: string;
  compare_at_price?: string;
  image_url?: string;
  product_type?: string;
  category?: string;
  sub_category?: string;
  ai_color?: string;
  ai_material?: string;
  ai_shape?: string;
  style?: string;
  tags?: string;
  vendor?: string;
  smart_width?: number;
  smart_height?: number;
  smart_length?: number;
  smart_width_unit?: string;
  smart_height_unit?: string;
  smart_length_unit?: string;
  shop_name?: string;
  currency?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

    console.log("🔑 API Keys Status:");
    console.log("  - OpenAI:", openaiKey ? `${openaiKey.substring(0, 10)}... (${openaiKey.length} chars)` : "NOT SET");
    console.log("  - DeepSeek:", deepseekKey ? `${deepseekKey.substring(0, 10)}... (${deepseekKey.length} chars)` : "NOT SET");

    if (!supabaseUrl || !supabaseKey)
      throw new Error("Supabase configuration missing");

    // Check if at least one AI provider is configured
    if (!deepseekKey && !openaiKey)
      throw new Error("AI API key missing (OpenAI or DeepSeek required)");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { message, history = [], storeId = null } = await req.json();
    if (!message) throw new Error("Message is required");

    const attributes = await extractAttributes(message);
    const products = await searchProducts(attributes, storeId, supabase);
    const summary = generateProductSummary(products);
    const response = await generateResponse(
      message,
      products,
      attributes,
      deepseekKey,
      openaiKey
    );

    return new Response(
      JSON.stringify({
        success: true,
        response,
        summary,
        products: products.slice(0, 6),
        totalProducts: products.length,
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

  const types = ["table basse", "table", "chaise", "canapé", "fauteuil", "lit", "armoire", "commode", "meuble", "étagère", "bureau"];
  const styles = ["scandinave", "moderne", "industriel", "vintage", "classique", "contemporain"];
  const colors = ["blanc", "noir", "beige", "gris", "bois", "marron", "bleu", "vert", "rouge", "doré"];
  const materials = ["bois", "métal", "verre", "marbre", "tissu", "cuir", "travertin", "granit", "acier", "pierre", "velours"];
  const shapes = ["rond", "ronde", "rectangulaire", "carré", "ovale"];

  const find = (arr: string[]) => arr.find((v) => msg.includes(v));

  attributes.type = find(types);
  attributes.style = find(styles);
  attributes.color = find(colors);
  attributes.material = find(materials);
  attributes.shape = find(shapes);

  const priceMatch = msg.match(/(?:moins de|max|maximum|sous|en dessous de)\s*(\d+)/);
  if (priceMatch) attributes.maxPrice = parseInt(priceMatch[1]);

  const promoKeywords = ["promo", "promotion", "solde", "réduction", "offre", "pas cher"];
  if (promoKeywords.some((k) => msg.includes(k))) attributes.searchPromo = true;

  return attributes;
}

async function searchProducts(filters: any, storeId: string | null, supabase: any): Promise<Product[]> {
  let query = supabase.from("shopify_products").select("*").eq("status", "active").limit(20);
  if (storeId) query = query.eq("store_id", storeId);
  if (filters.type) query = query.ilike("chat_text", `%${filters.type}%`);

  const { data, error } = await query;
  if (error) return [];

  let results = data || [];
  const match = (f?: string, val?: string) => f?.toLowerCase().includes(val?.toLowerCase() || "");

  if (filters.style) results = results.filter((p) => match(p.style, filters.style) || match(p.tags, filters.style));
  if (filters.color) results = results.filter((p) => match(p.ai_color, filters.color) || match(p.tags, filters.color));
  if (filters.material) results = results.filter((p) => match(p.ai_material, filters.material) || match(p.tags, filters.material));
  if (filters.shape) results = results.filter((p) => match(p.ai_shape, filters.shape) || match(p.title, filters.shape));
  if (filters.maxPrice) results = results.filter((p) => Number(p.price) <= filters.maxPrice);
  if (filters.searchPromo) results = results.filter((p) => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));

  return results.slice(0, 8);
}

function generateProductSummary(products: Product[]) {
  if (!products?.length) return null;

  const summary = {
    total: products.length,
    categories: new Set<string>(),
    styles: new Set<string>(),
    materials: new Set<string>(),
    colors: new Set<string>(),
    hasPromo: false,
  };

  for (const p of products) {
    if (p.category) summary.categories.add(p.category);
    if (p.style) summary.styles.add(p.style);
    if (p.ai_material) summary.materials.add(p.ai_material);
    if (p.ai_color) summary.colors.add(p.ai_color);
    if (p.compare_at_price && Number(p.compare_at_price) > Number(p.price)) summary.hasPromo = true;
  }

  return {
    total: summary.total,
    categories: [...summary.categories],
    styles: [...summary.styles],
    materials: [...summary.materials],
    colors: [...summary.colors],
    hasPromo: summary.hasPromo,
  };
}

async function generateResponse(message: string, products: Product[], filters: any, deepseekKey: string | undefined, openaiKey: string | undefined): Promise<string> {
  if (!products.length)
    return `Je n'ai trouvé aucun produit correspondant. 😊 Souhaitez-vous préciser le style, la couleur ou votre budget ?`;

  const productsData = products.map((p) => ({
    titre: p.title,
    prix: `${p.price}${p.currency || "€"}`,
    promo: p.compare_at_price && Number(p.compare_at_price) > Number(p.price),
    reduction: p.compare_at_price ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : null,
    style: p.style,
    couleur: p.ai_color,
    materiau: p.ai_material,
  }));

  const prompt = `Tu es OmnIA, expert en ameublement. Rédige une courte réponse (<100 mots) en français, naturelle et engageante.
Mets en avant les promotions (prix barré, réduction %), les matériaux et styles, puis termine par une question ouverte.
Demande du client: "${message}"
Produits: ${JSON.stringify(productsData, null, 2)}`;

  // Priority order: DeepSeek (cheapest) -> GPT-3.5-turbo -> GPT-4o-mini (fallback)
  const providers = [
    { name: "deepseek", key: deepseekKey, url: "https://api.deepseek.com/v1/chat/completions", model: "deepseek-chat" },
    { name: "openai-3.5", key: openaiKey, url: "https://api.openai.com/v1/chat/completions", model: "gpt-3.5-turbo" },
    { name: "openai-4o", key: openaiKey, url: "https://api.openai.com/v1/chat/completions", model: "gpt-4o-mini" },
  ];

  let lastError: Error | null = null;

  for (const provider of providers) {
    if (!provider.key) {
      console.log(`⏭️ Skipping ${provider.name}: no API key configured`);
      continue;
    }

    try {
      console.log(`🔄 Trying ${provider.name} with model ${provider.model}...`);
      console.log(`   API Key: ${provider.key.substring(0, 10)}... (${provider.key.length} chars)`);
      console.log(`   URL: ${provider.url}`);

      const res = await fetch(provider.url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${provider.key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ ${provider.name} API error:`, res.status, errorText);

        // If it's a quota/auth error, try next provider
        if (res.status === 429 || res.status === 401 || res.status === 403) {
          lastError = new Error(`${provider.name} API error: ${res.status}`);
          continue;
        }

        throw new Error(`${provider.name} API error: ${res.status} - ${errorText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;

      if (content) {
        console.log(`✅ Success with ${provider.name}`);
        return content;
      }

      console.log(`⚠️ ${provider.name} returned empty content, trying next provider...`);
      lastError = new Error(`${provider.name} returned empty content`);
    } catch (error) {
      console.error(`❌ Error with ${provider.name}:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  // All providers failed
  console.error("💥 All AI providers failed");
  if (lastError) {
    throw lastError;
  }
  throw new Error("All AI providers are unavailable");
}
