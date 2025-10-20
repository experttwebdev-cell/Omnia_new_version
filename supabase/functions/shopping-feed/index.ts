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

    // Récupérer le vendeur
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', sellerId)
      .single();

    if (sellerError) {
      console.error('Erreur récupération vendeur:', sellerError);
      throw new Error('Vendeur non trouvé');
    }

    // Vérifier que le vendeur a un statut actif ou en essai
    if (seller.status !== 'active' && seller.status !== 'trial') {
      throw new Error('Vendeur non actif');
    }

    // Récupérer l'abonnement du vendeur
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('seller_id', sellerId)
      .in('status', ['active', 'trial'])
      .single();

    if (subscriptionError) {
      console.error('Erreur récupération abonnement:', subscriptionError);
      throw new Error('Abonnement non trouvé ou inactif');
    }

    // Récupérer les produits du vendeur
    const { data: products, error: productsError } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('user_id', sellerId)
      .eq('status', 'active');

    if (productsError) {
      console.error('Erreur récupération produits:', productsError);
      throw new Error('Erreur lors de la récupération des produits');
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
    console.error("Error in edge function:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

function generateGoogleShoppingXML(products: any[]): string {
  const itemsXML = products.map(product => `
    <item>
      <g:id>${product.id}</g:id>
      <g:title>${escapeXML(product.title)}</g:title>
      <g:description>${escapeXML(product.description || product.body_html?.replace(/<[^>]*>/g, '').substring(0, 500) || '')}</g:description>
      <g:link>https://omnia.sale/products/${product.handle}</g:link>
      <g:image_link>${product.image_url}</g:image_link>
      <g:availability>${product.inventory > 0 ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${product.price} EUR</g:price>
      <g:sale_price>${product.compare_at_price || product.price} EUR</g:sale_price>
      <g:brand>${escapeXML(product.vendor || 'Unknown')}</g:brand>
      <g:condition>new</g:condition>
      <g:google_product_category>${escapeXML(product.category || 'Home & Garden')}</g:google_product_category>
      <g:product_type>${escapeXML(product.product_type || '')}</g:product_type>
      <g:shipping>
        <g:country>FR</g:country>
        <g:service>Standard</g:service>
        <g:price>0 EUR</g:price>
      </g:shipping>
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