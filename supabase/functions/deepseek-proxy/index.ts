import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages, model = "deepseek-chat", temperature = 0.7, stream = false } = await req.json();
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    
    if (!apiKey) {
      throw new Error("Missing DEEPSEEK_API_KEY");
    }

    console.log(`📨 Received ${messages.length} messages, stream: ${stream}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: stream // ⚠️ Respecter le paramètre stream du frontend
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: true,
          message: `API error: ${response.status}`,
          response: "Erreur de communication avec DeepSeek"
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    // 🔥 SI STREAMING = true
    if (stream) {
      if (!response.body) {
        throw new Error("No response body for streaming");
      }
      
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache"
        }
      });
    }

    // 🔥 SI STREAMING = false (MODE NORMAL - JSON)
    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });

  } catch (err) {
    console.error("DeepSeek proxy error:", err);
    
    return new Response(
      JSON.stringify({
        error: true,
        message: err.message,
        response: "Erreur technique temporaire"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});