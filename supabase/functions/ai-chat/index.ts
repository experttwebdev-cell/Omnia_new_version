import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  storeId?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { message, history = [], storeId } = await req.json() as ChatRequest;

    if (!message) {
      throw new Error('Message is required');
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const intent = await detectIntent(message, history);
    
    let responseMessage: string;
    let products = [];
    let selectedProduct = null;

    if (intent === 'product_search') {
      products = await searchProducts(supabase, message, storeId);
      
      if (products.length === 0) {
        responseMessage = "Je suis désolé, je n'ai pas trouvé de produits correspondant à votre recherche. Pouvez-vous me donner plus de détails sur ce que vous recherchez ?";
      } else if (products.length === 1) {
        selectedProduct = products[0];
        responseMessage = `J'ai trouvé exactement ce qu'il vous faut ! Voici le ${selectedProduct.title}.`;
      } else {
        responseMessage = `J'ai trouvé ${products.length} produits qui pourraient vous intéresser. Laissez-moi vous les présenter.`;
      }
    } else if (intent === 'product_show') {
      const productId = extractProductId(message);
      if (productId) {
        const { data, error } = await supabase
          .from('shopify_products')
          .select('*')
          .eq('id', productId)
          .maybeSingle();
        
        if (data) {
          selectedProduct = data;
          responseMessage = `Voici les détails complets du produit ${data.title}.`;
        } else {
          responseMessage = "Je n'ai pas pu trouver ce produit. Puis-je vous aider avec autre chose ?";
        }
      } else {
        responseMessage = "Quel produit souhaitez-vous voir en détail ?";
      }
    } else {
      responseMessage = await generateChatResponse(openaiApiKey, message, history);
    }

    return new Response(
      JSON.stringify({
        message: responseMessage,
        intent,
        products: products.slice(0, 8),
        selectedProduct,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI Chat error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred',
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

async function detectIntent(message: string, history: ChatMessage[]): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  const productSearchKeywords = [
    'cherche', 'recherche', 'besoin', 'veux', 'voudrais', 'trouve',
    'canapé', 'table', 'chaise', 'lit', 'meuble', 'lampe',
    'scandinave', 'moderne', 'industriel', 'rustique',
    'salon', 'chambre', 'cuisine', 'bureau'
  ];
  
  const productShowKeywords = [
    'montre', 'voir', 'détails', 'plus d\'infos', 'caractéristiques',
    'ce produit', 'cet article', 'celui-ci', 'celui-là'
  ];
  
  for (const keyword of productShowKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'product_show';
    }
  }
  
  for (const keyword of productSearchKeywords) {
    if (lowerMessage.includes(keyword)) {
      return 'product_search';
    }
  }
  
  return 'chat';
}

async function searchProducts(supabase: any, query: string, storeId?: string): Promise<any[]> {
  const lowerQuery = query.toLowerCase();
  
  const styleKeywords: Record<string, string> = {
    'scandinave': 'scandinavian',
    'moderne': 'modern',
    'industriel': 'industrial',
    'minimaliste': 'minimalist',
    'rustique': 'rustic',
    'contemporain': 'contemporary'
  };
  
  const roomKeywords: Record<string, string> = {
    'salon': 'living_room',
    'chambre': 'bedroom',
    'cuisine': 'kitchen',
    'bureau': 'office',
    'salle à manger': 'dining_room',
    'salle de bain': 'bathroom'
  };
  
  let queryBuilder = supabase
    .from('shopify_products')
    .select('*')
    .eq('status', 'active')
    .limit(12);
  
  if (storeId) {
    queryBuilder = queryBuilder.eq('store_id', storeId);
  }
  
  let styleMatch = null;
  for (const [french, english] of Object.entries(styleKeywords)) {
    if (lowerQuery.includes(french)) {
      styleMatch = english;
      break;
    }
  }
  
  let roomMatch = null;
  for (const [french, english] of Object.entries(roomKeywords)) {
    if (lowerQuery.includes(french)) {
      roomMatch = english;
      break;
    }
  }
  
  if (styleMatch) {
    queryBuilder = queryBuilder.eq('style', styleMatch);
  }
  
  if (roomMatch) {
    queryBuilder = queryBuilder.eq('room', roomMatch);
  }
  
  if (!styleMatch && !roomMatch) {
    queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.ilike.%${query}%`);
  }
  
  const { data, error } = await queryBuilder;
  
  if (error) {
    console.error('Product search error:', error);
    return [];
  }
  
  return data || [];
}

function extractProductId(message: string): string | null {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = message.match(uuidRegex);
  return match ? match[0] : null;
}

async function generateChatResponse(
  apiKey: string,
  message: string,
  history: ChatMessage[]
): Promise<string> {
  const messages = [
    {
      role: 'system',
      content: `Tu es un assistant commercial virtuel expert en décoration et ameublement. Tu aides les clients à trouver les meubles et accessoires parfaits pour leur intérieur. Tu es chaleureux, professionnel et tu poses des questions pertinentes pour bien comprendre les besoins des clients. Tu guides naturellement vers l'achat en présentant les avantages des produits.`
    },
    ...history,
    { role: 'user', content: message }
  ];
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 300,
    }),
  });
  
  if (!response.ok) {
    throw new Error('OpenAI API request failed');
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}
