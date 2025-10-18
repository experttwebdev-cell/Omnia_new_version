//
// ⚙️ STREAMING DIRECT VIA DEEPSEEK PROXY - VERSION CORRIGÉE
//
async function streamDeepSeek(
  messages: ChatMessage[],
  onChunk: (text: string) => void
): Promise<void> {
  const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
  
  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL non configurée");
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        model: "deepseek-chat",
        temperature: 0.7,
        stream: true
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error("No response body for stream");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Garder la dernière ligne incomplète dans le buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith('data: ') && !line.includes('[DONE]')) {
          try {
            const data = JSON.parse(line.slice(6));
            const chunk = data.choices?.[0]?.delta?.content;
            if (chunk) {
              onChunk(chunk);
            }
          } catch (e) {
            // Ignorer les lignes JSON invalides
            console.log("❌ JSON parse error for line:", line);
          }
        }
      }
    }

    // Traiter le buffer final
    if (buffer.startsWith('data: ') && !buffer.includes('[DONE]')) {
      try {
        const data = JSON.parse(buffer.slice(6));
        const chunk = data.choices?.[0]?.delta?.content;
        if (chunk) {
          onChunk(chunk);
        }
      } catch (e) {
        // Ignorer
      }
    }

  } catch (error) {
    console.error("❌ Stream error:", error);
    throw error;
  }
}