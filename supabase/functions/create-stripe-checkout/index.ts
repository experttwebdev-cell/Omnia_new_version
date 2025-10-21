import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase configuration is required');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0'
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    const error = validateParameters({
      price_id: plan_id, // Map plan_id to price_id for validation
      success_url,
      cancel_url,
      mode: 'subscription'
    }, {
      price_id: 'string',
      success_url: 'string', 
      cancel_url: 'string',
      mode: {
        values: ['subscription']
      }
    });

    if (error) {
      return corsResponse({
        error
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

    // Get plan details
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
      return corsResponse({
        error: 'Seller not found'
      }, 404);
    }

    // Create or get Stripe customer
    let customerId = seller.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: seller.email,
        name: seller.full_name,
        metadata: {
          seller_id: user.id,
          company_name: seller.company_name
        }
      });
      customerId = customer.id;

      // Update seller with Stripe customer ID
      const { error: updateError } = await supabase
        .from('sellers')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);

      if (updateError) {
        console.error('Failed to update seller with Stripe customer ID:', updateError);
      }
    }

    // Create Stripe Checkout Session
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

function validateParameters(values: any, expected: any) {
  for (const parameter in expected) {
    const expectation = expected[parameter];
    const value = values[parameter];

    if (expectation === 'string') {
      if (value == null) {
        return `Missing required parameter ${parameter}`;
      }
      if (typeof value !== 'string') {
        return `Expected parameter ${parameter} to be a string got ${JSON.stringify(value)}`;
      }
    } else {
      if (!expectation.values.includes(value)) {
        return `Expected parameter ${parameter} to be one of ${expectation.values.join(', ')}`;
      }
    }
  }
  return undefined;
}