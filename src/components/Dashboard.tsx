import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  ShoppingBag,
  RefreshCw,
  Store as StoreIcon,
  Activity,
  Sparkles,
  CheckCircle,
  Clock,
  Palette,
  Layers,
  Eye,
  XCircle
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { LoadingAnimation, DashboardCardSkeleton } from './LoadingAnimation';

type Product = Database['public']['Tables']['shopify_products']['Row'];
type SyncLog = Database['public']['Tables']['sync_logs']['Row'];

interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  activeProducts: number;
  lowStockProducts: number;
  uniqueVendors: number;
  enrichedProducts: number;
  syncedProducts: number;
  pendingSyncProducts: number;
  productTypes: Array<{ type: string; count: number }>;
  recentSyncs: SyncLog[];
}

interface DashboardProps {
  onProductSelect?: (productId: string) => void;
}

export function Dashboard({ onProductSelect }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [dashboardStatsResult, productTypesResult, enrichedProductsResult, syncLogsResult] = await Promise.all([
        supabase.from('fast_dashboard_cache').select('*').maybeSingle(),
        supabase.from('product_type_statistics_cache').select('*').limit(5),
        supabase.from('fast_products_view').select('*').eq('enrichment_status', 'enriched').order('last_enriched_at', { ascending: false }),
        supabase.from('recent_sync_logs_view').select('*').limit(5)
      ]);

      if (dashboardStatsResult.error) throw dashboardStatsResult.error;
      if (productTypesResult.error) throw productTypesResult.error;
      if (enrichedProductsResult.error) throw enrichedProductsResult.error;
      if (syncLogsResult.error) throw syncLogsResult.error;

      const statsData = dashboardStatsResult.data;
      const productTypes = (productTypesResult.data || []).map(pt => ({ type: pt.product_type, count: pt.product_count }));
      const products = enrichedProductsResult.data || [];
      const syncLogs = syncLogsResult.data || [];

      if (!statsData) {
        throw new Error('Dashboard statistics not available');
      }

      setProducts(products);
      setStats({
        totalProducts: statsData.total_products,
        totalInventory: statsData.total_inventory,
        activeProducts: statsData.active_products,
        lowStockProducts: statsData.low_stock_products,
        uniqueVendors: statsData.unique_vendors,
        enrichedProducts: statsData.enriched_products,
        syncedProducts: statsData.synced_products,
        pendingSyncProducts: statsData.pending_sync_products,
        productTypes,
        recentSyncs: syncLogs
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-product-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'shopify_products'
        },
        () => {
          console.log('Product updated, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        </div>
        <LoadingAnimation type="data" message="Loading dashboard data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <DashboardCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="AI Enriched"
          value={stats.enrichedProducts.toLocaleString()}
          icon={Sparkles}
          color="purple"
        />
        <StatCard
          title="Synced to Shopify"
          value={stats.syncedProducts.toLocaleString()}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending Sync"
          value={stats.pendingSyncProducts.toLocaleString()}
          icon={Clock}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Top Product Types</h2>
          </div>
          {stats.productTypes.length > 0 ? (
            <div className="space-y-3">
              {stats.productTypes.map((type, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{type.type || 'Uncategorized'}</span>
                  <span className="text-gray-600">{type.count} products</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No product types available</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Activity className="w-5 h-5 text-teal-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Recent Sync Activity</h2>
          </div>
          {stats.recentSyncs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSyncs.map((sync) => (
                <div key={sync.id} className="border-l-4 border-gray-200 pl-3 py-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{sync.store_name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sync.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {sync.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {sync.products_processed} products processed
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(sync.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sync history yet</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gray-100 rounded-lg">
            <StoreIcon className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Quick Stats</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-800">{stats.uniqueVendors}</div>
            <div className="text-sm text-gray-600 mt-1">Unique Vendors</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-800">
              {stats.totalProducts > 0
                ? Math.round(stats.totalInventory / stats.totalProducts)
                : 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg. Inventory Per Product</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-bold text-gray-800">
              {stats.totalProducts > 0
                ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Products</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">AI Enriched Products</h2>
          </div>
          <button
            onClick={() => setShowAllProducts(!showAllProducts)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            {showAllProducts ? 'Show Less' : 'Show All'}
          </button>
        </div>

        {products.filter(p => p.enrichment_status === 'enriched').length > 0 ? (
          <div className="space-y-3">
            {products
              .filter(p => p.enrichment_status === 'enriched')
              .slice(0, showAllProducts ? undefined : 5)
              .map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                  onClick={() => onProductSelect?.(product.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
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
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              <Sparkles className="w-3 h-3" />
                              AI Enriched
                            </span>
                            {product.seo_synced_to_shopify ? (
                              <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                Synced
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                <Clock className="w-3 h-3" />
                                Pending Sync
                              </span>
                            )}
                            {product.ai_confidence_score > 0 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                {product.ai_confidence_score}% confidence
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onProductSelect?.(product.id);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex-shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {product.ai_color && (
                          <div className="flex items-center gap-2">
                            <Palette className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Color</p>
                              <p className="text-sm font-medium text-gray-800">{product.ai_color}</p>
                            </div>
                          </div>
                        )}
                        {product.ai_material && (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500">Material</p>
                              <p className="text-sm font-medium text-gray-800">{product.ai_material}</p>
                            </div>
                          </div>
                        )}
                        {product.seo_title && (
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 mb-1">SEO Title</p>
                            <p className="text-sm text-gray-800 line-clamp-1">{product.seo_title}</p>
                          </div>
                        )}
                      </div>

                      {product.last_enriched_at && (
                        <p className="text-xs text-gray-500 mt-2">
                          Enriched: {new Date(product.last_enriched_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No AI Enriched Products Yet</p>
            <p className="text-sm text-gray-500">Go to the Products tab to start enriching your products with AI</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'teal' | 'orange' | 'purple';
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    teal: 'bg-teal-100 text-teal-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
