// productSearch.ts - VERSION AMÉLIORÉE
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
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc' | 'popularity';
}

export interface ProductSearchResult {
  products: (Product & { _relevance_score?: number })[];
  total: number;
  hasMore: boolean;
  filters?: {
    availableColors: string[];
    availableMaterials: string[];
    availableStyles: string[];
    availableRooms: string[];
    priceRange: { min: number; max: number };
  };
}

// Cache pour les métadonnées de filtres
const filterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function searchProducts(
  filters: ProductSearchFilters,
  storeId?: string
): Promise<ProductSearchResult> {
  console.log('🔍 [SEARCH] Starting product search with filters:', {
    ...filters,
    query: filters.query?.substring(0, 100) // Log partiel pour éviter la pollution
  });

  const startTime = Date.now();

  try {
    let query = supabase
      .from('shopify_products')
      .select('*', { count: 'exact' });

    // Appliquer les filtres de base
    query = applyBaseFilters(query, filters, storeId);
    
    // Appliquer les filtres de recherche avancés
    query = applySearchFilters(query, filters);
    
    // Appliquer le tri
    query = applySorting(query, filters);
    
    // Appliquer la pagination
    const limit = filters.limit || 24;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [SEARCH] Database error:', error);
      throw error;
    }

    let products = data || [];

    // Appliquer les filtres post-requête
    products = applyPostFilters(products, filters);

    // Calculer la pertinence si une query est présente
    if (filters.query?.trim()) {
      products = rankProductsByRelevance(products, filters.query);
    }

    const total = count || 0;
    const hasMore = offset + products.length < total;

    // Récupérer les métadonnées des filtres disponibles
    const filterMetadata = await getFilterMetadata(storeId);

    const executionTime = Date.now() - startTime;
    console.log(`✅ [SEARCH] Found ${products.length} products (total: ${total}) in ${executionTime}ms`);

    return {
      products,
      total,
      hasMore,
      filters: filterMetadata
    };

  } catch (error) {
    console.error('❌ [SEARCH] Search failed:', error);
    return {
      products: [],
      total: 0,
      hasMore: false
    };
  }
}

// 🎯 FONCTIONS D'APPLICATION DES FILTRES
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
  if (filters.status) {
    q = q.eq('status', filters.status);
  } else {
    q = q.eq('status', 'active');
  }

  // Filtre de stock
  if (filters.inStock) {
    q = q.gt('inventory_quantity', 0);
  }

  // Filtre d'enrichissement IA
  if (filters.enrichmentStatus === 'enriched') {
    q = q.eq('enrichment_status', 'enriched');
  } else if (filters.enrichmentStatus === 'not_enriched') {
    q = q.neq('enrichment_status', 'enriched');
  }

  // Filtres de base
  const basicFilters = [
    { field: 'category', value: filters.category },
    { field: 'sub_category', value: filters.subCategory },
    { field: 'vendor', value: filters.vendor },
    { field: 'room', value: filters.room },
    { field: 'style', value: filters.style }
  ];

  basicFilters.forEach(({ field, value }) => {
    if (value) {
      q = q.ilike(field, `%${value}%`);
    }
  });

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

  // Filtres basés sur l'analyse IA
  const aiFilters = [
    { field: 'ai_color', value: filters.color },
    { field: 'ai_material', value: filters.material },
    { field: 'ai_shape', value: filters.shape },
    { field: 'ai_texture', value: filters.texture },
    { field: 'ai_pattern', value: filters.pattern },
    { field: 'ai_finish', value: filters.finish },
    { field: 'ai_craftsmanship_level', value: filters.craftsmanship }
  ];

  aiFilters.forEach(({ field, value }) => {
    if (value) {
      q = q.ilike(field, `%${value}%`);
    }
  });

  // Recherche textuelle intelligente
  if (filters.query?.trim()) {
    q = applyTextSearch(q, filters.query);
  }

  // Filtres par tags
  if (filters.tags?.length) {
    const tagConditions = filters.tags.map(tag => `tags.ilike.%${tag}%`).join(',');
    q = q.or(tagConditions);
  }

  return q;
}

function applyTextSearch(query: any, searchQuery: string) {
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 2);
  
  if (searchTerms.length === 0) return query;

  // Champs prioritaires (score élevé)
  const primaryFields = [
    'title', 'category', 'sub_category', 'product_type',
    'ai_material', 'chat_text', 'seo_title'
  ];

  // Champs secondaires (score moyen)
  const secondaryFields = [
    'description', 'tags', 'vendor', 'seo_description',
    'ai_vision_analysis', 'ai_color', 'ai_shape', 'ai_texture',
    'ai_pattern', 'ai_finish', 'ai_design_elements', 'room', 'style',
    'characteristics', 'google_product_category', 'google_brand'
  ];

  // Construire les conditions de recherche
  const conditions: string[] = [];

  // Pour chaque terme, chercher dans tous les champs
  searchTerms.forEach(term => {
    const primaryConditions = primaryFields.map(field => `${field}.ilike.%${term}%`).join(',');
    const secondaryConditions = secondaryFields.map(field => `${field}.ilike.%${term}%`).join(',');
    
    conditions.push(primaryConditions);
    conditions.push(secondaryConditions);
  });

  return query.or(conditions.join(','));
}

function applySorting(query: any, filters: ProductSearchFilters) {
  switch (filters.sortBy) {
    case 'price_asc':
      return query.order('price', { ascending: true });
    case 'price_desc':
      return query.order('price', { ascending: false });
    case 'date_asc':
      return query.order('created_at', { ascending: true });
    case 'date_desc':
      return query.order('created_at', { ascending: false });
    case 'title_asc':
      return query.order('title', { ascending: true });
    case 'title_desc':
      return query.order('title', { ascending: false });
    case 'popularity':
      // Utiliser le score de confiance IA comme indicateur de popularité
      return query.order('ai_confidence_score', { ascending: false });
    default:
      return query.order('created_at', { ascending: false });
  }
}

function applyPostFilters(products: Product[], filters: ProductSearchFilters): Product[] {
  let filtered = [...products];

  // Filtre promo (doit être fait après la requête car compare_at_price peut être null)
  if (filters.hasPromo) {
    filtered = filtered.filter(p =>
      p.compare_at_price &&
      Number(p.compare_at_price) > Number(p.price)
    );
  }

  return filtered;
}

// 🎯 FONCTION DE SCORING AMÉLIORÉE
function rankProductsByRelevance(products: Product[], query: string): (Product & { _relevance_score: number })[] {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  const normalizedQuery = query.toLowerCase();

  if (searchTerms.length === 0) {
    return products.map(p => ({ ...p, _relevance_score: 0 }));
  }

  const scoredProducts = products.map(product => {
    let score = 0;
    const fields = getProductSearchFields(product);

    // ✅ BONUS MASSIF : Correspondance exacte du titre
    if (fields.title.includes(normalizedQuery)) {
      score += 100;
    }

    // ✅ BONUS : Tous les termes de recherche sont présents
    const allTermsPresent = searchTerms.every(term => 
      Object.values(fields).some(field => field.includes(term))
    );
    if (allTermsPresent && searchTerms.length > 1) {
      score += 80;
    }

    // Score pour chaque terme individuellement
    searchTerms.forEach(term => {
      // Champs critiques (score élevé)
      if (fields.title.includes(term)) {
        score += fields.title.startsWith(term) ? 15 : 10;
      }
      if (fields.category.includes(term)) score += 8;
      if (fields.subCategory.includes(term)) score += 7;
      if (fields.aiMaterial.includes(term)) score += 8;
      if (fields.chatText.includes(term)) score += 6;

      // Champs importants (score moyen)
      if (fields.seoTitle.includes(term)) score += 6;
      if (fields.room.includes(term)) score += 5;
      if (fields.style.includes(term)) score += 5;
      if (fields.tags.includes(term)) score += 4;
      if (fields.productType.includes(term)) score += 4;

      // Champs secondaires (score faible)
      if (fields.aiColor.includes(term)) score += 3;
      if (fields.aiShape.includes(term)) score += 3;
      if (fields.aiTexture.includes(term)) score += 3;
      if (fields.aiPattern.includes(term)) score += 3;
      if (fields.aiFinish.includes(term)) score += 3;
      if (fields.craftsmanship.includes(term)) score += 3;
      if (fields.characteristics.includes(term)) score += 2;
      if (fields.aiDesign.includes(term)) score += 2;
      if (fields.dimensions.includes(term)) score += 2;
      if (fields.seoDescription.includes(term)) score += 2;
      if (fields.description.includes(term)) score += 1;
      if (fields.visionAnalysis.includes(term)) score += 1;
    });

    // Bonus pour les produits enrichis par IA
    if (product.enrichment_status === 'enriched') {
      score += 5;
    }

    // Bonus pour les produits en stock
    if (product.inventory_quantity && product.inventory_quantity > 0) {
      score += 3;
    }

    return { ...product, _relevance_score: Math.min(score, 200) }; // Cap à 200
  });

  return scoredProducts.sort((a, b) => b._relevance_score - a._relevance_score);
}

function getProductSearchFields(product: Product) {
  return {
    title: (product.title?.toLowerCase() || ''),
    description: (product.description?.toLowerCase() || ''),
    tags: (product.tags?.toLowerCase() || ''),
    category: (product.category?.toLowerCase() || ''),
    subCategory: (product.sub_category?.toLowerCase() || ''),
    productType: (product.product_type?.toLowerCase() || ''),
    aiColor: (product.ai_color?.toLowerCase() || ''),
    aiMaterial: (product.ai_material?.toLowerCase() || ''),
    aiShape: (product.ai_shape?.toLowerCase() || ''),
    aiTexture: (product.ai_texture?.toLowerCase() || ''),
    aiPattern: (product.ai_pattern?.toLowerCase() || ''),
    aiFinish: (product.ai_finish?.toLowerCase() || ''),
    aiDesign: (product.ai_design_elements?.toLowerCase() || ''),
    room: (product.room?.toLowerCase() || ''),
    style: (product.style?.toLowerCase() || ''),
    dimensions: (product.dimensions_text?.toLowerCase() || ''),
    characteristics: (product.characteristics?.toLowerCase() || ''),
    seoTitle: (product.seo_title?.toLowerCase() || ''),
    seoDescription: (product.seo_description?.toLowerCase() || ''),
    visionAnalysis: (product.ai_vision_analysis?.toLowerCase() || ''),
    craftsmanship: (product.ai_craftsmanship_level?.toLowerCase() || ''),
    chatText: (product.chat_text?.toLowerCase() || '')
  };
}

// 🎯 FONCTIONS DE RECHERCHE SPÉCIALISÉES
export async function searchProductsByIds(productIds: string[]): Promise<Product[]> {
  if (!productIds.length) return [];

  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('*')
      .in('id', productIds)
      .eq('status', 'active');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('❌ Error searching products by IDs:', error);
    return [];
  }
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

    // Prioriser les produits enrichis par IA et en promo
    return (data || [])
      .sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.enrichment_status === 'enriched') scoreA += 2;
        if (b.enrichment_status === 'enriched') scoreB += 2;
        if (a.compare_at_price && Number(a.compare_at_price) > Number(a.price)) scoreA += 1;
        if (b.compare_at_price && Number(b.compare_at_price) > Number(b.price)) scoreB += 1;

        return scoreB - scoreA;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting featured products:', error);
    return [];
  }
}

// 🎯 EXTRACTION INTELLIGENTE DES FILTRES
export function extractFiltersFromQuery(query: string): Partial<ProductSearchFilters> {
  const filters: Partial<ProductSearchFilters> = {};
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery) return filters;

  // Détection des couleurs
  const colors = [
    'blanc', 'blanche', 'white', 'noir', 'noire', 'black', 
    'gris', 'grise', 'gray', 'beige', 'sable', 'crème',
    'marron', 'brun', 'brune', 'brown', 'bleu', 'bleue', 'blue',
    'vert', 'verte', 'green', 'rouge', 'red', 'jaune', 'yellow',
    'orange', 'rose', 'pink', 'violet', 'purple', 'doré', 'argent'
  ];
  
  const foundColor = colors.find(color => lowerQuery.includes(color));
  if (foundColor) {
    filters.color = foundColor;
  }

  // Détection des matériaux
  const materials = [
    'bois', 'wood', 'chêne', 'noyer', 'hêtre', 'pin',
    'metal', 'métal', 'acier', 'fer', 'inox', 'aluminium',
    'verre', 'glass', 'marbre', 'marble', 'pierre', 'stone',
    'cuir', 'leather', 'tissu', 'textile', 'fabric', 'velours',
    'lin', 'laine', 'coton', 'soie', 'silk', 'plastique', 'plastic',
    'rotin', 'osier', 'bambou', 'teck'
  ];
  
  const foundMaterial = materials.find(material => lowerQuery.includes(material));
  if (foundMaterial) {
    filters.material = foundMaterial;
  }

  // Détection des styles
  const styles = [
    'scandinave', 'scandinavian', 'moderne', 'modern', 'contemporain',
    'industriel', 'industrial', 'rustique', 'rustic', 'campagne',
    'minimaliste', 'minimalist', 'épuré', 'vintage', 'rétro', 'retro',
    'classique', 'classic', 'traditionnel', 'design', 'luxe'
  ];
  
  const foundStyle = styles.find(style => lowerQuery.includes(style));
  if (foundStyle) {
    filters.style = foundStyle;
  }

  // Détection des pièces
  const rooms = [
    'salon', 'séjour', 'living', 'chambre', 'bedroom', 
    'cuisine', 'kitchen', 'bureau', 'office', 'salle à manger',
    'salle de bain', 'bathroom', 'entrée', 'hall', 'jardin', 'terrasse'
  ];
  
  const foundRoom = rooms.find(room => lowerQuery.includes(room));
  if (foundRoom) {
    filters.room = foundRoom;
  }

  // Détection des promos
  if (/(promo|promotion|solde|réduction|reduction|discount|sale)/i.test(lowerQuery)) {
    filters.hasPromo = true;
  }

  // Détection du stock
  if (/(stock|disponible|available|en stock)/i.test(lowerQuery)) {
    filters.inStock = true;
  }

  // Détection des prix
  const priceMatch = lowerQuery.match(/(\d+)\s*(€|euros?|dh|dirham|mad)/i);
  if (priceMatch) {
    filters.maxPrice = Number(priceMatch[1]);
  }

  const priceRangeMatch = lowerQuery.match(/(?:entre\s+)?(\d+)\s*(?:-|et|à)\s*(\d+)/i);
  if (priceRangeMatch) {
    filters.minPrice = Number(priceRangeMatch[1]);
    filters.maxPrice = Number(priceRangeMatch[2]);
  }

  // Nettoyer la query des termes déjà utilisés comme filtres
  filters.query = cleanSearchQuery(lowerQuery, {
    colors, materials, styles, rooms,
    promoWords: ['promo', 'promotion', 'solde', 'réduction', 'reduction', 'discount', 'sale'],
    stockWords: ['stock', 'disponible', 'available'],
    priceWords: ['€', 'euro', 'euros', 'dh', 'dirham', 'mad', 'entre', 'et', 'à']
  });

  console.log('🎯 [FILTERS] Extracted filters:', filters);
  return filters;
}

function cleanSearchQuery(query: string, stopWords: {
  colors: string[];
  materials: string[];
  styles: string[];
  rooms: string[];
  promoWords: string[];
  stockWords: string[];
  priceWords: string[];
}): string {
  const allStopWords = [
    ...stopWords.colors,
    ...stopWords.materials,
    ...stopWords.styles,
    ...stopWords.rooms,
    ...stopWords.promoWords,
    ...stopWords.stockWords,
    ...stopWords.priceWords,
    // Mots communs supplémentaires
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de',
    'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
    'ce', 'cet', 'cette', 'ces', 'ça',
    'est', 'sont', 'être', 'avoir',
    'cherche', 'recherche', 'veux', 'voudrais', 'souhaite', 'besoin',
    'montre', 'affiche', 'voir', 'trouve', 'montrer', 'article', 'produit'
  ];

  const words = query.split(/\s+/).filter(word => 
    word.length > 2 && !allStopWords.includes(word.toLowerCase())
  );

  return words.join(' ').trim();
}

// 🎯 SUGGESTIONS INTELLIGENTES
export async function getProductSuggestions(
  query: string,
  limit: number = 6
): Promise<Array<{ suggestion: string; type: 'product' | 'category' | 'style' | 'material' }>> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    
    if (searchTerms.length === 0) return [];

    // Rechercher dans différents types de contenu
    const [productResults, categoryResults, styleResults, materialResults] = await Promise.all([
      searchSuggestionsInField('title', searchTerms, limit * 2),
      searchSuggestionsInField('category', searchTerms, limit),
      searchSuggestionsInField('style', searchTerms, limit),
      searchSuggestionsInField('ai_material', searchTerms, limit)
    ]);

    const allSuggestions = [
      ...productResults.map(item => ({ suggestion: item.value, type: 'product' as const })),
      ...categoryResults.map(item => ({ suggestion: item.value, type: 'category' as const })),
      ...styleResults.map(item => ({ suggestion: item.value, type: 'style' as const })),
      ...materialResults.map(item => ({ suggestion: item.value, type: 'material' as const }))
    ];

    // Dédupliquer et limiter
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map(item => [item.suggestion, item])).values()
    ).slice(0, limit);

    return uniqueSuggestions;

  } catch (error) {
    console.error('❌ Error getting product suggestions:', error);
    return [];
  }
}

async function searchSuggestionsInField(
  field: string, 
  searchTerms: string[], 
  limit: number
): Promise<Array<{ value: string; score: number }>> {
  try {
    const conditions = searchTerms.map(term => `${field}.ilike.%${term}%`).join(',');
    
    const { data, error } = await supabase
      .from('shopify_products')
      .select(field)
      .eq('status', 'active')
      .or(conditions)
      .limit(limit * 3);

    if (error || !data) return [];

    // Compter les occurrences et scorer
    const counts = new Map<string, number>();
    data.forEach(item => {
      const value = item[field as keyof Product];
      if (value && typeof value === 'string') {
        const current = counts.get(value) || 0;
        counts.set(value, current + 1);
      }
    });

    // Convertir en tableau et scorer
    return Array.from(counts.entries())
      .map(([value, count]) => {
        let score = count;
        // Bonus pour les correspondances exactes
        if (searchTerms.some(term => value.toLowerCase().includes(term))) {
          score += 10;
        }
        return { value, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error(`Error searching suggestions in field ${field}:`, error);
    return [];
  }
}

// 🎯 MÉTADONNÉES DES FILTRES
async function getFilterMetadata(storeId?: string) {
  const cacheKey = `filter_metadata_${storeId || 'global'}`;
  const cached = filterCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    let query = supabase
      .from('shopify_products')
      .select('ai_color, ai_material, style, room, price')
      .eq('status', 'active');

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        availableColors: [],
        availableMaterials: [],
        availableStyles: [],
        availableRooms: [],
        priceRange: { min: 0, max: 1000 }
      };
    }

    const metadata = {
      availableColors: [...new Set(data.map(p => p.ai_color).filter(Boolean))].slice(0, 20),
      availableMaterials: [...new Set(data.map(p => p.ai_material).filter(Boolean))].slice(0, 20),
      availableStyles: [...new Set(data.map(p => p.style).filter(Boolean))].slice(0, 15),
      availableRooms: [...new Set(data.map(p => p.room).filter(Boolean))].slice(0, 10),
      priceRange: {
        min: Math.min(...data.map(p => Number(p.price) || 0)),
        max: Math.max(...data.map(p => Number(p.price) || 1000))
      }
    };

    // Mettre en cache
    filterCache.set(cacheKey, {
      data: metadata,
      timestamp: Date.now()
    });

    return metadata;
  } catch (error) {
    console.error('Error getting filter metadata:', error);
    return {
      availableColors: [],
      availableMaterials: [],
      availableStyles: [],
      availableRooms: [],
      priceRange: { min: 0, max: 1000 }
    };
  }
}

// 🎯 FONCTION DE RECHERCHE SIMPLIFIÉE POUR LE CHAT
export async function quickProductSearch(
  query: string,
  limit: number = 8,
  storeId?: string
): Promise<Product[]> {
  const filters = extractFiltersFromQuery(query);
  filters.limit = limit;
  filters.sortBy = 'relevance';

  const result = await searchProducts(filters, storeId);
  return result.products;
}