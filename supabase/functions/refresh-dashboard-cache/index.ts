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

    // Refresh all legacy caches
    const { data: legacyData, error: legacyError } = await supabaseClient.rpc("refresh_all_caches");

    if (legacyError) {
      console.warn("Legacy cache refresh error:", legacyError.message);
    } else {
      console.log("Legacy caches refreshed");
    }

    // Refresh quick filter stats cache
    const { error: quickStatsError } = await supabaseClient.rpc("refresh_quick_filter_stats");

    if (quickStatsError) {
      console.warn("Quick filter stats error:", quickStatsError.message);
    } else {
      console.log("Quick filter stats cache refreshed");
    }

    // Refresh new SEO-optimized caches
    const { data: seoData, error: seoError } = await supabaseClient.rpc("refresh_all_seo_caches");

    if (seoError) {
      console.error("Error refreshing SEO caches:", seoError);
      return new Response(
        JSON.stringify({
          success: false,
          error: seoError.message,
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

    console.log("All caches refreshed in", totalDuration, "ms");

    // Return success response with detailed information
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        duration_ms: totalDuration,
        caches_refreshed: [
          ...(legacyData?.caches_refreshed || []),
          "quick_filter_stats_cache",
          ...(seoData?.refreshed_views || [
            "seo_optimization_tab_cache",
            "alt_image_tab_cache",
            "tags_tab_cache",
            "opportunities_cache",
            "seo_tabs_aggregate_stats"
          ])
        ],
        message: "All dashboard and SEO caches refreshed successfully",
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
