import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase configuration missing");
    }
    
    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16"
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request body
    const { plan_id, billing_period, success_url, cancel_url } = await req.json();
    
    // Validation des paramètres requis
    if (!plan_id || !billing_period) {
      throw new Error("Missing required parameters: plan_id and billing_period");
    }

    // Get JWT from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized: " + (userError?.message || "Invalid token"));
    }

    // Get seller info
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("email, full_name, company_name, stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (sellerError) throw new Error("Seller not found: " + sellerError.message);

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError) throw new Error("Plan not found: " + planError.message);

    // Get the appropriate Stripe Price ID based on billing period
    const stripePriceId = billing_period === "annual" || billing_period === "yearly"
      ? plan.stripe_price_id_yearly
      : plan.stripe_price_id_monthly;

    if (!stripePriceId) {
      throw new Error(`Stripe Price ID not configured for ${billing_period} billing on plan ${plan.name}`);
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
      await supabase
        .from("sellers")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Create Stripe Checkout Session using pre-configured Price IDs
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: customerId,
      client_reference_id: user.id,

      line_items: [
        {
          price: stripePriceId,
          quantity: 1
        }
      ],

      // Metadata for webhook
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

      // Custom success and cancel URLs
      success_url: success_url || `${req.headers.get("origin")}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/pricing?checkout=cancelled`,

      // Additional configuration
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },

      // Custom text
      custom_text: {
        submit: {
          message: `Essai gratuit de 14 jours. Aucun paiement aujourd'hui - le premier débit aura lieu dans 14 jours.`
        }
      }
    });

    console.log(`✅ Checkout session created for ${seller.email}: ${session.id}`);

    return new Response(JSON.stringify({
      success: true,
      session_id: session.id,
      url: session.url,
      customer_id: customerId
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (error) {
    console.error("💥 Stripe checkout error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.type || 'unknown_error'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});