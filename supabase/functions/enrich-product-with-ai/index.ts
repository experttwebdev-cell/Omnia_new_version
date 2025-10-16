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

  console.log("=== Enrichment request started ===");

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { productId }: EnrichmentRequest = await req.json();
    console.log("Product ID:", productId);

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Fetching product from database...");
    const { data: product, error: productError } = await supabaseClient
      .from("shopify_products")
      .select("id, title, description, product_type, vendor, enrichment_status, last_enriched_at, updated_at, ai_color, ai_material")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !product) {
      console.error("Product not found:", productError);
      return new Response(
        JSON.stringify({ error: "Product not found", details: productError?.message }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Product found:", product.title);

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
  "functionality": "Key functionality or type (e.g., 'Convertible', '3 places', 'Relevable', 'Avec rangement', 'Modulable', 'Extensible')",
  "characteristics": "Comma-separated list of technical characteristics from description (e.g., 'Déhoussable, Pieds réglables, Résistant aux UV, Facile d'entretien, Traitement anti-taches')",
  "material": "Primary material (if mentioned)",
  "style": "Product style in the same language as the title (e.g., 'Moderne', 'Scandinave', 'Industriel', 'Classique', 'Rustique')",
  "room": "Typical room usage in the same language as the title (e.g., 'Salon', 'Chambre', 'Salle à manger', 'Bureau', 'Cuisine')",
  "google_product_category": "Google Shopping Product Category with full path (e.g., 'Home & Garden > Furniture > Sofas', 'Home & Garden > Furniture > Tables > Coffee Tables', 'Furniture > Living Room Furniture > Sofas & Sectionals')",
  "smart_length": number or null,
  "smart_length_unit": "cm, m, inches, etc.",
  "smart_width": number or null,
  "smart_width_unit": "unit",
  "smart_height": number or null,
  "smart_height_unit": "unit",
  "smart_depth": number or null,
  "smart_depth_unit": "unit",
  "smart_diameter": number or null (for round items like tables, plates, etc.),
  "smart_diameter_unit": "unit",
  "smart_weight": number or null,
  "smart_weight_unit": "kg, g, lb, etc.",
  "smart_seat_height": number or null (hauteur d'assise pour chaises/canapés),
  "smart_seat_height_unit": "unit",
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

    console.log("DeepSeek response received");
    const textAnalysisContent = textAnalysisResponse.choices[0].message.content;
    console.log("Response content length:", textAnalysisContent.length);
    console.log("RAW DEEPSEEK RESPONSE:", textAnalysisContent);

    let textAnalysis;

    try {
      let jsonContent = textAnalysisContent;
      const jsonMatch = textAnalysisContent.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
        console.log("Extracted JSON from markdown block");
      }

      textAnalysis = JSON.parse(jsonContent);
      console.log("Text analysis parsed successfully");
      console.log("Extracted data:", JSON.stringify(textAnalysis, null, 2));
    } catch (e) {
      console.error("Failed to parse text analysis JSON. Error:", e);
      console.error("Content that failed to parse:", textAnalysisContent);
      textAnalysis = {
        category: "",
        sub_category: "",
        material: "",
        style: "",
        room: "",
        google_product_category: "",
        keywords: [],
        smart_length: null,
        smart_width: null,
        smart_height: null,
        dimensions_text: "",
        dimensions_source: ""
      };
    }

    console.log("Starting parallel API calls (Vision + SEO)...");

    const visionPromise = (async () => {
      let visionAnalysis: any = {};
      let imageInsights = "";

      console.log("=== Vision Analysis Start ===");
      console.log("Images count:", images?.length || 0);

      if (images && images.length > 0) {
        const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
        console.log("OpenAI API Key present:", !!openaiApiKey);

        if (openaiApiKey) {
          try {
            const imageContents = images.slice(0, 3).map((img: ImageData) => ({
              type: "image_url",
              image_url: {
                url: img.src,
              },
            }));

            console.log("Processing", imageContents.length, "images for vision analysis");

            const visionPrompt = `TÂCHE : Analyser les ATTRIBUTS VISUELS uniquement (couleur, texture, matériau, style).

INTERDIT :
- Ne nomme JAMAIS le type d'objet (ne dis pas "canapé", "table", "chaise", etc.)
- Ne mentionne JAMAIS la fonction de l'objet
- Décris UNIQUEMENT ce que tu VOIS : couleurs, textures, matériaux, formes, finitions

Réponds en JSON (français) :
{
  "visual_description": "Courte description (1-2 phrases) des ATTRIBUTS VISUELS : couleurs dominantes, textures visibles, finitions, forme générale (sans nommer l'objet)",
  "color_detected": "Couleur(s) principale(s) observée(s)",
  "material_detected": "Matériau(x) visible(s) : bois, métal, tissu, cuir, verre, plastique",
  "style_detected": "Style visuel : Moderne, Scandinave, Industriel, Classique, Contemporain, Minimaliste",
  "additional_features": ["textures", "finitions", "détails", "visibles"]
}

EXEMPLE CORRECT : "Tissu gris clair avec texture mate, structure en bois clair avec finition naturelle, lignes épurées et angles droits"
EXEMPLE INCORRECT : "Canapé moderne en tissu gris" ❌`;

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

                visionAnalysis = JSON.parse(jsonContent);
                imageInsights = visionAnalysis.visual_description || "";

                console.log("✅ Vision analysis parsed successfully");
                console.log("Color detected:", visionAnalysis.color_detected);
                console.log("Material detected:", visionAnalysis.material_detected);
                console.log("Style detected:", visionAnalysis.style_detected);
              } catch (e) {
                console.error("❌ Failed to parse vision analysis JSON:", e);
                console.error("Content that failed:", visionContent);
                imageInsights = visionContent || "";
              }
            } else {
              const errorText = await visionResponse.text();
              console.error("❌ Vision API error:", visionResponse.status, errorText);
            }
          } catch (error) {
            console.error("❌ OpenAI Vision API error:", error);
          }
        } else {
          console.warn("⚠️ OpenAI API Key not configured - skipping vision analysis");
        }
      } else {
        console.warn("⚠️ No images available for vision analysis");
      }

      console.log("=== Vision Analysis End ===");
      return { visionAnalysis, imageInsights };
    })();

    const seoPrompt = `Generate SEO-optimized title and meta description for this product:

Product: ${product.title}
Category: ${textAnalysis.category || ''}
Functionality: ${textAnalysis.functionality || ''}
Material: ${textAnalysis.material || ''}
Color: ${textAnalysis.color || ''}
Style: ${textAnalysis.style || ''}
Room: ${textAnalysis.room || ''}
Key Features: ${cleanDescription.substring(0, 300)}

CRITICAL INSTRUCTIONS:
1. seo_title: 50-60 characters, include category + main keyword + ONE key benefit (e.g., "Canapé d'angle convertible 5 places - Confort & Design Moderne")
2. seo_description: 140-155 characters, natural text with key features + subtle CTA
3. Language: Use the SAME LANGUAGE as the product title (French if title is French, English if English)
4. DON'T repeat the exact product title - enhance it with keywords
5. Include the main category, material or style, and key benefit
6. Make it SEO-friendly but human-readable
7. Add selling points like "Livraison rapide" or "Qualité premium" ONLY if space allows

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
    ], 300);

    const [visionResult, seoResponse] = await Promise.all([visionPromise, seoPromise]);

    console.log("Parallel API calls completed");

    const { visionAnalysis, imageInsights } = visionResult;
    const finalColor = visionAnalysis.color_detected || "";
    const finalMaterial = visionAnalysis.material_detected || textAnalysis.material || "";
    const finalStyle = visionAnalysis.style_detected || textAnalysis.style || "";

    console.log("=== Final Values ===");
    console.log("Final Color:", finalColor);
    console.log("Final Material:", finalMaterial);
    console.log("Final Style:", finalStyle);
    console.log("Final AI Vision Analysis:", imageInsights || visionAnalysis.visual_description || "");
    console.log("Google Brand (from vendor):", product.vendor || "");

    const allKeywords = [
      ...(textAnalysis.keywords || []),
      ...(visionAnalysis.additional_features || []),
    ];
    const uniqueKeywords = [...new Set(allKeywords)];
    const finalTags = uniqueKeywords.join(", ");

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

    const finalAiVisionAnalysis = imageInsights || visionAnalysis.visual_description || "";

    const updateData: any = {
      category: textAnalysis.category || "",
      sub_category: textAnalysis.sub_category || "",
      functionality: textAnalysis.functionality || "",
      characteristics: textAnalysis.characteristics || "",
      style: finalStyle,
      room: textAnalysis.room || "",
      google_product_category: textAnalysis.google_product_category || "",
      google_brand: product.vendor || "",
      seo_title: seoTitle,
      seo_description: seoDescription,
      tags: finalTags,
      ai_vision_analysis: finalAiVisionAnalysis,
      ai_color: finalColor,
      ai_material: finalMaterial,
      ai_confidence_score: confidenceScore,
      enrichment_status: "enriched",
      last_enriched_at: new Date().toISOString(),
      seo_synced_to_shopify: false,
      enrichment_error: "",
    };

    if (textAnalysis.smart_length) {
      updateData.smart_length = textAnalysis.smart_length;
      updateData.smart_length_unit = textAnalysis.smart_length_unit || "cm";
    }
    if (textAnalysis.smart_width) {
      updateData.smart_width = textAnalysis.smart_width;
      updateData.smart_width_unit = textAnalysis.smart_width_unit || "cm";
    }
    if (textAnalysis.smart_height) {
      updateData.smart_height = textAnalysis.smart_height;
      updateData.smart_height_unit = textAnalysis.smart_height_unit || "cm";
    }
    if (textAnalysis.smart_depth) {
      updateData.smart_depth = textAnalysis.smart_depth;
      updateData.smart_depth_unit = textAnalysis.smart_depth_unit || "cm";
    }
    if (textAnalysis.smart_diameter) {
      updateData.smart_diameter = textAnalysis.smart_diameter;
      updateData.smart_diameter_unit = textAnalysis.smart_diameter_unit || "cm";
    }
    if (textAnalysis.smart_weight) {
      updateData.smart_weight = textAnalysis.smart_weight;
      updateData.smart_weight_unit = textAnalysis.smart_weight_unit || "kg";
    }
    if (textAnalysis.smart_seat_height) {
      updateData.smart_seat_height = textAnalysis.smart_seat_height;
      updateData.smart_seat_height_unit = textAnalysis.smart_seat_height_unit || "cm";
    }
    if (textAnalysis.dimensions_text) {
      updateData.dimensions_text = textAnalysis.dimensions_text;
    }
    if (textAnalysis.dimensions_source) {
      updateData.dimensions_source = textAnalysis.dimensions_source;
    }

    console.log("Updating product in database...");
    console.log("Update data keys:", Object.keys(updateData));
    console.log("Sample update data:", {
      category: updateData.category,
      sub_category: updateData.sub_category,
      smart_length: updateData.smart_length,
      dimensions_text: updateData.dimensions_text,
      seo_title: updateData.seo_title
    });

    const { error: updateError } = await supabaseClient
      .from("shopify_products")
      .update(updateData)
      .eq("id", productId);

    if (updateError) {
      console.error("Error updating product:", updateError);
      throw updateError;
    }

    console.log("Product updated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product enriched successfully",
        enrichment: {
          category: textAnalysis.category || "",
          sub_category: textAnalysis.sub_category || "",
          seo_title: seoTitle,
          seo_description: seoDescription,
          tags: finalTags,
          ai_color: finalColor,
          ai_material: finalMaterial,
          style: finalStyle,
          room: textAnalysis.room || "",
          ai_vision_analysis: finalAiVisionAnalysis,
          ai_confidence_score: confidenceScore,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error enriching product:", error);

    let errorMessage = "An unknown error occurred";
    let errorDetails = "";

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || "";
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      errorMessage = JSON.stringify(error);
    }

    console.error("Error message:", errorMessage);
    console.error("Error details:", errorDetails);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        details: errorDetails.substring(0, 500),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function calculateConfidenceScore(
  analysis: any,
  imageCount: number
): number {
  let score = 0;

  if (analysis.category) score += 20;
  if (analysis.sub_category) score += 15;
  if (analysis.material) score += 10;
  if (analysis.style) score += 10;
  if (analysis.room) score += 10;

  if (imageCount > 0) score += Math.min(imageCount * 5, 20);

  if (analysis.smart_length || analysis.smart_width || analysis.smart_height) {
    score += 15;
  }

  return Math.min(score, 100);
}
