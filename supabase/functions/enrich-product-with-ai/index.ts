import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EnrichmentRequest {
  productId: string;
}

interface ProductData {
  id: string;
  title: string;
  description: string;
  product_type: string;
  vendor: string;
}

interface ImageData {
  src: string;
  alt_text: string;
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

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { productId }: EnrichmentRequest = await req.json();

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
      .select("id, title, description, product_type, vendor, enrichment_status, last_enriched_at, updated_at, ai_color, ai_material")
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

    const hasBeenEnriched = product.enrichment_status === 'completed' && product.last_enriched_at;
    const hasDataChanged = product.updated_at && product.last_enriched_at &&
      new Date(product.updated_at) > new Date(product.last_enriched_at);

    if (hasBeenEnriched && !hasDataChanged) {
      console.log(`Skipping enrichment for product ${product.title} - already enriched and no changes detected`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          message: "Product already enriched and no changes detected"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: images } = await supabaseClient
      .from("product_images")
      .select("src, alt_text")
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .limit(5);

    console.log(`Enriching product: ${product.title}`);

    const textAnalysisPrompt = `You are a product enrichment AI expert. Analyze the following product information and extract structured data.

Product Title: ${product.title}
Product Description: ${product.description || 'No description provided'}
Product Type: ${product.product_type || 'Not specified'}
Vendor: ${product.vendor || 'Not specified'}

Extract and provide the following in JSON format:
{
  "category": "Main product category (e.g., 'Table basse', 'Canapé', 'Chaise')",
  "sub_category": "Detailed sub-category with material OR functionality (e.g., 'Table basse bois', 'Table basse design', 'Canapé convertible cuir')",
  "color": "Main color of the product (always provide if visible or mentioned)",
  "material": "Primary material (if mentioned)",
  "length": number or null,
  "length_unit": "cm, m, inches, etc.",
  "length_min": number or null (for ranges like 82-98 cm),
  "length_max": number or null (for ranges),
  "width": number or null,
  "width_unit": "unit",
  "width_min": number or null,
  "width_max": number or null,
  "height": number or null,
  "height_unit": "unit",
  "height_min": number or null,
  "height_max": number or null,
  "other_dimensions": {
    "seat_height": "value with unit if mentioned",
    "leg_height": "value with unit if mentioned",
    "armrest_height": "value with unit if mentioned",
    "depth": "value with unit if mentioned",
    "diameter": "value with unit if mentioned"
  },
  "keywords": ["array", "of", "relevant", "keywords", "for", "tags"]
}

IMPORTANT CATEGORY LOGIC:
- category: The base product type (e.g., if it's a wooden coffee table, category = "Table basse")
- sub_category: The category PLUS the material OR key functionality (e.g., "Table basse bois" or "Table basse relevable")
- If the product has both a material and functionality, prioritize material in sub_category
- Examples:
  * "Table basse en bois" → category: "Table basse", sub_category: "Table basse bois"
  * "Canapé convertible en cuir" → category: "Canapé", sub_category: "Canapé convertible cuir"
  * "Chaise de bureau ergonomique" → category: "Chaise", sub_category: "Chaise de bureau"
- For dimensions with ranges (e.g., "82-98 cm"), provide both min and max values
- Capture ALL dimension types including seat height, leg height, armrest height, depth, diameter
- Always try to detect color even if not explicitly stated
- Return valid JSON only.`;

    const textAnalysisResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a product data extraction expert. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: textAnalysisPrompt,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!textAnalysisResponse.ok) {
      throw new Error(`OpenAI API error: ${textAnalysisResponse.statusText}`);
    }

    const textAnalysisData = await textAnalysisResponse.json();
    const textAnalysisContent = textAnalysisData.choices[0].message.content;
    let textAnalysis;

    try {
      textAnalysis = JSON.parse(textAnalysisContent);
    } catch (e) {
      console.error("Failed to parse text analysis JSON:", textAnalysisContent);
      textAnalysis = {
        color: "",
        material: "",
        keywords: [],
      };
    }

    let visionAnalysis: any = {};
    let visionSynthesis = "";

    if (images && images.length > 0) {
      const imageContents = images.slice(0, 3).map((img: ImageData) => ({
        type: "image_url",
        image_url: {
          url: img.src,
        },
      }));

      const visionPrompt = `Analyze these product images and provide:
1. A complete visual synthesis (2-3 sentences describing what you see)
2. Main color detected
3. Material detected (if visible)
4. Visual characteristics not mentioned in the description
5. Additional keywords based on visual elements

Provide response in JSON format:
{
  "vision_synthesis": "Complete description of what you see",
  "color": "Main color detected",
  "material": "Material detected",
  "visual_characteristics": ["list", "of", "characteristics"],
  "visual_keywords": ["additional", "keywords"]
}`;

      const visionResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openaiApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: visionPrompt,
                  },
                  ...imageContents,
                ],
              },
            ],
            max_tokens: 500,
            temperature: 0.3,
          }),
        }
      );

      if (visionResponse.ok) {
        const visionData = await visionResponse.json();
        const visionContent = visionData.choices[0].message.content;

        try {
          visionAnalysis = JSON.parse(visionContent);
          visionSynthesis = visionAnalysis.vision_synthesis || "";
        } catch (e) {
          console.error("Failed to parse vision analysis JSON:", visionContent);
          visionSynthesis = visionContent || "";
        }
      }
    }

    const finalColor = visionAnalysis.color || textAnalysis.color || "";
    const finalMaterial = visionAnalysis.material || textAnalysis.material || "";

    const allKeywords = [
      ...(textAnalysis.keywords || []),
      ...(visionAnalysis.visual_keywords || []),
    ];
    const uniqueKeywords = [...new Set(allKeywords)];
    const finalTags = uniqueKeywords.join(", ");

    const seoPrompt = `Generate SEO-optimized title and description for this product:

Product: ${product.title}
Description: ${product.description || ''}
Color: ${finalColor}
Material: ${finalMaterial}
Type: ${product.product_type || ''}

Provide response in JSON format:
{
  "seo_title": "SEO title (60-70 characters)",
  "seo_description": "SEO description (150-160 characters)"
}`;

    const seoResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert. Generate compelling, keyword-rich SEO content. Always respond with valid JSON only.",
            },
            {
              role: "user",
              content: seoPrompt,
            },
          ],
          temperature: 0.5,
        }),
      }
    );

    let seoTitle = product.title;
    let seoDescription = product.description?.substring(0, 160) || "";

    if (seoResponse.ok) {
      const seoData = await seoResponse.json();
      const seoContent = seoData.choices[0].message.content;

      try {
        const seoParsed = JSON.parse(seoContent);
        seoTitle = seoParsed.seo_title || seoTitle;
        seoDescription = seoParsed.seo_description || seoDescription;
      } catch (e) {
        console.error("Failed to parse SEO JSON:", seoContent);
      }
    }

    const confidenceScore = calculateConfidenceScore(
      textAnalysis,
      visionAnalysis,
      images?.length || 0
    );

    const updateData: any = {
      category: textAnalysis.category || "",
      sub_category: textAnalysis.sub_category || "",
      seo_title: seoTitle,
      seo_description: seoDescription,
      tags: finalTags,
      ai_vision_analysis: visionSynthesis,
      ai_color: finalColor,
      ai_material: finalMaterial,
      ai_confidence_score: confidenceScore,
      enrichment_status: "enriched",
      last_enriched_at: new Date().toISOString(),
      seo_synced_to_shopify: false,
      enrichment_error: "",
    };

    if (textAnalysis.length) {
      updateData.length = textAnalysis.length;
      updateData.length_unit = textAnalysis.length_unit || "cm";
    }
    if (textAnalysis.width) {
      updateData.width = textAnalysis.width;
      updateData.width_unit = textAnalysis.width_unit || "cm";
    }
    if (textAnalysis.height) {
      updateData.height = textAnalysis.height;
      updateData.height_unit = textAnalysis.height_unit || "cm";
    }

    const extendedDimensions: any = {};
    if (textAnalysis.length_min && textAnalysis.length_max) {
      extendedDimensions.length_range = { min: textAnalysis.length_min, max: textAnalysis.length_max, unit: textAnalysis.length_unit || "cm" };
    }
    if (textAnalysis.width_min && textAnalysis.width_max) {
      extendedDimensions.width_range = { min: textAnalysis.width_min, max: textAnalysis.width_max, unit: textAnalysis.width_unit || "cm" };
    }
    if (textAnalysis.height_min && textAnalysis.height_max) {
      extendedDimensions.height_range = { min: textAnalysis.height_min, max: textAnalysis.height_max, unit: textAnalysis.height_unit || "cm" };
    }

    if (textAnalysis.other_dimensions && Object.keys(textAnalysis.other_dimensions).length > 0) {
      Object.assign(extendedDimensions, textAnalysis.other_dimensions);
    }

    if (Object.keys(extendedDimensions).length > 0) {
      updateData.other_dimensions = extendedDimensions;
    }

    const { error: updateError } = await supabaseClient
      .from("shopify_products")
      .update(updateData)
      .eq("id", productId);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product enriched successfully",
        data: {
          seo_title: seoTitle,
          seo_description: seoDescription,
          tags: finalTags,
          ai_color: finalColor,
          ai_material: finalMaterial,
          ai_confidence_score: confidenceScore,
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

function calculateConfidenceScore(
  textAnalysis: any,
  visionAnalysis: any,
  imageCount: number
): number {
  let score = 50;

  if (textAnalysis.color) score += 10;
  if (textAnalysis.material) score += 10;
  if (textAnalysis.keywords?.length > 0) score += 10;

  if (imageCount > 0) score += 5;
  if (visionAnalysis.color) score += 5;
  if (visionAnalysis.material) score += 5;
  if (visionAnalysis.visual_keywords?.length > 0) score += 5;

  return Math.min(100, score);
}