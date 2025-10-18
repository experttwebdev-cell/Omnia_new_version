// productSearch.ts - VERSION CORRECTE
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
    // ✅ CORRECTION : Pas de colonne item_type dans votre table
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

    // ✅ RECHERCHE INTELLIGENTE : Priorité aux correspondances exactes et multiples
    if (filters.query && filters.query.trim().length > 0) {
      const fullQuery = filters.query.toLowerCase().trim();
      const searchTerms = fullQuery.split(' ').filter(term => term.length > 2);

      if (searchTerms.length > 0) {
        // Construction d'une recherche intelligente avec priorité
        const primaryFields = [
          'title', 'category', 'sub_category', 'product_type',
          'ai_material', 'chat_text', 'seo_title'
        ];

        const secondaryFields = [
          'description', 'tags', 'vendor', 'seo_description',
          'ai_vision_analysis', 'ai_color', 'ai_shape', 'ai_texture',
          'ai_pattern', 'ai_finish', 'ai_design_elements', 'room', 'style',
          'dimensions_text', 'characteristics', 'google_product_category',
          'google_brand', 'google_custom_label_0', 'google_custom_label_1',
          'google_custom_label_2', 'google_custom_label_3', 'google_custom_label_4'
        ];

        // Recherche d'abord dans les champs prioritaires avec TOUS les mots
        const primaryConditions: string[] = [];
        const secondaryConditions: string[] = [];

        // Pour chaque terme, créer des conditions dans les champs prioritaires
        for (const term of searchTerms) {
          for (const field of primaryFields) {
            primaryConditions.push(`${field}.ilike.%${term}%`);
          }
          for (const field of secondaryFields) {
            secondaryConditions.push(`${field}.ilike.%${term}%`);
          }
        }

        // Combiner toutes les conditions
        const allConditions = [...primaryConditions, ...secondaryConditions].join(',');
        query = query.or(allConditions);
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

    // ✅ TOUJOURS appliquer le scoring de pertinence si on a une query
    if (filters.query && filters.query.trim().length > 0) {
      products = rankProductsByRelevance(products, filters.query);

      // ✅ FILTRAGE AGRESSIF : Pour recherches multi-mots, garder seulement les produits pertinents
      const searchTerms = filters.query.toLowerCase().split(' ').filter(term => term.length > 2);

      if (searchTerms.length >= 2) {
        // Pour recherche multi-mots (ex: "table basse travertin"), score minimum de 80
        // Cela exige que plusieurs termes soient présents
        const minScore = 80;
        const originalCount = products.length;
        products = products.filter((p: any) => (p._relevance_score || 0) >= minScore);

        console.log(`🔍 Multi-word search: filtered from ${originalCount} to ${products.length} products (min score: ${minScore})`);
      } else if (searchTerms.length === 1 && products.length > limit * 2) {
        // Pour recherche simple, filtrage plus doux
        const minScore = 15;
        products = products.filter((p: any) => (p._relevance_score || 0) >= minScore);
      }
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
  const normalizedQuery = query.toLowerCase();

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

    // ✅ BONUS MASSIF : Si TOUS les termes sont présents dans le produit
    let termsFound = 0;
    const searchableText = [title, category, subCategory, aiMaterial, chatText, tags].join(' ');

    for (const term of searchTerms) {
      if (searchableText.includes(term)) {
        termsFound++;
      }
    }

    // Si TOUS les termes sont présents, gros bonus
    if (searchTerms.length > 1 && termsFound === searchTerms.length) {
      score += 100; // ✅ BONUS PRIORITAIRE pour correspondance complète
    }

    // Score pour chaque terme individuellement
    searchTerms.forEach(term => {
      // Champs critiques (titre, catégorie)
      if (title.includes(term)) score += 10;
      if (title.startsWith(term)) score += 5;
      if (category.includes(term)) score += 8;
      if (subCategory.includes(term)) score += 7;

      // Champs IA importants
      if (aiMaterial.includes(term)) score += 8; // ✅ Matériau très important
      if (aiColor.includes(term)) score += 5;
      if (chatText.includes(term)) score += 6;

      // Autres champs
      if (seoTitle.includes(term)) score += 6;
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
    });

    return { product: { ...product, _relevance_score: score }, score };
  });

  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .map(item => item.product);
}

// ✅ CORRECTION des autres fonctions
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

  // ✅ CORRECTION : Si demande générique, on cherche dans tous les produits
  const genericWords = ['produits', 'articles', 'catalogue', 'collection', 'choix', 'sélection', 'quelque chose', 'quelques', 'tout', 'tous', 'tes', 'vos'];
  const hasGenericWord = genericWords.some(word => lowerQuery.includes(word));

  // Product categories (French) - prioritize specific product searches
  const categories = ['canapé', 'canape', 'table', 'chaise', 'fauteuil', 'meuble', 'armoire', 'lit', 'bureau', 'lampe', 'miroir'];
  const foundCategory = categories.find(c => lowerQuery.includes(c));

  if (foundCategory) {
    filters.query = foundCategory;
  } else if (hasGenericWord) {
    filters.query = ''; // Recherche vide = tous les produits
  } else {
    // Nettoyer la requête
    const cleanQuery = query
      .replace(new RegExp(`\\b(${colors.join('|')})\\b`, 'gi'), '')
      .replace(new RegExp(`\\b(${materials.join('|')})\\b`, 'gi'), '')
      .replace(/\b(promo|promotion|solde|réduction|reduction|discount|sale)\b/gi, '')
      .replace(/\d+\s*(€|euros?|dollars?|\$)/gi, '')
      .trim();

    if (cleanQuery) {
      filters.query = cleanQuery;
    }
  }

  return filters;
}

export async function getProductSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);

    // ✅ SUGGESTIONS INTELLIGENTES : Recherche dans plusieurs champs
    const { data, error } = await supabase
      .from('shopify_products')
      .select('title, category, sub_category, ai_material')
      .eq('status', 'active')
      .or(
        searchTerms.flatMap(term => [
          `title.ilike.%${term}%`,
          `category.ilike.%${term}%`,
          `sub_category.ilike.%${term}%`,
          `ai_material.ilike.%${term}%`
        ]).join(',')
      )
      .limit(limit * 3); // Récupérer plus pour filtrer après

    if (error) {
      console.error('❌ Error getting product suggestions:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // ✅ SCORER les suggestions comme pour la recherche
    const scoredSuggestions = data.map(product => {
      let score = 0;
      const title = product.title?.toLowerCase() || '';
      const category = product.category?.toLowerCase() || '';
      const subCategory = product.sub_category?.toLowerCase() || '';
      const material = product.ai_material?.toLowerCase() || '';

      let termsFound = 0;
      const searchableText = [title, category, subCategory, material].join(' ');

      // Compter combien de termes de recherche sont présents
      for (const term of searchTerms) {
        if (searchableText.includes(term)) {
          termsFound++;
          if (title.includes(term)) score += 10;
          if (category.includes(term)) score += 5;
          if (material.includes(term)) score += 5;
        }
      }

      // Bonus si tous les termes sont présents
      if (searchTerms.length > 1 && termsFound === searchTerms.length) {
        score += 50;
      }

      return { title: product.title, score };
    });

    // Trier par score et retourner les meilleurs titres uniques
    const uniqueTitles = new Set<string>();
    return scoredSuggestions
      .sort((a, b) => b.score - a.score)
      .map(item => item.title)
      .filter((title): title is string => {
        if (!title || uniqueTitles.has(title)) return false;
        uniqueTitles.add(title);
        return true;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('❌ Error in getProductSuggestions:', error);
    return [];
  }
}