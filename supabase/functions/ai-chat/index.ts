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
  retailerId?: string;
  sessionToken?: string;
}

interface RetailerSettings {
  assistant_name: string;
  theme_color: string;
  greeting_message: string;
  show_products: boolean;
  cart_enabled: boolean;
}

interface Product {
  id: string;
  title: string;
  description: string;
  ai_enhanced_description?: string;
  price: number;
  image_url: string;
  product_url: string;
  style?: string;
  room?: string;
  category?: string;
}

const retailerCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

async function callDeepSeek(messages: any[], temperature = 0.7, maxTokens = 500, retries = 2): Promise<any> {
  const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');

  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`🔁 DeepSeek API call attempt ${attempt + 1}/${retries + 1}`);

      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${deepseekApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ DeepSeek API call successful');
      return data;
    } catch (error) {
      console.error(`❌ DeepSeek attempt ${attempt + 1} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  console.log('=== 💬 AI CHAT REQUEST ===');

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, history = [], retailerId, sessionToken } = await req.json() as ChatRequest;

    if (!message?.trim()) {
      throw new Error('Message is required');
    }

    console.log('📝 Message:', message.substring(0, 100));
    console.log('🏪 Retailer ID:', retailerId);

    let retailerSettings: RetailerSettings | null = null;
    if (retailerId) {
      retailerSettings = await getRetailerSettings(supabase, retailerId);
      console.log('⚙️ Retailer settings loaded');
    }

    const intent = await detectIntent(message, history);
    console.log('🎯 Detected intent:', intent);

    let responseMessage: string;
    let products: Product[] = [];
    let selectedProduct: Product | null = null;

    switch (intent) {
      case 'product_search':
        console.log('🔍 Searching products for query:', message);
        products = await searchProducts(supabase, message, retailerId);
        console.log(`✅ Found ${products.length} products`);

        responseMessage = await generateProductResponse(
          message,
          products,
          retailerSettings
        );
        break;

      case 'product_show':
        const productId = extractProductId(message);
        if (productId) {
          console.log('📦 Fetching product:', productId);
          selectedProduct = await getProductById(supabase, productId, retailerId);
          responseMessage = selectedProduct
            ? generateProductDetailResponse(selectedProduct, retailerSettings)
            : "Je n'ai pas pu trouver ce produit. Puis-je vous aider avec autre chose ?";
        } else {
          responseMessage = "Quel produit souhaitez-vous voir en détail ?";
        }
        break;

      case 'greeting':
        responseMessage = retailerSettings?.greeting_message
          || `Bonjour ! Je suis ${retailerSettings?.assistant_name || 'votre assistant'}, expert en décoration et ameublement. Comment puis-je vous aider aujourd'hui ?`;
        break;

      default:
        console.log('💬 Generating conversational response...');
        responseMessage = await generateChatResponse(
          message,
          history,
          retailerSettings
        );
    }

    console.log('✅ Response generated');

    return new Response(
      JSON.stringify({
        message: responseMessage,
        intent,
        products: retailerSettings?.show_products !== false ? products.slice(0, 8) : [],
        selectedProduct,
        retailerSettings: {
          assistant_name: retailerSettings?.assistant_name,
          theme_color: retailerSettings?.theme_color,
          cart_enabled: retailerSettings?.cart_enabled
        },
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
    console.error('❌ AI Chat error:', error);
    return new Response(
      JSON.stringify({
        error: "Désolé, une erreur s'est produite. Veuillez réessayer.",
        details: error instanceof Error ? error.message : 'Unknown error',
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

async function getRetailerSettings(supabase: any, retailerId: string): Promise<RetailerSettings | null> {
  const cacheKey = `retailer-${retailerId}`;
  const cached = retailerCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('📦 Using cached retailer settings');
    return cached.data;
  }

  const { data, error } = await supabase
    .from('retailer_settings')
    .select('*')
    .eq('retailer_id', retailerId)
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching retailer settings:', error);
    return null;
  }

  const settings: RetailerSettings = {
    assistant_name: data?.assistant_name || 'Assistant',
    theme_color: data?.theme_color || '#3B82F6',
    greeting_message: data?.greeting_message,
    show_products: data?.show_products !== false,
    cart_enabled: data?.cart_enabled !== false
  };

  retailerCache.set(cacheKey, { data: settings, timestamp: Date.now() });
  console.log('✅ Retailer settings cached');
  return settings;
}

async function detectIntent(message: string, history: ChatMessage[]): Promise<string> {
  const lowerMessage = message.toLowerCase().trim();

  const intentPatterns = {
    greeting: [
      /^(bonjour|salut|coucou|hello|hi|yo|bonsoir|bonne nuit)/i,
      /^(commencer|début|start|allô)/i
    ],
    product_search: [
      /(cherche|recherche|trouve|veux|voudrais|besoin|disponible|acheter|achète|propose|suggère|montre|voir)/i,
      /(canapé|table|chaise|lit|meuble|armoire|étagère|lampe|tapis|fauteuil|bureau|commode|buffet|éclairage|décoration)/i,
      /(scandinave|moderne|industriel|rustique|minimaliste|contemporain|vintage|classique|design)/i,
      /(salon|chambre|cuisine|bureau|salle[\s-]à[\s-]manger|salle[\s-]de[\s-]bain|entrée|jardin|terrasse)/i,
      /(quel|quels|quelle|quelles|recommande|suggestion|idée|conseille|type|genre|style)/i
    ],
    product_show: [
      /(détails?|plus d'infos?|caractéristiques?|fiche|spécifications?|info)/i,
      /(celui-ci|celui-là|cette|ceci|cela|celui|([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}))/i
    ]
  };

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return intent;
      }
    }
  }

  return 'chat';
}

async function searchProducts(supabase: any, query: string, retailerId?: string): Promise<Product[]> {
  const lowerQuery = query.toLowerCase();

  const styleKeywords: Record<string, string> = {
    'scandinave': 'scandinave',
    'moderne': 'moderne',
    'industriel': 'industriel',
    'minimaliste': 'minimaliste',
    'rustique': 'rustique',
    'contemporain': 'contemporain',
    'vintage': 'vintage',
    'classique': 'classique',
    'design': 'design'
  };

  const roomKeywords: Record<string, string> = {
    'salon': 'salon',
    'chambre': 'chambre',
    'cuisine': 'cuisine',
    'bureau': 'bureau',
    'salle à manger': 'salle à manger',
    'salle de bain': 'salle de bain',
    'entrée': 'entrée',
    'jardin': 'jardin',
    'terrasse': 'terrasse'
  };

  const categoryKeywords: Record<string, string[]> = {
    'canapé': ['canapé', 'sofa'],
    'table': ['table'],
    'chaise': ['chaise', 'siège'],
    'lit': ['lit', 'sommier'],
    'armoire': ['armoire', 'penderie'],
    'étagère': ['étagère', 'bibliothèque'],
    'lampe': ['lampe', 'luminaire', 'éclairage'],
    'tapis': ['tapis'],
    'fauteuil': ['fauteuil'],
    'bureau': ['bureau', 'desk'],
    'commode': ['commode', 'tiroirs'],
    'buffet': ['buffet', 'vaisselier']
  };

  let queryBuilder = supabase
    .from('shopify_products')
    .select('*')
    .eq('status', 'active')
    .limit(20);

  if (retailerId) {
    queryBuilder = queryBuilder.eq('retailer_id', retailerId);
  }

  let styleMatch = null;
  for (const [french, style] of Object.entries(styleKeywords)) {
    if (lowerQuery.includes(french)) {
      styleMatch = style;
      break;
    }
  }

  let roomMatch = null;
  for (const [french, room] of Object.entries(roomKeywords)) {
    if (lowerQuery.includes(french)) {
      roomMatch = room;
      break;
    }
  }

  let categoryMatch = null;
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        categoryMatch = category;
        break;
      }
    }
    if (categoryMatch) break;
  }

  const filters = [];

  if (styleMatch) {
    filters.push(`style.ilike.%${styleMatch}%`);
  }

  if (roomMatch) {
    filters.push(`room.ilike.%${roomMatch}%`);
  }

  if (categoryMatch) {
    filters.push(`category.ilike.%${categoryMatch}%,title.ilike.%${categoryMatch}%,product_type.ilike.%${categoryMatch}%`);
  }

  if (filters.length === 0) {
    const searchTerms = query.split(' ').filter(word => word.length > 2);
    if (searchTerms.length > 0) {
      const searchConditions = searchTerms.map(term =>
        `title.ilike.%${term}%,description.ilike.%${term}%,tags.ilike.%${term}%,product_type.ilike.%${term}%,category.ilike.%${term}%`
      ).join(',');
      filters.push(searchConditions);
    }
  }

  if (filters.length > 0) {
    queryBuilder = queryBuilder.or(filters.join(','));
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('❌ Product search error:', error);
    return [];
  }

  const products = (data || []).map((product: any) => ({
    id: product.id,
    title: product.title,
    description: product.description,
    ai_enhanced_description: product.ai_enhanced_description,
    price: product.price,
    image_url: product.image_url || product.featured_image,
    product_url: product.product_url || `/products/${product.handle}`,
    style: product.style,
    room: product.room,
    category: product.category
  }));

  return products.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (styleMatch) {
      if (a.style?.toLowerCase().includes(styleMatch)) scoreA += 3;
      if (b.style?.toLowerCase().includes(styleMatch)) scoreB += 3;
    }

    if (roomMatch) {
      if (a.room?.toLowerCase().includes(roomMatch)) scoreA += 2;
      if (b.room?.toLowerCase().includes(roomMatch)) scoreB += 2;
    }

    if (categoryMatch) {
      if (a.category?.toLowerCase().includes(categoryMatch)) scoreA += 2;
      if (b.category?.toLowerCase().includes(categoryMatch)) scoreB += 2;
      if (a.title?.toLowerCase().includes(categoryMatch)) scoreA += 1;
      if (b.title?.toLowerCase().includes(categoryMatch)) scoreB += 1;
    }

    return scoreB - scoreA;
  });
}

async function getProductById(supabase: any, productId: string, retailerId?: string): Promise<Product | null> {
  let queryBuilder = supabase
    .from('shopify_products')
    .select('*')
    .eq('id', productId)
    .maybeSingle();

  if (retailerId) {
    queryBuilder = queryBuilder.eq('retailer_id', retailerId);
  }

  const { data, error } = await queryBuilder;

  if (error || !data) {
    console.error('❌ Product fetch error:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    ai_enhanced_description: data.ai_enhanced_description,
    price: data.price,
    image_url: data.image_url || data.featured_image,
    product_url: data.product_url || `/products/${data.handle}`,
    style: data.style,
    room: data.room,
    category: data.category
  };
}

async function generateProductResponse(
  message: string,
  products: Product[],
  retailerSettings?: RetailerSettings | null
): Promise<string> {
  if (products.length === 0) {
    return "Je suis désolé, je n'ai pas trouvé de produits correspondant à votre recherche. Pouvez-vous me donner plus de détails ? Par exemple : le style (moderne, scandinave...), la pièce (salon, chambre...), ou le type de meuble spécifique ?";
  }

  if (products.length === 1) {
    const product = products[0];
    const description = product.ai_enhanced_description || product.description?.substring(0, 200) || '';
    return `J'ai trouvé exactement ce qu'il vous faut ! Voici "${product.title}". ${description}`;
  }

  const assistantName = retailerSettings?.assistant_name || 'notre boutique';

  const styles = [...new Set(products.map(p => p.style).filter(Boolean))];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  let intro = `Parfait ! J'ai trouvé ${products.length} produits `;

  if (categories.length === 1) {
    intro += `${categories[0]}s `;
  }

  if (styles.length > 0 && styles.length <= 2) {
    intro += `de style ${styles.join(' et ')} `;
  }

  intro += `qui correspondent à votre recherche. Voici ma sélection :`;

  return intro;
}

function generateProductDetailResponse(product: Product, retailerSettings?: RetailerSettings | null): string {
  const features = [];
  if (product.style) features.push(`style ${product.style}`);
  if (product.room) features.push(`pour ${product.room}`);
  if (product.category) features.push(product.category);

  const featureText = features.length > 0 ? ` (${features.join(', ')})` : '';
  const description = product.ai_enhanced_description || product.description || 'Un produit de qualité soigneusement sélectionné.';

  return `Voici les détails complets du produit "${product.title}"${featureText}. ${description}`;
}

function extractProductId(message: string): string | null {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = message.match(uuidRegex);
  return match ? match[0] : null;
}

async function generateChatResponse(
  message: string,
  history: ChatMessage[],
  retailerSettings?: RetailerSettings | null
): Promise<string> {
  const assistantName = retailerSettings?.assistant_name || 'votre assistant';

  const systemPrompt = `Tu es ${assistantName}, un assistant commercial virtuel expert en décoration d'intérieur et ameublement.

TON RÔLE:
- Accueillir chaleureusement les clients et comprendre leurs besoins en mobilier et décoration
- Poser des questions pertinentes sur le style recherché, la pièce à meubler, le type de meuble
- Guider les clients vers des produits adaptés en mettant en valeur leurs caractéristiques
- Être enthousiaste et aider à visualiser l'intégration des meubles dans leur intérieur
- Proposer des conseils de décoration personnalisés et des associations de styles

TON STYLE DE COMMUNICATION:
- Naturel, conversationnel et chaleureux (pas robotique)
- Pose UNE question à la fois pour ne pas submerger le client
- Encourage à préciser les recherches avec bienveillance
- Utilise des exemples concrets pour aider le client à se projeter
- Reste concentré sur l'ameublement et la décoration d'intérieur
- Réponds de manière concise (2-4 phrases maximum)

TON OBJECTIF:
Accompagner le client dans sa recherche jusqu'à trouver le meuble ou l'article de décoration parfait pour son intérieur.

IMPORTANT:
- Si le client cherche un produit spécifique, demande des détails (style, pièce, matière, couleur)
- Si le client hésite, propose des suggestions basées sur les tendances actuelles
- Valorise toujours les produits avec enthousiasme mais reste naturel`;

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...history.slice(-6),
    { role: 'user', content: message }
  ];

  try {
    const response = await callDeepSeek(messages, 0.7, 500);
    return response.choices[0].message.content;
  } catch (error) {
    console.error('❌ Chat response generation failed:', error);
    return "Je suis désolé, j'ai rencontré une difficulté. Pouvez-vous reformuler votre question ?";
  }
}
