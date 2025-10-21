import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0'
  }
});

const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '');

// Helper function to create responses with CORS headers
function corsResponse(body: any, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*'
  };

  if (status === 204) {
    return new Response(null, {
      status,
      headers
    });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json'
    }
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({
        error: 'Method not allowed'
      }, 405);
    }

    const { plan_id, billing_period, success_url, cancel_url } = await req.json();
    
    // Validate required parameters
    if (!plan_id || !billing_period) {
      return corsResponse({
        error: 'Missing required parameters: plan_id and billing_period'
      }, 400);
    }

    if (!['monthly', 'yearly'].includes(billing_period)) {
      return corsResponse({
        error: 'Invalid billing_period. Must be "monthly" or "yearly"'
      }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({
        error: 'No authorization header'
      }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(token);
    
    if (getUserError || !user) {
      return corsResponse({
        error: 'Failed to authenticate user'
      }, 401);
    }

    // Get plan details from subscription_plans table
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return corsResponse({
        error: 'Plan not found'
      }, 404);
    }

    // Get the appropriate Stripe Price ID based on billing period
    const stripePriceId = billing_period === 'yearly' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id_monthly;

    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      console.error(`Invalid Stripe Price ID for plan ${plan_id}: ${stripePriceId}`);
      return corsResponse({
        error: `Configuration incomplète: Le forfait "${plan.name}" n'a pas de tarif Stripe configuré pour la facturation ${billing_period === 'monthly' ? 'mensuelle' : 'annuelle'}.`
      }, 400);
    }

    // Get or create seller
    const { data: seller, error: sellerError } = await supabase
      .from('sellers')
      .select('email, full_name, company_name, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (sellerError) {
      console.error('Seller not found, creating new seller record...');
      
      // Create seller record if it doesn't exist
      const { data: newSeller, error: createSellerError } = await supabase
        .from('sellers')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          company_name: user.user_metadata?.company_name || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createSellerError) {
        console.error('Failed to create seller:', createSellerError);
        return corsResponse({
          error: 'Failed to create seller profile'
        }, 500);
      }
    }

    // Re-fetch seller data to ensure we have the latest
    const { data: sellerData, error: finalSellerError } = await supabase
      .from('sellers')
      .select('email, full_name, company_name, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (finalSellerError || !sellerData) {
      return corsResponse({
        error: 'Seller profile not found'
      }, 404);
    }

    // Create or get Stripe customer
    let customerId = sellerData.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: sellerData.email,
        name: sellerData.full_name,
        metadata: {
          seller_id: user.id,
          company_name: sellerData.company_name
        }
      });
      customerId = customer.id;

      // Update seller with Stripe customer ID
      const { error: updateError } = await supabase
        .from('sellers')
        .update({ 
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update seller with Stripe customer ID:', updateError);
        // Continue anyway, as we have the customer ID
      }
    }

    // Create Stripe Checkout Session with trial
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{
        price: stripePriceId,
        quantity: 1
      }],
      metadata: {
        seller_id: user.id,
        plan_id: plan_id,
        billing_period: billing_period,
        plan_name: plan.name
      },
      subscription_data: {
        trial_period_days: 14,
        metadata: {
          seller_id: user.id,
          plan_id: plan_id,
          billing_period: billing_period,
          plan_name: plan.name
        }
      },
      success_url: success_url || `${new URL(req.url).origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${new URL(req.url).origin}/pricing?checkout=cancelled`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      custom_text: {
        submit: {
          message: 'Essai gratuit de 14 jours. Aucun paiement requis aujourd\'hui.'
        }
      }
    });

    console.log(`Created checkout session ${session.id} for customer ${customerId}`);

    return corsResponse({
      success: true,
      session_id: session.id,
      url: session.url,
      customer_id: customerId
    });

  } catch (error) {
    console.error(`Checkout error: ${error.message}`);
    return corsResponse({
      error: error.message
    }, 500);
  }
});