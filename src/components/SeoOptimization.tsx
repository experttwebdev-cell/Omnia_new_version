import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  Clock,
  Sparkles,
  Upload,
  Edit3,
  Tag as TagIcon,
  FileText,
  AlertCircle,
  Loader2,
  Package,
  AlertTriangle,
  RotateCw
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['shopify_products']['Row'];

export function SeoOptimization() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    subCategory: 'all',
    enrichmentStatus: 'all',
    syncStatus: 'all'
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const [pushingToShopify, setPushingToShopify] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [pushProgress, setPushProgress] = useState({ current: 0, total: 0 });

  const ITEMS_PER_PAGE = 50;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('shopify_products')
        .select('*')
        .order('imported_at', { ascending: false });

      if (fetchError) throw fetchError;

      setProducts(data || []);

      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean))].sort();
      const uniqueSubCategories = [...new Set(data?.map(p => p.sub_category).filter(Boolean))].sort();

      setCategories(uniqueCategories as string[]);
      setSubCategories(uniqueSubCategories as string[]);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('seo-product-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_products'
        },
        (payload) => {
          setProducts((current) =>
            current.map((p) => (p.id === payload.new.id ? (payload.new as Product) : p))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredProducts = products.filter((product) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!product.title.toLowerCase().includes(searchLower)) return false;
    }
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.subCategory !== 'all' && product.sub_category !== filters.subCategory) return false;
    if (filters.enrichmentStatus !== 'all' && product.enrichment_status !== filters.enrichmentStatus) return false;
    if (filters.syncStatus === 'synced' && !product.seo_synced_to_shopify) return false;
    if (filters.syncStatus === 'pending' && (product.seo_synced_to_shopify || product.enrichment_status !== 'enriched')) return false;
    if (filters.syncStatus === 'not-enriched' && product.enrichment_status === 'enriched') return false;
    return true;
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category, filters.subCategory, filters.enrichmentStatus, filters.syncStatus]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectByCategory = (category: string) => {
    const categoryProducts = filteredProducts.filter((p) => p.category === category);
    const newSelected = new Set(selectedProducts);
    categoryProducts.forEach((p) => newSelected.add(p.id));
    setSelectedProducts(newSelected);
  };

  const handleGenerateForAll = async () => {
    const productsToGenerate = selectedProducts.size > 0
      ? products.filter(p => selectedProducts.has(p.id) && !p.seo_title && !p.seo_description)
      : products.filter(p => !p.seo_title && !p.seo_description);

    if (productsToGenerate.length === 0) {
      alert('No products need SEO generation. All products already have SEO titles and descriptions.');
      return;
    }

    if (!confirm(`Generate SEO content for ${productsToGenerate.length} products using AI? This will use OpenAI API.`)) {
      return;
    }

    setGeneratingAll(true);
    setPushProgress({ current: 0, total: productsToGenerate.length });

    for (let i = 0; i < productsToGenerate.length; i++) {
      const product = productsToGenerate[i];
      setPushProgress({ current: i + 1, total: productsToGenerate.length });

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/enrich-product-with-ai`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product.id }),
        });

        if (!response.ok) {
          console.error(`Failed to generate SEO for product ${product.id}`);
        }
      } catch (err) {
        console.error(`Error generating SEO for product ${product.id}:`, err);
      }
    }

    setGeneratingAll(false);
    setPushProgress({ current: 0, total: 0 });
    setSelectedProducts(new Set());
    await fetchProducts();
  };

  const handleBulkPushToShopify = async () => {
    const selectedProductIds = Array.from(selectedProducts);
    const productsToSync = products.filter(
      (p) => selectedProductIds.includes(p.id) && p.enrichment_status === 'enriched'
    );

    if (productsToSync.length === 0) {
      alert('No enriched products selected to sync');
      return;
    }

    if (!confirm(`Push ${productsToSync.length} products to Shopify?`)) {
      return;
    }

    setPushingToShopify(true);
    setPushProgress({ current: 0, total: productsToSync.length });

    for (let i = 0; i < productsToSync.length; i++) {
      const product = productsToSync[i];
      setPushProgress({ current: i + 1, total: productsToSync.length });

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-seo-to-shopify`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product.id }),
        });

        if (!response.ok) {
          console.error(`Failed to sync product ${product.id}`);
        }
      } catch (err) {
        console.error(`Error syncing product ${product.id}:`, err);
      }
    }

    setPushingToShopify(false);
    setPushProgress({ current: 0, total: 0 });
    setSelectedProducts(new Set());
    await fetchProducts();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  const selectedEnrichedCount = Array.from(selectedProducts).filter(
    (id) => products.find((p) => p.id === id)?.enrichment_status === 'enriched'
  ).length;

  const productsNeedingSeo = products.filter(p => !p.seo_title && !p.seo_description).length;
  const totalProducts = products.length;
  const optimizedProducts = products.filter(p => p.enrichment_status === 'enriched' && (p.seo_title || p.seo_description)).length;
  const pendingSyncProducts = products.filter(p => p.enrichment_status === 'enriched' && !p.seo_synced_to_shopify).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer"
             onClick={() => setFilters({ ...filters, enrichmentStatus: 'all', syncStatus: 'all' })}>
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-6 h-6 text-gray-600" />
            <h3 className="font-semibold text-gray-700">Total Products</h3>
          </div>
          <p className="text-4xl font-bold text-gray-900">{totalProducts}</p>
          <p className="text-sm text-gray-500 mt-1">All products in catalog</p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer"
             onClick={() => setFilters({ ...filters, enrichmentStatus: 'enriched', syncStatus: 'all' })}>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Optimized</h3>
          </div>
          <p className="text-4xl font-bold text-green-900">{optimizedProducts}/{totalProducts}</p>
          <p className="text-sm text-green-700 mt-1">SEO optimized products</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition cursor-pointer"
             onClick={() => setFilters({ ...filters, enrichmentStatus: 'enriched', syncStatus: 'pending' })}>
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Pending Sync</h3>
          </div>
          <p className="text-4xl font-bold text-blue-900">{pendingSyncProducts}</p>
          <p className="text-sm text-blue-700 mt-1">Not synced to Shopify</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleGenerateForAll}
            disabled={generatingAll || productsNeedingSeo === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
          >
            {generatingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate for All Products ({productsNeedingSeo})
              </>
            )}
          </button>
          <button
            onClick={handleBulkPushToShopify}
            disabled={pushingToShopify || selectedEnrichedCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
          >
            {pushingToShopify ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Synchronize with Shopify
              </>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <button
            onClick={fetchProducts}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <select
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select
          value={filters.subCategory}
          onChange={(e) => setFilters({ ...filters, subCategory: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Sub-Categories</option>
          {subCategories.map((subCat) => (
            <option key={subCat} value={subCat}>{subCat}</option>
          ))}
        </select>

        <select
          value={filters.enrichmentStatus}
          onChange={(e) => setFilters({ ...filters, enrichmentStatus: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Enrichment Status</option>
          <option value="enriched">Enriched</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          value={filters.syncStatus}
          onChange={(e) => setFilters({ ...filters, syncStatus: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Sync Status</option>
          <option value="synced">Synced</option>
          <option value="pending">Pending Sync</option>
          <option value="not-enriched">Not Enriched</option>
        </select>
      </div>

      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">
              {selectedProducts.size} products selected ({selectedEnrichedCount} enriched, ready to sync)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkPushToShopify}
              disabled={selectedEnrichedCount === 0 || pushingToShopify}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Push to Shopify
            </button>
          </div>
        </div>
      )}

      {(pushingToShopify || generatingAll) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-medium">
              {generatingAll ? 'Generating SEO content with AI...' : 'Pushing to Shopify...'}
            </span>
            <span className="text-blue-600 font-bold">
              {pushProgress.current} / {pushProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${generatingAll ? 'bg-purple-600' : 'bg-blue-600'}`}
              style={{ width: `${(pushProgress.current / pushProgress.total) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {Math.round((pushProgress.current / pushProgress.total) * 100)}% complete
          </p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">SEO Title</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Meta Description</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.image_url && (
                        <img src={product.image_url} alt={product.title} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{product.title}</div>
                        <div className="text-xs text-gray-500">{product.vendor}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-gray-900 font-medium">{product.category || '-'}</div>
                      <div className="text-xs text-gray-500">{product.sub_category || '-'}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="text-gray-900 truncate">{product.seo_title || '-'}</div>
                      <div className={`text-xs mt-1 ${
                        product.seo_title && product.seo_title.length >= 60 && product.seo_title.length <= 70
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {product.seo_title ? `${product.seo_title.length} chars` : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <div className="text-gray-900 truncate">{product.seo_description || '-'}</div>
                      <div className={`text-xs mt-1 ${
                        product.seo_description && product.seo_description.length >= 150 && product.seo_description.length <= 160
                          ? 'text-green-600'
                          : 'text-orange-600'
                      }`}>
                        {product.seo_description ? `${product.seo_description.length} chars` : ''}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {product.enrichment_status === 'enriched' ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium w-fit">
                          <Sparkles className="w-3 h-3" />
                          Enriched
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium w-fit">
                          <Clock className="w-3 h-3" />
                          Not Enriched
                        </span>
                      )}
                      {product.seo_synced_to_shopify ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Synced
                        </span>
                      ) : product.enrichment_status === 'enriched' ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium w-fit">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-700">
                Affichage {startIndex + 1} à {Math.min(endIndex, filteredProducts.length)} sur {filteredProducts.length} produits
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} sur {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No products match your filters</p>
        </div>
      )}
    </div>
  );
}
