import { supabase } from './supabase';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProductAttributes {
  intent: string;
  type?: string;
  style?: string;
  color?: string;
  material?: string;
  room?: string;
  dimensions?: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  style?: string;
  material?: string;
  color?: string;
  room?: string;
  image_url?: string;
  product_type?: string;
  description?: string;
  ai_enhanced_description?: string;
}

const intents = {
  ChatIntent: {
    name: 'ChatIntent',
    description: 'Répond de manière naturelle et fluide aux messages généraux sans intention d\'achat directe.',
    system_prompt: `Tu es OmnIA, un assistant commercial spécialisé dans le mobilier et la décoration intérieure.
Ton rôle est d'accueillir, conseiller et aider les visiteurs du site.
Reste professionnel, convivial et pertinent.
Engage une conversation naturelle pour comprendre les besoins du client.
Pose des questions sur le style préféré (scandinave, moderne, industriel, etc.), la pièce (salon, chambre, bureau, etc.) et le type de meuble recherché.
Sois enthousiaste mais pas insistant.`,
  },

  ProductChatIntent: {
    name: 'ProductChatIntent',
    description: 'Analyse le message utilisateur pour détecter le type de produit recherché.',
    system_prompt: `Tu es un assistant e-commerce intelligent.
Analyse le message de l'utilisateur et détecte s'il recherche un produit spécifique.
Retourne UNIQUEMENT un objet JSON structuré avec les attributs suivants (ne mets rien d'autre) :
{
  "intent": "product_search",
  "type": "type de produit (canapé, table, chaise, lit, etc.)",
  "style": "style si mentionné (scandinave, moderne, industriel, etc.)",
  "color": "couleur si mentionnée",
  "material": "matériau si mentionné (bois, métal, tissu, etc.)",
  "room": "pièce si mentionnée (salon, chambre, cuisine, etc.)",
  "dimensions": "dimensions si mentionnées"
}
Si un attribut n'est pas mentionné, mets null. Ne donne rien d'autre en sortie, juste le JSON.`,
  },

  ProductShowIntent: {
    name: 'ProductShowIntent',
    description: 'Présente les produits trouvés avec un ton commercial engageant.',
    system_prompt: `Tu es un vendeur virtuel expert en mobilier et décoration.
Présente les produits de manière enthousiaste et professionnelle.
Mets en valeur leurs caractéristiques principales (style, matériau, couleur).
Utilise un ton chaleureux et engageant.
Termine toujours par une question pour continuer la conversation (ex: "Souhaitez-vous voir d'autres modèles ?" ou "Puis-je vous aider avec autre chose ?").
Sois concis mais descriptif.`,
  },
};

async function callDeepSeek(messages: ChatMessage[]): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: 'deepseek-chat',
      temperature: 0.8,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function detectIntent(userMessage: string): Promise<string> {
  const lowerMessage = userMessage.toLowerCase();

  const productKeywords = [
    'canapé', 'table', 'chaise', 'lit', 'buffet', 'meuble', 'fauteuil',
    'commode', 'armoire', 'étagère', 'lampe', 'bureau', 'sofa', 'tapis',
    'cherche', 'recherche', 'besoin', 'veux', 'voudrais', 'acheter',
    'scandinave', 'moderne', 'industriel', 'rustique', 'vintage',
    'salon', 'chambre', 'cuisine', 'bureau', 'salle'
  ];

  const hasProductIntent = productKeywords.some(keyword => lowerMessage.includes(keyword));

  return hasProductIntent ? 'ProductChatIntent' : 'ChatIntent';
}

async function extractProductAttributes(userMessage: string): Promise<ProductAttributes> {
  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: intents.ProductChatIntent.system_prompt },
      { role: 'user', content: userMessage },
    ];

    const response = await callDeepSeek(messages);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { intent: 'product_search' };
  } catch (error) {
    console.error('Error extracting product attributes:', error);
    return { intent: 'product_search' };
  }
}

async function searchProducts(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  let query = supabase
    .from('shopify_products')
    .select('id, title, price, style, material, color, room, image_url, product_type, description, ai_enhanced_description')
    .eq('status', 'active')
    .limit(8);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  if (filters.type) {
    query = query.or(`title.ilike.%${filters.type}%,product_type.ilike.%${filters.type}%,tags.ilike.%${filters.type}%`);
  }

  if (filters.style) {
    query = query.eq('style', filters.style);
  }

  if (filters.color) {
    query = query.ilike('color', `%${filters.color}%`);
  }

  if (filters.material) {
    query = query.ilike('material', `%${filters.material}%`);
  }

  if (filters.room) {
    query = query.eq('room', filters.room);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data || [];
}

async function generateProductPresentation(products: Product[], userMessage: string): Promise<string> {
  if (products.length === 0) {
    const messages: ChatMessage[] = [
      { role: 'system', content: intents.ProductShowIntent.system_prompt },
      {
        role: 'user',
        content: `Le client a demandé: "${userMessage}". Aucun produit exact n'a été trouvé. Réponds de manière positive et propose des alternatives ou demande plus de précisions.`
      },
    ];

    return await callDeepSeek(messages);
  }

  const productsList = products.map((p, index) =>
    `${index + 1}. ${p.title} - ${p.price} € - ${p.style || ''} ${p.material || ''} ${p.color || ''} (ID: ${p.id})`
  ).join('\n');

  const messages: ChatMessage[] = [
    { role: 'system', content: intents.ProductShowIntent.system_prompt },
    {
      role: 'user',
      content: `Le client a demandé: "${userMessage}". Voici les produits trouvés:\n\n${productsList}\n\nPrésente ces produits de manière engageante et professionnelle.`
    },
  ];

  return await callDeepSeek(messages);
}

export async function OmnIAChat(userMessage: string, history: ChatMessage[] = [], storeId?: string) {
  const intentName = await detectIntent(userMessage);

  if (intentName === 'ChatIntent') {
    const messages: ChatMessage[] = [
      { role: 'system', content: intents.ChatIntent.system_prompt },
      ...history.slice(-6),
      { role: 'user', content: userMessage },
    ];

    const response = await callDeepSeek(messages);

    return {
      role: 'assistant' as const,
      content: response,
      intent: 'chat',
      products: [],
    };
  }

  if (intentName === 'ProductChatIntent') {
    const attributes = await extractProductAttributes(userMessage);
    const products = await searchProducts(attributes, storeId);
    const presentation = await generateProductPresentation(products, userMessage);

    return {
      role: 'assistant' as const,
      content: presentation,
      intent: 'product_search',
      products: products,
    };
  }

  return {
    role: 'assistant' as const,
    content: 'Comment puis-je vous aider aujourd\'hui ?',
    intent: 'chat',
    products: [],
  };
}
