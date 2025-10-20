// supabase/functions/shopping-feed/index.ts

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    
    // Extract seller_id from URL path: /Shoppingfeed/{seller_id}.xml
    const sellerId = pathParts[2]?.replace('.xml', '');
    
    if (!sellerId) {
      return new Response(JSON.stringify({ error: 'Seller ID manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuration Supabase manquante');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer les produits du vendeur
    const { data: products, error } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('user_id', sellerId)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Erreur lors de la récupération des produits: ${error.message}`);
    }

    // Générer le XML Google Shopping
    const xmlContent = generateGoogleShoppingXML(products || []);

    return new Response(xmlContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="shopping-feed-${sellerId}.xml"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateGoogleShoppingXML(products: any[]): string {
  const itemsXML = products.map(product => `
    <item>
      <id>${product.id}</id>
      <title>${escapeXML(product.title)}</title>
      <description>${escapeXML(product.description || '')}</description>
      <link>https://omnia.sale/products/${product.handle}</link>
      <image_link>${product.image_url}</image_link>
      <availability>${product.inventory > 0 ? 'in stock' : 'out of stock'}</availability>
      <price>${product.price} EUR</price>
      <brand>${escapeXML(product.vendor || 'Unknown')}</brand>
      <condition>new</condition>
      <google_product_category>${escapeXML(product.category || '')}</google_product_category>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Omnia Sale Product Feed</title>
    <link>https://omnia.sale</link>
    <description>Google Shopping Feed from Omnia Sale</description>
    ${itemsXML}
  </channel>
</rss>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}