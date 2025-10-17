import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const { messages, model = "deepseek-chat", temperature = 0.7 } = await req.json();
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const text = await res.text();
    return new Response(text, {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({
        error: true,
        message: err.message,
        response: "Erreur de communication avec DeepSeek API",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
