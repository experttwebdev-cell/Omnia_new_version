import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../App';
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
  XCircle,
  BarChart3,
  Users,
  Zap,
  Target,
  Filter,
  Search,
  Download,
  AlertCircle
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
  performanceMetrics?: {
    syncSuccessRate: number;
    averageEnrichmentTime: number;
    totalEnrichedValue: number;
  };
}

interface DashboardProps {
  onProductSelect?: (productId: string) => void;
  onViewAllProducts?: (filter?: string) => void;
  onViewAllSyncs?: () => void;
}

type TimeRange = 'today' | 'week' | 'month' | 'all';

export function Dashboard({ onProductSelect, onViewAllProducts, onViewAllSyncs }: DashboardProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');

  const fetchDashboardData = useCallback(async () => {
    try {
      setError('');
      const isRefreshing = !loading;
      if (isRefreshing) setRefreshing(true);

      const [
        dashboardStatsResult,
        productTypesResult,
        enrichedProductsResult,
        syncLogsResult,
        performanceResult
      ] = await Promise.all([
        supabase.from('fast_dashboard_cache').select('*').maybeSingle(),
        supabase.from('product_type_statistics_cache').select('*').limit(10),
        supabase.from('fast_products_view').select('*').eq('enrichment_status', 'enriched').order('last_enriched_at', { ascending: false }),
        supabase.from('recent_sync_logs_view').select('*').limit(10),
        supabase.from('performance_metrics_cache').select('*').maybeSingle()
      ]);

      const errors = [
        dashboardStatsResult.error,
        productTypesResult.error,
        enrichedProductsResult.error,
        syncLogsResult.error,
        performanceResult.error
      ].filter(error => error);

      if (errors.length > 0) {
        console.error('Database errors:', errors);
        throw new Error(`Failed to load some data: ${errors[0]?.message}`);
      }

      const statsData = dashboardStatsResult.data;
      if (!statsData) {
        throw new Error('Dashboard statistics not available');
      }

      const productTypes = (productTypesResult.data || []).map(pt => ({
        type: pt.product_type || 'Uncategorized',
        count: pt.product_count
      }));

      const products = enrichedProductsResult.data || [];
      const syncLogs = syncLogsResult.data || [];
      const performanceData = performanceResult.data;

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
        recentSyncs: syncLogs,
        performanceMetrics: performanceData ? {
          syncSuccessRate: performanceData.sync_success_rate,
          averageEnrichmentTime: performanceData.avg_enrichment_time,
          totalEnrichedValue: performanceData.total_enriched_value
        } : undefined
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopify_products'
        },
        () => {
          console.log('Products changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sync_logs'
        },
        () => {
          console.log('Sync logs changed, refreshing dashboard...');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExportData = async () => {
    try {
      // In a real implementation, this would generate and download a CSV/Excel file
      console.log('Exporting dashboard data...');
      // Mock export functionality
      alert('Export functionality would be implemented here');
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.seo_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedProductType === 'all' || 
                       product.product_type === selectedProductType;
    return matchesSearch && matchesType;
  });

  const displayedProducts = showAllProducts ? filteredProducts : filteredProducts.slice(0, 5);

  const productTypes = [...new Set(products.map(p => p.product_type).filter(Boolean))];

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

  if (error && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Unable to Load Dashboard</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your product catalog and AI enrichment</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t.dashboard.totalProducts}
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          color="blue"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title={t.dashboard.aiEnriched}
          value={stats.enrichedProducts.toLocaleString()}
          icon={Sparkles}
          color="purple"
          subtitle={`${Math.round((stats.enrichedProducts / stats.totalProducts) * 100)}% of total`}
        />
        <StatCard
          title={t.dashboard.syncedToShopify}
          value={stats.syncedProducts.toLocaleString()}
          icon={CheckCircle}
          color="green"
          subtitle={`${Math.round((stats.syncedProducts / stats.totalProducts) * 100)}% success rate`}
        />
        <StatCard
          title={t.dashboard.pendingSync}
          value={stats.pendingSyncProducts.toLocaleString()}
          icon={Clock}
          color="orange"
          alert={stats.pendingSyncProducts > 10}
        />
      </div>

      {/* Performance Metrics */}
      {stats.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Sync Success Rate"
            value={`${stats.performanceMetrics.syncSuccessRate}%`}
            icon={Target}
            color="green"
          />
          <MetricCard
            title="Avg Enrichment Time"
            value={`${stats.performanceMetrics.averageEnrichmentTime}s`}
            icon={Zap}
            color="blue"
          />
          <MetricCard
            title="Enrichment Value Score"
            value={stats.performanceMetrics.totalEnrichedValue.toFixed(1)}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Types */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Top Product Types</h2>
            </div>
            {stats.productTypes.length > 5 && (
              <button
                onClick={() => onViewAllProducts?.('types')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            )}
          </div>
          {stats.productTypes.length > 0 ? (
            <div className="space-y-3">
              {stats.productTypes.slice(0, 5).map((type, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{type.count} products</span>
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition">
                      {Math.round((type.count / stats.totalProducts) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No product types available</p>
          )}
        </div>

        {/* Recent Sync Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Activity className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Recent Sync Activity</h2>
            </div>
            {stats.recentSyncs.length > 5 && (
              <button
                onClick={onViewAllSyncs}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All
              </button>
            )}
          </div>
          {stats.recentSyncs.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSyncs.slice(0, 5).map((sync) => (
                <div key={sync.id} className="border-l-4 border-gray-200 pl-3 py-2 hover:border-teal-400 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-800">{sync.store_name}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sync.status === 'success'
                        ? 'bg-green-100 text-green-700'
                        : sync.status === 'processing'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {sync.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {sync.products_processed} products processed
                    {sync.products_failed > 0 && (
                      <span className="text-red-600 ml-2">
                        ({sync.products_failed} failed)
                      </span>
                    )}
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

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Business Insights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.uniqueVendors}</div>
            <div className="text-sm text-gray-600 mt-1">Unique Vendors</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <Package className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {stats.totalProducts > 0
                ? Math.round(stats.totalInventory / stats.totalProducts)
                : 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Avg. Inventory Per Product</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">
              {stats.totalProducts > 0
                ? Math.round((stats.activeProducts / stats.totalProducts) * 100)
                : 0}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Active Products</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.lowStockProducts}</div>
            <div className="text-sm text-gray-600 mt-1">Low Stock Items</div>
          </div>
        </div>
      </div>

      {/* AI Enriched Products */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">AI Enriched Products</h2>
              <p className="text-sm text-gray-600">
                Products enhanced with AI-generated SEO and descriptions
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {productTypes.length > 0 && (
                <select
                  value={selectedProductType}
                  onChange={(e) => setSelectedProductType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  {productTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              )}
            </div>
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              {showAllProducts ? 'Show Less' : `Show All (${filteredProducts.length})`}
            </button>
          </div>
        </div>

        {displayedProducts.length > 0 ? (
          <div className="space-y-4">
            {displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onView={() => onProductSelect?.(product.id)}
              />
            ))}
            {filteredProducts.length > 5 && !showAllProducts && (
              <div className="text-center pt-4 border-t">
                <button
                  onClick={() => setShowAllProducts(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Show {filteredProducts.length - 5} more products
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">No AI Enriched Products Found</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {searchTerm || selectedProductType !== 'all' 
                ? 'Try adjusting your search filters'
                : 'Go to the Products tab to start enriching your products with AI'
              }
            </p>
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
  subtitle?: string;
  trend?: { value: number; positive: boolean };
  alert?: boolean;
}

function StatCard({ title, value, icon: Icon, color, subtitle, trend, alert }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    teal: 'bg-teal-100 text-teal-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 relative ${alert ? 'ring-2 ring-orange-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${
              trend.positive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 ${!trend.positive ? 'rotate-180' : ''}`} />
              <span>{trend.positive ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onView: () => void;
}

function ProductCard({ product, onView }: ProductCardProps) {
  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden group-hover:shadow-md transition">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title || 'Product image'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                {product.title}
              </h3>
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
                {product.product_type && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {product.product_type}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition flex-shrink-0 opacity-0 group-hover:opacity-100"
            >
              <Eye className="w-4 h-4" />
              View Details
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {product.ai_color && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Palette className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Color</p>
                  <p className="text-sm font-medium text-gray-800">{product.ai_color}</p>
                </div>
              </div>
            )}
            {product.ai_material && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Layers className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Material</p>
                  <p className="text-sm font-medium text-gray-800">{product.ai_material}</p>
                </div>
              </div>
            )}
            {product.ai_style && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <Sparkles className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Style</p>
                  <p className="text-sm font-medium text-gray-800">{product.ai_style}</p>
                </div>
              </div>
            )}
            {product.seo_title && (
              <div className="lg:col-span-2">
                <p className="text-xs text-gray-500 mb-1">SEO Title</p>
                <p className="text-sm text-gray-800 line-clamp-2">{product.seo_title}</p>
              </div>
            )}
          </div>

          {product.last_enriched_at && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Enriched: {new Date(product.last_enriched_at).toLocaleString()}
              </p>
              {product.inventory_level !== undefined && (
                <p className={`text-xs font-medium ${
                  product.inventory_level < 10 
                    ? 'text-red-600' 
                    : product.inventory_level < 25 
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  Stock: {product.inventory_level}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}