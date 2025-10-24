import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

interface Product {
  title: string;
  description?: string;
  product_type?: string;
  category?: string;
  sub_category?: string;
  ai_color?: string;
  ai_material?: string;
  style?: string;
  ai_texture?: string;
  ai_pattern?: string;
  ai_finish?: string;
  ai_shape?: string;
  ai_design_elements?: string;
  functionality?: string;
  characteristics?: string;
  ai_vision_analysis?: string;
  tags?: string[];
  vendor?: string;
}

interface Image {
  id: string;
  product_id: string;
  src: string;
  position: number;
  alt_text?: string;
}

interface AltTextResult {
  success: boolean;
  message: string;
  data?: {
    image_id: string;
    alt_text: string;
    confidence_score?: number;
    generated_from?: string;
  };
  skipped?: boolean;
  error?: string;
}

class AltTextGenerator {
  private supabaseClient;
  private deepseekApiKey;

  constructor() {
    this.supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    this.deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
  }

  async generateAltText(imageId: string): Promise<AltTextResult> {
    try {
      // Validate API key
      if (!this.deepseekApiKey) {
        throw new Error("DeepSeek API key not configured");
      }

      // Fetch image data
      const image = await this.getImageData(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      // Check if image already has ALT text
      if (image.alt_text && image.alt_text.trim() !== "") {
        return {
          success: true,
          skipped: true,
          message: "Image already has ALT text"
        };
      }

      // Fetch product data
      const product = await this.getProductData(image.product_id);
      if (!product) {
        throw new Error("Product not found for this image");
      }

      console.log(`Generating ALT text for image ${image.position} of product: ${product.title}`);

      // Enrich product data if needed
      const enrichedProduct = await this.enrichProductIfNeeded(image.product_id, product);

      // Generate ALT text using AI
      const altText = await this.generateWithAI(image, enrichedProduct);

      // Save ALT text to database
      await this.saveAltText(imageId, altText);

      console.log(`✅ ALT text generated for image ${imageId}: ${altText}`);

      return {
        success: true,
        message: "ALT text generated successfully",
        data: {
          image_id: imageId,
          alt_text: altText,
          confidence_score: this.calculateConfidenceScore(enrichedProduct),
          generated_from: "ai_vision_analysis"
        }
      };

    } catch (error) {
      console.error("Error generating ALT text:", error);
      throw error;
    }
  }

  private async getImageData(imageId: string): Promise<Image | null> {
    const { data: image, error } = await this.supabaseClient
      .from("product_images")
      .select("id, product_id, src, position, alt_text")
      .eq("id", imageId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching image:", error);
      throw error;
    }

    return image;
  }

  private async getProductData(productId: string): Promise<Product | null> {
    const { data: product, error } = await this.supabaseClient
      .from("shopify_products")
      .select(`
        title,
        description,
        product_type,
        category,
        sub_category,
        ai_color,
        ai_material,
        style,
        ai_texture,
        ai_pattern,
        ai_finish,
        ai_shape,
        ai_design_elements,
        functionality,
        characteristics,
        ai_vision_analysis,
        tags,
        vendor
      `)
      .eq("id", productId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching product:", error);
      throw error;
    }

    return product;
  }

  private async enrichProductIfNeeded(productId: string, product: Product): Promise<Product> {
    const hasEnrichmentData = 
      product.ai_color || 
      product.ai_material || 
      product.style || 
      product.functionality || 
      product.characteristics || 
      product.ai_vision_analysis;

    if (!hasEnrichmentData) {
      console.log(`⚠️ Product ${product.title} has no AI enrichment data. Triggering enrichment...`);
      
      try {
        const enrichUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/enrich-product-with-ai`;
        const enrichResponse = await fetch(enrichUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: productId
          })
        });

        if (enrichResponse.ok) {
          console.log(`✅ Product enriched successfully`);
          const enrichedProduct = await this.getProductData(productId);
          if (enrichedProduct) {
            return enrichedProduct;
          }
        } else {
          console.log(`⚠️ Enrichment failed, continuing with available data`);
        }
      } catch (enrichError) {
        console.log(`⚠️ Enrichment error:`, enrichError);
      }
    }

    return product;
  }

  private async generateWithAI(image: Image, product: Product): Promise<string> {
    const prompt = this.buildPrompt(image, product);
    
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.deepseekApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Tu es un expert en accessibilité web et SEO pour e-commerce. 
            Tu génères des textes ALT descriptifs, naturels et optimisés en français.
            Règles strictes:
            - Maximum 125 caractères
            - Commence par le type de produit
            - Utilise un langage naturel et descriptif
            - Pas de marketing, uniquement des faits
            - INTERDIT: "Image de", "Photo de", "Produit", "JSON", "{", "}", guillemets
            Réponds UNIQUEMENT avec le texte ALT final.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    let altText = data.choices[0].message.content.trim();

    // Clean and validate the response
    altText = this.cleanAltText(altText, product);

    return altText;
  }

  private buildPrompt(image: Image, product: Product): string {
    const imageContext = this.getImageContext(image.position);
    const productType = this.determineProductType(product);
    const colorInfo = this.getColorInformation(product);
    const materialInfo = this.getMaterialInformation(product);
    const styleInfo = this.getStyleInformation(product);
    const functionalityInfo = this.getFunctionalityInformation(product);

    return `
Génère un texte ALT optimisé pour cette image de produit e-commerce.

CONTEXTE IMAGE:
${imageContext}

INFORMATIONS PRODUIT:
• Type: ${productType}
• Titre: ${product.title}
• Catégorie: ${product.category || "Non spécifiée"}
• Sous-catégorie: ${product.sub_category || "Non spécifiée"}
• Vendeur: ${product.vendor || "Non spécifié"}

CARACTÉRISTIQUES DÉTECTÉES:
• Couleur: ${colorInfo}
• Matière: ${materialInfo}
• Style: ${styleInfo}
• Fonctionnalité: ${functionalityInfo}
• Texture: ${product.ai_texture || "Non spécifiée"}
• Motif: ${product.ai_pattern || "Non spécifié"}
• Finition: ${product.ai_finish || "Non spécifiée"}
• Forme: ${product.ai_shape || "Non spécifiée"}
• Éléments design: ${product.ai_design_elements || "Non spécifiés"}

ANALYSE VISION IA:
${product.ai_vision_analysis || "Aucune analyse visuelle disponible"}

DESCRIPTION:
${product.description ? product.description.substring(0, 400) : "Aucune description disponible"}

ÉTIQUETES: ${product.tags ? product.tags.join(', ') : "Aucune étiquette"}

CONSIGNES STRICTES:
- Longueur: 125 caractères maximum
- Format: Commence par le type de produit
- Style: Naturel, descriptif, factuel
- Langue: Français uniquement
- INTERDIT: "Image de", "Photo de", "Produit", marketing, JSON, guillemets

Exemples de bons textes ALT:
"Canapé convertible tissu gris anthracite avec rangement intégré"
"Table basse bois chêne naturel pieds métal noir style industriel"
"Chaise design cuir noir pattes métalliques chromées contemporaine"

Génère UNIQUEMENT le texte ALT final:`;
  }

  private getImageContext(position: number): string {
    switch (position) {
      case 1:
        return "Image principale - Vue d'ensemble du produit";
      case 2:
        return "Vue secondaire - Détail ou angle différent";
      case 3:
        return "Vue détaillée - Gros plan sur caractéristiques";
      case 4:
        return "Vue contextuelle - Produit en situation d'usage";
      default:
        return `Vue supplémentaire n°${position} - Angle ou détail spécifique`;
    }
  }

  private determineProductType(product: Product): string {
    if (product.product_type) return product.product_type;
    if (product.category) return product.category;
    
    // Fallback: extract from title
    const commonTypes = ['canapé', 'table', 'chaise', 'fauteuil', 'meuble', 'lampe', 'tabouret', 'bureau', 'armoire', 'étagère'];
    const titleLower = product.title.toLowerCase();
    const foundType = commonTypes.find(type => titleLower.includes(type));
    
    return foundType ? foundType.charAt(0).toUpperCase() + foundType.slice(1) : "Produit";
  }

  private getColorInformation(product: Product): string {
    if (product.ai_color) return product.ai_color;
    
    // Extract color from title using common color names
    const colors = ['blanc', 'noir', 'gris', 'bleu', 'rouge', 'vert', 'jaune', 'marron', 'beige', 'taupe', 'argent', 'or'];
    const titleLower = product.title.toLowerCase();
    const foundColor = colors.find(color => titleLower.includes(color));
    
    return foundColor || "À déterminer";
  }

  private getMaterialInformation(product: Product): string {
    if (product.ai_material) return product.ai_material;
    
    // Extract material from title
    const materials = ['bois', 'cuir', 'tissu', 'métal', 'verre', 'plastic', 'rotin', 'osier', 'velours', 'lin'];
    const titleLower = product.title.toLowerCase();
    const foundMaterial = materials.find(material => titleLower.includes(material));
    
    return foundMaterial || "À déterminer";
  }

  private getStyleInformation(product: Product): string {
    if (product.style) return product.style;
    
    const styles = ['moderne', 'scandinave', 'industriel', 'contemporain', 'classique', 'rustique', 'design', 'vintage'];
    const titleLower = product.title.toLowerCase();
    const foundStyle = styles.find(style => titleLower.includes(style));
    
    return foundStyle || "À déterminer";
  }

  private getFunctionalityInformation(product: Product): string {
    if (product.functionality) return product.functionality;
    
    const functionalities = ['convertible', 'extensible', 'empilable', 'pliant', 'ajustable', 'rotatif', 'oscillant', 'avec rangement'];
    const titleLower = product.title.toLowerCase();
    const foundFunctionality = functionalities.find(func => titleLower.includes(func));
    
    return foundFunctionality || "Standard";
  }

  private cleanAltText(altText: string, product: Product): string {
    // Remove JSON artifacts
    let cleaned = altText.replace(/^["']|["']$/g, '')
      .replace(/^\{[\s\S]*"alt_text":\s*["']?/i, '')
      .replace(/["']?\s*\}$/i, '')
      .replace(/^(Image de|Photo de|Produit|Image|Photo)[\s:]+/i, '')
      .replace(/^-\s*/i, '')
      .trim();

    // Remove any markdown formatting
    cleaned = cleaned.replace(/[*_`#]/g, '');

    // Ensure it starts with product type
    const productType = this.determineProductType(product);
    if (!cleaned.toLowerCase().startsWith(productType.toLowerCase())) {
      cleaned = `${productType} ${cleaned}`;
    }

    // Truncate if too long
    if (cleaned.length > 125) {
      const lastSpace = cleaned.substring(0, 122).lastIndexOf(' ');
      cleaned = cleaned.substring(0, lastSpace > 80 ? lastSpace : 122) + "...";
    }

    // Fallback if empty or too short
    if (!cleaned || cleaned.length < 10) {
      const fallbackParts = [
        productType,
        this.getColorInformation(product),
        this.getMaterialInformation(product)
      ].filter(part => part && part !== "À déterminer");
      
      cleaned = fallbackParts.join(' ').substring(0, 125);
    }

    return cleaned;
  }

  private calculateConfidenceScore(product: Product): number {
    let score = 0;
    let totalFactors = 0;

    if (product.ai_color) { score += 20; totalFactors++; }
    if (product.ai_material) { score += 20; totalFactors++; }
    if (product.style) { score += 15; totalFactors++; }
    if (product.functionality) { score += 15; totalFactors++; }
    if (product.ai_vision_analysis) { score += 30; totalFactors++; }
    if (product.description && product.description.length > 50) { score += 10; totalFactors++; }

    return totalFactors > 0 ? Math.min(100, score) : 50; // Default confidence if no data
  }

  private async saveAltText(imageId: string, altText: string): Promise<void> {
    const { error } = await this.supabaseClient
      .from("product_images")
      .update({
        alt_text: altText,
        updated_at: new Date().toISOString(),
        alt_text_generated_at: new Date().toISOString()
      })
      .eq("id", imageId);

    if (error) {
      console.error("Error saving ALT text:", error);
      throw error;
    }
  }
}

// Main request handler
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const generator = new AltTextGenerator();
    
    // Support both single and batch processing
    const requestData = await req.json();
    
    if (Array.isArray(requestData.imageIds)) {
      // Batch processing
      const results = [];
      for (const imageId of requestData.imageIds) {
        try {
          const result = await generator.generateAltText(imageId);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            image_id: imageId
          });
        }
      }
      
      return new Response(JSON.stringify({
        batch_complete: true,
        results: results
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
      
    } else {
      // Single image processing
      const { imageId } = requestData;
      
      if (!imageId) {
        return new Response(JSON.stringify({
          error: "Image ID is required"
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
          }
        });
      }

      const result = await generator.generateAltText(imageId);
      
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : (result.skipped ? 200 : 500),
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    
  } catch (error) {
    console.error("Error in ALT text generation function:", error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "An unknown error occurred"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});