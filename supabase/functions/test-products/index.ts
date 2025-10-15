import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Total produits
    const { count: totalCount } = await supabase
      .from('shopify_products')
      .select('*', { count: 'exact', head: true });

    // Produits avec images
    const { count: withImageCount, data: withImages } = await supabase
      .from('shopify_products')
      .select('id, title, image_url, category', { count: 'exact' })
      .not('image_url', 'is', null)
      .limit(10);

    // Produits sans images
    const { count: withoutImageCount } = await supabase
      .from('shopify_products')
      .select('*', { count: 'exact', head: true })
      .is('image_url', null);

    // Catégories disponibles
    const { data: categories } = await supabase
      .from('shopify_products')
      .select('category')
      .not('category', 'is', null)
      .limit(100);

    const uniqueCategories = [...new Set(categories?.map(p => p.category).filter(Boolean))];

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics: {
          total_products: totalCount,
          products_with_images: withImageCount,
          products_without_images: withoutImageCount,
          sample_products: withImages,
          available_categories: uniqueCategories.slice(0, 20),
          message: withImageCount === 0
            ? "⚠️ Aucun produit n'a d'image. Importez vos produits depuis Shopify."
            : `✅ ${withImageCount} produits disponibles avec images`
        }
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
