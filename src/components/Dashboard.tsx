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
  AlertCircle,
  Text,
  Image,
  Gauge
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { LoadingAnimation, DashboardCardSkeleton } from './LoadingAnimation';

type Product = Database['public']['Tables']['shopify_products']['Row'];
type SyncLog = {
  id: string;
  store_name: string;
  status: 'success' | 'failed' | 'processing';
  products_processed: number;
  products_failed: number;
  created_at: string;
};

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
    avgConfidenceScore: number;
    highConfidenceProducts: number;
  };
}

interface DashboardProps {
  onProductSelect?: (productId: string) => void;
  onViewAllProducts?: (filter?: string) => void;
  onViewAllSyncs?: () => void;
}

export function Dashboard({ onProductSelect, onViewAllProducts, onViewAllSyncs }: DashboardProps) {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');

  const fetchDashboardData = useCallback(async () => {
    try {
      setError('');
      const isRefreshing = !loading;
      if (isRefreshing) setRefreshing(true);

      // Fetch all data in parallel
      const [
        dashboardStatsResult,
        productTypesResult,
        enrichedProductsResult
      ] = await Promise.all([
        supabase.from('fast_dashboard_cache').select('*').maybeSingle(),
        supabase.from('product_type_statistics_cache').select('*'),
        supabase.from('shopify_products')
          .select('*')
          .eq('enrichment_status', 'enriched')
          .order('last_enriched_at', { ascending: false })
          .limit(100)
      ]);

      // Try to fetch performance metrics, but don't fail if table doesn't exist
      let performanceResult = { data: null, error: null };
      try {
        performanceResult = await supabase.from('performance_metrics_cache').select('*').maybeSingle();
      } catch (e) {
        console.warn('Performance metrics not available:', e);
      }

      // Handle critical errors
      const criticalErrors = [
        dashboardStatsResult.error,
        productTypesResult.error,
        enrichedProductsResult.error
      ].filter(error => error);

      if (criticalErrors.length > 0) {
        console.error('Database errors:', criticalErrors);
        throw new Error(`Failed to load dashboard data: ${criticalErrors[0]?.message}`);
      }

      const statsData = dashboardStatsResult.data;
      if (!statsData) {
        throw new Error('Dashboard statistics not available');
      }

      const category = (productTypesResult.data || []).map(pt => ({
        type: pt.category || 'Uncategorized',
        count: pt.product_count
      }));

      const products = enrichedProductsResult.data || [];
      const performanceData = performanceResult.data;

      // Mock recent syncs (replace with actual sync_logs data when available)
      const mockRecentSyncs: SyncLog[] = [
        {
          id: '1',
          store_name: 'Main Store',
          status: 'success',
          products_processed: 45,
          products_failed: 2,
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          store_name: 'Outlet Store',
          status: 'processing',
          products_processed: 23,
          products_failed: 0,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];

      setProducts(products);
      setStats({
        totalProducts: statsData.total_products || 0,
        totalInventory: statsData.total_inventory || 0,
        activeProducts: statsData.active_products || 0,
        lowStockProducts: statsData.low_stock_products || 0,
        uniqueVendors: statsData.unique_vendors || 0,
        enrichedProducts: statsData.enriched_products || 0,
        syncedProducts: statsData.synced_products || 0,
        pendingSyncProducts: statsData.pending_sync_products || 0,
        productTypes,
        recentSyncs: mockRecentSyncs,
        performanceMetrics: performanceData ? {
          syncSuccessRate: performanceData.sync_success_rate || 0,
          avgConfidenceScore: performanceData.avg_confidence_score || 0,
          highConfidenceProducts: performanceData.high_confidence_products || 0
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

    // Set up real-time subscriptions
    const productSubscription = supabase
      .channel('dashboard-products')
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
      .subscribe();

    return () => {
      supabase.removeChannel(productSubscription);
    };
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleExportData = () => {
    // Export functionality implementation
    console.log('Exporting dashboard data...');
    alert('Export functionality would be implemented here');
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.seo_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    
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
          <h1 className="text-3xl font-bold text-gray-800">Product Intelligence Dashboard</h1>
          <p className="text-gray-600 mt-1">
            AI-powered product enrichment and Shopify synchronization
          </p>
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
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={Package}
          color="blue"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="AI Enriched"
          value={stats.enrichedProducts.toLocaleString()}
          icon={Sparkles}
          color="purple"
          subtitle={`${Math.round((stats.enrichedProducts / stats.totalProducts) * 100)}% of total`}
        />
        <StatCard
          title="Synced to Shopify"
          value={stats.syncedProducts.toLocaleString()}
          icon={CheckCircle}
          color="green"
          subtitle={`${Math.round((stats.syncedProducts / stats.enrichedProducts) * 100)}% success`}
        />
        <StatCard
          title="Pending Sync"
          value={stats.pendingSyncProducts.toLocaleString()}
          icon={Clock}
          color="orange"
          alert={stats.pendingSyncProducts > 10}
        />
      </div>

      {/* AI Performance Metrics */}
      {stats.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard
            title="Avg Confidence Score"
            value={`${stats.performanceMetrics.avgConfidenceScore}%`}
            icon={Gauge}
            color="blue"
          />
          <MetricCard
            title="High Confidence Products"
            value={stats.performanceMetrics.highConfidenceProducts.toLocaleString()}
            icon={Target}
            color="green"
          />
          <MetricCard
            title="Sync Success Rate"
            value={`${stats.performanceMetrics.syncSuccessRate}%`}
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
                <div key={idx} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      idx === 0 ? 'bg-blue-500' :
                      idx === 1 ? 'bg-green-500' :
                      idx === 2 ? 'bg-purple-500' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-gray-700 font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{type.count} products</span>
                    <span className="text-xs text-gray-400">
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

        {/* Inventory Insights */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Inventory Insights</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">Total Inventory Value</span>
              </div>
              <span className="text-lg font-bold text-gray-800">
                {stats.totalInventory.toLocaleString()} units
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="text-gray-700">Low Stock Products</span>
              </div>
              <span className="text-lg font-bold text-orange-600">
                {stats.lowStockProducts}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Unique Vendors</span>
              </div>
              <span className="text-lg font-bold text-green-600">
                {stats.uniqueVendors}
              </span>
            </div>
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
                Products enhanced with AI-generated SEO, descriptions, and metadata
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
                : 'Start enriching your products with AI to see them here'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// StatCard Component (same as before)
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

// MetricCard Component (same as before)
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

// Enhanced ProductCard Component matching your schema
interface ProductCardProps {
  product: Product;
  onView: () => void;
}

function ProductCard({ product, onView }: ProductCardProps) {
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div
      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer group"
      onClick={onView}
    >
      <div className="flex items-start gap-4">
        {/* Product Image */}
        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden group-hover:shadow-md transition">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.title || 'Product image'}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with title and actions */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
                {product.title || 'Untitled Product'}
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(product.ai_confidence_score)}`}>
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

          {/* AI Enrichment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
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
          </div>

          {/* SEO Information */}
          {(product.seo_title || product.seo_description) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Text className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">SEO Content</span>
              </div>
              {product.seo_title && (
                <p className="text-sm text-gray-800 line-clamp-1 mb-1">
                  <strong>Title:</strong> {product.seo_title}
                </p>
              )}
              {product.seo_description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  <strong>Description:</strong> {product.seo_description}
                </p>
              )}
            </div>
          )}

          {/* Footer with metadata */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {product.last_enriched_at && (
                <span>Enriched: {new Date(product.last_enriched_at).toLocaleDateString()}</span>
              )}
              {product.vendor && (
                <span>Vendor: {product.vendor}</span>
              )}
            </div>
            {product.inventory_quantity !== undefined && (
              <p className={`text-xs font-medium ${
                product.inventory_quantity < 10 
                  ? 'text-red-600' 
                  : product.inventory_quantity < 25 
                  ? 'text-orange-600'
                  : 'text-green-600'
              }`}>
                Stock: {product.inventory_quantity}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}