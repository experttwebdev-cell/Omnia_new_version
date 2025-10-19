import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface OrderRequest {
  cart_id: string;
  customer: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  shipping_method: 'standard' | 'express';
  payment_method: 'card' | 'paypal';
  order_number: string;
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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const orderData: OrderRequest = await req.json();
    const { cart_id, customer, shipping_method, payment_method, order_number } = orderData;

    console.log('Creating order:', order_number);

    const { data: cart, error: cartError } = await supabase
      .from('shopping_carts')
      .select('*, store_id')
      .eq('id', cart_id)
      .single();

    if (cartError) {
      throw new Error(`Failed to fetch cart: ${cartError.message}`);
    }

    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart_id);

    if (itemsError) {
      throw new Error(`Failed to fetch cart items: ${itemsError.message}`);
    }

    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }

    const { data: store, error: storeError } = await supabase
      .from('shopify_stores')
      .select('shop_name, access_token')
      .eq('id', cart.store_id)
      .maybeSingle();

    if (storeError) {
      console.error('Store error:', storeError);
    }

    const shippingRates = {
      standard: { price: '5.99', title: 'Livraison Standard (3-5 jours)' },
      express: { price: '12.99', title: 'Livraison Express (1-2 jours)' }
    };

    const shippingLine = shippingRates[shipping_method];

    const lineItems = items.map(item => ({
      title: item.product_snapshot.title,
      quantity: item.quantity,
      price: item.unit_price.toString()
    }));

    if (store && store.access_token && store.shop_name) {
      console.log('Creating Shopify order...');

      const shopifyOrder = {
        order: {
          email: customer.email,
          line_items: lineItems,
          customer: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            email: customer.email,
            phone: customer.phone
          },
          shipping_address: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            address1: customer.address,
            city: customer.city,
            zip: customer.postalCode,
            country: customer.country,
            phone: customer.phone
          },
          billing_address: {
            first_name: customer.firstName,
            last_name: customer.lastName,
            address1: customer.address,
            city: customer.city,
            zip: customer.postalCode,
            country: customer.country,
            phone: customer.phone
          },
          shipping_lines: [
            {
              title: shippingLine.title,
              price: shippingLine.price
            }
          ],
          note: `Commande OmniaChat - ${order_number} - Méthode de paiement: ${payment_method}`,
          tags: 'omniachat, ai-assisted',
          financial_status: 'pending'
        }
      };

      try {
        const shopifyResponse = await fetch(
          `https://${store.shop_name}/admin/api/2024-01/orders.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Shopify-Access-Token': store.access_token
            },
            body: JSON.stringify(shopifyOrder)
          }
        );

        if (!shopifyResponse.ok) {
          const errorText = await shopifyResponse.text();
          console.error('Shopify API error:', errorText);
        } else {
          const shopifyOrderData = await shopifyResponse.json();
          console.log('Shopify order created:', shopifyOrderData.order.id);
        }
      } catch (shopifyError) {
        console.error('Failed to create Shopify order:', shopifyError);
      }
    }

    await supabase
      .from('shopping_carts')
      .update({ status: 'converted' })
      .eq('id', cart_id);

    console.log('Order completed successfully:', order_number);

    return new Response(
      JSON.stringify({
        success: true,
        order_number,
        message: 'Order created successfully'
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating order:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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