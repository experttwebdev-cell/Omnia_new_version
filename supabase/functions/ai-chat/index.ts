import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }

    if (!deepseekKey) {
      return new Response(
        JSON.stringify({
          error: "DeepSeek API key not configured",
          response: "Je suis désolé, le service de chat n'est pas disponible pour le moment. Veuillez contacter l'administrateur.",
          success: false
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { message, history = [], storeId = null } = await req.json();

    if (!message || typeof message !== 'string') {
      throw new Error("Message is required");
    }

    console.log('💬 Chat message:', message);
    console.log('🏪 Store ID:', storeId);

    const attributes = await extractAttributes(message, history, deepseekKey);
    console.log('🧠 Extracted attributes:', attributes);

    const products = await searchProducts(attributes, storeId, supabase);
    console.log('📦 Found products:', products.length);

    const response = await generateResponse(message, products, attributes, deepseekKey);

    return new Response(
      JSON.stringify({
        success: true,
        response: response,
        products: products.slice(0, 6),
        totalProducts: products.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("💥 Error in ai-chat:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        response: "Je suis désolé, j'ai rencontré une erreur. Pouvez-vous reformuler votre question ?",
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function extractAttributes(message: string, history: ChatMessage[], apiKey: string): Promise<any> {
  const msg = message.toLowerCase();
  const attributes: any = { intent: 'product_search' };

  const types = ['table basse', 'table', 'chaise', 'canapé', 'fauteuil', 'lit', 'armoire', 'commode', 'meuble', 'étagère', 'bureau'];
  for (const type of types) {
    if (msg.includes(type)) {
      attributes.type = type;
      break;
    }
  }

  const styles = ['scandinave', 'moderne', 'industriel', 'vintage', 'classique', 'contemporain'];
  for (const style of styles) {
    if (msg.includes(style)) {
      attributes.style = style;
      break;
    }
  }

  const colors = ['blanc', 'noir', 'beige', 'gris', 'bois', 'marron', 'bleu', 'vert', 'rouge', 'doré', 'dorés'];
  for (const color of colors) {
    if (msg.includes(color)) {
      attributes.color = color;
      break;
    }
  }

  const materials = ['bois', 'métal', 'verre', 'marbre', 'tissu', 'cuir', 'céramique', 'travertin', 'granit', 'acier', 'pierre', 'velours'];
  for (const material of materials) {
    if (msg.includes(material)) {
      attributes.material = material;
      break;
    }
  }

  const shapes = ['rond', 'ronde', 'rectangulaire', 'carré', 'carrée', 'ovale'];
  for (const shape of shapes) {
    if (msg.includes(shape)) {
      attributes.shape = shape;
      break;
    }
  }

  const priceMatch = msg.match(/(?:moins de|maximum|max|sous|en dessous de)\s*(\d+)/);
  if (priceMatch) {
    attributes.maxPrice = parseInt(priceMatch[1]);
  }

  const dimMatch = msg.match(/(\d+)\s*[x×]\s*(\d+)/);
  if (dimMatch) {
    attributes.dimensions = `${dimMatch[1]}x${dimMatch[2]}`;
  }

  const promoKeywords = ['promo', 'promotion', 'solde', 'réduction', 'bon plan', 'offre', 'pas cher', 'discount'];
  for (const keyword of promoKeywords) {
    if (msg.includes(keyword)) {
      attributes.searchPromo = true;
      break;
    }
  }

  return attributes;
}

async function searchProducts(filters: any, storeId: string | null, supabase: any): Promise<Product[]> {
  let query = supabase
    .from('shopify_products')
    .select('*')
    .eq('status', 'active')
    .limit(12);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  if (filters.type) {
    query = query.ilike('chat_text', `%${filters.type}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  let results = data || [];

  if (filters.style && results.length > 0) {
    results = results.filter((p: Product) =>
      p.style?.toLowerCase().includes(filters.style.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.style.toLowerCase())
    );
  }

  if (filters.color && results.length > 0) {
    results = results.filter((p: Product) =>
      p.ai_color?.toLowerCase().includes(filters.color.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.color.toLowerCase())
    );
  }

  if (filters.material && results.length > 0) {
    results = results.filter((p: Product) =>
      p.ai_material?.toLowerCase().includes(filters.material.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.material.toLowerCase()) ||
      p.title?.toLowerCase().includes(filters.material.toLowerCase())
    );
  }

  if (filters.shape && results.length > 0) {
    results = results.filter((p: Product) =>
      p.ai_shape?.toLowerCase().includes(filters.shape.toLowerCase()) ||
      p.title?.toLowerCase().includes(filters.shape.toLowerCase())
    );
  }

  if (filters.maxPrice && results.length > 0) {
    results = results.filter((p: Product) => {
      const price = Number(p.price);
      return !isNaN(price) && price <= filters.maxPrice;
    });
  }

  if (filters.searchPromo && results.length > 0) {
    const promoProducts = results.filter((p: Product) =>
      p.compare_at_price && Number(p.compare_at_price) > Number(p.price)
    );
    if (promoProducts.length > 0) {
      results = promoProducts;
    }
  }

  return results.slice(0, 8);
}

async function generateResponse(message: string, products: Product[], filters: any, apiKey: string): Promise<string> {
  if (products.length === 0) {
    return `Je n'ai pas trouvé de produits correspondant à votre recherche. 😊\n\nPuis-je vous aider à affiner votre recherche ? Par exemple :\n• Quel style préférez-vous ? (scandinave, moderne, industriel...)\n• Pour quelle pièce ? (salon, chambre, bureau...)\n• Avez-vous des préférences de couleur ou de matériau ?\n• Quel est votre budget approximatif ?`;
  }

  const productsData = products.slice(0, 4).map((p, idx) => {
    const hasPromo = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
    const discount = hasPromo ? Math.round((1 - Number(p.price) / Number(p.compare_at_price!)) * 100) : 0;

    const dimensions = [];
    if (p.smart_width) dimensions.push(`L${p.smart_width}${p.smart_width_unit || 'cm'}`);
    if (p.smart_height) dimensions.push(`H${p.smart_height}${p.smart_height_unit || 'cm'}`);

    return {
      index: idx + 1,
      titre: p.title,
      prix: `${p.price}${p.currency || '€'}`,
      prix_barre: hasPromo ? `${p.compare_at_price}${p.currency || '€'}` : null,
      reduction: hasPromo ? `-${discount}%` : null,
      categorie: p.category,
      style: p.style,
      couleur: p.ai_color,
      materiau: p.ai_material,
      dimensions: dimensions.join(' x ') || 'N/A'
    };
  });

  const prompt = `Tu es OmnIA, expert conseil en ameublement. Analyse la demande et présente les produits de manière chaleureuse et personnalisée.\n\nDemande du client: "${message}"\n\nProduits disponibles:\n${JSON.stringify(productsData, null, 2)}\n\nRègles:\n- Réponds en français naturel et chaleureux\n- Maximum 100 mots\n- Mets en avant les promotions (prix barré, réduction %)\n- Cite les caractéristiques pertinentes (dimensions, matériaux, couleurs)\n- Termine par une question ouverte pour continuer la conversation\n- N'invente rien`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Tu es OmnIA, expert conseil chaleureux. Réponds en français naturel." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (error) {
    console.error('Error generating response with AI:', error);

    const hasPromo = products.some(p => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));
    let response = `J'ai trouvé ${products.length} produit${products.length > 1 ? 's' : ''} qui correspondent à votre recherche ! `;

    if (hasPromo) {
      response += `💸 Et bonne nouvelle, certains sont en promotion ! `;
    }

    response += `\n\nQue souhaitez-vous savoir sur ces produits ?`;

    return response;
  }
}