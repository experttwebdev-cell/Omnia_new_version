import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, RefreshCw, ExternalLink, Tag, Box, Hash, Calendar, Store as StoreIcon, Sparkles, Filter } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['shopify_products']['Row'];

type EnrichmentFilter = 'all' | 'enriched' | 'not_enriched';

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrichmentFilter, setEnrichmentFilter] = useState<EnrichmentFilter>('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Fetching products from database...');

      const { data, error: fetchError } = await supabase
        .from('fast_products_view')
        .select('*')
        .order('imported_at', { ascending: false });

      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Fetched products:', data?.length || 0);
      setProducts(data || []);
    } catch (err) {
      console.error('Error in fetchProducts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-blue-600 border-r-purple-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-10 h-10 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chargement des produits</h3>
        <p className="text-sm text-gray-600">Veuillez patienter...</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchProducts}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-1 font-medium">No products imported yet</p>
        <p className="text-sm text-gray-500">Import products from your Shopify store to get started</p>
      </div>
    );
  }

  const filteredProducts = products.filter(product => {
    if (enrichmentFilter === 'enriched') {
      return product.enrichment_status === 'enriched';
    }
    if (enrichmentFilter === 'not_enriched') {
      return product.enrichment_status !== 'enriched';
    }
    return true;
  });

  const enrichedCount = products.filter(p => p.enrichment_status === 'enriched').length;
  const notEnrichedCount = products.length - enrichedCount;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Produits Importés ({products.length})</h2>
          <button
            onClick={fetchProducts}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filtrer:</span>
          </div>
          <button
            onClick={() => setEnrichmentFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              enrichmentFilter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tous ({products.length})
          </button>
          <button
            onClick={() => setEnrichmentFilter('enriched')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              enrichmentFilter === 'enriched'
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Enrichis ({enrichedCount})
          </button>
          <button
            onClick={() => setEnrichmentFilter('not_enriched')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              enrichmentFilter === 'not_enriched'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Non enrichis ({notEnrichedCount})
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {enrichmentFilter === 'enriched' ? 'Aucun produit enrichi' : 'Aucun produit non enrichi'}
          </h3>
          <p className="text-sm text-gray-500">
            {enrichmentFilter === 'enriched'
              ? 'Utilisez l\'enrichissement AI pour analyser vos produits'
              : 'Tous vos produits sont enrichis !'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
          {filteredProducts.map((product) => (
          <div key={product.id} className="p-6 hover:bg-gray-50 transition">
            <div className="flex gap-6">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{product.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.status}
                      </span>
                      {product.enrichment_status === 'enriched' ? (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Enrichi AI
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                          Non enrichi
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ${Number(product.price).toFixed(2)}
                    </div>
                    {product.compare_at_price && (
                      <div className="text-sm text-gray-500 line-through">
                        ${Number(product.compare_at_price).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  {product.shopify_id && (
                    <div className="flex items-start gap-2">
                      <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">ID Shopify</div>
                        <div className="text-sm font-medium text-gray-900">{product.shopify_id}</div>
                      </div>
                    </div>
                  )}

                  {product.vendor && (
                    <div className="flex items-start gap-2">
                      <StoreIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Vendeur</div>
                        <div className="text-sm font-medium text-gray-900">{product.vendor}</div>
                      </div>
                    </div>
                  )}

                  {product.product_type && (
                    <div className="flex items-start gap-2">
                      <Box className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Type de produit</div>
                        <div className="text-sm font-medium text-gray-900">{product.product_type}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">Stock</div>
                      <div className="text-sm font-medium text-gray-900">{product.inventory_quantity} unités</div>
                    </div>
                  </div>

                  {product.handle && (
                    <div className="flex items-start gap-2">
                      <ExternalLink className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Handle</div>
                        <div className="text-sm font-medium text-gray-900 truncate">{product.handle}</div>
                      </div>
                    </div>
                  )}

                  {product.shop_name && (
                    <div className="flex items-start gap-2">
                      <StoreIcon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Boutique</div>
                        <div className="text-sm font-medium text-gray-900">{product.shop_name}</div>
                      </div>
                    </div>
                  )}

                  {product.tags && (
                    <div className="flex items-start gap-2 col-span-2">
                      <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs text-gray-500">Tags</div>
                        <div className="text-sm text-gray-900 flex flex-wrap gap-1">
                          {product.tags.split(',').map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2 col-span-2">
                    <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs text-gray-500">Importé le</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(product.imported_at).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>

                {product.description && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Description</div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {product.description.replace(/<[^>]*>/g, '')}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                  <a
                    href={`https://${product.shop_name}.myshopify.com/products/${product.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Voir dans la boutique
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

function Store({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
