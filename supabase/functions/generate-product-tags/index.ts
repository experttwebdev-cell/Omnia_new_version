import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TagGenerationRequest {
  productId: string;
}

async function callDeepSeek(messages: any[], maxTokens = 500) {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.5,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { productId }: TagGenerationRequest = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: product, error: productError } = await supabaseClient
      .from("shopify_products")
      .select("id, title, description, product_type, vendor, category, sub_category, ai_color, ai_material, tags")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (product.tags && product.tags.trim() !== "") {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          message: "Product already has tags",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating tags with DeepSeek for product: ${product.title}`);

    const tagPrompt = `Generate SEO-optimized product tags for this item:

Product Information:
- Title: ${product.title}
- Description: ${product.description || "Not provided"}
- Type: ${product.product_type || "Not specified"}
- Vendor: ${product.vendor || "Not specified"}
- Category: ${product.category || "Not specified"}
- Sub-Category: ${product.sub_category || "Not specified"}
- Color: ${product.ai_color || "Not specified"}
- Material: ${product.ai_material || "Not specified"}

Generate 8-15 relevant tags that:
1. Include the product type, category, and material
2. Include color if applicable
3. Include style descriptors (modern, classic, rustic, etc.)
4. Include use cases or room types
5. Are single words or short phrases (2-3 words max)
6. Are in lowercase
7. Are SEO-friendly and searchable
8. Don't repeat the same information

Provide response as a comma-separated list in JSON format:
{
  "tags": "tag1, tag2, tag3, tag4, tag5, tag6, tag7, tag8"
}

Example for a wooden coffee table:
{
  "tags": "table basse, bois, salon, meuble, design moderne, rangement, naturel, scandinave"
}`;

    const tagResponse = await callDeepSeek([
      {
        role: "system",
        content: "You are a product tagging expert. Generate relevant, SEO-optimized tags. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: tagPrompt,
      },
    ]);

    const tagContent = tagResponse.choices[0].message.content;

    let tags = "";
    try {
      const parsed = JSON.parse(tagContent);
      tags = parsed.tags || "";
    } catch (e) {
      console.error("Failed to parse tag JSON:", tagContent);
      tags = product.product_type || product.category || "";
    }

    const { error: updateError } = await supabaseClient
      .from("shopify_products")
      .update({
        tags: tags,
        seo_synced_to_shopify: false
      })
      .eq("id", productId);

    if (updateError) {
      throw updateError;
    }

    console.log(`Tags generated with DeepSeek for product ${productId}: ${tags}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tags generated successfully with DeepSeek",
        data: {
          product_id: productId,
          tags: tags,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
