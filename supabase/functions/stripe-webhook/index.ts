// stripe-webhook.ts - Updated version
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!stripeSecret || !stripeWebhookSecret || !supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error.message);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    // Process the event asynchronously
    EdgeRuntime.waitUntil(handleEvent(event));

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function handleEvent(event: Stripe.Event) {
  const data = event.data.object;
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(data as Stripe.Checkout.Session);
      break;
    
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(data as Stripe.Subscription);
      break;
    
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(data as Stripe.Subscription);
      break;
    
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(data as Stripe.Invoice);
      break;
    
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { customer, subscription, metadata } = session;
  
  if (!customer || typeof customer !== 'string') {
    console.error('No customer found in session');
    return;
  }

  // Find seller by stripe_customer_id
  const { data: seller, error } = await supabase
    .from('sellers')
    .select('*')
    .eq('stripe_customer_id', customer)
    .single();

  if (error || !seller) {
    console.error('Seller not found for customer:', customer);
    return;
  }

  if (subscription && typeof subscription === 'string') {
    // Update seller subscription status
    const { error: updateError } = await supabase
      .from('sellers')
      .update({
        subscription_status: 'active',
        status: 'active',
        current_plan_id: metadata?.plan_id,
        trial_ends_at: null
      })
      .eq('id', seller.id);

    if (updateError) {
      console.error('Error updating seller subscription:', updateError);
    } else {
      console.log(`✅ Updated seller subscription for: ${seller.email}`);
    }

    // Create subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .upsert({
        seller_id: seller.id,
        stripe_subscription_id: subscription,
        plan_id: metadata?.plan_id,
        status: 'active',
        billing_period: metadata?.billing_period,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        cancel_at_period_end: false
      });

    if (subError) {
      console.error('Error creating subscription record:', subError);
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { customer, status, current_period_start, current_period_end, cancel_at_period_end } = subscription;

  if (typeof customer !== 'string') return;

  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: status as any,
      current_period_start: new Date(current_period_start * 1000).toISOString(),
      current_period_end: new Date(current_period_end * 1000).toISOString(),
      cancel_at_period_end
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { customer } = subscription;

  if (typeof customer !== 'string') return;

  // Update seller status
  const { error: sellerError } = await supabase
    .from('sellers')
    .update({
      subscription_status: 'cancelled',
      status: 'inactive',
      current_plan_id: null
    })
    .eq('stripe_customer_id', customer);

  if (sellerError) {
    console.error('Error updating seller status:', sellerError);
  }

  // Update subscription status
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled'
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    console.error('Error updating subscription status:', subError);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Handle successful payments for subscription renewals
  console.log('Invoice payment succeeded:', invoice.id);
}