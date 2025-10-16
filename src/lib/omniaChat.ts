import { supabase, getEnvVar } from './supabase';

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
  const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');

  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured. Please check your environment variables.');
  }

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
  console.log('🧠 [EXTRACT] Starting attribute extraction for:', userMessage);
  const extractStart = performance.now();

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
      console.log('⚡ [EXTRACT] Quick detection found:', detectedType);
      const attributes: ProductAttributes = {
        intent: 'product_search',
        type: detectedType
      };

      // Détection style
      const styles = ['scandinave', 'moderne', 'industriel', 'vintage', 'classique', 'contemporain'];
      for (const style of styles) {
        if (msg.includes(style)) {
          attributes.style = style;
          console.log('✅ [EXTRACT] Detected style:', style);
          break;
        }
      }

      // Détection couleur
      const colors = ['blanc', 'noir', 'beige', 'gris', 'bois', 'marron', 'bleu', 'vert', 'rouge'];
      for (const color of colors) {
        if (msg.includes(color)) {
          attributes.color = color;
          console.log('✅ [EXTRACT] Detected color:', color);
          break;
        }
      }

      // Détection matériau
      const materials = ['bois', 'métal', 'verre', 'marbre', 'tissu', 'cuir', 'céramique'];
      for (const material of materials) {
        if (msg.includes(material)) {
          attributes.material = material;
          console.log('✅ [EXTRACT] Detected material:', material);
          break;
        }
      }

      const extractTime = performance.now() - extractStart;
      console.log('🏁 [EXTRACT] Quick extraction completed in', extractTime.toFixed(0), 'ms');
      console.log('📋 [EXTRACT] Final attributes:', attributes);

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
  console.log('🔍 [SEARCH] Starting search with filters:', filters);
  const searchStart = performance.now();

  let query = supabase
    .from('shopify_products')
    .select(`
      id, title, price, compare_at_price, style, material, color,
      ai_color, ai_material, ai_texture, ai_pattern, ai_finish, ai_shape, ai_design_elements,
      room, image_url, product_type, description, ai_vision_analysis,
      handle, shopify_id, currency, shop_name, category, sub_category, tags,
      length, width, height, length_unit, width_unit, height_unit, inventory_quantity,
      chat_text
    `)
    .eq('status', 'active')
    .limit(12);

  if (storeId) {
    console.log('🔎 [SEARCH] Filtering by store_id:', storeId);
    query = query.eq('store_id', storeId);
  } else {
    console.log('🔎 [SEARCH] No store filter applied - searching all stores');
  }

  // Recherche principale par type de produit (plus large et rapide)
  if (filters.type) {
    const searchTerm = filters.type.toLowerCase();
    console.log('🔎 [SEARCH] Search term:', searchTerm);

    // Use chat_text field for faster single-field search
    query = query.ilike('chat_text', `%${searchTerm}%`);
  }

  console.log('🗄️ [SEARCH] Querying Supabase...');
  const dbStart = performance.now();
  const { data, error } = await query;
  const dbTime = performance.now() - dbStart;
  console.log('✅ [SEARCH] Database query completed in', dbTime.toFixed(0), 'ms');

  if (error) {
    console.error('Error searching products:', error);
    return [];
  }

  let results = data || [];
  console.log('📊 [SEARCH] Found', results.length, 'products with current filters');

  // If no results and we filtered by store, try again without store filter
  if (results.length === 0 && storeId && filters.type) {
    console.log('⚠️ [SEARCH] No products found with store filter. Retrying without store filter...');

    let fallbackQuery = supabase
      .from('shopify_products')
      .select(`
        id, title, price, compare_at_price, style, material, color,
        ai_color, ai_material, ai_texture, ai_pattern, ai_finish, ai_shape, ai_design_elements,
        room, image_url, product_type, description, ai_vision_analysis,
        handle, shopify_id, currency, shop_name, category, sub_category, tags,
        length, width, height, length_unit, width_unit, height_unit, inventory_quantity,
        chat_text
      `)
      .eq('status', 'active')
      .limit(12);

    const searchTerm = filters.type.toLowerCase();
    // Use chat_text field for faster single-field search
    fallbackQuery = fallbackQuery.ilike('chat_text', `%${searchTerm}%`);

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;

    if (!fallbackError && fallbackData) {
      results = fallbackData;
      console.log('✅ [SEARCH] Fallback search found', results.length, 'products');
    }
  }

  console.log('📊 [SEARCH] Initial results:', results.length, 'products');

  // Filtrage secondaire côté client pour style, couleur, matériau
  // Important: On applique TOUJOURS le filtre si spécifié, même si résultat vide
  if (filters.style && results.length > 0) {
    console.log('🎨 [SEARCH] Applying style filter:', filters.style);
    const styleFiltered = results.filter(p =>
      p.style?.toLowerCase().includes(filters.style!.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.style!.toLowerCase())
    );
    console.log('📊 [SEARCH] Style filter result:', styleFiltered.length, 'products');
    results = styleFiltered;
  }

  if (filters.color && results.length > 0) {
    console.log('🌈 [SEARCH] Applying color filter:', filters.color);
    const colorFiltered = results.filter(p =>
      p.color?.toLowerCase().includes(filters.color!.toLowerCase()) ||
      p.ai_color?.toLowerCase().includes(filters.color!.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.color!.toLowerCase())
    );
    console.log('📊 [SEARCH] Color filter result:', colorFiltered.length, 'products');
    results = colorFiltered;
  }

  if (filters.material && results.length > 0) {
    console.log('🪵 [SEARCH] Applying material filter:', filters.material);
    const materialFiltered = results.filter(p =>
      p.material?.toLowerCase().includes(filters.material!.toLowerCase()) ||
      p.ai_material?.toLowerCase().includes(filters.material!.toLowerCase()) ||
      p.tags?.toLowerCase().includes(filters.material!.toLowerCase())
    );
    console.log('📊 [SEARCH] Material filter result:', materialFiltered.length, 'products');
    results = materialFiltered;
  }

  const finalResults = results.slice(0, 8);
  const searchTime = performance.now() - searchStart;
  console.log('🏁 [SEARCH] Returning', finalResults.length, 'products in', searchTime.toFixed(0), 'ms');

  return finalResults;
}

async function generateSmartProductPresentation(products: Product[], userMessage: string, filters: ProductAttributes): Promise<string> {
  console.log('🎨 [PRESENTATION] Starting with', products.length, 'products');
  const startTime = performance.now();

  if (products.length === 0) {
    const filterDesc = [];
    if (filters.type) filterDesc.push(filters.type);
    if (filters.style) filterDesc.push(`de style ${filters.style}`);
    if (filters.room) filterDesc.push(`pour ${filters.room}`);

    const search = filterDesc.length > 0 ? filterDesc.join(' ') : 'produit correspondant';
    return `Je n'ai pas trouvé de ${search} pour le moment. 😊\n\nPuis-je vous aider à affiner votre recherche ? Voici quelques suggestions :\n• Quel style recherchez-vous ? (scandinave, moderne, industriel...)\n• Pour quelle pièce ? (salon, chambre, bureau...)\n• Avez-vous des préférences de couleur ou de matériau ?\n• Quel est votre budget approximatif ?`;
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
      description: p.description?.replace(/<[^>]*>/g, '').substring(0, 200),
      tags: p.tags,
      stock: p.inventory_quantity || 'Disponible'
    };
  });

  console.log('📦 [PRESENTATION] Product data prepared:', productsData.length, 'items');

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
    console.log('🤖 [PRESENTATION] Calling DeepSeek for presentation...');
    const deepseekStart = performance.now();

    const response = await callDeepSeek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 300);

    const deepseekTime = performance.now() - deepseekStart;
    console.log('✅ [PRESENTATION] DeepSeek response received in', deepseekTime.toFixed(0), 'ms');
    console.log('📝 [PRESENTATION] Response:', response);

    const totalTime = performance.now() - startTime;
    console.log('🏁 [PRESENTATION] Total time:', totalTime.toFixed(0), 'ms');

    return response;
  } catch (error) {
    console.error('❌ [PRESENTATION] Error generating smart presentation:', error);
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
  console.log('🚀 [OMNIA] Starting OmnIAChat for message:', userMessage);
  const totalStart = performance.now();

  console.log('🎯 [OMNIA] Step 1: Detecting intent...');
  const intentStart = performance.now();
  const intentName = await detectIntent(userMessage, history);
  const intentTime = performance.now() - intentStart;
  console.log('✅ [OMNIA] Intent detected:', intentName, 'in', intentTime.toFixed(0), 'ms');

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
    console.log('🔍 [OMNIA] Step 2: Extracting product attributes...');
    const extractStart = performance.now();
    const attributes = await extractProductAttributesWithAI(userMessage, history);
    const extractTime = performance.now() - extractStart;
    console.log('✅ [OMNIA] Attributes extracted in', extractTime.toFixed(0), 'ms:', attributes);

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
    console.log('📦 [OMNIA] Step 3: Searching products...');
    const searchStart = performance.now();
    const products = await searchProducts(attributes, storeId);
    const searchTime = performance.now() - searchStart;
    console.log('✅ [OMNIA] Found', products.length, 'products in', searchTime.toFixed(0), 'ms');

    console.log('💬 [OMNIA] Step 4: Generating presentation...');
    const presentation = await generateSmartProductPresentation(products, userMessage, attributes);

    const totalTime = performance.now() - totalStart;
    console.log('🏁 [OMNIA] Total OmnIAChat time:', totalTime.toFixed(0), 'ms');

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
