import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  messages: DeepSeekMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { messages, model = 'deepseek-chat', temperature = 0.8, max_tokens = 800 } = await req.json() as DeepSeekRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages array is required and must not be empty');
    }

    // Try to get API key from environment variables first, then fallback to hardcoded
    let deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
    
    if (!deepseekApiKey) {
      deepseekApiKey = 'sk-f8371ab077764e799458200be57edd9f';
      console.warn('Using hardcoded DeepSeek API key. Please set DEEPSEEK_API_KEY environment variable.');
    }

    if (!deepseekApiKey || deepseekApiKey.trim() === '') {
      throw new Error('DeepSeek API key is not configured. Please provide DEEPSEEK_API_KEY.');
    }
    
    console.log('Calling DeepSeek API...');
    console.log('Model:', model);
    console.log('Messages count:', messages.length);
    console.log('API Key present:', !!deepseekApiKey);
    console.log('API Key length:', deepseekApiKey.length);
    console.log('API Key starts with:', deepseekApiKey.substring(0, 8));

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    const responseText = await response.text();
    console.log('DeepSeek API response status:', response.status);
    console.log('DeepSeek API response:', responseText);

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status, responseText);
      
      let errorMessage = `DeepSeek API request failed: ${response.status}`;
      
      if (response.status === 401) {
        errorMessage = 'Invalid or expired DeepSeek API key. Please check your API key at https://platform.deepseek.com/api_keys';
      } else if (response.status === 429) {
        errorMessage = 'DeepSeek API rate limit exceeded. Please try again later.';
      }
      
      throw new Error(`${errorMessage} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('DeepSeek response received successfully');

    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('DeepSeek Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
        hint: 'Please verify your DeepSeek API key at https://platform.deepseek.com/api_keys',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
