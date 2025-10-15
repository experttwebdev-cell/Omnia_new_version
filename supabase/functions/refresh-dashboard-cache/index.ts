import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

/**
 * Refresh Dashboard Cache Edge Function
 * 
 * This function refreshes all materialized view caches used by the dashboard.
 * It can be triggered:
 * - Manually via HTTP request
 * - Automatically via Supabase cron/webhook (every 10 minutes)
 * - On-demand from the frontend
 * 
 * Returns status and timing information for monitoring.
 */

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();

    // Create Supabase admin client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Starting cache refresh at", new Date().toISOString());

    // Call the database function to refresh all caches
    const { data, error } = await supabaseClient.rpc("refresh_all_caches");

    if (error) {
      console.error("Error refreshing caches:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log("Cache refresh completed in", totalDuration, "ms");

    // Return success response with detailed information
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        duration_ms: totalDuration,
        caches_refreshed: data.caches_refreshed || [
          "fast_dashboard_cache",
          "fast_products_list_cache",
          "product_type_statistics_cache",
        ],
        message: "All dashboard caches refreshed successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in cache refresh:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
