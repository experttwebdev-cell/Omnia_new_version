import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Search,
  RefreshCw,
  Tag as TagIcon,
  Sparkles,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { ProgressModal } from './ProgressModal';
import { ConfirmDialog } from './ConfirmDialog';
import { useNotifications, NotificationSystem } from './NotificationSystem';

type Product = Database['public']['Tables']['shopify_products']['Row'];

export function SeoTag() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentItem: '' });
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'generate' | 'sync' | null>(null);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const { notifications, addNotification, dismissNotification } = useNotifications();

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
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    return product.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleGenerateForAll = async () => {
    const productsToGenerate = selectedProducts.size > 0
      ? products.filter(p => selectedProducts.has(p.id))
      : products.filter(p => !p.tags || p.tags.trim() === '');

    if (productsToGenerate.length === 0) {
      addNotification({
        type: 'info',
        title: 'No Action Needed',
        message: 'No products need tag generation',
        duration: 3000
      });
      return;
    }

    setConfirmAction('generate');
    setShowConfirm(true);
  };

  const executeGenerateForAll = async () => {
    setShowConfirm(false);
    const productsToGenerate = selectedProducts.size > 0
      ? products.filter(p => selectedProducts.has(p.id))
      : products.filter(p => !p.tags || p.tags.trim() === '');

    setGeneratingAll(true);
    setIsProcessingComplete(false);
    setProgress({ current: 0, total: productsToGenerate.length, currentItem: '' });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsToGenerate.length; i++) {
      const product = productsToGenerate[i];
      setProgress({
        current: i + 1,
        total: productsToGenerate.length,
        currentItem: product.title
      });

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-product-tags`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product.id }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to generate tags for product ${product.id}`);
        }
      } catch (err) {
        errorCount++;
        console.error(`Error generating tags for product ${product.id}:`, err);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProcessingComplete(true);

    setTimeout(async () => {
      setGeneratingAll(false);
      setProgress({ current: 0, total: 0, currentItem: '' });
      setSelectedProducts(new Set());
      await fetchProducts();

      addNotification({
        type: 'success',
        title: 'Tag Generation Complete',
        message: `Successfully generated tags for ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        duration: 5000
      });
    }, 2000);
  };

  const handleSyncToShopify = async () => {
    const productsToSync = selectedProducts.size > 0
      ? products.filter(p => selectedProducts.has(p.id) && p.tags)
      : products.filter(p => p.tags && !p.seo_synced_to_shopify);

    if (productsToSync.length === 0) {
      addNotification({
        type: 'info',
        title: 'No Products to Sync',
        message: 'No products with tags found to synchronize',
        duration: 3000
      });
      return;
    }

    setConfirmAction('sync');
    setShowConfirm(true);
  };

  const executeSyncToShopify = async () => {
    setShowConfirm(false);
    const productsToSync = selectedProducts.size > 0
      ? products.filter(p => selectedProducts.has(p.id) && p.tags)
      : products.filter(p => p.tags && !p.seo_synced_to_shopify);

    setSyncingAll(true);
    setIsProcessingComplete(false);
    setProgress({ current: 0, total: productsToSync.length, currentItem: '' });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < productsToSync.length; i++) {
      const product = productsToSync[i];
      setProgress({
        current: i + 1,
        total: productsToSync.length,
        currentItem: product.title
      });

      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-seo-to-shopify`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product.id, syncTags: true }),
        });

        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
          console.error(`Failed to sync product ${product.id}`);
        }
      } catch (err) {
        errorCount++;
        console.error(`Error syncing product ${product.id}:`, err);
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsProcessingComplete(true);

    setTimeout(async () => {
      setSyncingAll(false);
      setProgress({ current: 0, total: 0, currentItem: '' });
      setSelectedProducts(new Set());
      await fetchProducts();

      addNotification({
        type: 'success',
        title: 'Shopify Sync Complete',
        message: `Successfully synced ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
        duration: 5000
      });
    }, 2000);
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

  const productsWithoutTags = products.filter(p => !p.tags || p.tags.trim() === '').length;
  const productsNeedingSync = products.filter(p => p.tags && !p.seo_synced_to_shopify).length;

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />

      <ConfirmDialog
        isOpen={showConfirm}
        title={confirmAction === 'generate' ? 'Generate Tags?' : 'Sync to Shopify?'}
        message={
          confirmAction === 'generate'
            ? `Generate tags for products using AI?`
            : `Sync tags to Shopify?`
        }
        confirmText="Confirm"
        cancelText="Cancel"
        type={confirmAction === 'generate' ? 'info' : 'warning'}
        onConfirm={() => {
          if (confirmAction === 'generate') {
            executeGenerateForAll();
          } else if (confirmAction === 'sync') {
            executeSyncToShopify();
          }
        }}
        onCancel={() => {
          setShowConfirm(false);
          setConfirmAction(null);
        }}
      />

      <ProgressModal
        isOpen={generatingAll || syncingAll}
        title={generatingAll ? 'Generating Tags' : 'Syncing to Shopify'}
        current={progress.current}
        total={progress.total}
        currentItem={progress.currentItem}
        itemType="product"
        isComplete={isProcessingComplete}
        onClose={() => {
          if (isProcessingComplete) {
            setGeneratingAll(false);
            setSyncingAll(false);
            setIsProcessingComplete(false);
          }
        }}
      />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateForAll}
            disabled={generatingAll}
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
                Generate for All Products
              </>
            )}
          </button>
          <button
            onClick={handleSyncToShopify}
            disabled={syncingAll}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
          >
            {syncingAll ? (
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
          <button
            onClick={fetchProducts}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <TagIcon className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Total Products</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">Without Tags</h3>
          </div>
          <p className="text-2xl font-bold text-orange-900">{productsWithoutTags}</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Pending Sync</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">{productsNeedingSync}</p>
        </div>
      </div>

      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-medium">
              {selectedProducts.size} products selected
            </span>
          </div>
          <button
            onClick={() => setSelectedProducts(new Set())}
            className="px-4 py-2 text-blue-700 hover:bg-blue-100 rounded-lg transition text-sm font-medium"
          >
            Clear Selection
          </button>
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
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Current Tags</th>
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
                      {product.tags ? (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.split(',').slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {tag.trim()}
                            </span>
                          ))}
                          {product.tags.split(',').length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{product.tags.split(',').length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No tags</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {product.tags ? (
                        product.seo_synced_to_shopify ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Synced
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium w-fit">
                            <Clock className="w-3 h-3" />
                            Pending Sync
                          </span>
                        )
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium w-fit">
                          <AlertCircle className="w-3 h-3" />
                          No Tags
                        </span>
                      )}
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
            <TagIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No products match your search</p>
          </div>
        )}
      </div>
    </>
  );
}
