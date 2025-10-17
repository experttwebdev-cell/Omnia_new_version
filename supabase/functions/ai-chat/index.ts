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
  vision_ai_summary?: string;
  smart_tags?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase configuration missing");

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { message, history = [], storeId = null } = await req.json();

    if (!message || typeof message !== "string") throw new Error("Message is required");

    const attributes = await extractAttributes(message);
    const products = await searchProducts(attributes, storeId, supabase);
    const summary = generateProductSummary(products);
    const response = await generateResponse(message, products, attributes, deepseekKey);

    return new Response(
      JSON.stringify({
        success: true,
        response,
        summary,
        products: products.slice(0, 8),
        totalProducts: products.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        response: "Erreur interne. Pouvez-vous reformuler votre recherche ?",
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
  const styles = ["scandinave", "moderne", "industriel", "vintage", "classique", "contemporain", "minimaliste", "design"];
  const colors = ["blanc", "noir", "beige", "gris", "bois", "marron", "bleu", "vert", "rouge", "doré", "cuivre"];
  const materials = ["bois", "métal", "verre", "marbre", "tissu", "cuir", "céramique", "travertin", "granit", "acier", "pierre", "velours"];
  const shapes = ["rond", "ronde", "rectangulaire", "carré", "carrée", "ovale"];

  for (const type of types) if (msg.includes(type)) attributes.type = type;
  for (const style of styles) if (msg.includes(style)) attributes.style = style;
  for (const color of colors) if (msg.includes(color)) attributes.color = color;
  for (const material of materials) if (msg.includes(material)) attributes.material = material;
  for (const shape of shapes) if (msg.includes(shape)) attributes.shape = shape;

  const priceMatch = msg.match(/(?:moins de|max|maximum|sous|en dessous de)\s*(\d+)/);
  if (priceMatch) attributes.maxPrice = parseInt(priceMatch[1]);

  const promoKeywords = ["promo", "promotion", "solde", "réduction", "offre", "pas cher"];
  attributes.searchPromo = promoKeywords.some(k => msg.includes(k));

  return attributes;
}

async function searchProducts(filters: any, storeId: string | null, supabase: any): Promise<Product[]> {
  let query = supabase.from("shopify_products").select("*").eq("status", "active").limit(50);
  if (storeId) query = query.eq("store_id", storeId);
  if (filters.type) query = query.ilike("chat_text", `%${filters.type}%`);

  const { data, error } = await query;
  if (error) {
    console.error("❌ DB Error:", error);
    return [];
  }

  let results = data || [];
  const match = (f?: string, val?: string) => f?.toLowerCase().includes(val?.toLowerCase() || "");

  // 🔍 Matching enrichi
  if (filters.style) results = results.filter(p => match(p.style, filters.style) || match(p.tags, filters.style));
  if (filters.color) results = results.filter(p => match(p.ai_color, filters.color) || match(p.tags, filters.color));
  if (filters.material) results = results.filter(p => match(p.ai_material, filters.material) || match(p.title, filters.material));
  if (filters.shape) results = results.filter(p => match(p.ai_shape, filters.shape) || match(p.title, filters.shape));
  if (filters.maxPrice) results = results.filter(p => Number(p.price) <= filters.maxPrice);
  if (filters.searchPromo) results = results.filter(p => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));

  // 🧠 Tri par pertinence
  results.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (filters.material) {
      if (a.title?.includes(filters.material)) scoreA++;
      if (b.title?.includes(filters.material)) scoreB++;
    }
    if (filters.style) {
      if (a.style === filters.style) scoreA++;
      if (b.style === filters.style) scoreB++;
    }
    if (filters.color) {
      if (a.ai_color === filters.color) scoreA++;
      if (b.ai_color === filters.color) scoreB++;
    }
    return scoreB - scoreA;
  });

  return results.slice(0, 12);
}

function generateProductSummary(products: Product[]) {
  if (!products?.length) return null;

  const summary = {
    total: products.length,
    categories: new Set<string>(),
    subcategories: new Set<string>(),
    styles: new Set<string>(),
    materials: new Set<string>(),
    colors: new Set<string>(),
    dimensions: new Set<string>(),
    hasPromo: false,
  };

  for (const p of products) {
    if (p.category) summary.categories.add(p.category);
    if (p.sub_category) summary.subcategories.add(p.sub_category);
    if (p.style) summary.styles.add(p.style);
    if (p.ai_material) summary.materials.add(p.ai_material);
    if (p.ai_color) summary.colors.add(p.ai_color);

    const dims: string[] = [];
    if (p.smart_width) dims.push(`L${p.smart_width}${p.smart_width_unit || "cm"}`);
    if (p.smart_length) dims.push(`P${p.smart_length}${p.smart_length_unit || "cm"}`);
    if (p.smart_height) dims.push(`H${p.smart_height}${p.smart_height_unit || "cm"}`);
    if (dims.length > 0) summary.dimensions.add(dims.join(" × "));

    if (p.compare_at_price && Number(p.compare_at_price) > Number(p.price)) summary.hasPromo = true;
  }

  return {
    total: summary.total,
    categories: [...summary.categories],
    subcategories: [...summary.subcategories],
    styles: [...summary.styles],
    materials: [...summary.materials],
    colors: [...summary.colors],
    dimensions: [...summary.dimensions],
    hasPromo: summary.hasPromo,
  };
}

async function generateResponse(message: string, products: Product[], filters: any, apiKey?: string): Promise<string> {
  if (!products.length) {
    return `Je n'ai trouvé aucun produit correspondant. 🎯 Souhaitez-vous préciser la couleur, le matériau ou le budget ?`;
  }

  const list = products
    .slice(0, 5)
    .map(p => {
      const promo = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
      const discount = promo ? Math.round((1 - Number(p.price) / Number(p.compare_at_price)) * 100) : 0;
      return `• ${p.title} – ${p.price}${p.currency || "€"}${promo ? ` (-${discount}%)` : ""}`;
    })
    .join("\n");

  const prompt = `Tu es OmnIA, un expert-conseil en ameublement. 
Rédige une réponse naturelle, fluide et engageante (max 100 mots).
Mets en avant les promos s'il y en a, les matériaux et les styles. Termine par une question pour relancer la discussion.
Demande: "${message}"
Produits disponibles:
${list}`;

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.7,
      }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || `J’ai trouvé ${products.length} articles qui pourraient vous plaire !`;
  } catch (err) {
    console.error("⚠️ DeepSeek API Error:", err);
    return `J’ai trouvé ${products.length} articles. Certains sont en promotion 💸. Voulez-vous voir les moins chers ?`;
  }
}
