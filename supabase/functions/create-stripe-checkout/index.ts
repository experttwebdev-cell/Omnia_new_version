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
    name: 'Omnia AI',
    version: '1.0.0'
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // Validation des paramètres
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
      console.error('❌ Authentication error:', getUserError);
      return corsResponse({
        error: 'Failed to authenticate user'
      }, 401);
    }

    console.log('🔍 Getting plan details for:', plan_id);

    // Récupérer les détails du forfait
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      console.error('❌ Plan not found:', planError);
      return corsResponse({
        error: 'Plan not found'
      }, 404);
    }

    console.log('📋 Plan found:', plan.name);

    // Obtenir le bon Stripe Price ID basé sur la période de facturation
    const stripePriceId = billing_period === 'yearly' 
      ? plan.stripe_price_id_yearly 
      : plan.stripe_price_id;

    console.log('💰 Stripe Price ID to use:', stripePriceId);
    console.log('📅 Billing period:', billing_period);

    if (!stripePriceId || !stripePriceId.startsWith('price_')) {
      console.error(`❌ Invalid Stripe Price ID for plan ${plan_id}: ${stripePriceId}`);
      return corsResponse({
        error: `Configuration incomplète: Le forfait "${plan.name}" n'a pas de tarif Stripe configuré pour la facturation ${billing_period === 'monthly' ? 'mensuelle' : 'annuelle'}.`
      }, 400);
    }

    // Vérifier que le prix existe dans Stripe
    try {
      const price = await stripe.prices.retrieve(stripePriceId);
      console.log('✅ Stripe price verified:', price.id);
    } catch (priceError) {
      console.error('❌ Stripe price not found:', priceError);
      return corsResponse({
        error: `Le tarif Stripe n'existe pas. Veuillez vérifier la configuration.`
      }, 400);
    }

    // Obtenir ou créer le seller
    let sellerData;
    const { data: existingSeller, error: sellerError } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', user.id)
      .single();

    if (sellerError || !existingSeller) {
      console.log('👤 Creating new seller record...');
      
      // Créer le seller s'il n'existe pas
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
        console.error('❌ Failed to create seller:', createSellerError);
        return corsResponse({
          error: 'Failed to create seller profile'
        }, 500);
      }
      sellerData = newSeller;
    } else {
      sellerData = existingSeller;
    }

    console.log('👤 Seller data:', sellerData.email);

    // Créer ou récupérer le client Stripe
    let customerId = sellerData.stripe_customer_id;
    if (!customerId) {
      console.log('👥 Creating new Stripe customer...');
      const customer = await stripe.customers.create({
        email: sellerData.email,
        name: sellerData.full_name,
        metadata: {
          seller_id: user.id,
          company_name: sellerData.company_name
        }
      });
      customerId = customer.id;

      // Mettre à jour le seller avec l'ID client Stripe
      const { error: updateError } = await supabase
        .from('sellers')
        .update({ 
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('⚠️ Failed to update seller with Stripe customer ID:', updateError);
        // Continuer quand même, nous avons l'ID client
      }
    }

    console.log('🎫 Creating Stripe checkout session...');

    // Créer la session Stripe Checkout
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
        trial_period_days: plan.trial_days || 14,
        metadata: {
          seller_id: user.id,
          plan_id: plan_id,
          billing_period: billing_period,
          plan_name: plan.name
        }
      },
      success_url: success_url || `${new URL(req.url).origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${new URL(req.url).origin}/signup?checkout=cancelled&plan_id=${plan_id}`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      custom_text: {
        submit: {
          message: `Essai gratuit de ${plan.trial_days || 14} jours. Aucun paiement requis aujourd'hui.`
        }
      }
    });

    console.log('✅ Checkout session created:', session.id);

    return corsResponse({
      success: true,
      session_id: session.id,
      url: session.url,
      customer_id: customerId
    });

  } catch (error) {
    console.error('💥 Checkout error:', error);
    return corsResponse({
      error: error.message || 'Une erreur est survenue lors de la création de la session de paiement'
    }, 500);
  }
});