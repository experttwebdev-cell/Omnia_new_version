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
    system_prompt: `Tu es OmnIA, assistant mobilier. Réponds en 1 phrase courte + 1 question courte. Maximum 15 mots.`,
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

async function callDeepSeek(messages: ChatMessage[], maxTokens = 50): Promise<string> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/deepseek-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      model: 'deepseek-chat',
      temperature: 0.3,
      max_tokens: maxTokens,
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

function extractProductAttributesSimple(userMessage: string): ProductAttributes {
  const lowerMessage = userMessage.toLowerCase();
  const attributes: ProductAttributes = { intent: 'product_search' };

  const typeMap: { [key: string]: string } = {
    'canapé': 'canapé', 'sofa': 'canapé',
    'table': 'table',
    'chaise': 'chaise',
    'lit': 'lit',
    'buffet': 'buffet',
    'fauteuil': 'fauteuil',
    'commode': 'commode',
    'armoire': 'armoire',
    'étagère': 'étagère',
    'lampe': 'lampe',
    'bureau': 'bureau',
    'tapis': 'tapis',
  };

  for (const [keyword, type] of Object.entries(typeMap)) {
    if (lowerMessage.includes(keyword)) {
      attributes.type = type;
      break;
    }
  }

  const styleMap: { [key: string]: string } = {
    'scandinave': 'Scandinave',
    'moderne': 'Moderne',
    'industriel': 'Industriel',
    'rustique': 'Rustique',
    'vintage': 'Vintage',
    'contemporain': 'Contemporain',
  };

  for (const [keyword, style] of Object.entries(styleMap)) {
    if (lowerMessage.includes(keyword)) {
      attributes.style = style;
      break;
    }
  }

  const roomMap: { [key: string]: string } = {
    'salon': 'Salon',
    'chambre': 'Chambre',
    'cuisine': 'Cuisine',
    'bureau': 'Bureau',
    'salle': 'Salle à manger',
  };

  for (const [keyword, room] of Object.entries(roomMap)) {
    if (lowerMessage.includes(keyword)) {
      attributes.room = room;
      break;
    }
  }

  const colors = ['blanc', 'noir', 'gris', 'beige', 'bleu', 'vert', 'rouge', 'jaune', 'marron'];
  for (const color of colors) {
    if (lowerMessage.includes(color)) {
      attributes.color = color;
      break;
    }
  }

  const materials = ['bois', 'métal', 'tissu', 'cuir', 'verre', 'plastique'];
  for (const material of materials) {
    if (lowerMessage.includes(material)) {
      attributes.material = material;
      break;
    }
  }

  return attributes;
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
    query = query.or(`style.eq.${filters.style},tags.ilike.%${filters.style}%`);
  }

  if (filters.color) {
    query = query.or(`color.ilike.%${filters.color}%,tags.ilike.%${filters.color}%`);
  }

  if (filters.material) {
    query = query.or(`material.ilike.%${filters.material}%,tags.ilike.%${filters.material}%`);
  }

  if (filters.room) {
    query = query.or(`room.eq.${filters.room},tags.ilike.%${filters.room}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  return data || [];
}

function generateProductPresentationSimple(products: Product[], userMessage: string, filters: ProductAttributes): string {
  if (products.length === 0) {
    const filterDesc = [];
    if (filters.type) filterDesc.push(`${filters.type}s`);
    if (filters.style) filterDesc.push(`de style ${filters.style}`);
    if (filters.room) filterDesc.push(`pour ${filters.room}`);

    const search = filterDesc.length > 0 ? filterDesc.join(' ') : 'ce type de produit';
    return `Je n'ai pas trouvé de ${search} pour le moment. 😊\n\nPuis-je vous aider à affiner votre recherche ? Par exemple :\n- Quel style préférez-vous ? (scandinave, moderne, industriel...)\n- Quelle pièce souhaitez-vous aménager ?\n- Avez-vous des préférences de couleur ou matériau ?`;
  }

  const intro = products.length === 1
    ? `J'ai trouvé ce produit qui pourrait vous intéresser :`
    : `J'ai trouvé ${products.length} produits qui correspondent à votre recherche :`;

  const productsList = products.map((p, index) => {
    const details = [];
    if (p.style) details.push(p.style);
    if (p.material) details.push(p.material);
    if (p.color) details.push(p.color);

    const detailsStr = details.length > 0 ? ` - ${details.join(', ')}` : '';
    return `\n${index + 1}. **${p.title}**${detailsStr}\n   Prix: ${p.price} €`;
  }).join('\n');

  return `${intro}\n${productsList}\n\nSouhaitez-vous plus d'informations sur l'un de ces produits ? 😊`;
}

export async function processOmniaMessage(userMessage: string, history: ChatMessage[] = [], storeId?: string) {
  return OmnIAChat(userMessage, history, storeId);
}

const quickResponses: { [key: string]: string } = {
  'bonjour': 'Bonjour ! Quel type de meuble recherchez-vous ?',
  'salut': 'Salut ! Je peux vous aider à trouver un meuble ?',
  'hello': 'Hello ! Que puis-je faire pour vous ?',
  'bonsoir': 'Bonsoir ! Comment puis-je vous aider ?',
  'merci': 'Avec plaisir ! Autre chose ?',
  'merci beaucoup': 'Je vous en prie ! Besoin d\'autre chose ?',
  'au revoir': 'Au revoir ! À bientôt !',
  'bye': 'À bientôt !',
  'comment vas-tu': 'Très bien ! Cherchez-vous un meuble ?',
  'comment allez-vous': 'Très bien merci ! Que recherchez-vous ?',
  'aide': 'Je vous aide à trouver du mobilier. Quel type ?',
  'help': 'Je vous aide à trouver des meubles. Quel style ?',
};

function getQuickResponse(message: string): string | null {
  const normalized = message.toLowerCase().trim();

  for (const [key, response] of Object.entries(quickResponses)) {
    if (normalized === key || normalized.includes(key)) {
      return response;
    }
  }

  return null;
}

export async function OmnIAChat(userMessage: string, history: ChatMessage[] = [], storeId?: string) {
  const intentName = await detectIntent(userMessage);

  if (intentName === 'ChatIntent') {
    const quickResponse = getQuickResponse(userMessage);

    if (quickResponse) {
      return {
        role: 'assistant' as const,
        content: quickResponse,
        intent: 'chat',
        mode: 'conversation',
        products: [],
      };
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: intents.ChatIntent.system_prompt },
      ...history.slice(-4),
      { role: 'user', content: userMessage },
    ];

    const response = await callDeepSeek(messages, 40);

    return {
      role: 'assistant' as const,
      content: response,
      intent: 'chat',
      mode: 'conversation',
      products: [],
    };
  }

  if (intentName === 'ProductChatIntent') {
    const attributes = extractProductAttributesSimple(userMessage);
    const products = await searchProducts(attributes, storeId);
    const presentation = generateProductPresentationSimple(products, userMessage, attributes);

    return {
      role: 'assistant' as const,
      content: presentation,
      intent: 'product_search',
      mode: 'product_show',
      products: products,
      searchFilters: attributes,
    };
  }

  return {
    role: 'assistant' as const,
    content: 'Comment puis-je vous aider aujourd\'hui ?',
    intent: 'chat',
    mode: 'conversation',
    products: [],
  };
}
