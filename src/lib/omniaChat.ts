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
    // Extraction rapide avec regex pour les cas simples
    const msg = userMessage.toLowerCase();

    // Détection rapide du type de produit
    const productTypes = ['table basse', 'table', 'chaise', 'canapé', 'fauteuil', 'lit', 'armoire', 'commode', 'meuble', 'étagère', 'bureau', 'tabouret'];
    let detectedType = '';

    for (const type of productTypes) {
      if (msg.includes(type)) {
        detectedType = type;
        break;
      }
    }

    // Si on a détecté un type simple, retourner directement
    if (detectedType) {
      const attributes: ProductAttributes = {
        intent: 'product_search',
        type: detectedType
      };

      // Détection style
      const styles = ['scandinave', 'moderne', 'industriel', 'vintage', 'classique', 'contemporain'];
      for (const style of styles) {
        if (msg.includes(style)) {
          attributes.style = style;
          break;
        }
      }

      // Détection couleur
      const colors = ['blanc', 'noir', 'beige', 'gris', 'bois', 'marron', 'bleu', 'vert', 'rouge'];
      for (const color of colors) {
        if (msg.includes(color)) {
          attributes.color = color;
          break;
        }
      }

      // Détection matériau
      const materials = ['bois', 'métal', 'verre', 'marbre', 'tissu', 'cuir', 'céramique'];
      for (const material of materials) {
        if (msg.includes(material)) {
          attributes.material = material;
          break;
        }
      }

      return attributes;
    }

    // Si pas de détection simple, utiliser DeepSeek
    const context = history.length > 0
      ? `Historique:\n${history.slice(-2).map(m => `${m.role}: ${m.content}`).join('\n')}\n\n`
      : '';

    const response = await callDeepSeek([
      { role: 'system', content: intents.ProductSearchIntent.system_prompt },
      { role: 'user', content: `${context}Message: "${userMessage}"` }
    ], 100);

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
    .limit(12);

  if (storeId) {
    query = query.eq('store_id', storeId);
  }

  // Recherche principale par type de produit (plus large et rapide)
  if (filters.type) {
    const searchTerms = filters.type.toLowerCase().split(' ');
    const orConditions = [];

    for (const term of searchTerms) {
      orConditions.push(`title.ilike.%${term}%`);
      orConditions.push(`category.ilike.%${term}%`);
      orConditions.push(`sub_category.ilike.%${term}%`);
      orConditions.push(`tags.ilike.%${term}%`);
    }

    query = query.or(orConditions.join(','));
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  let results = data || [];

  // Filtrage secondaire côté client pour style, couleur, matériau
  if (filters.style && results.length > 0) {
    const styleFiltered = results.filter(p =>
      p.style?.toLowerCase().includes(filters.style!.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.style!.toLowerCase())
    );
    if (styleFiltered.length > 0) results = styleFiltered;
  }

  if (filters.color && results.length > 0) {
    const colorFiltered = results.filter(p =>
      p.color?.toLowerCase().includes(filters.color!.toLowerCase()) ||
      p.ai_color?.toLowerCase().includes(filters.color!.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.color!.toLowerCase())
    );
    if (colorFiltered.length > 0) results = colorFiltered;
  }

  if (filters.material && results.length > 0) {
    const materialFiltered = results.filter(p =>
      p.material?.toLowerCase().includes(filters.material!.toLowerCase()) ||
      p.ai_material?.toLowerCase().includes(filters.material!.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.material!.toLowerCase())
    );
    if (materialFiltered.length > 0) results = materialFiltered;
  }

  return results.slice(0, 8);
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

  // Génération rapide sans IA pour la présentation
  const intro = products.length === 1
    ? `Voici ce que j'ai trouvé pour vous :`
    : `J'ai trouvé ${products.length} ${filters.type || 'produits'} qui pourraient vous intéresser :`;

  // Détection des promotions
  const promos = products.filter(p => p.compare_at_price && Number(p.compare_at_price) > Number(p.price));
  let promoText = '';
  if (promos.length > 0) {
    const bestPromo = promos.reduce((best, current) => {
      const currentDiscount = Math.round((1 - Number(current.price) / Number(current.compare_at_price!)) * 100);
      const bestDiscount = Math.round((1 - Number(best.price) / Number(best.compare_at_price!)) * 100);
      return currentDiscount > bestDiscount ? current : best;
    });
    const discount = Math.round((1 - Number(bestPromo.price) / Number(bestPromo.compare_at_price!)) * 100);
    promoText = `\n\n✨ Bonne nouvelle ! ${promos.length} article${promos.length > 1 ? 's sont' : ' est'} en promotion jusqu'à -${discount}% !`;
  }

  // Mise en avant des caractéristiques pertinentes
  const features = [];
  if (filters.style) features.push(`style ${filters.style}`);
  if (filters.color) features.push(`couleur ${filters.color}`);
  if (filters.material) features.push(`en ${filters.material}`);

  const featureText = features.length > 0
    ? `\n\nCaractéristiques : ${features.join(', ')}`
    : '';

  return `${intro}${promoText}${featureText}\n\nVous pouvez cliquer sur les produits ci-dessous pour plus de détails. Besoin d'aide pour choisir ? 😊`;
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
