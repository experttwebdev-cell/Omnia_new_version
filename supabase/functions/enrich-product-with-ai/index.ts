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

function parseAIResponse(responseContent: string): any {
  console.log("🔧 Parsing AI response...");

  if (!responseContent || responseContent.trim() === '') {
    console.error("❌ Empty response content");
    return null;
  }

  try {
    return JSON.parse(responseContent);
  } catch (directError) {
    console.log("Direct parse failed, trying to extract JSON...");

    const patterns = [
      /```json\s*([\s\S]*?)\s*```/,
      /```\s*([\s\S]*?)\s*```/,
      /\{[\s\S]*\}/,
    ];

    for (const pattern of patterns) {
      const match = responseContent.match(pattern);
      if (match) {
        try {
          const jsonContent = match[1] || match[0];
          console.log("✅ Extracted JSON with pattern");
          return JSON.parse(jsonContent);
        } catch (e) {
          console.log("Pattern failed, trying next...");
          continue;
        }
      }
    }

    try {
      const cleaned = responseContent
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
        .trim();
      return JSON.parse(cleaned);
    } catch (finalError) {
      console.error("❌ All parsing attempts failed");
      console.error("Raw content:", responseContent.substring(0, 200));
      return null;
    }
  }
}

async function callDeepSeek(messages: any[], maxTokens = 800, retries = 2) {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔁 DeepSeek API call attempt ${attempt + 1}/${retries + 1}`);

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

      const data = await response.json();
      console.log("✅ DeepSeek API call successful");
      return data;
    } catch (error) {
      console.error(`❌ DeepSeek attempt ${attempt + 1} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

function extractDimensionsWithRegex(title: string, description: string): { text: string; source: string } | null {
  console.log("🔍 Extracting dimensions with regex...");

  const combinedText = `${title} ${description}`.toLowerCase();
  const dimensions: string[] = [];

  const patterns = [
    /(\d+)\s*x\s*(\d+)\s*x?\s*(\d+)?\s*(cm|m|mm|inches?|in)/gi,
    /l[.:]?\s*(\d+)\s*(cm|m)/gi,
    /w[.:]?\s*(\d+)\s*(cm|m)/gi,
    /h[.:]?\s*(\d+)\s*(cm|m)/gi,
    /hauteur[:\s]+(\d+)\s*(cm|m)/gi,
    /largeur[:\s]+(\d+)\s*(cm|m)/gi,
    /longueur[:\s]+(\d+)\s*(cm|m)/gi,
    /profondeur[:\s]+(\d+)\s*(cm|m)/gi,
    /diamètre[:\s]+(\d+)\s*(cm|m)/gi,
    /ø\s*(\d+)\s*(cm|m)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      dimensions.push(match[0]);
    }
  }

  if (dimensions.length > 0) {
    const uniqueDimensions = [...new Set(dimensions)];
    console.log("✅ Dimensions found:", uniqueDimensions);
    return {
      text: uniqueDimensions.join(", "),
      source: title.toLowerCase().includes(dimensions[0].toLowerCase()) ? "title" : "description"
    };
  }

  console.log("⚠️ No dimensions found");
  return null;
}

function createTextAnalysisPrompt(product: any, cleanDescription: string): string {
  return `Tu es un expert en analyse de produits e-commerce. Analyse le produit suivant et extrais les données structurées.

PRODUIT:
Titre: ${product.title}
Description: ${cleanDescription.substring(0, 800)}
Type: ${product.product_type || 'Non spécifié'}
Marque: ${product.vendor || 'Non spécifié'}

INSTRUCTIONS CRITIQUES:
1. Réponds UNIQUEMENT avec un JSON valide, sans texte additionnel
2. IGNORE toute mention de quantité (lot, set, pack, ensemble, X pièces)
3. Concentre-toi sur les attributs d'UN SEUL produit
4. Utilise le français pour tous les champs (sauf google_product_category)
5. Extrais TOUTES les dimensions mentionnées

FORMAT JSON ATTENDU:
{
  "category": "Catégorie principale (ex: 'Chaise', 'Table', 'Canapé')",
  "sub_category": "Sous-catégorie détaillée (ex: 'Chaise de bar métal', 'Table basse bois')",
  "functionality": "Fonctionnalité clé (ex: 'Convertible', 'Avec rangement', 'Réglable')",
  "characteristics": "Liste des caractéristiques techniques séparées par des virgules",
  "material": "Matériau principal identifié",
  "color": "Couleur principale si mentionnée",
  "style": "Style design (ex: 'Moderne', 'Scandinave', 'Industriel', 'Minimaliste')",
  "room": "Pièce d'utilisation (ex: 'Salon', 'Chambre', 'Cuisine', 'Bureau')",
  "google_product_category": "Catégorie Google Shopping COMPLÈTE en anglais (ex: 'Home & Garden > Furniture > Chairs > Bar Stools')",
  "keywords": ["liste", "de", "10-15", "mots-clés", "SEO", "pertinents"],
  "dimensions_text": "Texte descriptif des dimensions (ex: 'Hauteur: 85 cm, Largeur: 45 cm, Profondeur: 50 cm')",
  "dimensions_source": "title ou description ou ai_inference"
}

EXTRACTION DES DIMENSIONS:
- Cherche les patterns: "120x80", "L120 x l80 x H45", "Ø60", "hauteur 85 cm"
- Inclus TOUTES les dimensions trouvées (hauteur, largeur, profondeur, diamètre, poids)
- Formate lisiblement: "Hauteur: 85 cm, Largeur: 45 cm"

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
}

function createVisionPrompt(): string {
  return `ANALYSE VISUELLE STRICTE - Tu analyses des IMAGES de produit.

RÈGLES ABSOLUES:
1. Tu vois UNE SEULE UNITÉ de produit dans l'image
2. Tu n'as AUCUN contexte sur le titre, la description ou l'emballage
3. Tu décris UNIQUEMENT ce qui est VISUELLEMENT OBSERVABLE
4. INTERDIT: mentionner "lot", "set", "ensemble", "pack", nombres de pièces
5. INTERDIT: nommer le type d'objet (pas de "chaise", "table", "canapé")
6. AUTORISÉ: couleurs, textures, matériaux, finitions, style visuel

RÉPONDS EN JSON (français):
{
  "color_detected": "Couleur(s) principale(s) observée(s)",
  "material_detected": "Matériau(x) visible(s): bois, métal, tissu, cuir, verre, plastique",
  "style_detected": "Style visuel: Moderne, Scandinave, Industriel, Classique, Contemporain, Minimaliste",
  "visual_description": "Description concise (1-2 phrases) des attributs visuels d'UNE unité"
}

✅ CORRECT: "Tissu gris clair rembourré, structure en métal noir mat, lignes épurées"
❌ INTERDIT: "Lot de 4 chaises", "Ensemble de meubles", "Set de 2 tabourets"`;
}

function createSEOPrompt(product: any, textAnalysis: any): string {
  return `Génère un titre SEO et une meta description optimisés.

PRODUIT:
Titre: ${product.title}
Catégorie: ${textAnalysis.category || ''}
Matériau: ${textAnalysis.material || ''}
Style: ${textAnalysis.style || ''}

EXIGENCES:
1. seo_title: 50-60 caractères max
2. seo_description: 140-155 caractères max
3. Langue: français (ou même langue que le titre)
4. NE PAS répéter le titre exact
5. NE PAS mentionner quantité (lot, set, pack, X pièces)
6. Inclure: catégorie + matériau/style + bénéfice clé

RÉPONDS EN JSON:
{
  "seo_title": "Titre SEO optimisé",
  "seo_description": "Description SEO attractive avec CTA subtil"
}`;
}

function calculateConfidenceScore(
  textAnalysis: any,
  imageCount: number,
  visionAnalysis: any = {}
): number {
  let score = 0;

  if (textAnalysis.category && textAnalysis.category !== "Non catégorisé") score += 20;
  if (textAnalysis.sub_category) score += 15;
  if (textAnalysis.material) score += 10;
  if (textAnalysis.style) score += 10;
  if (textAnalysis.functionality) score += 10;
  if (textAnalysis.characteristics) score += 5;
  if (textAnalysis.dimensions_text) score += 10;

  if (visionAnalysis.color_detected) score += 10;
  if (visionAnalysis.material_detected) score += 5;
  if (visionAnalysis.style_detected) score += 5;

  if (imageCount > 0) score += Math.min(imageCount * 2, 10);

  return Math.min(score, 100);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log("=== 🚀 DÉBUT DE L'ENRICHISSEMENT ===");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("🔑 Environment check:", {
      supabaseUrl: supabaseUrl ? "✓" : "✗",
      serviceRoleKey: serviceRoleKey ? "✓" : "✗",
      deepseekKey: deepseekKey ? "✓" : "✗",
      openaiKey: openaiKey ? "✓" : "✗"
    });

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Supabase configuration missing",
          details: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured"
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!deepseekKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "DeepSeek API key not configured",
          details: "DEEPSEEK_API_KEY environment variable is missing. Please configure it in Supabase Edge Function secrets."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    const { productId }: EnrichmentRequest = await req.json();
    console.log("📦 Product ID:", productId);

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: "Product ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("🔍 Fetching product from database...");
    const { data: product, error: productError } = await supabaseClient
      .from("shopify_products")
      .select("id, title, description, product_type, vendor, enrichment_status, last_enriched_at, updated_at, ai_color, ai_material, ai_vision_analysis")
      .eq("id", productId)
      .maybeSingle();

    if (productError || !product) {
      console.error("❌ Product not found:", productError);
      return new Response(
        JSON.stringify({ success: false, error: "Product not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Product found:", product.title);

    const { data: images } = await supabaseClient
      .from("product_images")
      .select("src, alt_text, position")
      .eq("product_id", productId)
      .order("position", { ascending: true })
      .limit(3);

    console.log(`🖼️ Found ${images?.length || 0} images`);

    let cleanDescription = product.description
      ? product.description
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      : 'No description provided';

    cleanDescription = cleanDescription
      .replace(/\b(lot|set|pack|ensemble|coffret)\s+(de\s+)?(\d+)\s+/gi, '')
      .replace(/\b(\d+)\s+(pièces?|pieces?|items?|unités?|units?)\s+/gi, '')
      .replace(/\bquantité\s*:\s*\d+\s*/gi, '')
      .replace(/\bquantity\s*:\s*\d+\s*/gi, '')
      .trim();

    console.log("📝 Description cleaned");

    console.log("🧠 Starting text analysis with DeepSeek...");
    let textAnalysis: any = {};

    try {
      const textAnalysisResponse = await callDeepSeek([
        {
          role: "system",
          content: "Tu es un expert en analyse de produits e-commerce. Réponds UNIQUEMENT en JSON valide, sans texte additionnel.",
        },
        {
          role: "user",
          content: createTextAnalysisPrompt(product, cleanDescription),
        },
      ], 800);

      const textAnalysisContent = textAnalysisResponse.choices[0].message.content;
      console.log("📄 DeepSeek response received");

      textAnalysis = parseAIResponse(textAnalysisContent);

      if (!textAnalysis) {
        console.error("❌ Failed to parse text analysis");
        throw new Error("Text analysis parsing failed");
      }

      console.log("✅ Text analysis parsed:", {
        category: textAnalysis.category,
        material: textAnalysis.material,
        style: textAnalysis.style
      });
    } catch (textError) {
      console.error("❌ Text analysis failed:", textError);
      textAnalysis = {
        category: product.product_type || "Non catégorisé",
        sub_category: "",
        functionality: "",
        characteristics: "",
        material: "",
        color: "",
        style: "",
        room: "",
        google_product_category: "Home & Garden > Furniture",
        keywords: [],
        dimensions_text: "",
        dimensions_source: ""
      };
    }

    if (!textAnalysis.dimensions_text) {
      const regexDimensions = extractDimensionsWithRegex(product.title, product.description || "");
      if (regexDimensions) {
        textAnalysis.dimensions_text = regexDimensions.text;
        textAnalysis.dimensions_source = regexDimensions.source;
        console.log("✅ Dimensions extracted with regex");
      }
    }

    const visionPromise = (async () => {
      if (!images || images.length === 0) {
        console.log("⏭️ No images for vision analysis");
        return { visionAnalysis: {}, imageInsights: "" };
      }

      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
      if (!openaiApiKey) {
        console.warn("⚠️ OpenAI API key missing");
        return { visionAnalysis: {}, imageInsights: "" };
      }

      try {
        console.log("👁️ Analyzing images with OpenAI Vision...");

        const imageContents = images.slice(0, 2).map((img: any) => ({
          type: "image_url",
          image_url: {
            url: img.src,
            detail: "low",
          },
        }));

        if (imageContents.length === 0) {
          console.log("⚠️ No images to process");
          return { visionAnalysis: {}, imageInsights: "" };
        }

        console.log(`📸 Processing ${imageContents.length} images...`);

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
                    { type: "text", text: createVisionPrompt() },
                    ...imageContents,
                  ],
                },
              ],
              max_tokens: 250,
              temperature: 0.2,
            }),
          }
        );

        if (!visionResponse.ok) {
          throw new Error(`Vision API error: ${visionResponse.status}`);
        }

        const visionData = await visionResponse.json();
        const visionContent = visionData.choices[0].message.content;

        const visionAnalysis = parseAIResponse(visionContent) || {};
        console.log("✅ Vision analysis completed:", {
          color: visionAnalysis.color_detected,
          material: visionAnalysis.material_detected
        });

        return {
          visionAnalysis,
          imageInsights: visionAnalysis.visual_description || ""
        };
      } catch (visionError) {
        console.error("❌ Vision analysis failed:", visionError);
        return { visionAnalysis: {}, imageInsights: "" };
      }
    })();

    const seoPromise = (async () => {
      try {
        console.log("📝 Generating SEO content...");

        const seoResponse = await callDeepSeek([
          {
            role: "system",
            content: "Expert SEO. Réponds UNIQUEMENT en JSON valide.",
          },
          {
            role: "user",
            content: createSEOPrompt(product, textAnalysis),
          },
        ], 300);

        const seoContent = seoResponse.choices[0].message.content;
        const seoData = parseAIResponse(seoContent);

        if (seoData) {
          console.log("✅ SEO content generated");
          return seoData;
        }

        return {};
      } catch (seoError) {
        console.error("❌ SEO generation failed:", seoError);
        return {};
      }
    })();

    console.log("⏳ Waiting for parallel API calls...");
    const [visionResult, seoResult] = await Promise.allSettled([visionPromise, seoPromise]);

    const visionData = visionResult.status === 'fulfilled' ? visionResult.value : { visionAnalysis: {}, imageInsights: "" };
    const seoData = seoResult.status === 'fulfilled' ? seoResult.value : {};

    console.log("✅ Parallel API calls completed");

    const { visionAnalysis, imageInsights } = visionData;

    const finalColor = visionAnalysis.color_detected || textAnalysis.color || product.ai_color || "";
    const finalMaterial = visionAnalysis.material_detected || textAnalysis.material || product.ai_material || "";
    const finalStyle = visionAnalysis.style_detected || textAnalysis.style || "";
    const finalAiVisionAnalysis = imageInsights || product.ai_vision_analysis || "";

    const baseKeywords = Array.isArray(textAnalysis.keywords) ? textAnalysis.keywords : [];
    const allKeywords = [...new Set(baseKeywords)].slice(0, 15);

    const seoTitle = seoData.seo_title || product.title;
    const seoDescription = seoData.seo_description || cleanDescription.substring(0, 155);

    console.log("🎯 Final data fusion:", {
      color: finalColor,
      material: finalMaterial,
      style: finalStyle,
      keywords: allKeywords.length,
      dimensions: textAnalysis.dimensions_text || "none"
    });

    const confidenceScore = calculateConfidenceScore(textAnalysis, images?.length || 0, visionAnalysis);
    console.log("📊 Confidence score:", confidenceScore);

    const updateData: any = {
      category: textAnalysis.category || "",
      sub_category: textAnalysis.sub_category || "",
      functionality: textAnalysis.functionality || "",
      characteristics: textAnalysis.characteristics || "",
      style: finalStyle,
      room: textAnalysis.room || "",
      google_product_category: textAnalysis.google_product_category || "Home & Garden > Furniture",
      google_brand: product.vendor || "",
      seo_title: seoTitle,
      seo_description: seoDescription,
      tags: allKeywords.join(", "),
      ai_vision_analysis: finalAiVisionAnalysis,
      ai_color: finalColor,
      ai_material: finalMaterial,
      dimensions_text: textAnalysis.dimensions_text || null,
      dimensions_source: textAnalysis.dimensions_source || null,
      confidence_score: confidenceScore,
      enrichment_status: "completed",
      last_enriched_at: new Date().toISOString(),
      seo_synced_to_shopify: false,
    };

    console.log("💾 Updating product in database...");
    const { error: updateError } = await supabaseClient
      .from("shopify_products")
      .update(updateData)
      .eq("id", productId);

    if (updateError) {
      console.error("❌ Database update failed:", updateError);
      throw updateError;
    }

    console.log("✅ ENRICHISSEMENT TERMINÉ AVEC SUCCÈS!");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Product enriched successfully",
        data: {
          category: updateData.category,
          sub_category: updateData.sub_category,
          style: updateData.style,
          material: updateData.ai_material,
          color: updateData.ai_color,
          dimensions: updateData.dimensions_text,
          confidence: updateData.confidence_score
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("💥 ENRICHMENT PROCESS FAILED:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
