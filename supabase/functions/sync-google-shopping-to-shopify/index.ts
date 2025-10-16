import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function normalizeStoreUrl(storeUrl: string): string {
  let normalized = storeUrl.trim();
  normalized = normalized.replace(/^https?:\/\//, '');
  normalized = normalized.replace(/\/$/, '');
  return normalized;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { productIds } = await req.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('productIds array is required');
    }

    const results = [];

    for (const productId of productIds) {
      try {
        const { data: product, error: productError } = await supabase
          .from('shopify_products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();

        if (productError || !product) {
          results.push({
            productId,
            success: false,
            error: productError?.message || 'Product not found',
          });
          continue;
        }

        const { data: store, error: storeError } = await supabase
          .from('shopify_stores')
          .select('store_name, store_url, api_token')
          .eq('id', product.store_id)
          .maybeSingle();

        if (storeError || !store) {
          results.push({
            productId,
            success: false,
            error: storeError?.message || 'Store not found',
          });
          continue;
        }

        const normalizedStoreUrl = normalizeStoreUrl(store.store_url);

        const metafields = [];

        if (product.google_product_category) {
          metafields.push({
            namespace: 'custom',
            key: 'google_product_category',
            value: product.google_product_category,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_product_category: ${product.google_product_category}`);
        }

        if (product.google_brand) {
          metafields.push({
            namespace: 'custom',
            key: 'google_brand',
            value: product.google_brand,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_brand: ${product.google_brand}`);
        }

        if (product.google_gtin) {
          metafields.push({
            namespace: 'custom',
            key: 'google_gtin',
            value: product.google_gtin,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_gtin: ${product.google_gtin}`);
        }

        if (product.google_gender) {
          metafields.push({
            namespace: 'custom',
            key: 'google_gender',
            value: product.google_gender,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_gender: ${product.google_gender}`);
        }

        if (product.google_age_group) {
          metafields.push({
            namespace: 'custom',
            key: 'google_age_group',
            value: product.google_age_group,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_age_group: ${product.google_age_group}`);
        }

        if (product.google_mpn) {
          metafields.push({
            namespace: 'custom',
            key: 'google_mpn',
            value: product.google_mpn,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_mpn: ${product.google_mpn}`);
        }

        if (product.google_condition) {
          metafields.push({
            namespace: 'custom',
            key: 'google_condition',
            value: product.google_condition,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_condition: ${product.google_condition}`);
        }

        if (product.google_availability) {
          metafields.push({
            namespace: 'custom',
            key: 'google_availability',
            value: product.google_availability,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_availability: ${product.google_availability}`);
        }

        if (product.google_custom_product !== null && product.google_custom_product !== undefined) {
          metafields.push({
            namespace: 'custom',
            key: 'google_custom_product',
            value: product.google_custom_product ? 'true' : 'false',
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_custom_product: ${product.google_custom_product}`);
        }

        if (product.google_custom_label_0) {
          metafields.push({
            namespace: 'custom',
            key: 'google_custom_label_0',
            value: product.google_custom_label_0,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_custom_label_0: ${product.google_custom_label_0}`);
        }

        if (product.google_custom_label_1) {
          metafields.push({
            namespace: 'custom',
            key: 'google_custom_label_1',
            value: product.google_custom_label_1,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_custom_label_1: ${product.google_custom_label_1}`);
        }

        if (product.google_custom_label_2) {
          metafields.push({
            namespace: 'custom',
            key: 'google_custom_label_2',
            value: product.google_custom_label_2,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_custom_label_2: ${product.google_custom_label_2}`);
        }

        if (product.google_custom_label_3) {
          metafields.push({
            namespace: 'custom',
            key: 'google_custom_label_3',
            value: product.google_custom_label_3,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_custom_label_3: ${product.google_custom_label_3}`);
        }

        if (product.google_custom_label_4) {
          metafields.push({
            namespace: 'custom',
            key: 'google_custom_label_4',
            value: product.google_custom_label_4,
            type: 'single_line_text_field',
          });
          console.log(`✓ Adding google_custom_label_4: ${product.google_custom_label_4}`);
        }

        const shopifyUrl = `https://${normalizedStoreUrl}/admin/api/2024-01/products/${product.shopify_id}/metafields.json`;

        console.log(`\n🔄 Syncing ${metafields.length} Google Shopping fields to Shopify for product ${product.shopify_id}`);
        console.log('Shopify URL:', shopifyUrl);

        let successCount = 0;
        let failCount = 0;

        for (const metafield of metafields) {
          try {
            console.log(`\n  📤 Syncing ${metafield.key}...`);
            const response = await fetch(shopifyUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': store.api_token,
              },
              body: JSON.stringify({ metafield }),
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`  ❌ Failed to sync metafield ${metafield.key}:`, errorText);
              failCount++;
            } else {
              console.log(`  ✅ Successfully synced ${metafield.key}`);
              successCount++;
            }
          } catch (error) {
            console.error(`  ❌ Exception syncing metafield ${metafield.key}:`, error);
            failCount++;
          }
        }

        console.log(`\n✅ Sync complete for product ${product.shopify_id}: ${successCount} success, ${failCount} failed`);

        await supabase
          .from('shopify_products')
          .update({ google_synced_at: new Date().toISOString() })
          .eq('id', productId);

        results.push({
          productId,
          success: true,
          syncedFields: successCount,
          failedFields: failCount,
          totalFields: metafields.length,
        });
      } catch (error) {
        results.push({
          productId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
        totalProcessed: results.length,
        successCount: results.filter((r) => r.success).length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error in sync-google-shopping-to-shopify:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});