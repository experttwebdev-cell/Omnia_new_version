import { useEffect, useState, useRef } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import { Package, RefreshCw, Search, Filter, ChevronDown, ChevronLeft, ChevronRight, Eye, Sparkles, CheckCircle, Clock, List, Grid2x2 as Grid, Palette, Layers, Tag as TagIcon, Loader2, Activity, AlertCircle } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { formatPrice } from '../lib/currency';
import { ProgressModal } from './ProgressModal';
import { ConfirmDialog } from './ConfirmDialog';
import { ConnectionDiagnostics } from './ConnectionDiagnostics';
import { getConnectionErrorMessage, testSupabaseConnection } from '../lib/connectionTest';
import { useLanguage } from '../App';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface Filters {
  search: string;
  status: string;
  vendor: string;
  productType: string;
  minPrice: string;
  maxPrice: string;
  stockStatus: string;
  room: string;
  style: string;
}

interface EnhancedProductListProps {
  onProductSelect?: (productId: string) => void;
}

export function EnhancedProductList({ onProductSelect }: EnhancedProductListProps) {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: 'all',
    vendor: 'all',
    productType: 'all',
    minPrice: '',
    maxPrice: '',
    stockStatus: 'all',
    room: 'all',
    style: 'all'
  });

  const [sortBy, setSortBy] = useState<'title' | 'price' | 'inventory' | 'created'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [vendors, setVendors] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [rooms, setRooms] = useState<string[]>([]);
  const [styles, setStyles] = useState<string[]>([]);

  const [enrichingProducts, setEnrichingProducts] = useState(false);
  const [enrichProgress, setEnrichProgress] = useState({ current: 0, total: 0, currentProduct: '', currentImage: '' });
  const enrichmentAbortRef = useRef(false);
  const [showEnrichConfirm, setShowEnrichConfirm] = useState(false);
  const [productsToEnrichCount, setProductsToEnrichCount] = useState(0);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      setErrorDetails(null);

      console.log('Attempting to fetch products from Supabase...');

      const { data, error: fetchError } = await supabase
        .from('shopify_products')
        .select('*')
        .order('imported_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        setErrorDetails(fetchError);

        // Run connection tests to get detailed error message
        const testResults = await testSupabaseConnection();
        const detailedMessage = getConnectionErrorMessage(testResults);
        throw new Error(detailedMessage);
      }

      console.log(`Successfully fetched ${data?.length || 0} products`);
      setProducts(data || []);

      const uniqueVendors = [...new Set(data?.map(p => p.vendor).filter(Boolean))].sort();
      const uniqueTypes = [...new Set(data?.map(p => p.product_type).filter(Boolean))].sort();
      const uniqueRooms = [...new Set(data?.map(p => p.room).filter(Boolean))].sort();
      const uniqueStyles = [...new Set(data?.map(p => p.style).filter(Boolean))].sort();

      setVendors(uniqueVendors as string[]);
      setProductTypes(uniqueTypes as string[]);
      setRooms(uniqueRooms as string[]);
      setStyles(uniqueStyles as string[]);
    } catch (err) {
      console.error('Error fetching products:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products from database';
      setError(errorMessage);
      setErrorDetails(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('product-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_products'
        },
        (payload) => {
          console.log('Product updated:', payload);
          setProducts((currentProducts) =>
            currentProducts.map((product) =>
              product.id === payload.new.id ? (payload.new as Product) : product
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let result = [...products];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.toLowerCase().includes(searchLower)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(p => p.status === filters.status);
    }

    if (filters.vendor !== 'all') {
      result = result.filter(p => p.vendor === filters.vendor);
    }

    if (filters.productType !== 'all') {
      result = result.filter(p => p.product_type === filters.productType);
    }

    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      result = result.filter(p => p.price >= minPrice);
    }

    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      result = result.filter(p => p.price <= maxPrice);
    }

    if (filters.stockStatus !== 'all') {
      if (filters.stockStatus === 'in-stock') {
        result = result.filter(p => p.inventory_quantity > 10);
      } else if (filters.stockStatus === 'low-stock') {
        result = result.filter(p => p.inventory_quantity > 0 && p.inventory_quantity <= 10);
      } else if (filters.stockStatus === 'out-of-stock') {
        result = result.filter(p => p.inventory_quantity === 0);
      }
    }

    if (filters.room !== 'all') {
      result = result.filter(p => p.room === filters.room);
    }

    if (filters.style !== 'all') {
      result = result.filter(p => p.style === filters.style);
    }

    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortBy) {
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case 'price':
          aVal = a.price;
          bVal = b.price;
          break;
        case 'inventory':
          aVal = a.inventory_quantity;
          bVal = b.inventory_quantity;
          break;
        case 'created':
          aVal = new Date(a.imported_at).getTime();
          bVal = new Date(b.imported_at).getTime();
          break;
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredProducts(result);
    setCurrentPage(1);
  }, [products, filters, sortBy, sortOrder]);

  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      vendor: 'all',
      productType: 'all',
      minPrice: '',
      maxPrice: '',
      stockStatus: 'all',
      room: 'all',
      style: 'all'
    });
  };

  const handleEnrichWithAI = () => {
    const productsToEnrich = products.filter(p => p.enrichment_status !== 'enriched');

    if (productsToEnrich.length === 0) {
      return;
    }

    setProductsToEnrichCount(productsToEnrich.length);
    setShowEnrichConfirm(true);
  };

  const executeEnrichment = async () => {
    setShowEnrichConfirm(false);
    const productsToEnrich = products.filter(p => p.enrichment_status !== 'enriched');

    enrichmentAbortRef.current = false;
    setEnrichingProducts(true);
    setEnrichProgress({ current: 0, total: productsToEnrich.length, currentProduct: '', currentImage: '' });

    const BATCH_SIZE = 5;
    let completed = 0;

    for (let i = 0; i < productsToEnrich.length; i += BATCH_SIZE) {
      if (enrichmentAbortRef.current) {
        break;
      }

      const batch = productsToEnrich.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (product) => {
        try {
          const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/enrich-product-with-ai`;
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ productId: product.id }),
          });

          if (!response.ok) {
            console.error(`Failed to enrich product ${product.id}`);
          }
        } catch (err) {
          console.error(`Error enriching product ${product.id}:`, err);
        }
      });

      await Promise.all(batchPromises);
      completed += batch.length;

      const lastProduct = batch[batch.length - 1];
      setEnrichProgress({
        current: completed,
        total: productsToEnrich.length,
        currentProduct: lastProduct.title,
        currentImage: lastProduct.image_url
      });
    }

    setEnrichingProducts(false);
    setEnrichProgress({ current: 0, total: 0, currentProduct: '', currentImage: '' });

    try {
      const refreshUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/refresh-dashboard-cache`;
      await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (err) {
      console.error('Error refreshing cache:', err);
    }

    await fetchProducts();
  };

  const handleCancelEnrichment = () => {
    enrichmentAbortRef.current = true;
    setEnrichingProducts(false);
    setEnrichProgress({ current: 0, total: 0, currentProduct: '', currentImage: '' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <>
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-start gap-4 mb-6">
            <AlertCircle className="w-12 h-12 text-red-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Connection Error</h3>
              <p className="text-red-600 mb-4">{error}</p>

              {errorDetails && (
                <details className="mb-4">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                    View technical details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto text-gray-700">
                    {JSON.stringify(errorDetails, null, 2)}
                  </pre>
                </details>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={fetchProducts}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry Connection
                </button>
                <button
                  onClick={() => setShowDiagnostics(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                >
                  <Activity className="w-4 h-4" />
                  Run Diagnostics
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Quick Troubleshooting:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>Verify your .env file contains valid Supabase credentials</li>
              <li>Check that your Supabase project is active (not paused)</li>
              <li>Ensure you have internet connectivity</li>
              <li>Try opening your browser's developer console for more details</li>
            </ul>
          </div>
        </div>

        {showDiagnostics && (
          <ConnectionDiagnostics onClose={() => setShowDiagnostics(false)} />
        )}
      </>
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

  const productsNeedingEnrichment = products.filter(p => p.enrichment_status !== 'enriched').length;

  return (
    <>
      <ConfirmDialog
        isOpen={showEnrichConfirm}
        title="Enrichir les produits avec l'IA ?"
        message={`Enrichir ${productsToEnrichCount} produits avec l'IA ? Cela utilisera l'API OpenAI pour générer du contenu SEO, analyser les couleurs, matières, et plus encore.`}
        confirmText="Enrichir"
        cancelText="Annuler"
        type="info"
        onConfirm={executeEnrichment}
        onCancel={() => setShowEnrichConfirm(false)}
      />

      <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.products.totalProducts}</p>
              <p className="text-3xl font-bold text-gray-900">{products.length}</p>
            </div>
            <Package className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.products.enrichedProducts}</p>
              <p className="text-3xl font-bold text-gray-900">
                {products.filter(p => p.enrichment_status === 'enriched').length}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {products.length > 0 ? Math.round((products.filter(p => p.enrichment_status === 'enriched').length / products.length) * 100) : 0}% {t.products.ofTotal}
              </p>
            </div>
            <Sparkles className="w-10 h-10 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.products.syncedToShopify}</p>
              <p className="text-3xl font-bold text-gray-900">
                {products.filter(p => p.seo_synced_to_shopify).length}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{t.products.pendingSync}</p>
              <p className="text-3xl font-bold text-gray-900">
                {products.filter(p => p.enrichment_status === 'enriched' && !p.seo_synced_to_shopify).length}
              </p>
            </div>
            <Clock className="w-10 h-10 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={handleEnrichWithAI}
            disabled={enrichingProducts || productsNeedingEnrichment === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
          >
            {enrichingProducts ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enriching {enrichProgress.current}/{enrichProgress.total}...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Enrich with AI ({productsNeedingEnrichment})
              </>
            )}
          </button>
        </div>


        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Grid view"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition ${
              showFilters ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
          <button
            onClick={fetchProducts}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {showFilters && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={filters.vendor}
                onChange={(e) => setFilters({ ...filters, vendor: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">By Vendor</option>
                {vendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>

              <select
                value={filters.productType}
                onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Types</option>
                {productTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>

              <select
                value={filters.stockStatus}
                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock (&gt;10)</option>
                <option value="low-stock">Low Stock (1-10)</option>
                <option value="out-of-stock">Out of Stock (0)</option>
              </select>

              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <select
                value={filters.room}
                onChange={(e) => setFilters({ ...filters, room: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Rooms</option>
                {rooms.map(room => (
                  <option key={room} value={room}>{room.charAt(0).toUpperCase() + room.slice(1)}</option>
                ))}
              </select>

              <select
                value={filters.style}
                onChange={(e) => setFilters({ ...filters, style: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">All Styles</option>
                {styles.map(style => (
                  <option key={style} value={style}>{style.charAt(0).toUpperCase() + style.slice(1)}</option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{filteredProducts.length}</span>
            <span>of</span>
            <span className="font-medium">{products.length}</span>
            <span>products</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="created">Date Added</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
              <option value="inventory">Stock</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group">
            <div className="relative w-full h-56 bg-gray-100 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 left-2 flex gap-2">
                {product.enrichment_status === 'enriched' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </div>
                )}
                {product.seo_synced_to_shopify && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white rounded-full text-xs font-medium shadow-lg">
                    <CheckCircle className="w-3 h-3" />
                    Synced
                  </div>
                )}
                {product.enrichment_status === 'enriched' && !product.seo_synced_to_shopify && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium shadow-lg">
                    <Clock className="w-3 h-3" />
                    Pending
                  </div>
                )}
              </div>
              {product.enrichment_status === 'enriched' && product.ai_confidence_score > 0 && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black bg-opacity-70 text-white rounded text-xs font-medium">
                  {product.ai_confidence_score}% confidence
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.title}</h3>

              {product.tags && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {product.tags.split(',').slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-medium">
                      {tag.trim()}
                    </span>
                  ))}
                  {product.tags.split(',').length > 3 && (
                    <span className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded text-xs">
                      +{product.tags.split(',').length - 3}
                    </span>
                  )}
                </div>
              )}

              {(product.category || product.sub_category) && (
                <p className="text-sm text-gray-600 mb-2">
                  {product.category}{product.sub_category ? ` • ${product.sub_category}` : ''}
                </p>
              )}

              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-gray-800">
                  {formatPrice(Number(product.price), product.currency || 'EUR')}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-600">
                  Stock: {product.inventory_quantity}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  product.inventory_quantity > 10 ? 'bg-green-500' :
                  product.inventory_quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
                }`} />
              </div>

              {product.vendor && (
                <p className="text-xs text-gray-500 mb-2">By {product.vendor}</p>
              )}

              {onProductSelect && (
                <button
                  onClick={() => onProductSelect(product.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              )}
            </div>
          </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  {product.enrichment_status === 'enriched' && (
                    <div className="absolute top-1 left-1 flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
                      {(product.category || product.sub_category) && (
                        <p className="text-sm text-gray-600 mb-2">
                          {product.category}{product.sub_category ? ` • ${product.sub_category}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-lg font-bold text-gray-800">
                          {formatPrice(Number(product.price), product.currency || 'EUR')}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status}
                        </span>
                        {product.enrichment_status === 'enriched' && (
                          <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </span>
                        )}
                        {product.seo_synced_to_shopify ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Synced
                          </span>
                        ) : product.enrichment_status === 'enriched' ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        ) : null}
                      </div>
                      {product.vendor && (
                        <p className="text-sm text-gray-600">By {product.vendor}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onProductSelect?.(product.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex-shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>

                  {product.enrichment_status === 'enriched' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      {product.ai_color && (
                        <div className="flex items-center gap-2">
                          <Palette className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Color</p>
                            <p className="text-sm text-purple-900 font-semibold">{product.ai_color}</p>
                          </div>
                        </div>
                      )}
                      {product.ai_material && (
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Material</p>
                            <p className="text-sm text-purple-900 font-semibold">{product.ai_material}</p>
                          </div>
                        </div>
                      )}
                      {product.ai_confidence_score > 0 && (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <div>
                            <p className="text-xs text-purple-600 font-medium">Confidence</p>
                            <p className="text-sm text-purple-900 font-semibold">{product.ai_confidence_score}%</p>
                          </div>
                        </div>
                      )}
                      {product.seo_title && (
                        <div className="col-span-2 md:col-span-1">
                          <div className="flex items-center gap-2 mb-1">
                            <TagIcon className="w-4 h-4 text-purple-600" />
                            <p className="text-xs text-purple-600 font-medium">SEO Title</p>
                          </div>
                          <p className="text-sm text-purple-900 line-clamp-1">{product.seo_title}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Stock: <span className="font-semibold text-gray-900">{product.inventory_quantity}</span></span>
                      {product.last_enriched_at && (
                        <span className="text-gray-500 text-xs">
                          Enriched: {new Date(product.last_enriched_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-lg transition ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <ProgressModal
        isOpen={enrichingProducts}
        title="Enrichissement IA en cours"
        current={enrichProgress.current}
        total={enrichProgress.total}
        currentItem={enrichProgress.currentProduct}
        currentItemImage={enrichProgress.currentImage}
        itemType="product"
        onClose={handleCancelEnrichment}
      />

      {showDiagnostics && (
        <ConnectionDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
      </div>
    </>
  );
}
