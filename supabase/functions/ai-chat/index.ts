import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log("💬 AI Chat request received");

    const { message, conversationId, storeId } = await req.json();

    if (!message) {
      return respond(400, { error: "Message is required" });
    }

    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    console.log("🔑 API Keys check:", {
      hasDeepSeek: !!deepseekKey,
      hasOpenAI: !!openaiKey,
    });

    if (!deepseekKey && !openaiKey) {
      return respond(500, {
        error: "No AI API keys configured",
        reply: "Désolé, le service de chat n'est pas configuré actuellement.",
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let conversationHistory = [];
    let storeSettings = null;

    if (storeId) {
      const { data: store } = await supabase
        .from("shopify_stores")
        .select("chat_welcome_message, chat_tone, chat_response_length, language")
        .eq("id", storeId)
        .maybeSingle();

      storeSettings = store;
      console.log("🏪 Store settings loaded:", storeSettings);
    }

    if (conversationId) {
      const { data: messages } = await supabase
        .from("chat_conversations")
        .select("message, response, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(10);

      if (messages) {
        conversationHistory = messages.flatMap((m) => [
          { role: "user", content: m.message },
          { role: "assistant", content: m.response },
        ]);
      }
    }

    const systemPrompt = buildSystemPrompt(storeSettings);
    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    let reply = null;
    let provider = null;
    let model = null;
    let duration = null;

    if (deepseekKey) {
      console.log("🤖 Trying DeepSeek...");
      const result = await callDeepSeek(deepseekKey, chatMessages);
      if (result.success) {
        reply = result.reply;
        provider = "DeepSeek";
        model = "deepseek-chat";
        duration = result.duration;
        console.log(`✅ DeepSeek responded in ${duration}`);
      } else {
        console.log(`⚠️ DeepSeek failed: ${result.error}`);
      }
    }

    if (!reply && openaiKey) {
      console.log("🤖 Trying OpenAI GPT-3.5-turbo...");
      const result = await callOpenAI(openaiKey, chatMessages, "gpt-3.5-turbo");
      if (result.success) {
        reply = result.reply;
        provider = "OpenAI";
        model = "gpt-3.5-turbo";
        duration = result.duration;
        console.log(`✅ OpenAI GPT-3.5 responded in ${duration}`);
      } else {
        console.log(`⚠️ OpenAI GPT-3.5 failed: ${result.error}`);
      }
    }

    if (!reply && openaiKey) {
      console.log("🤖 Trying OpenAI GPT-4o-mini (last resort)...");
      const result = await callOpenAI(openaiKey, chatMessages, "gpt-4o-mini");
      if (result.success) {
        reply = result.reply;
        provider = "OpenAI";
        model = "gpt-4o-mini";
        duration = result.duration;
        console.log(`✅ OpenAI GPT-4o-mini responded in ${duration}`);
      } else {
        console.log(`❌ All providers failed`);
      }
    }

    if (!reply) {
      return respond(500, {
        error: "All AI providers failed",
        reply: "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer.",
      });
    }

    const newConversationId = conversationId || crypto.randomUUID();

    if (storeId) {
      await supabase.from("chat_conversations").insert({
        conversation_id: newConversationId,
        store_id: storeId,
        message: message,
        response: reply,
        provider: provider,
        model: model,
      });
    }

    return respond(200, {
      reply: reply,
      conversationId: newConversationId,
      provider: provider,
      model: model,
      duration: duration,
    });

  } catch (error) {
    console.error("💥 Error:", error);
    return respond(500, {
      error: error.message,
      reply: "Désolé, une erreur s'est produite.",
    });
  }
});

function buildSystemPrompt(settings: any) {
  const tone = settings?.chat_tone || "friendly";
  const responseLength = settings?.chat_response_length || "balanced";
  const language = settings?.language || "fr";

  const toneInstructions = {
    professional: "Soyez professionnel et formel.",
    friendly: "Soyez amical et accueillant.",
    enthusiastic: "Soyez enthousiaste et énergique.",
    casual: "Soyez décontracté et conversationnel.",
  };

  const lengthInstructions = {
    concise: "Répondez de manière concise (2-3 phrases maximum).",
    balanced: "Répondez de manière équilibrée (3-5 phrases).",
    detailed: "Répondez de manière détaillée et complète.",
  };

  return `Vous êtes un assistant de chat pour une boutique en ligne de meubles.
${toneInstructions[tone]}
${lengthInstructions[responseLength]}
Répondez en ${language === "fr" ? "français" : "anglais"}.
Aidez les clients avec leurs questions sur les produits, les commandes et les conseils d'ameublement.`;
}

async function callDeepSeek(apiKey: string, messages: any[]) {
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
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const duration = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return {
      success: true,
      reply: reply,
      duration: duration,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function callOpenAI(apiKey: string, messages: any[], model: string) {
  const startTime = Date.now();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const duration = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return {
      success: true,
      reply: reply,
      duration: duration,
    };
  } catch (error) {
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
