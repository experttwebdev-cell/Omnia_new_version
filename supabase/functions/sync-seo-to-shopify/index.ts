import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SyncRequest {
  productId: string;
  userId?: string;
}

interface ProductData {
  id: string;
  shopify_id: number;
  seo_title: string;
  seo_description: string;
  tags: string;
  store_id: string;
}

interface StoreData {
  id: string;
  store_name: string;
  api_token: string;
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

    const { productId, userId }: SyncRequest = await req.json();

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
      .select("id, shopify_id, seo_title, seo_description, tags, store_id")
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

    if (!product.store_id) {
      return new Response(
        JSON.stringify({ error: "Product has no associated store" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: store, error: storeError } = await supabaseClient
      .from("shopify_stores")
      .select("id, store_name, api_token")
      .eq("id", product.store_id)
      .maybeSingle();

    if (storeError || !store) {
      console.error("Store lookup error:", storeError);
      console.error("Product store_id:", product.store_id);
      return new Response(
        JSON.stringify({
          error: "Store not found",
          details: storeError?.message || "No store associated with this product",
          product_store_id: product.store_id
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Syncing SEO data for product ${product.shopify_id} to Shopify store ${store.store_name}`);

    const cleanShopName = store.store_name.replace(".myshopify.com", "");
    const shopifyApiUrl = `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}.json`;

    const metafields = [];

    if (product.seo_title) {
      const titleMetafieldResponse = await fetch(
        `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}/metafields.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": store.api_token,
            "Content-Type": "application/json",
          },
        }
      );

      if (titleMetafieldResponse.ok) {
        const existingMetafields = await titleMetafieldResponse.json();
        const titleMetafield = existingMetafields.metafields?.find(
          (m: any) => m.namespace === "global" && m.key === "title_tag"
        );

        if (titleMetafield) {
          await fetch(
            `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}/metafields/${titleMetafield.id}.json`,
            {
              method: "PUT",
              headers: {
                "X-Shopify-Access-Token": store.api_token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metafield: {
                  id: titleMetafield.id,
                  value: product.seo_title,
                  type: "single_line_text_field",
                },
              }),
            }
          );
        } else {
          await fetch(
            `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}/metafields.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": store.api_token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metafield: {
                  namespace: "global",
                  key: "title_tag",
                  value: product.seo_title,
                  type: "single_line_text_field",
                },
              }),
            }
          );
        }
      }

      metafields.push("seo_title");
    }

    if (product.seo_description) {
      const descMetafieldResponse = await fetch(
        `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}/metafields.json`,
        {
          method: "GET",
          headers: {
            "X-Shopify-Access-Token": store.api_token,
            "Content-Type": "application/json",
          },
        }
      );

      if (descMetafieldResponse.ok) {
        const existingMetafields = await descMetafieldResponse.json();
        const descMetafield = existingMetafields.metafields?.find(
          (m: any) => m.namespace === "global" && m.key === "description_tag"
        );

        if (descMetafield) {
          await fetch(
            `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}/metafields/${descMetafield.id}.json`,
            {
              method: "PUT",
              headers: {
                "X-Shopify-Access-Token": store.api_token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metafield: {
                  id: descMetafield.id,
                  value: product.seo_description,
                  type: "single_line_text_field",
                },
              }),
            }
          );
        } else {
          await fetch(
            `https://${cleanShopName}.myshopify.com/admin/api/2024-01/products/${product.shopify_id}/metafields.json`,
            {
              method: "POST",
              headers: {
                "X-Shopify-Access-Token": store.api_token,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                metafield: {
                  namespace: "global",
                  key: "description_tag",
                  value: product.seo_description,
                  type: "single_line_text_field",
                },
              }),
            }
          );
        }
      }

      metafields.push("seo_description");
    }

    if (product.tags) {
      const updateResponse = await fetch(shopifyApiUrl, {
        method: "PUT",
        headers: {
          "X-Shopify-Access-Token": store.api_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: {
            id: product.shopify_id,
            tags: product.tags,
          },
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Failed to update tags:", errorText);
        throw new Error(`Failed to update tags: ${updateResponse.statusText}`);
      }

      metafields.push("tags");
    }

    const { error: productUpdateError } = await supabaseClient
      .from("shopify_products")
      .update({
        seo_synced_to_shopify: true,
        last_seo_sync_at: new Date().toISOString(),
        seo_sync_error: "",
      })
      .eq("id", productId);

    if (productUpdateError) {
      console.error("Failed to update product sync status:", productUpdateError);
    }

    const { error: logError } = await supabaseClient
      .from("seo_sync_logs")
      .insert({
        product_id: productId,
        store_id: store.id,
        sync_type: userId ? "manual" : "auto",
        fields_synced: { fields: metafields },
        status: "success",
        synced_at: new Date().toISOString(),
        synced_by: userId || null,
      });

    if (logError) {
      console.error("Failed to log sync:", logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "SEO data synced to Shopify successfully",
        fields_synced: metafields,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);

    const { productId } = await req.json().catch(() => ({ productId: null }));

    if (productId) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseClient
        .from("shopify_products")
        .update({
          seo_sync_error: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", productId);
    }

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