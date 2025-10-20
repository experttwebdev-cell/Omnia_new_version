import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, Stripe-Signature"
};

// Initialize clients
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16"
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    // Get the signature from the header
    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    if (!stripeWebhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    // Get the raw body
    const body = await req.text();

    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(JSON.stringify({
        error: "Invalid signature"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`🔔 Webhook received: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({
      received: true,
      event: event.type
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});

// ===== EVENT HANDLERS =====

async function handleCheckoutSessionCompleted(session: any) {
  console.log(`🛒 Checkout completed for session: ${session.id}`);

  const sellerId = session.metadata.seller_id;
  const planId = session.metadata.plan_id;
  const billingPeriod = session.metadata.billing_period;

  if (!sellerId || !planId) {
    throw new Error("Missing metadata in checkout session");
  }

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription);

  // Update seller's subscription
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      seller_id: sellerId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer,
      plan_id: planId,
      status: subscription.status,
      billing_period: billingPeriod,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'seller_id'
    });

  if (error) {
    throw new Error(`Failed to update subscription: ${error.message}`);
  }

  // Update seller status
  await supabase
    .from('sellers')
    .update({
      status: 'active',
      plan_type: session.metadata.plan_name,
      billing_period: billingPeriod,
      stripe_customer_id: session.customer,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('id', sellerId);

  console.log(`✅ Subscription activated for seller: ${sellerId}`);
}

async function handleSubscriptionCreated(subscription: any) {
  console.log(`🆕 Subscription created: ${subscription.id}`);

  const sellerId = subscription.metadata.seller_id;
  if (!sellerId) return;

  await updateSellerSubscription(sellerId, subscription);
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log(`📝 Subscription updated: ${subscription.id}`);

  const sellerId = subscription.metadata.seller_id;
  if (!sellerId) return;

  await updateSellerSubscription(sellerId, subscription);
}

async function handleSubscriptionDeleted(subscription: any) {
  console.log(`🗑️ Subscription deleted: ${subscription.id}`);

  const sellerId = subscription.metadata.seller_id;
  if (!sellerId) return;

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  // Update seller status
  await supabase
    .from('sellers')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('id', sellerId);

  console.log(`❌ Subscription canceled for seller: ${sellerId}`);
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log(`💰 Payment succeeded for invoice: ${invoice.id}`);

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const sellerId = subscription.metadata.seller_id;

  if (!sellerId) return;

  // Record payment in database
  const { error } = await supabase
    .from('payments')
    .insert({
      seller_id: sellerId,
      stripe_invoice_id: invoice.id,
      stripe_payment_intent_id: invoice.payment_intent,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: 'succeeded',
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Failed to record payment:', error);
  }

  console.log(`✅ Payment recorded for seller: ${sellerId}`);
}

async function handleInvoicePaymentFailed(invoice: any) {
  console.log(`❌ Payment failed for invoice: ${invoice.id}`);

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
  const sellerId = subscription.metadata.seller_id;

  if (!sellerId) return;

  // Record failed payment
  await supabase
    .from('payments')
    .insert({
      seller_id: sellerId,
      stripe_invoice_id: invoice.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: 'failed',
      failure_reason: invoice.last_payment_error?.message || 'unknown',
      created_at: new Date().toISOString()
    });

  // Send notification to seller (you can implement this later)
  console.log(`⚠️ Payment failed for seller: ${sellerId}`);
}

// ===== HELPER FUNCTIONS =====

async function updateSellerSubscription(sellerId: string, subscription: any) {
  const status = subscription.status === 'active' ? 'active' : 
                 subscription.status === 'trialing' ? 'trial' : 
                 subscription.status === 'past_due' ? 'past_due' : 
                 subscription.status === 'canceled' ? 'canceled' : 
                 'inactive';

  // Update subscription
  const { error: subError } = await supabase
    .from('subscriptions')
    .update({
      status: status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (subError) {
    throw new Error(`Failed to update subscription: ${subError.message}`);
  }

  // Update seller
  const { error: sellerError } = await supabase
    .from('sellers')
    .update({
      status: status === 'trial' ? 'trial' : 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', sellerId);

  if (sellerError) {
    throw new Error(`Failed to update seller: ${sellerError.message}`);
  }

  console.log(`✅ Subscription updated for seller: ${sellerId}, status: ${status}`);
}