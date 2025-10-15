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

interface ChatSettings {
  chat_tone?: string;
  chat_response_length?: string;
}

interface Product {
  id: string;
  title: string;
  price: string;
  compare_at_price?: string;
  style?: string;
  material?: string;
  color?: string;
  ai_color?: string;
  ai_material?: string;
  room?: string;
  image_url?: string;
  product_type?: string;
  description?: string;
  ai_vision_analysis?: string;
  handle?: string;
  shopify_id?: string;
  currency?: string;
  shop_name?: string;
  category?: string;
  sub_category?: string;
  tags?: string;
  length?: number;
  width?: number;
  height?: number;
  length_unit?: string;
  width_unit?: string;
  height_unit?: string;
  inventory_quantity?: number;
}

function buildChatIntent(settings?: ChatSettings) {
  const toneInstructions = {
    professional: 'Ton professionnel et formel. Vouvoiement. Style expert et précis.',
    friendly: 'Ton chaleureux et accessible. Style conversationnel équilibré.',
    enthusiastic: 'Ton dynamique et expressif ! Utilise des exclamations. Style engageant.',
    casual: 'Ton décontracté et proche. Tutoiement. Style naturel.'
  };

  const lengthInstructions = {
    concise: 'Maximum 20 mots. Phrases courtes et directes.',
    balanced: 'Maximum 40 mots. Réponses équilibrées avec contexte.',
    detailed: 'Maximum 80 mots. Réponses complètes et descriptives.'
  };

  const tone = settings?.chat_tone || 'friendly';
  const length = settings?.chat_response_length || 'balanced';

  return `Tu es OmnIA, assistant commercial intelligent.
${toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.friendly}
${lengthInstructions[length as keyof typeof lengthInstructions] || lengthInstructions.balanced}`;
}

function buildQualificationIntent(settings?: ChatSettings) {
  const tone = settings?.chat_tone || 'friendly';
  const toneInstructions = {
    professional: 'Ton professionnel et courtois.',
    friendly: 'Ton chaleureux et accessible.',
    enthusiastic: 'Ton dynamique et enthousiaste !',
    casual: 'Ton décontracté et sympa.'
  };

  return `Tu es OmnIA, conseiller commercial expert.

Quand un client mentionne un produit de manière vague, tu DOIS poser des questions de qualification intelligentes pour mieux comprendre ses besoins.

Exemples:
- "table" → "Cherchez-vous une table basse, une table à manger ou un bureau ? Quel est votre budget approximatif ?"
- "montre" → "Préférez-vous une montre sport, élégante ou casual ? Avez-vous une marque en tête ?"
- "parka" → "Pour quelle saison ? Plutôt urbaine ou technique ? Quelle taille recherchez-vous ?"

Règles:
- Pose 2-3 questions précises et pertinentes
- ${toneInstructions[tone as keyof typeof toneInstructions]}
- Maximum 30 mots
- Adapte les questions au type de produit mentionné`;
}

const intents = {
  ChatIntent: {
    name: 'ChatIntent',
    description: 'Répond de manière naturelle et fluide aux messages généraux sans intention d\'achat directe.',
    system_prompt: `Tu es OmnIA, assistant commercial intelligent. Réponds en 1-2 phrases courtes et chaleureuses. Maximum 20 mots.`,
  },

  ProductQualificationIntent: {
    name: 'ProductQualificationIntent',
    description: 'Qualifie la demande produit de manière conversationnelle avant de chercher.',
    system_prompt: '', // Will be dynamically set
  },

  ProductSearchIntent: {
    name: 'ProductSearchIntent',
    description: 'Détecte quand l\'utilisateur a donné suffisamment de détails pour lancer une recherche.',
    system_prompt: `Analyse le message et retourne UNIQUEMENT un JSON (rien d'autre):
{
  "intent": "product_search" ou "need_qualification",
  "type": "type de produit exact",
  "style": "style/design si mentionné",
  "color": "couleur si mentionnée",
  "material": "matériau si mentionné",
  "room": "usage/pièce si mentionné",
  "price_range": "budget si mentionné",
  "size": "taille/dimensions si mentionnées"
}

Mets "need_qualification" si la demande est trop vague (ex: juste "table" sans détails).
Mets "product_search" si le client a donné des critères précis.`,
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

export async function detectIntent(userMessage: string, history: ChatMessage[] = []): Promise<string> {
  const lowerMessage = userMessage.toLowerCase();

  // Mots de salutation → conversation générale
  const greetings = ['bonjour', 'salut', 'hello', 'bonsoir', 'hey'];
  if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
    return 'ChatIntent';
  }

  // Mots indiquant une recherche produit
  const searchWords = ['cherche', 'recherche', 'besoin', 'veux', 'voudrais', 'acheter', 'montre', 'voir', 'trouver', 'commander'];
  const hasSearchIntent = searchWords.some(word => lowerMessage.includes(word));

  if (hasSearchIntent) {
    return 'ProductSearchIntent';
  }

  // Si l'historique contient une question de qualification, c'est une réponse → recherche
  if (history.length > 0) {
    const lastMessage = history[history.length - 1];
    if (lastMessage.role === 'assistant' && lastMessage.content.includes('?')) {
      return 'ProductSearchIntent';
    }
  }

  return 'ChatIntent';
}

async function extractProductAttributesWithAI(userMessage: string, history: ChatMessage[] = []): Promise<ProductAttributes> {
  try {
    const context = history.length > 0
      ? `Historique conversation:\n${history.slice(-3).map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';

    const response = await callDeepSeek([
      { role: 'system', content: intents.ProductSearchIntent.system_prompt },
      { role: 'user', content: `${context}Message actuel: "${userMessage}"` }
    ], 150);

    const jsonMatch = response.match(/\{[^}]+\}/);
    if (!jsonMatch) {
      return { intent: 'need_qualification' };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error('Error extracting attributes:', error);
    return { intent: 'need_qualification' };
  }
}

async function searchProducts(filters: ProductAttributes, storeId?: string): Promise<Product[]> {
  let query = supabase
    .from('shopify_products')
    .select('id, title, price, compare_at_price, style, material, color, ai_color, ai_material, room, image_url, product_type, description, ai_vision_analysis, handle, shopify_id, currency, shop_name, category, sub_category, tags, length, width, height, length_unit, width_unit, height_unit, inventory_quantity')
    .eq('status', 'active')
    .limit(8);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  if (filters.type) {
    query = query.or(`title.ilike.%${filters.type}%,product_type.ilike.%${filters.type}%,tags.ilike.%${filters.type}%,category.ilike.%${filters.type}%,sub_category.ilike.%${filters.type}%`);
  }

  if (filters.style) {
    query = query.or(`style.eq.${filters.style},tags.ilike.%${filters.style}%`);
  }

  if (filters.color) {
    query = query.or(`color.ilike.%${filters.color}%,ai_color.ilike.%${filters.color}%,tags.ilike.%${filters.color}%`);
  }

  if (filters.material) {
    query = query.or(`material.ilike.%${filters.material}%,ai_material.ilike.%${filters.material}%,tags.ilike.%${filters.material}%`);
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

async function generateSmartProductPresentation(products: Product[], userMessage: string, filters: ProductAttributes): Promise<string> {
  if (products.length === 0) {
    const filterDesc = [];
    if (filters.type) filterDesc.push(`${filters.type}s`);
    if (filters.style) filterDesc.push(`de style ${filters.style}`);
    if (filters.room) filterDesc.push(`pour ${filters.room}`);

    const search = filterDesc.length > 0 ? filterDesc.join(' ') : 'ce type de produit';
    return `Je n'ai pas trouvé de ${search} pour le moment. 😊\n\nPuis-je vous aider à affiner votre recherche ? Par exemple :\n- Quel style préférez-vous ? (scandinave, moderne, industriel...)\n- Quelle pièce souhaitez-vous aménager ?\n- Avez-vous des préférences de couleur ou matériau ?`;
  }

  // Construire les données enrichies pour l'IA
  const productsData = products.map((p, idx) => {
    const hasPromo = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
    const discount = hasPromo ? Math.round((1 - Number(p.price) / Number(p.compare_at_price!)) * 100) : 0;

    const dimensions = [];
    if (p.width) dimensions.push(`L${p.width}${p.width_unit || 'cm'}`);
    if (p.height) dimensions.push(`H${p.height}${p.height_unit || 'cm'}`);
    if (p.length) dimensions.push(`P${p.length}${p.length_unit || 'cm'}`);

    return {
      index: idx + 1,
      titre: p.title,
      prix: `${p.price}${p.currency || '€'}`,
      prix_barre: hasPromo ? `${p.compare_at_price}${p.currency || '€'}` : null,
      reduction: hasPromo ? `${discount}%` : null,
      categorie: p.category,
      sous_categorie: p.sub_category,
      style: p.style,
      couleur: p.ai_color || p.color,
      materiau: p.ai_material || p.material,
      piece: p.room,
      dimensions: dimensions.join(' x '),
      description: p.description?.replace(/<[^>]*>/g, '').substring(0, 300),
      tags: p.tags,
      stock: p.inventory_quantity || 'Disponible'
    };
  });

  const systemPrompt = `Tu es OmnIA, expert conseil en ameublement et décoration.
Analyse la demande du client et présente les produits de manière personnalisée et engageante.

Règles importantes:
- Réponds en français naturel et chaleureux
- Mets en avant les caractéristiques qui correspondent à la demande du client
- Mentionne les promotions s'il y en a (prix barré, réduction)
- Cite les dimensions si pertinent
- Sois concis mais informatif (maximum 150 mots)
- Termine par une question ouverte pour continuer la conversation
- N'invente rien, utilise uniquement les données fournies`;

  const userPrompt = `Demande client: "${userMessage}"

Produits trouvés:
${JSON.stringify(productsData, null, 2)}

Présente ces produits au client de manière engageante.`;

  try {
    const response = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 300);

    return response;
  } catch (error) {
    console.error('Error generating smart presentation:', error);
    // Fallback simple
    const intro = products.length === 1
      ? `J'ai trouvé ce produit qui pourrait vous intéresser :`
      : `J'ai trouvé ${products.length} produits correspondants :`;
    return `${intro}\n\nSouhaitez-vous plus de détails ? 😊`;
  }
}

export async function processOmniaMessage(userMessage: string, history: ChatMessage[] = [], storeId?: string) {
  return OmnIAChat(userMessage, history, storeId);
}


export async function OmnIAChat(userMessage: string, history: ChatMessage[] = [], storeId?: string, settings?: ChatSettings) {
  const intentName = await detectIntent(userMessage, history);

  if (intentName === 'ChatIntent') {
    const chatPrompt = buildChatIntent(settings);
    const maxTokens = settings?.chat_response_length === 'concise' ? 30 :
                      settings?.chat_response_length === 'detailed' ? 100 : 50;

    const messages: ChatMessage[] = [
      { role: 'system', content: chatPrompt },
      ...history.slice(-4),
      { role: 'user', content: userMessage },
    ];

    const response = await callDeepSeek(messages, maxTokens);

    return {
      role: 'assistant' as const,
      content: response,
      intent: 'chat',
      mode: 'conversation',
      products: [],
    };
  }

  if (intentName === 'ProductSearchIntent') {
    const attributes = await extractProductAttributesWithAI(userMessage, history);

    // Si la demande est trop vague, qualifier intelligemment
    if (attributes.intent === 'need_qualification' || !attributes.type) {
      const qualificationPrompt = buildQualificationIntent(settings);
      const messages: ChatMessage[] = [
        { role: 'system', content: qualificationPrompt },
        ...history.slice(-2),
        { role: 'user', content: userMessage },
      ];

      const qualificationResponse = await callDeepSeek(messages, 80);

      return {
        role: 'assistant' as const,
        content: qualificationResponse,
        intent: 'product_qualification',
        mode: 'conversation',
        products: [],
      };
    }

    // Sinon, lancer la recherche
    const products = await searchProducts(attributes, storeId);
    const presentation = await generateSmartProductPresentation(products, userMessage, attributes);

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
