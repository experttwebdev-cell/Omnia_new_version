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

async function callDeepSeek(messages: any[], maxTokens = 800) {
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
      temperature: 0.3,
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

    console.log(`Enriching product with DeepSeek: ${product.title}`);

    const cleanDescription = product.description
      ? product.description
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : 'No description provided';

    const textAnalysisPrompt = `You are a product enrichment AI expert. Analyze the following product information and extract structured data.

Product Title: ${product.title}
Product Description: ${cleanDescription}
Product Type: ${product.product_type || 'Not specified'}
Vendor: ${product.vendor || 'Not specified'}

Extract and provide the following in JSON format:
{
  "category": "Main product category (e.g., 'Table basse', 'Canapé', 'Chaise')",
  "sub_category": "Detailed sub-category with material OR functionality (e.g., 'Table basse bois', 'Table basse design', 'Canapé convertible cuir')",
  "color": "Main color of the product (always provide if visible or mentioned)",
  "material": "Primary material (if mentioned)",
  "style": "Product style (e.g., 'Modern', 'Scandinavian', 'Industrial', 'Classic', 'Rustic')",
  "room": "Typical room usage (e.g., 'Living Room', 'Bedroom', 'Dining Room', 'Office', 'Kitchen')",
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
  "keywords": ["array", "of", "relevant", "keywords", "for", "tags"],
  "ai_vision_analysis": "Write a detailed, engaging product description (3-4 sentences) that highlights key features, materials, style, and benefits. Make it compelling and informative.",
  "dimensions_text": "Complete human-readable dimensions text (e.g., 'Length: 120 cm, Width: 80 cm, Height: 45 cm, Seat height: 40 cm') or empty string if no dimensions found"
}

IMPORTANT INSTRUCTIONS:
- category: The base product type in the same language as the title (e.g., "Table basse", "Canapé", "Lit")
- sub_category: The category PLUS the material OR key functionality (e.g., "Table basse bois" or "Table basse relevable")
- style: Infer the design style (Modern, Scandinavian, Industrial, Classic, Rustic, Minimalist, Contemporary, etc.)
- room: Infer typical usage room (Living Room, Bedroom, Dining Room, Office, Kitchen, Bathroom, etc.)
- ai_vision_analysis: Write a rich, detailed description that would convince a customer to buy. Include materials, dimensions if mentioned, style characteristics, and practical benefits. Use the same language as the product title.
- color & material: Extract from both title and description
- For dimensions with ranges (e.g., "82-98 cm"), provide both min and max values
- keywords: Extract 10-15 relevant SEO keywords from title and description
- dimensions_text: Create a complete, readable text of ALL dimensions found (length, width, height, depth, diameter, seat height, etc.) with units. Use the same language as the product title.
- Return ONLY valid JSON, no additional text.`;

    const textAnalysisResponse = await callDeepSeek([
      {
        role: "system",
        content: "You are a product data extraction expert. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: textAnalysisPrompt,
      },
    ], 1000);

    const textAnalysisContent = textAnalysisResponse.choices[0].message.content;
    let textAnalysis;

    try {
      textAnalysis = JSON.parse(textAnalysisContent);
    } catch (e) {
      console.error("Failed to parse text analysis JSON:", textAnalysisContent);
      textAnalysis = {
        color: "",
        material: "",
        style: "",
        room: "",
        keywords: [],
        ai_vision_analysis: "",
      };
    }

    let visionAnalysis: any = {};
    let imageInsights = "";

    if (images && images.length > 0) {
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

      if (openaiApiKey) {
        try {
          const imageContents = images.slice(0, 3).map((img: ImageData) => ({
            type: "image_url",
            image_url: {
              url: img.src,
            },
          }));

          const visionPrompt = `Analyze these product images and provide detailed visual insights in JSON format:
{
  "visual_description": "Detailed description of what you see (materials, colors, design, style)",
  "color_detected": "Main color detected",
  "material_detected": "Material detected from visual inspection",
  "style_detected": "Design style detected (Modern, Scandinavian, Industrial, etc.)",
  "additional_features": ["list", "of", "visible", "features"]
}

Provide response in the same language as this product: ${product.title}`;

          const visionResponse = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openaiApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "gpt-4o",
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
              imageInsights = visionAnalysis.visual_description || "";
            } catch (e) {
              console.error("Failed to parse vision analysis JSON:", visionContent);
              imageInsights = visionContent || "";
            }
          }
        } catch (error) {
          console.error("OpenAI Vision API error:", error);
        }
      }
    }

    const finalColor = visionAnalysis.color_detected || textAnalysis.color || "";
    const finalMaterial = visionAnalysis.material_detected || textAnalysis.material || "";
    const finalStyle = visionAnalysis.style_detected || textAnalysis.style || "";

    const allKeywords = [
      ...(textAnalysis.keywords || []),
      ...(visionAnalysis.additional_features || []),
    ];
    const uniqueKeywords = [...new Set(allKeywords)];
    const finalTags = uniqueKeywords.join(", ");

    const seoPrompt = `Generate SEO-optimized title and description for this product:

Product: ${product.title}
Description: ${cleanDescription}
Color: ${textAnalysis.color || ''}
Material: ${textAnalysis.material || ''}
Style: ${textAnalysis.style || ''}
Type: ${product.product_type || ''}
Category: ${textAnalysis.category || ''}

Generate compelling SEO content in the SAME LANGUAGE as the product title.

Provide response in JSON format:
{
  "seo_title": "SEO title (55-65 characters, include main keyword and benefit)",
  "seo_description": "SEO description (145-155 characters, include CTA and key features)"
}`;

    const seoResponse = await callDeepSeek([
      {
        role: "system",
        content: "You are an SEO expert. Generate compelling, keyword-rich SEO content. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: seoPrompt,
      },
    ], 500);

    let seoTitle = product.title;
    let seoDescription = product.description?.substring(0, 160) || "";

    const seoContent = seoResponse.choices[0].message.content;

    try {
      const seoParsed = JSON.parse(seoContent);
      seoTitle = seoParsed.seo_title || seoTitle;
      seoDescription = seoParsed.seo_description || seoDescription;
    } catch (e) {
      console.error("Failed to parse SEO JSON:", seoContent);
    }

    const confidenceScore = calculateConfidenceScore(
      textAnalysis,
      images?.length || 0
    );

    const finalAiVisionAnalysis = imageInsights
      ? `${textAnalysis.ai_vision_analysis || ""}\n\nVisual Analysis: ${imageInsights}`
      : textAnalysis.ai_vision_analysis || "";

    const updateData: any = {
      category: textAnalysis.category || "",
      sub_category: textAnalysis.sub_category || "",
      style: finalStyle,
      room: textAnalysis.room || "",
      seo_title: seoTitle,
      seo_description: seoDescription,
      tags: finalTags,
      ai_vision_analysis: finalAiVisionAnalysis,
      ai_color: finalColor,
      ai_material: finalMaterial,
      dimensions_text: textAnalysis.dimensions_text || "",
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
        message: "Product enriched successfully with DeepSeek",
        data: {
          seo_title: seoTitle,
          seo_description: seoDescription,
          tags: finalTags,
          ai_color: finalColor,
          ai_material: finalMaterial,
          style: finalStyle,
          room: textAnalysis.room || "",
          ai_vision_analysis: finalAiVisionAnalysis,
          dimensions_text: textAnalysis.dimensions_text || "",
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
  imageCount: number
): number {
  let score = 50;

  if (textAnalysis.color) score += 10;
  if (textAnalysis.material) score += 10;
  if (textAnalysis.style) score += 10;
  if (textAnalysis.room) score += 5;
  if (textAnalysis.keywords?.length > 0) score += 10;
  if (imageCount > 0) score += 5;

  return Math.min(100, score);
}
