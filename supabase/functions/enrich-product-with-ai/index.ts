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

interface DeepSeekMessage {
  role: string;
  content: string;
}

async function callDeepSeek(
  messages: DeepSeekMessage[],
  maxTokens = 800
): Promise<any> {
  const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
  if (!deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY not configured");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("DeepSeek API error:", errorText);
    throw new Error(`DeepSeek API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

function calculateConfidenceScore(
  textAnalysis: any,
  imageCount: number
): number {
  let score = 50;
  if (textAnalysis.category) score += 10;
  if (textAnalysis.material) score += 10;
  if (textAnalysis.style) score += 10;
  if (imageCount > 0) score += 20;
  return Math.min(score, 100);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { productId }: EnrichmentRequest = await req.json();

    const { data: product, error: productError } = await supabaseClient
      .from("shopify_products")
      .select("id, title, description, product_type, vendor, enrichment_status, last_enriched_at, updated_at, ai_color, ai_material, ai_vision_analysis")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !product) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Product not found",
          details: productError,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!product.title) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Product title is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: images } = await supabaseClient
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .limit(5);

    console.log(`Enriching product with DeepSeek: ${product.title}`);

    // Clean description and remove quantity mentions
    let cleanDescription = product.description
      ? product.description
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : 'No description provided';

    // Remove quantity patterns like "lot de X", "set of X", "pack de X", etc.
    cleanDescription = cleanDescription
      .replace(/\b(lot|set|pack|ensemble|coffret)\s+(de\s+)?(\d+)\s+/gi, '')
      .replace(/\b(\d+)\s+(pièces?|pieces?|items?|unités?|units?)\s+/gi, '')
      .replace(/\bquantité\s*:\s*\d+\s*/gi, '')
      .replace(/\bquantity\s*:\s*\d+\s*/gi, '')
      .trim();

    const textAnalysisPrompt = `You are a product enrichment AI expert. Analyze the following product information and extract structured data.

Product Title: ${product.title}
Product Description: ${cleanDescription}
Product Type: ${product.product_type || 'Not specified'}
Vendor: ${product.vendor || 'Not specified'}

CRITICAL: IGNORE all quantity mentions (lot de X, set of X, pack, etc.). Focus ONLY on the individual product attributes.

Extract and provide the following in JSON format:
{
  "category": "Main product category (e.g., 'Table basse', 'Canapé', 'Chaise')",
  "sub_category": "Detailed sub-category with material OR functionality (e.g., 'Table basse bois', 'Table basse design', 'Canapé convertible cuir')",
  "functionality": "Key functionality or type (e.g., 'Convertible', '3 places', 'Relevable', 'Avec rangement', 'Modulable', 'Extensible')",
  "characteristics": "Comma-separated list of technical characteristics from description (e.g., 'Déhoussable, Pieds réglables, Résistant aux UV, Facile d'entretien, Traitement anti-taches')",
  "material": "Primary material (if mentioned)",
  "style": "Product style in the same language as the title (e.g., 'Moderne', 'Scandinave', 'Industriel', 'Classique', 'Rustique')",
  "room": "Typical usage room in the same language as the title (e.g., 'Salon', 'Chambre', 'Salle à manger', 'Bureau', 'Cuisine')",
  "color": "Primary color if mentioned",
  "google_product_category": "Full Google Shopping category path in English (e.g., 'Home & Garden > Furniture > Sofas', 'Home & Garden > Furniture > Tables > Coffee Tables')",
  "keywords": ["array", "of", "relevant", "keywords", "for", "tags"],
  "dimensions_text": "Complete human-readable dimensions text extracting ALL dimensions found (e.g., 'Longueur: 120 cm, Largeur: 80 cm, Hauteur: 45 cm, Profondeur: 60 cm, Hauteur d'assise: 42 cm'). Include ALL dimensions mentioned.",
  "dimensions_source": "title, description, or ai_inference"
}

IMPORTANT INSTRUCTIONS:
- category: The base product type in the same language as the title (e.g., "Table basse", "Canapé", "Lit")
- sub_category: The category PLUS the material OR key functionality (e.g., "Table basse bois" or "Table basse relevable")
- functionality: Extract key functionality like "Convertible", "3 places", "Modulable", "Avec rangement", "Extensible", "Relevable", etc.
- characteristics: Extract ALL technical characteristics from description: "Déhoussable, Pieds réglables, Résistant aux UV, Facile d'entretien, etc."
- style: Infer the design style in the same language as the title (e.g., for French: "Moderne", "Scandinave", "Industriel", "Classique", "Rustique", "Minimaliste", "Contemporain")
- room: Infer typical usage room in the same language as the title (e.g., for French: "Salon", "Chambre", "Salle à manger", "Bureau", "Cuisine", "Salle de bain")
- google_product_category: MUST be a valid Google Shopping category with full path. Use English. Examples: "Home & Garden > Furniture > Sofas", "Home & Garden > Furniture > Tables > Coffee Tables", "Home & Garden > Decor > Mirrors", "Home & Garden > Lighting > Lamps"
- material: Extract from title and description

CRITICAL - EXTRACT ALL DIMENSIONS:
1. Extract EVERY dimension mentioned in title AND description (numbers + units: cm, m, inches, mm, kg, g, lb)
2. Look for ALL patterns: "120x80", "120 x 80", "L120 x W80 x H45", "Ø60", "H.45", "hauteur d'assise 42 cm"
3. French terms: Longueur (length), Largeur (width), Hauteur (height), Profondeur (depth), Diamètre (diameter), Poids (weight), Hauteur d'assise (seat height), Épaisseur (thickness)
4. English terms: Length, Width, Height, Depth, Diameter, Weight, Seat height, Thickness
5. Extract ranges: "82-98 cm" → use max value (98)
6. ALWAYS specify unit found (cm, m, inches, kg, g, lb)
7. dimensions_source: "title" if in title, "description" if in description, "ai_inference" if inferred
8. dimensions_text: Include ALL dimensions in readable format: "Longueur: 120 cm, Largeur: 80 cm, Hauteur: 45 cm, Profondeur: 60 cm, Hauteur d'assise: 42 cm"

- keywords: Extract 10-15 relevant SEO keywords from title and description
- Return ONLY valid JSON, no additional text.`;

    console.log("Calling DeepSeek API for text analysis...");
    const textAnalysisResponse = await callDeepSeek([
      {
        role: "system",
        content: "You are a product data extraction expert. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: textAnalysisPrompt,
      },
    ], 800);

    const textContent = textAnalysisResponse.choices[0].message.content;
    console.log("DeepSeek text analysis response:", textContent);

    let textAnalysis: any = {};
    try {
      let jsonContent = textContent;
      const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
        console.log("Extracted JSON from markdown block");
      }

      textAnalysis = JSON.parse(jsonContent);
      console.log("✅ Text analysis parsed successfully");
    } catch (e) {
      console.error("Failed to parse text analysis JSON:", textContent);
      console.error("Parse error:", e);
      textAnalysis = {};
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    let visionResult = { visionAnalysis: {}, imageInsights: "" };

    (async () => {
      try {
        if (!openaiApiKey) {
          console.log("⚠️ OPENAI_API_KEY not configured, skipping Vision API");
          return;
        }

        if (!images || images.length === 0) {
          console.log("⚠️ No images available for Vision analysis");
          return;
        }

        console.log(`Found ${images.length} images for Vision analysis`);

        const imageContents = await Promise.all(images.slice(0, 3).map(async (img: any) => {
          try {
            const imageUrl = img.src;
            console.log("Fetching image:", imageUrl);

            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
              console.error(`Failed to fetch image: ${imageResponse.status}`);
              return null;
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = btoa(
              String.fromCharCode(...new Uint8Array(imageBuffer))
            );

            return {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            };
          } catch (error) {
            console.error("Error processing image:", error);
            return null;
          }
        }));

        const validImageContents = imageContents.filter((img) => img !== null);

        if (validImageContents.length === 0) {
          console.log("⚠️ No valid images could be processed");
          return;
        }

        console.log("Processing", imageContents.length, "images for vision analysis");

        const visionPrompt = `CRITICAL INSTRUCTIONS:
You are analyzing product images ONLY. You have NO context about the product title, description, or packaging.
You are looking at ONE SINGLE ITEM in the image(s).

ABSOLUTE RULES:
1. Analyze ONLY what is PHYSICALLY VISIBLE in the image
2. Describe ONE SINGLE UNIT (the item itself, not packaging or quantity)
3. NEVER infer or guess quantity from context
4. NEVER mention "lot", "set", "pack", "ensemble", numbers like "4 pieces", etc.
5. NEVER name the object type (don't say "sofa", "table", "chair", "bar stool")
6. ONLY describe: colors, textures, materials, finishes, visual style

Respond in JSON (in French):
{
  "visual_description": "Brief description (1-2 sentences) of VISUAL ATTRIBUTES of ONE SINGLE UNIT: dominant colors, visible textures, finishes, shape (WITHOUT naming the object)",
  "color_detected": "Main color(s) observed on the item",
  "material_detected": "Visible material(s): bois, métal, tissu, cuir, verre, plastique",
  "style_detected": "Visual style: Moderne, Scandinave, Industriel, Classique, Contemporain, Minimaliste",
  "additional_features": ["visible textures", "finishes", "details"]
}

✅ CORRECT: "Tissu gris clair rembourré, structure en métal noir mat, lignes épurées et design minimaliste"
❌ WRONG: "Lot de 4 chaises de bar"
❌ WRONG: "Ensemble de chaises"
❌ WRONG: "Pack de tabourets"
❌ WRONG: "Set of 2 chairs"`;

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
              max_tokens: 200,
              temperature: 0.3,
            }),
          }
        );

        console.log("Vision API response status:", visionResponse.status);

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const visionContent = visionData.choices[0].message.content;

          console.log("Vision API raw response:", visionContent);

          try {
            let jsonContent = visionContent;
            const jsonMatch = visionContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
              jsonContent = jsonMatch[1];
              console.log("Extracted JSON from markdown block");
            }

            visionResult.visionAnalysis = JSON.parse(jsonContent);
            visionResult.imageInsights = visionResult.visionAnalysis.visual_description || "";

            console.log("✅ Vision analysis parsed successfully");
            console.log("Color detected:", visionResult.visionAnalysis.color_detected || "EMPTY");
            console.log("Material detected:", visionResult.visionAnalysis.material_detected || "EMPTY");
            console.log("Style detected:", visionResult.visionAnalysis.style_detected || "EMPTY");
          } catch (parseError) {
            console.error("Failed to parse Vision JSON:", visionContent);
            console.error("Parse error:", parseError);
          }
        } else {
          const errorText = await visionResponse.text();
          console.error("Vision API error:", errorText);
        }
      } catch (error) {
        console.error("Vision processing error:", error);
      }
    })();

    const seoPrompt = `Generate SEO-optimized title and meta description for this product:

Product: ${product.title}
Category: ${textAnalysis.category || ''}
Material: ${textAnalysis.material || ''}
Color: ${textAnalysis.color || ''}
Style: ${textAnalysis.style || ''}
Room: ${textAnalysis.room || ''}
Key Features: ${cleanDescription.substring(0, 300)}

CRITICAL INSTRUCTIONS:
1. seo_title: 50-60 characters, include category + material/style + ONE key benefit
2. seo_description: 140-155 characters, natural text with key features + subtle CTA
3. Language: Use the SAME LANGUAGE as the product title (French if title is French, English if English)
4. DON'T repeat the exact product title - enhance it with keywords
5. Include the main category, material or style, and key benefit
6. Make it SEO-friendly but human-readable
7. Add selling points like "Livraison rapide" or "Qualité premium" ONLY if space allows
8. NEVER include quantity mentions (lot, set, pack, ensemble, X pièces, etc.) - focus on the individual product

Return ONLY valid JSON:
{
  "seo_title": "Enhanced SEO-optimized title",
  "seo_description": "Natural, keyword-rich meta description with subtle CTA"
}`;

    const seoPromise = callDeepSeek([
      {
        role: "system",
        content: "You are an SEO expert. Generate compelling titles and descriptions. Always respond with valid JSON only.",
      },
      {
        role: "user",
        content: seoPrompt,
      },
    ], 200);

    const [seoResponse] = await Promise.all([seoPromise]);

    console.log("Parallel API calls completed");

    const { visionAnalysis, imageInsights } = visionResult;

    // Conserver les valeurs existantes si Vision n'a rien retourné
    const visionColor = visionAnalysis.color_detected || "";
    const finalColor = visionColor || product.ai_color || "";
    const finalMaterial = visionAnalysis.material_detected || textAnalysis.material || "";
    const finalStyle = visionAnalysis.style_detected || textAnalysis.style || "";

    const visionDescription = imageInsights || visionAnalysis.visual_description || "";
    const finalAiVisionAnalysis = visionDescription || product.ai_vision_analysis || "";

    console.log("=== Final Values ===");
    console.log("Vision Color returned:", visionColor || "EMPTY");
    console.log("Final Color (with fallback):", finalColor);
    console.log("Final Material:", finalMaterial);
    console.log("Final Style:", finalStyle);
    console.log("Vision Description returned:", visionDescription || "EMPTY");
    console.log("Final AI Vision Analysis (with fallback):", finalAiVisionAnalysis.substring(0, 100) + "...");
    console.log("Google Brand (from vendor):", product.vendor || "");

    const allKeywords = [
      ...(textAnalysis.keywords || []),
      ...(visionAnalysis.additional_features || []),
    ];
    const uniqueKeywords = [...new Set(allKeywords)];
    const finalTags = uniqueKeywords.join(", ");

    let seoTitle = product.title;
    let seoDescription = cleanDescription.substring(0, 160) || "";

    const seoContent = seoResponse.choices[0].message.content;

    try {
      let jsonContent = seoContent;
      const jsonMatch = seoContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      const seoParsed = JSON.parse(jsonContent);
      seoTitle = seoParsed.seo_title || seoTitle;
      seoDescription = seoParsed.seo_description || seoDescription;
    } catch (e) {
      console.error("Failed to parse SEO JSON:", seoContent);
    }

    const confidenceScore = calculateConfidenceScore(
      textAnalysis,
      images?.length || 0
    );

    const enrichmentData = {
      category: textAnalysis.category || "",
      sub_category: textAnalysis.sub_category || "",
      functionality: textAnalysis.functionality || "",
      characteristics: textAnalysis.characteristics || "",
      google_product_category: textAnalysis.google_product_category || "",
      google_brand: product.vendor || "",
      seo_title: seoTitle,
      seo_description: seoDescription,
      tags: finalTags,
      ai_vision_analysis: finalAiVisionAnalysis,
      ai_color: finalColor,
      ai_material: finalMaterial,
      style: finalStyle,
      room: textAnalysis.room || "",
      dimensions_text: textAnalysis.dimensions_text || null,
      dimensions_source: textAnalysis.dimensions_source || null,
      enrichment_status: "completed",
      confidence_score: confidenceScore,
      last_enriched_at: new Date().toISOString(),
    };

    console.log("Updating product with enrichment data...");

    const { error: updateError } = await supabaseClient
      .from("shopify_products")
      .update(enrichmentData)
      .eq("id", productId);

    if (updateError) {
      console.error("Failed to update product:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update product",
          details: updateError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Product enriched successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product enriched successfully",
        data: enrichmentData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error enriching product:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});