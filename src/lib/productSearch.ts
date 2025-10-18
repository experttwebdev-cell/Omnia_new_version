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
      .select('*', { count: 'exact' })
      .eq('item_type', 'product');

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
          `ai_color.ilike.%${term}%`,
          `ai_material.ilike.%${term}%`,
          `ai_shape.ilike.%${term}%`
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

    searchTerms.forEach(term => {
      if (title.includes(term)) score += 10;
      if (category.includes(term)) score += 5;
      if (tags.includes(term)) score += 3;
      if (description.includes(term)) score += 1;

      if (title.startsWith(term)) score += 5;
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
      .in('id', productIds)
      .eq('item_type', 'product');

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
      .eq('item_type', 'product')
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
      .eq('item_type', 'product')
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

export function extractFiltersFromQuery(query: string): Partial<ProductSearchFilters> {
  const filters: Partial<ProductSearchFilters> = {};
  const lowerQuery = query.toLowerCase();

  const colors = ['blanc', 'noir', 'gris', 'beige', 'bois', 'marron', 'bleu', 'vert', 'rouge', 'jaune', 'orange', 'rose', 'violet', 'white', 'black', 'gray', 'brown', 'blue', 'green', 'red', 'yellow', 'pink', 'purple'];
  const foundColor = colors.find(c => lowerQuery.includes(c));
  if (foundColor) {
    filters.color = foundColor;
  }

  const materials = ['bois', 'metal', 'métal', 'verre', 'marbre', 'cuir', 'tissu', 'plastique', 'wood', 'metal', 'glass', 'marble', 'leather', 'fabric', 'plastic'];
  const foundMaterial = materials.find(m => lowerQuery.includes(m));
  if (foundMaterial) {
    filters.material = foundMaterial;
  }

  if (lowerQuery.includes('promo') || lowerQuery.includes('promotion') || lowerQuery.includes('solde') || lowerQuery.includes('réduction') || lowerQuery.includes('reduction') || lowerQuery.includes('discount') || lowerQuery.includes('sale')) {
    filters.hasPromo = true;
  }

  const priceMatch = lowerQuery.match(/(\d+)\s*(€|euros?|dollars?|\$)/i);
  if (priceMatch) {
    filters.maxPrice = Number(priceMatch[1]);
  }

  const priceRangeMatch = lowerQuery.match(/entre\s+(\d+)\s+et\s+(\d+)|(\d+)\s*-\s*(\d+)/i);
  if (priceRangeMatch) {
    filters.minPrice = Number(priceRangeMatch[1] || priceRangeMatch[3]);
    filters.maxPrice = Number(priceRangeMatch[2] || priceRangeMatch[4]);
  }

  const cleanQuery = query
    .replace(new RegExp(`\\b(${colors.join('|')})\\b`, 'gi'), '')
    .replace(new RegExp(`\\b(${materials.join('|')})\\b`, 'gi'), '')
    .replace(/\b(promo|promotion|solde|réduction|reduction|discount|sale)\b/gi, '')
    .replace(/\d+\s*(€|euros?|dollars?|\$)/gi, '')
    .trim();

  if (cleanQuery) {
    filters.query = cleanQuery;
  }

  return filters;
}
