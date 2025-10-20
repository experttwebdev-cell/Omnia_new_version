import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@14.14.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      throw new Error("Stripe secret key not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get request body
    const { plan_id, billing_period, success_url, cancel_url } = await req.json();

    // Get JWT from header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Get seller info
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("email, full_name, company_name")
      .eq("id", user.id)
      .single();

    if (sellerError) throw sellerError;

    // Get plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", plan_id)
      .single();

    if (planError) throw planError;

    // Calculate price
    const amount = billing_period === "annual" 
      ? parseFloat(plan.price_annual) 
      : parseFloat(plan.price_monthly);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: seller.email,
      client_reference_id: user.id,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan.name,
              description: `${plan.name} - ${billing_period === "annual" ? "Annuel" : "Mensuel"}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
            recurring: {
              interval: billing_period === "annual" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        seller_id: user.id,
        plan_id: plan_id,
        billing_period: billing_period,
      },
      subscription_data: {
        metadata: {
          seller_id: user.id,
          plan_id: plan_id,
          billing_period: billing_period,
        },
        trial_period_days: 14, // 14 days free trial
      },
      success_url: success_url || `${req.headers.get("origin")}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/signup?step=3`,
    });

    console.log(`✅ Checkout session created for ${seller.email}: ${session.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        url: session.url,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("💥 Stripe checkout error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
