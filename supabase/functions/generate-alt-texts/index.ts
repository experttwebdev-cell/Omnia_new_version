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

    const contextParts = [];
    if (product.product_type) contextParts.push(product.product_type);
    if (product.ai_color) contextParts.push(product.ai_color);
    if (product.ai_material) contextParts.push(product.ai_material);

    const textPrompt = `Tu es un expert en accessibilité web et SEO. Génère un texte ALT descriptif et naturel pour cette image de produit.

PRODUIT:
Titre: ${product.title}
Type: ${product.product_type || "meuble"}
Catégorie: ${product.category || ""}
Sous-catégorie: ${product.sub_category || ""}
Couleur: ${product.ai_color || ""}
Matière: ${product.ai_material || ""}
Position: ${image.position === 1 ? "Image principale" : `Vue supplémentaire ${image.position}`}

INSTRUCTIONS:
- Maximum 125 caractères
- Commence DIRECTEMENT par le type de produit (ex: "Canapé", "Table", "Chaise")
- Inclus les caractéristiques principales: couleur, matière, style
- Sois naturel et descriptif, pas de phrases marketing
- Évite les mots inutiles comme "Image de", "Photo de", "Produit"

EXEMPLES CORRECTS:
"Canapé d'angle convertible Nevada en tissu gris avec rangement et têtières réglables"
"Table basse ronde en bois massif finition naturelle avec pieds métal noir"
"Chaise de salle à manger velours bleu marine avec pieds en chêne clair"

Réponds UNIQUEMENT avec ce format JSON:
{
  "alt_text": "ton texte ici"
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
              content: "Tu es un expert en accessibilité web et SEO pour e-commerce. Tu génères des textes ALT descriptifs et naturels en français. Réponds toujours en JSON valide."
            },
            {
              role: "user",
              content: textPrompt,
            },
          ],
          max_tokens: 100,
          temperature: 0.4,
        }),
      }
    );

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      throw new Error(`DeepSeek API error: ${textResponse.statusText} - ${errorText}`);
    }

    const textData = await textResponse.json();
    const textContent = textData.choices[0].message.content.trim();

    let altText = "";

    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        altText = parsed.alt_text || "";
      } else {
        altText = textContent;
      }
    } catch (e) {
      console.log("Failed to parse JSON, using raw content");
      altText = textContent;
    }

    altText = altText
      .replace(/^["']|["']$/g, '')
      .replace(/^(Image de|Photo de|Produit|Image|Photo)[\s:]+/i, '')
      .trim();

    if (altText.length > 125) {
      const lastSpace = altText.substring(0, 122).lastIndexOf(' ');
      altText = altText.substring(0, lastSpace > 100 ? lastSpace : 122) + "...";
    }

    if (!altText || altText.length < 10) {
      const titleParts = [product.product_type || "Produit"];
      if (product.ai_color) titleParts.push(product.ai_color);
      if (product.ai_material) titleParts.push(product.ai_material);
      altText = titleParts.join(' ').substring(0, 125);
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