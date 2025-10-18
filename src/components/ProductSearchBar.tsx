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
  enrichmentStatus?: 'enriched' | 'not_enriched' | 'all';
  status?: 'active' | 'draft' | 'archived';
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc' | 'date_asc' | 'title_asc' | 'title_desc';
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  hasMore: boolean;
}

export async function searchProducts(
  filters: ProductSearchFilters,
  storeId?: string
): Promise<ProductSearchResult> {
  console.log('🔍 [SEARCH] Starting product search with filters:', filters);

  try {
    let query = supabase
      .from('shopify_products')
      .select('*', { count: 'exact' });

    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    } else {
      query = query.eq('status', 'active');
    }

    if (filters.enrichmentStatus) {
      if (filters.enrichmentStatus === 'enriched') {
        query = query.eq('enrichment_status', 'enriched');
      } else if (filters.enrichmentStatus === 'not_enriched') {
        query = query.neq('enrichment_status', 'enriched');
      }
    }

    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }

    if (filters.subCategory) {
      query = query.ilike('sub_category', `%${filters.subCategory}%`);
    }

    if (filters.vendor) {
      query = query.ilike('vendor', `%${filters.vendor}%`);
    }

    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice.toString());
    }

    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice.toString());
    }

    if (filters.color) {
      query = query.or(`ai_color.ilike.%${filters.color}%,title.ilike.%${filters.color}%,tags.ilike.%${filters.color}%`);
    }

    if (filters.material) {
      query = query.or(`ai_material.ilike.%${filters.material}%,title.ilike.%${filters.material}%,tags.ilike.%${filters.material}%`);
    }

    if (filters.shape) {
      query = query.or(`ai_shape.ilike.%${filters.shape}%,title.ilike.%${filters.shape}%,tags.ilike.%${filters.shape}%`);
    }

    if (filters.texture) {
      query = query.or(`ai_texture.ilike.%${filters.texture}%,title.ilike.%${filters.texture}%,description.ilike.%${filters.texture}%`);
    }

    if (filters.pattern) {
      query = query.or(`ai_pattern.ilike.%${filters.pattern}%,title.ilike.%${filters.pattern}%,description.ilike.%${filters.pattern}%`);
    }

    if (filters.finish) {
      query = query.or(`ai_finish.ilike.%${filters.finish}%,title.ilike.%${filters.finish}%,description.ilike.%${filters.finish}%`);
    }

    if (filters.room) {
      query = query.or(`room.ilike.%${filters.room}%,title.ilike.%${filters.room}%,tags.ilike.%${filters.room}%`);
    }

    if (filters.style) {
      query = query.or(`style.ilike.%${filters.style}%,title.ilike.%${filters.style}%,tags.ilike.%${filters.style}%`);
    }

    if (filters.craftsmanship) {
      query = query.or(`ai_craftsmanship_level.ilike.%${filters.craftsmanship}%`);
    }

    if (filters.query) {
      const searchTerms = filters.query.toLowerCase().split(' ').filter(term => term.length > 2);

      if (searchTerms.length > 0) {
        const orConditions = searchTerms.flatMap(term => [
          `title.ilike.%${term}%`,
          `description.ilike.%${term}%`,
          `tags.ilike.%${term}%`,
          `category.ilike.%${term}%`,
          `sub_category.ilike.%${term}%`,
          `product_type.ilike.%${term}%`,
          `vendor.ilike.%${term}%`,
          `seo_title.ilike.%${term}%`,
          `seo_description.ilike.%${term}%`,
          `ai_vision_analysis.ilike.%${term}%`,
          `ai_color.ilike.%${term}%`,
          `ai_material.ilike.%${term}%`,
          `ai_shape.ilike.%${term}%`,
          `ai_texture.ilike.%${term}%`,
          `ai_pattern.ilike.%${term}%`,
          `ai_finish.ilike.%${term}%`,
          `ai_design_elements.ilike.%${term}%`,
          `ai_craftsmanship_level.ilike.%${term}%`,
          `ai_condition_notes.ilike.%${term}%`,
          `room.ilike.%${term}%`,
          `style.ilike.%${term}%`,
          `dimensions_text.ilike.%${term}%`,
          `characteristics.ilike.%${term}%`,
          `google_product_category.ilike.%${term}%`,
          `google_brand.ilike.%${term}%`,
          `google_custom_label_0.ilike.%${term}%`,
          `google_custom_label_1.ilike.%${term}%`,
          `google_custom_label_2.ilike.%${term}%`,
          `google_custom_label_3.ilike.%${term}%`,
          `google_custom_label_4.ilike.%${term}%`,
          `chat_text.ilike.%${term}%`
        ]).join(',');

        query = query.or(orConditions);
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      const tagConditions = filters.tags.map(tag => `tags.ilike.%${tag}%`).join(',');
      query = query.or(tagConditions);
    }

    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    switch (filters.sortBy) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'date_asc':
        query = query.order('created_at', { ascending: true });
        break;
      case 'date_desc':
        query = query.order('created_at', { ascending: false });
        break;
      case 'title_asc':
        query = query.order('title', { ascending: true });
        break;
      case 'title_desc':
        query = query.order('title', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ [SEARCH] Database error:', error);
      throw error;
    }

    let products = data || [];

    if (filters.hasPromo) {
      products = products.filter(p =>
        p.compare_at_price &&
        Number(p.compare_at_price) > Number(p.price)
      );
    }

    if (filters.sortBy === 'relevance' && filters.query) {
      products = rankProductsByRelevance(products, filters.query);
    }

    const total = count || 0;
    const hasMore = offset + products.length < total;

    console.log(`✅ [SEARCH] Found ${products.length} products (total: ${total})`);

    return {
      products,
      total,
      hasMore
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

function rankProductsByRelevance(products: Product[], query: string): Product[] {
  const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);

  const scoredProducts = products.map(product => {
    let score = 0;
    const title = product.title?.toLowerCase() || '';
    const description = product.description?.toLowerCase() || '';
    const tags = product.tags?.toLowerCase() || '';
    const category = product.category?.toLowerCase() || '';
    const subCategory = product.sub_category?.toLowerCase() || '';
    const aiColor = product.ai_color?.toLowerCase() || '';
    const aiMaterial = product.ai_material?.toLowerCase() || '';
    const aiShape = product.ai_shape?.toLowerCase() || '';
    const aiTexture = product.ai_texture?.toLowerCase() || '';
    const aiPattern = product.ai_pattern?.toLowerCase() || '';
    const aiFinish = product.ai_finish?.toLowerCase() || '';
    const aiDesign = product.ai_design_elements?.toLowerCase() || '';
    const room = product.room?.toLowerCase() || '';
    const style = product.style?.toLowerCase() || '';
    const dimensions = product.dimensions_text?.toLowerCase() || '';
    const characteristics = product.characteristics?.toLowerCase() || '';
    const seoTitle = product.seo_title?.toLowerCase() || '';
    const seoDescription = product.seo_description?.toLowerCase() || '';
    const visionAnalysis = product.ai_vision_analysis?.toLowerCase() || '';
    const craftsmanship = product.ai_craftsmanship_level?.toLowerCase() || '';
    const chatText = product.chat_text?.toLowerCase() || '';

    searchTerms.forEach(term => {
      if (title.includes(term)) score += 10;
      if (title.startsWith(term)) score += 5;
      if (category.includes(term)) score += 8;
      if (subCategory.includes(term)) score += 7;
      if (seoTitle.includes(term)) score += 6;
      if (aiColor.includes(term)) score += 5;
      if (aiMaterial.includes(term)) score += 5;
      if (room.includes(term)) score += 5;
      if (style.includes(term)) score += 5;
      if (tags.includes(term)) score += 4;
      if (aiShape.includes(term)) score += 3;
      if (aiTexture.includes(term)) score += 3;
      if (aiPattern.includes(term)) score += 3;
      if (aiFinish.includes(term)) score += 3;
      if (craftsmanship.includes(term)) score += 3;
      if (characteristics.includes(term)) score += 2;
      if (aiDesign.includes(term)) score += 2;
      if (dimensions.includes(term)) score += 2;
      if (seoDescription.includes(term)) score += 2;
      if (description.includes(term)) score += 1;
      if (visionAnalysis.includes(term)) score += 1;
      if (chatText.includes(term)) score += 6;
    });

    return { product, score };
  });

  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

export async function searchProductsByIds(productIds: string[]): Promise<Product[]> {
  if (productIds.length === 0) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('*')
      .in('id', productIds);

    if (error) {
      console.error('❌ Error searching products by IDs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in searchProductsByIds:', error);
    return [];
  }
}

export async function searchProductsByCategory(
  category: string,
  limit: number = 10
): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('status', 'active')
      .ilike('category', `%${category}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error searching by category:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error in searchProductsByCategory:', error);
    return [];
  }
}

export async function findSimilarProducts(
  productId: string,
  limit: number = 5
): Promise<Product[]> {
  try {
    const { data: product, error: productError } = await supabase
      .from('shopify_products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();

    if (productError || !product) {
      return [];
    }

    const filters: ProductSearchFilters = {
      category: product.category || undefined,
      limit,
      sortBy: 'relevance'
    };

    if (product.ai_color) {
      filters.color = product.ai_color;
    }

    if (product.ai_material) {
      filters.material = product.ai_material;
    }

    const result = await searchProducts(filters);

    return result.products.filter(p => p.id !== productId);

  } catch (error) {
    console.error('❌ Error finding similar products:', error);
    return [];
  }
}

export async function getProductSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('shopify_products')
      .select('title')
      .eq('status', 'active')
      .ilike('title', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('❌ Error getting suggestions:', error);
      return [];
    }

    return (data || []).map(p => p.title);
  } catch (error) {
    console.error('❌ Error in getProductSuggestions:', error);
    return [];
  }
}

// ✅ EXTRACTFILTERS CORRIGÉE
export function extractFiltersFromQuery(query: string): Partial<ProductSearchFilters> {
  const filters: Partial<ProductSearchFilters> = {};
  const lowerQuery = query.toLowerCase().trim();

  console.log("🔍 Extraction filtres pour:", lowerQuery);

  const materials = [
    'bois', 'wood', 'chêne', 'oak', 'noyer', 'walnut', 'châtaignier', 'chestnut',
    'metal', 'métal', 'acier', 'steel', 'fer', 'iron', 'aluminium', 'aluminum',
    'verre', 'glass', 'cristal', 'crystal', 'vitre',
    'marbre', 'marble', 'granit', 'granite', 'pierre', 'stone', 'travertin', 'travertine',
    'cuir', 'leather', 'tissu', 'fabric', 'textile', 'lin', 'linen', 'coton', 'cotton',
    'plastique', 'plastic', 'résine', 'resin', 'rotin', 'rattan', 'osier', 'wicker',
    'céramique', 'ceramic', 'porcelaine', 'porcelain', 'faïence', 'earthenware',
    'velours', 'velvet', 'cuivre', 'copper', 'laiton', 'brass'
  ];

  const colors = [
    'blanc', 'white', 'noir', 'black', 'gris', 'gray', 'beige', 'marron', 'brown',
    'bleu', 'blue', 'vert', 'green', 'rouge', 'red', 'jaune', 'yellow', 'orange',
    'rose', 'pink', 'violet', 'purple', 'turquoise', 'or', 'gold', 'argent', 'silver'
  ];

  const foundMaterial = materials.find(material => lowerQuery.includes(material));
  if (foundMaterial) {
    filters.material = foundMaterial;
    console.log("🎯 Matériau détecté:", foundMaterial);
  }

  const foundColor = colors.find(color => lowerQuery.includes(color));
  if (foundColor) {
    filters.color = foundColor;
    console.log("🎯 Couleur détectée:", foundColor);
  }

  if (lowerQuery.includes('promo') || lowerQuery.includes('promotion') || 
      lowerQuery.includes('solde') || lowerQuery.includes('réduction') || 
      lowerQuery.includes('reduction') || lowerQuery.includes('discount') || 
      lowerQuery.includes('sale')) {
    filters.hasPromo = true;
    console.log("🎯 Promotion détectée");
  }

  const priceMatch = lowerQuery.match(/(\d+)\s*(€|euros?|dollars?|\$)/i);
  if (priceMatch) {
    filters.maxPrice = Number(priceMatch[1]);
    console.log("🎯 Prix max détecté:", filters.maxPrice);
  }

  const priceRangeMatch = lowerQuery.match(/entre\s+(\d+)\s+et\s+(\d+)|(\d+)\s*-\s*(\d+)/i);
  if (priceRangeMatch) {
    filters.minPrice = Number(priceRangeMatch[1] || priceRangeMatch[3]);
    filters.maxPrice = Number(priceRangeMatch[2] || priceRangeMatch[4]);
    console.log("🎯 Fourchette prix détectée:", filters.minPrice, "-", filters.maxPrice);
  }

  let cleanQuery = query
    .replace(/\b(tes|vos|mes|les|des|du|de|la|le)\b/gi, '')
    .replace(new RegExp(`\\b(${materials.join('|')})\\b`, 'gi'), '')
    .replace(new RegExp(`\\b(${colors.join('|')})\\b`, 'gi'), '')
    .replace(/\b(promo|promotion|solde|réduction|reduction|discount|sale)\b/gi, '')
    .replace(/\d+\s*(€|euros?|dollars?|\$)/gi, '')
    .replace(/entre\s+\d+\s+et\s+\d+|\d+\s*-\s*\d+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const meaningfulWords = cleanQuery.split(' ').filter(word => 
    word.length > 2 && 
    !['montre', 'affiche', 'voir', 'cherche', 'recherche', 'veux', 'souhaite'].includes(word.toLowerCase())
  );

  if (meaningfulWords.length > 0) {
    filters.query = meaningfulWords.join(' ');
    console.log("🎯 Requête nettoyée:", filters.query);
  } else if (foundMaterial || foundColor) {
    filters.query = '';
    console.log("🎯 Recherche large avec filtres matériau/couleur");
  }

  console.log("🔍 Filtres extraits:", filters);
  return filters;
}