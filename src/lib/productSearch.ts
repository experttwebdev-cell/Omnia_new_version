// productSearch.ts - VERSION DEEPSEEK UNIQUEMENT
import { supabase } from "./supabase";
import type { Database } from "./database.types";

type Product = Database['public']['Tables']['shopify_products']['Row'];

export interface ProductSearchFilters {
  query?: string;
  category?: string;
  subCategory?: string;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  material?: string;
  shape?: string;
  texture?: string;
  pattern?: string;
  finish?: string;
  room?: string;
  style?: string;
  craftsmanship?: string;
  tags?: string[];
  vendor?: string;
  hasPromo?: boolean;
  inStock?: boolean;
  enrichmentStatus?: 'enriched' | 'not_enriched' | 'all';
  status?: 'active' | 'draft' | 'archived';
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'popularity' | 'inventory';
}

export interface ProductSearchResult {
  products: (Product & { _relevance_score?: number; _match_type?: 'exact' | 'partial' | 'fallback' })[];
  total: number;
  hasMore: boolean;
  searchMeta?: {
    originalQuery: string;
    processedQuery: string;
    searchTime: number;
    matchType: 'exact' | 'partial' | 'fallback';
    extractedFilters: Partial<ProductSearchFilters>;
  };
}

// 🎯 FONCTION D'EXTRACTION DEEPSEEK UNIQUEMENT
async function extractSearchIntentWithDeepSeek(userQuery: string): Promise<Partial<ProductSearchFilters>> {
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!deepseekApiKey) {
    console.warn('❌ DeepSeek API key not configured, using fallback search');
    return { query: userQuery };
  }

  try {
    const systemPrompt = `Tu es un assistant e-commerce intelligent. 
Analyse la requête de l'utilisateur et comprends son intention de recherche.
Tu as accès à une table de produits avec tous ces champs : 
- title, description, price, compare_at_price
- category, sub_category, product_type, vendor
- style, room, material, color
- ai_color, ai_material, ai_shape, ai_texture, ai_pattern, ai_finish
- tags, characteristics, dimensions_text
- et tous les autres champs d'analyse IA

Retourne UNIQUEMENT un objet JSON avec les filtres pertinents pour cette recherche.
Exemple de requête: "je cherche une table basse travertin moins de 100 euros"
Réponse: {"type": "table basse", "material": "travertin", "maxPrice": 100}

Autre exemple: "canapé scandinave bleu pour salon"
Réponse: {"type": "canapé", "style": "scandinave", "color": "bleu", "room": "salon"}

Retourne un objet JSON vide {} si tu ne détectes pas d'intention spécifique.`;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery }
        ],
        temperature: 0.1,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const parsed = JSON.parse(content);
      console.log('🎯 DeepSeek extracted filters:', parsed);
      return { ...parsed, query: userQuery }; // Garder la query originale
    } catch (parseError) {
      console.error('❌ DeepSeek JSON parse error:', parseError);
      return { query: userQuery };
    }
  } catch (error) {
    console.error('❌ DeepSeek API error:', error);
    return { query: userQuery };
  }
}

// 🎯 FONCTION DE RECHERCHE PRINCIPALE
export async function searchProducts(
  filters: ProductSearchFilters,
  storeId?: string
): Promise<ProductSearchResult> {
  const startTime = Date.now();
  
  console.log('🔍 [SEARCH] Starting natural search with:', {
    ...filters,
    query: filters.query?.substring(0, 100)
  });

  try {
    // Extraire l'intention avec DeepSeek si une query est fournie
    let extractedFilters: Partial<ProductSearchFilters> = {};
    if (filters.query?.trim()) {
      extractedFilters = await extractSearchIntentWithDeepSeek(filters.query);
    }

    // Fusionner les filtres (ceux passés en paramètre écrasent ceux de DeepSeek)
    const finalFilters: ProductSearchFilters = {
      ...extractedFilters,
      ...filters, // Les filtres explicites ont la priorité
      limit: filters.limit || 24,
      sortBy: filters.sortBy || 'relevance'
    };

    let query = supabase
      .from('shopify_products')
      .select('*', { count: 'exact' });

    // Appliquer les filtres de base
    query = applyBaseFilters(query, finalFilters, storeId);
    
    // Appliquer les filtres de recherche avancés
    query = applySearchFilters(query, finalFilters);
    
    // Appliquer le tri
    query = applySorting(query, finalFilters);
    
    // Appliquer la pagination
    const limit = Math.min(finalFilters.limit || 24, 100);
    const offset = finalFilters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [SEARCH] Database error:', error);
      throw error;
    }

    let products = data || [];

    // Appliquer les filtres post-requête
    products = applyPostFilters(products, finalFilters);

    // Calculer la pertinence si une query est présente
    let matchType: 'exact' | 'partial' | 'fallback' = 'exact';
    if (finalFilters.query?.trim()) {
      const rankedResults = rankProductsByRelevance(products, finalFilters.query);
      products = rankedResults.products;
      matchType = rankedResults.matchType;
    }

    const total = count || 0;
    const hasMore = offset + products.length < total;

    const executionTime = Date.now() - startTime;
    
    const result: ProductSearchResult = {
      products,
      total,
      hasMore,
      searchMeta: {
        originalQuery: filters.query || '',
        processedQuery: finalFilters.query || '',
        searchTime: executionTime,
        matchType,
        extractedFilters
      }
    };

    console.log(`✅ [SEARCH] Found ${products.length} products (total: ${total}) in ${executionTime}ms [${matchType}]`);

    return result;

  } catch (error) {
    console.error('❌ [SEARCH] Search failed:', error);
    return {
      products: [],
      total: 0,
      hasMore: false,
      searchMeta: {
        originalQuery: filters.query || '',
        processedQuery: filters.query || '',
        searchTime: Date.now() - startTime,
        matchType: 'fallback',
        extractedFilters: {}
      }
    };
  }
}

// 🎯 FONCTIONS D'APPLICATION DES FILTRES (SIMPLIFIÉES)
function applyBaseFilters(
  query: any, 
  filters: ProductSearchFilters, 
  storeId?: string
) {
  let q = query;

  if (storeId) {
    q = q.eq('store_id', storeId);
  }

  // Filtre de statut
  q = q.eq('status', filters.status || 'active');

  // Filtre de stock
  if (filters.inStock) {
    q = q.gt('inventory_quantity', 0);
  }

  // Filtre d'enrichissement IA
  if (filters.enrichmentStatus === 'enriched') {
    q = q.eq('enrichment_status', 'enriched');
  } else if (filters.enrichmentStatus === 'not_enriched') {
    q = q.neq('enrichment_status', 'enriched').not('enrichment_status', 'is', null);
  }

  // Filtres de prix
  if (filters.minPrice !== undefined) {
    q = q.gte('price', filters.minPrice);
  }
  if (filters.maxPrice !== undefined) {
    q = q.lte('price', filters.maxPrice);
  }

  return q;
}

function applySearchFilters(query: any, filters: ProductSearchFilters) {
  let q = query;

  // Recherche textuelle intelligente - TOUS les champs sont disponibles
  if (filters.query?.trim()) {
    q = applyGlobalTextSearch(q, filters.query);
  }

  // Filtres spécifiques extraits par DeepSeek
  const filterMap = {
    category: filters.category,
    sub_category: filters.subCategory,
    vendor: filters.vendor,
    room: filters.room,
    style: filters.style,
    material: filters.material,
    color: filters.color,
    ai_color: filters.color,
    ai_material: filters.material
  };

  Object.entries(filterMap).forEach(([field, value]) => {
    if (value) {
      q = q.ilike(field, `%${value}%`);
    }
  });

  // Filtres par tags
  if (filters.tags?.length) {
    const tagConditions = filters.tags
      .slice(0, 10)
      .map(tag => `tags.ilike.%${tag}%`)
      .join(',');
    q = q.or(tagConditions);
  }

  return q;
}

function applyGlobalTextSearch(query: any, searchQuery: string) {
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 2);
  
  if (searchTerms.length === 0) return query;

  // TOUS les champs de la table sont disponibles pour la recherche
  const searchableFields = [
    'title', 'description', 'category', 'sub_category', 'product_type', 'vendor',
    'style', 'room', 'material', 'color', 'tags', 'characteristics', 'dimensions_text',
    'ai_color', 'ai_material', 'ai_shape', 'ai_texture', 'ai_pattern', 'ai_finish',
    'ai_design_elements', 'ai_vision_analysis', 'seo_title', 'seo_description',
    'chat_text', 'functionality', 'google_product_category', 'google_brand'
  ];

  const conditions: string[] = [];

  // Pour chaque terme, chercher dans TOUS les champs
  searchTerms.forEach(term => {
    const fieldConditions = searchableFields.map(field => `${field}.ilike.%${term}%`).join(',');
    conditions.push(fieldConditions);
  });

  return query.or(conditions.join(','));
}

function applySorting(query: any, filters: ProductSearchFilters) {
  const sortConfig: { [key: string]: any } = {
    price_asc: { column: 'price', ascending: true },
    price_desc: { column: 'price', ascending: false },
    date_asc: { column: 'created_at', ascending: true },
    date_desc: { column: 'created_at', ascending: false },
    title_asc: { column: 'title', ascending: true },
    title_desc: { column: 'title', ascending: false },
    popularity: { column: 'ai_confidence_score', ascending: false },
    inventory: { column: 'inventory_quantity', ascending: false }
  };

  const sort = sortConfig[filters.sortBy || 'relevance'];
  return query.order(sort.column, { ascending: sort.ascending });
}

function applyPostFilters(products: Product[], filters: ProductSearchFilters): Product[] {
  let filtered = [...products];

  // Filtre promo
  if (filters.hasPromo) {
    filtered = filtered.filter(p =>
      p.compare_at_price &&
      Number(p.compare_at_price) > Number(p.price)
    );
  }

  return filtered;
}

// 🎯 FONCTION DE SCORING SIMPLIFIÉE
function rankProductsByRelevance(products: Product[], query: string): { 
  products: (Product & { _relevance_score: number; _match_type: 'exact' | 'partial' | 'fallback' })[];
  matchType: 'exact' | 'partial' | 'fallback';
} {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  const normalizedQuery = query.toLowerCase().trim();

  if (searchTerms.length === 0) {
    return {
      products: products.map(p => ({ 
        ...p, 
        _relevance_score: 0,
        _match_type: 'fallback' 
      })),
      matchType: 'fallback'
    };
  }

  const scoredProducts = products.map(product => {
    let score = 0;

    // Vérifier tous les champs textuels du produit
    const allTextFields = [
      product.title,
      product.description,
      product.category,
      product.sub_category,
      product.product_type,
      product.vendor,
      product.style,
      product.room,
      product.material,
      product.color,
      product.tags,
      product.characteristics,
      product.dimensions_text,
      product.ai_color,
      product.ai_material,
      product.ai_shape,
      product.ai_texture,
      product.ai_pattern,
      product.ai_finish,
      product.ai_design_elements,
      product.ai_vision_analysis,
      product.seo_title,
      product.seo_description,
      product.chat_text,
      product.functionality
    ].filter(Boolean).join(' ').toLowerCase();

    // Correspondance exacte de la requête complète
    if (allTextFields.includes(normalizedQuery)) {
      score += 100;
    }

    // Score pour chaque terme de recherche
    searchTerms.forEach(term => {
      if (allTextFields.includes(term)) {
        score += 10;
        
        // Bonus pour les correspondances dans les champs importants
        if (product.title?.toLowerCase().includes(term)) score += 5;
        if (product.category?.toLowerCase().includes(term)) score += 3;
        if (product.tags?.toLowerCase().includes(term)) score += 2;
      }
    });

    // Bonus pour les produits enrichis par IA
    if (product.enrichment_status === 'enriched') {
      score += 5;
    }

    // Bonus pour les produits en stock
    if (product.inventory_quantity && product.inventory_quantity > 0) {
      score += 3;
    }

    // Déterminer le type de correspondance
    let matchType: 'exact' | 'partial' | 'fallback' = 'fallback';
    if (score >= 50) matchType = 'exact';
    else if (score >= 20) matchType = 'partial';

    return { 
      ...product, 
      _relevance_score: score,
      _match_type: matchType
    };
  });

  return {
    products: scoredProducts.sort((a, b) => b._relevance_score - a._relevance_score),
    matchType: scoredProducts.some(p => p._relevance_score >= 50) ? 'exact' : 
               scoredProducts.some(p => p._relevance_score >= 20) ? 'partial' : 'fallback'
  };
}

// 🎯 FONCTIONS DE RECHERCHE SPÉCIALISÉES
export async function quickProductSearch(
  query: string,
  limit: number = 8,
  storeId?: string
): Promise<Product[]> {
  const result = await searchProducts({ query, limit, sortBy: 'relevance' }, storeId);
  return result.products;
}

export async function searchProductsByCategory(
  category: string,
  limit: number = 12
): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('status', 'active')
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error searching by category:', error);
    return [];
  }
}

export async function getFeaturedProducts(
  limit: number = 8,
  storeId?: string
): Promise<Product[]> {
  try {
    let query = supabase
      .from('shopify_products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('❌ Error getting featured products:', error);
    return [];
  }
}

// 🎯 SUPPRESSION DE L'EXTRACTION MANUELLE - UTILISATION DE DEEPSEEK UNIQUEMENT
export async function getProductSuggestions(
  query: string,
  limit: number = 6
): Promise<Array<{ suggestion: string; type: 'product' | 'category' | 'style' | 'material' }>> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Recherche simple dans les titres pour les suggestions
    const { data, error } = await supabase
      .from('shopify_products')
      .select('title, category, style, ai_material')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,category.ilike.%${query}%,style.ilike.%${query}%,ai_material.ilike.%${query}%`)
      .limit(limit * 2);

    if (error || !data) return [];

    const suggestions = new Set<string>();
    const results: Array<{ suggestion: string; type: 'product' | 'category' | 'style' | 'material' }> = [];

    data.forEach(product => {
      if (product.title && !suggestions.has(product.title)) {
        suggestions.add(product.title);
        results.push({ suggestion: product.title, type: 'product' });
      }
      if (product.category && !suggestions.has(product.category)) {
        suggestions.add(product.category);
        results.push({ suggestion: product.category, type: 'category' });
      }
      if (product.style && !suggestions.has(product.style)) {
        suggestions.add(product.style);
        results.push({ suggestion: product.style, type: 'style' });
      }
      if (product.ai_material && !suggestions.has(product.ai_material)) {
        suggestions.add(product.ai_material);
        results.push({ suggestion: product.ai_material, type: 'material' });
      }
    });

    return results.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting product suggestions:', error);
    return [];
  }
}