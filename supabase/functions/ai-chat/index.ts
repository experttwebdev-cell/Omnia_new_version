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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, history = [], storeId } = await req.json() as ChatRequest;

    if (!message) {
      throw new Error('Message is required');
    }

    console.log('Received message:', message);
    console.log('Store ID:', storeId);

    const deepseekApiKey = 'sk-f8371ab077764e799458200be57edd9f';
    if (!deepseekApiKey) {
      console.error('DeepSeek API key not configured');
      throw new Error('DeepSeek API key not configured.');
    }

    const intent = await detectIntent(message, history);
    console.log('Detected intent:', intent);

    let responseMessage: string;
    let products = [];
    let selectedProduct = null;

    if (intent === 'product_search') {
      console.log('Searching products for query:', message);
      products = await searchProducts(supabase, message, storeId);
      console.log('Found products:', products.length);

      if (products.length === 0) {
        responseMessage = "Je suis désolé, je n'ai pas trouvé de produits correspondant à votre recherche. Pouvez-vous me donner plus de détails sur ce que vous recherchez ? Par exemple, le style (scandinave, moderne), la pièce (salon, chambre), ou le type de meuble ?";
      } else if (products.length === 1) {
        selectedProduct = products[0];
        responseMessage = `J'ai trouvé exactement ce qu'il vous faut ! Voici "${selectedProduct.title}". ${selectedProduct.ai_enhanced_description || selectedProduct.description || ''}`;
      } else {
        responseMessage = `Excellent ! J'ai trouvé ${products.length} produits qui correspondent à votre recherche. Voici ma sélection pour vous :`;
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
      responseMessage = await generateChatResponse(deepseekApiKey, message, history);
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
    'contemporain': 'contemporary',
    'vintage': 'vintage',
    'classique': 'classic'
  };

  const roomKeywords: Record<string, string> = {
    'salon': 'living_room',
    'chambre': 'bedroom',
    'cuisine': 'kitchen',
    'bureau': 'office',
    'salle à manger': 'dining_room',
    'salle de bain': 'bathroom',
    'entrée': 'entryway',
    'jardin': 'garden'
  };

  const productTypes: Record<string, string[]> = {
    'canapé': ['sofa', 'couch', 'canapé'],
    'table': ['table', 'desk'],
    'chaise': ['chair', 'seat', 'chaise'],
    'lit': ['bed', 'lit'],
    'armoire': ['wardrobe', 'cabinet', 'armoire'],
    'étagère': ['shelf', 'bookcase', 'étagère'],
    'lampe': ['lamp', 'light', 'lampe'],
    'tapis': ['rug', 'carpet', 'tapis']
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
      console.log('Style match:', styleMatch);
      break;
    }
  }

  let roomMatch = null;
  for (const [french, english] of Object.entries(roomKeywords)) {
    if (lowerQuery.includes(french)) {
      roomMatch = english;
      console.log('Room match:', roomMatch);
      break;
    }
  }

  let productTypeMatch: string[] | null = null;
  for (const [french, keywords] of Object.entries(productTypes)) {
    if (lowerQuery.includes(french)) {
      productTypeMatch = keywords;
      console.log('Product type match:', productTypeMatch);
      break;
    }
  }

  if (styleMatch) {
    queryBuilder = queryBuilder.eq('style', styleMatch);
  }

  if (roomMatch) {
    queryBuilder = queryBuilder.eq('room', roomMatch);
  }

  if (productTypeMatch && !styleMatch && !roomMatch) {
    const searchConditions = productTypeMatch.map(keyword =>
      `title.ilike.%${keyword}%,product_type.ilike.%${keyword}%,tags.ilike.%${keyword}%`
    ).join(',');
    queryBuilder = queryBuilder.or(searchConditions);
  } else if (!styleMatch && !roomMatch && !productTypeMatch) {
    const searchTerms = query.split(' ').filter(word => word.length > 2);
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term =>
        `title.ilike.%${term}%,description.ilike.%${term}%,tags.ilike.%${term}%,product_type.ilike.%${term}%,category.ilike.%${term}%`
      ).join(',');
      queryBuilder = queryBuilder.or(searchConditions);
    }
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Product search error:', error);
    return [];
  }

  console.log('Search result count:', data?.length || 0);

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
      content: `Tu es un assistant commercial virtuel expert en décoration et ameublement d'une boutique de meubles.

Ton rôle:
- Accueillir chaleureusement les clients et comprendre leurs besoins en matière d'ameublement
- Poser des questions pertinentes sur le style préféré (scandinave, moderne, industriel, etc.)
- Demander pour quelle pièce ils cherchent (salon, chambre, cuisine, etc.)
- Identifier le type de meuble recherché (canapé, table, chaise, lit, etc.)
- Guider les clients vers nos produits en mettant en valeur leurs caractéristiques
- Être enthousiaste et aider à visualiser comment les meubles s'intégreront dans leur intérieur

Important:
- Sois naturel et conversationnel, pas robotique
- Pose UNE question à la fois pour ne pas surcharger
- Encourage à préciser leurs recherches pour mieux les aider
- Si un client demande des produits, je vais automatiquement chercher dans notre catalogue
- Reste concentré sur l'aide à trouver les bons meubles

Ton objectif est d'accompagner le client jusqu'à trouver le meuble parfait pour lui.`
    },
    ...history.slice(-6),
    { role: 'user', content: message }
  ];

  console.log('Calling DeepSeek API...');

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      temperature: 0.8,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('DeepSeek API error:', response.status, errorData);
    throw new Error(`DeepSeek API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log('DeepSeek response received');
  return data.choices[0].message.content;
}
