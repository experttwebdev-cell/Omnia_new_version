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

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature, stream: true }),
    });

    if (!response.ok || !response.body) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: errText }), {
        status: response.status,
        headers: corsHeaders,
      });
    }

    // 🔥 STREAM (proxy direct du flux DeepSeek)
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let partial = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          partial += decoder.decode(value, { stream: true });
          controller.enqueue(value);
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("DeepSeek stream error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
