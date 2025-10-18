import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("🧪 Testing DeepSeek connection...");

    // Get API keys
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("🔑 API Keys check:", {
      hasDeepSeek: !!deepseekKey,
      hasOpenAI: !!openaiKey,
    });

    if (!deepseekKey && !openaiKey) {
      return respond(500, {
        success: false,
        error: "No API keys configured. Please configure DEEPSEEK_API_KEY or OPENAI_API_KEY in Supabase Dashboard > Settings > Edge Functions > Secrets",
        keysFound: {
          DEEPSEEK_API_KEY: false,
          OPENAI_API_KEY: false,
        },
      });
    }

    // Try DeepSeek first
    if (deepseekKey) {
      console.log("🤖 Testing DeepSeek API...");
      const deepseekResult = await testDeepSeek(deepseekKey);

      if (deepseekResult.success) {
        return respond(200, {
          success: true,
          provider: "DeepSeek",
          model: "deepseek-chat",
          response: deepseekResult.response,
          duration: deepseekResult.duration,
          message: "DeepSeek API is working correctly!",
        });
      } else {
        console.log("⚠️ DeepSeek failed, trying OpenAI fallback...");
      }
    }

    // Fallback to OpenAI
    if (openaiKey) {
      console.log("🤖 Testing OpenAI API...");
      const openaiResult = await testOpenAI(openaiKey);

      if (openaiResult.success) {
        return respond(200, {
          success: true,
          provider: "OpenAI",
          model: "gpt-3.5-turbo",
          response: openaiResult.response,
          duration: openaiResult.duration,
          message: openaiResult.deepseekError
            ? `OpenAI working (DeepSeek failed: ${openaiResult.deepseekError})`
            : "OpenAI API is working correctly!",
        });
      } else {
        return respond(500, {
          success: false,
          error: "Both DeepSeek and OpenAI failed",
          details: {
            deepseek: openaiResult.deepseekError,
            openai: openaiResult.error,
          },
        });
      }
    }

    return respond(500, {
      success: false,
      error: "No working API provider found",
    });

  } catch (error) {
    console.error("💥 Error:", error);
    return respond(500, {
      success: false,
      error: error.message,
    });
  }
});

async function testDeepSeek(apiKey: string) {
  const startTime = Date.now();

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: "Say 'Hello! DeepSeek is working correctly.' in a single sentence.",
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ DeepSeek error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    console.log(`✅ DeepSeek responded in ${duration}s: ${message}`);

    return {
      success: true,
      response: message,
      duration: `${duration}s`,
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ DeepSeek exception after ${duration}s:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function testOpenAI(apiKey: string) {
  const startTime = Date.now();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Say 'Hello! OpenAI is working correctly.' in a single sentence.",
          },
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI error: ${response.status} - ${errorText}`);
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const message = data.choices[0].message.content;

    console.log(`✅ OpenAI responded in ${duration}s: ${message}`);

    return {
      success: true,
      response: message,
      duration: `${duration}s`,
    };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`❌ OpenAI exception after ${duration}s:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
}

function respond(status: number, data: any) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
