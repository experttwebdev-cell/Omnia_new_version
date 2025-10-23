import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY is required');
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Omnia AI',
    version: '1.0.0'
  }
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
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
      return new Response('Method not allowed', {
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature found', {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Process the event asynchronously
    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({
      received: true
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({
      error: error.message
    }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};
  
  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.created':
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { customer, mode, subscription, payment_intent } = session;
  
  if (!customer || typeof customer !== 'string') {
    console.error('No customer found in session');
    return;
  }

  if (mode === 'subscription' && subscription) {
    console.info(`Processing subscription checkout for customer: ${customer}`);
    await syncCustomerFromStripe(customer);
    
    // Update seller subscription status
    const { error: updateError } = await supabase
      .from('sellers')
      .update({ 
        subscription_status: 'active',
        current_plan_id: session.metadata?.plan_id,
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('stripe_customer_id', customer);

    if (updateError) {
      console.error('Error updating seller subscription:', updateError);
    }
  } else if (mode === 'payment' && payment_intent) {
    console.info(`Processing one-time payment for customer: ${customer}`);
    await handleOneTimePayment(session);
  }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const { customer } = subscription;
  
  if (typeof customer === 'string') {
    console.info(`Syncing subscription for customer: ${customer}`);
    await syncCustomerFromStripe(customer);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { customer } = subscription;
  
  if (typeof customer === 'string') {
    console.info(`Subscription deleted for customer: ${customer}`);
    
    // Update seller subscription status
    const { error: updateError } = await supabase
      .from('sellers')
      .update({ 
        subscription_status: 'cancelled',
        current_plan_id: null
      })
      .eq('stripe_customer_id', customer);

    if (updateError) {
      console.error('Error updating seller subscription status:', updateError);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Handle one-time payments if needed
  if (!paymentIntent.invoice) {
    console.info('Processing one-time payment intent');
    // Add your one-time payment logic here
  }
}

async function handleOneTimePayment(session: Stripe.Checkout.Session) {
  const { id: checkout_session_id, customer, payment_intent, amount_subtotal, amount_total, currency, payment_status } = session;

  if (!customer || typeof customer !== 'string') {
    console.error('No customer found for one-time payment');
    return;
  }

  try {
    const { error: orderError } = await supabase.from('stripe_orders').insert({
      checkout_session_id,
      payment_intent_id: payment_intent,
      customer_id: customer,
      amount_subtotal,
      amount_total,
      currency,
      payment_status,
      status: 'completed'
    });

    if (orderError) {
      console.error('Error inserting order:', orderError);
      return;
    }

    console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
  } catch (error) {
    console.error('Error processing one-time payment:', error);
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method']
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert({
        customer_id: customerId,
        subscription_status: 'not_started'
      }, {
        onConflict: 'customer_id'
      });

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
      return;
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
    const subscriptionData: any = {
      customer_id: customerId,
      subscription_id: subscription.id,
      price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      status: subscription.status
    };

    // Add payment method details if available
    if (subscription.default_payment_method && typeof subscription.default_payment_method !== 'string') {
      const paymentMethod = subscription.default_payment_method as Stripe.PaymentMethod;
      subscriptionData.payment_method_brand = paymentMethod.card?.brand ?? null;
      subscriptionData.payment_method_last4 = paymentMethod.card?.last4 ?? null;
    }

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(subscriptionData, {
      onConflict: 'customer_id'
    });

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }

    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}