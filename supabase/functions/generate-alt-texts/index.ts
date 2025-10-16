import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AltTextRequest {
  imageId: string;
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

    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({ error: "DeepSeek API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { imageId }: AltTextRequest = await req.json();

    if (!imageId) {
      return new Response(
        JSON.stringify({ error: "Image ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: image, error: imageError } = await supabaseClient
      .from("product_images")
      .select("id, product_id, src, position, alt_text")
      .eq("id", imageId)
      .maybeSingle();

    if (imageError || !image) {
      return new Response(
        JSON.stringify({ error: "Image not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (image.alt_text && image.alt_text.trim() !== "") {
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          message: "Image already has ALT text",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: product } = await supabaseClient
      .from("shopify_products")
      .select("title, description, product_type, category, sub_category, ai_color, ai_material")
      .eq("id", image.product_id)
      .maybeSingle();

    if (!product) {
      return new Response(
        JSON.stringify({ error: "Product not found for this image" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Generating ALT text for image ${image.position} of product: ${product.title}`);

    const textPrompt = `Generate a concise, SEO-optimized ALT text description for this product image (max 125 characters).

Product Context:
- Title: ${product.title}
- Description: ${product.description || "Not provided"}
- Type: ${product.product_type || "Not specified"}
- Category: ${product.category || "Not specified"}
- Sub-Category: ${product.sub_category || "Not specified"}
- Color: ${product.ai_color || "Not specified"}
- Material: ${product.ai_material || "Not specified"}
- Image Position: ${image.position} (1 = main image, 2+ = additional views)

Generate ALT text that:
1. Is descriptive and natural (not keyword stuffing)
2. Includes the product type and key attributes
3. Includes color and material
4. Is exactly 125 characters or less
5. Is suitable for accessibility and SEO

Provide response in JSON format only:
{
  "alt_text": "Your generated ALT text here"
}`;

    const textResponse = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${deepseekApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert specializing in product ALT text. Always respond with valid JSON only."
            },
            {
              role: "user",
              content: textPrompt,
            },
          ],
          max_tokens: 150,
          temperature: 0.3,
        }),
      }
    );

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      throw new Error(`DeepSeek API error: ${textResponse.statusText} - ${errorText}`);
    }

    const textData = await textResponse.json();
    const textContent = textData.choices[0].message.content;

    let altText = "";
    try {
      const parsed = JSON.parse(textContent);
      altText = parsed.alt_text || "";
    } catch (e) {
      console.error("Failed to parse JSON, using raw content:", textContent);
      altText = textContent.substring(0, 125);
    }

    if (altText.length > 125) {
      altText = altText.substring(0, 122) + "...";
    }

    if (!altText || altText.trim() === "") {
      altText = `${product.title} - Image ${image.position}`.substring(0, 125);
    }

    const { error: updateError } = await supabaseClient
      .from("product_images")
      .update({ alt_text: altText })
      .eq("id", imageId);

    if (updateError) {
      throw updateError;
    }

    console.log(`ALT text generated for image ${imageId}: ${altText}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "ALT text generated successfully",
        data: {
          image_id: imageId,
          alt_text: altText,
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