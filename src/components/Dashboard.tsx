import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../App';
import { useNotifications, NotificationSystem } from './NotificationSystem';
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
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const fetchDashboardData = useCallback(async () => {
    try {
      setError('');
      const isRefreshing = !loading;
      if (isRefreshing) setRefreshing(true);

      // Fetch all products for this seller
      const { data: allProducts, error: productsError } = await supabase
        .from('shopify_products')
        .select('*')
        .eq('seller_id', seller.id);

      if (productsError) {
        throw productsError;
      }

      const products = allProducts || [];

      // Calculate stats directly from products
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const lowStockProducts = products.filter(p => (p.inventory_quantity || 0) < 10 && (p.inventory_quantity || 0) > 0).length;
      const totalInventory = products.reduce((sum, p) => sum + (p.inventory_quantity || 0), 0);
      const uniqueVendors = new Set(products.map(p => p.vendor).filter(Boolean)).size;
      const enrichedProducts = products.filter(p => p.enrichment_status === 'enriched').length;
      const syncedProducts = products.filter(p => p.shopify_sync_status === 'synced').length;
      const pendingSyncProducts = products.filter(p => p.shopify_sync_status === 'pending').length;

      // Calculate product types
      const categoryCount = new Map<string, number>();
      products.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
      });
      const productTypes = Array.from(categoryCount.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Performance metrics
      const enrichedWithScores = products.filter(p => p.ai_confidence_score);
      const avgScore = enrichedWithScores.length > 0
        ? enrichedWithScores.reduce((sum, p) => sum + (p.ai_confidence_score || 0), 0) / enrichedWithScores.length
        : 0;
      const highConfidenceProducts = products.filter(p => (p.ai_confidence_score || 0) >= 0.8).length;

      const performanceMetrics = {
        syncSuccessRate: totalProducts > 0 ? (syncedProducts / totalProducts) * 100 : 0,
        avgConfidenceScore: avgScore,
        highConfidenceProducts
      };

      // Get enriched products for display
      const enrichedProductsList = products
        .filter(p => p.enrichment_status === 'enriched')
        .sort((a, b) => {
          const dateA = a.last_enriched_at ? new Date(a.last_enriched_at).getTime() : 0;
          const dateB = b.last_enriched_at ? new Date(b.last_enriched_at).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 100);

      // Fetch recent sync logs
      const { data: syncLogs } = await supabase
        .from('recent_sync_logs_view')
        .select('*')
        .limit(5);

      const recentSyncs: SyncLog[] = (syncLogs || []).map(log => ({
        id: log.id || '',
        store_name: log.store_name || 'Unknown Store',
        status: log.status || 'failed',
        products_processed: log.products_processed || 0,
        products_failed: log.products_failed || 0,
        created_at: log.created_at || new Date().toISOString()
      }));

      setProducts(enrichedProductsList);
      setStats({
        totalProducts,
        totalInventory,
        activeProducts,
        lowStockProducts,
        uniqueVendors,
        enrichedProducts,
        syncedProducts,
        pendingSyncProducts,
        productTypes,
        recentSyncs,
        performanceMetrics
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [seller?.id]);

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
    addNotification({
      type: 'info',
      message: 'Export functionality will be available soon',
      duration: 3000,
    });
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
          className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition shadow-lg"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 border border-gray-300 rounded-lg transition shadow-md"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg transition disabled:opacity-50 shadow-lg"
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
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Top Product Types</h2>
            </div>
            {stats.productTypes.length > 5 && (
              <button
                onClick={() => onViewAllProducts?.('types')}
                className="text-sm px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-md font-medium shadow-md transition"
              >
                View All
              </button>
            )}
          </div>
          {stats.productTypes.length > 0 ? (
            <div className="space-y-3">
              {stats.productTypes.slice(0, 5).map((type, idx) => (
                <div key={idx} className="flex items-center justify-between group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 p-2 rounded-lg transition cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      idx === 0 ? 'bg-blue-500' :
                      idx === 1 ? 'bg-emerald-500' :
                      idx === 2 ? 'bg-amber-500' :
                      idx === 3 ? 'bg-violet-500' : 'bg-cyan-500'
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
        <div className="bg-gradient-to-br from-white via-blue-50/30 to-blue-100/50 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg shadow-md">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Inventory Insights</h2>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg shadow-sm">
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
            <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
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
              className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg transition shadow-md"
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
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium shadow-md transition"
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
    </>
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
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg',
    green: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg',
    teal: 'bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg',
    orange: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg',
    purple: 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg'
  };

  return (
    <div className={`bg-gradient-to-br from-white via-gray-50/50 to-gray-100/80 rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 p-6 relative ${alert ? 'ring-2 ring-orange-400' : ''}`}>
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
    blue: 'bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-xl hover:shadow-2xl',
    green: 'bg-gradient-to-br from-emerald-500 via-green-600 to-green-700 text-white shadow-xl hover:shadow-2xl',
    purple: 'bg-gradient-to-br from-violet-500 via-purple-600 to-purple-700 text-white shadow-xl hover:shadow-2xl',
    orange: 'bg-gradient-to-br from-amber-500 via-orange-600 to-orange-700 text-white shadow-xl hover:shadow-2xl'
  };

  return (
    <div className={`rounded-xl p-6 ${colorClasses[color]} transition-all duration-300 hover:scale-105 hover:-translate-y-1`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-white/90 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="p-3 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-lg shadow-lg">
          <Icon className="w-8 h-8 text-white drop-shadow-md" />
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
      className="border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 rounded-lg p-4 hover:border-blue-400 hover:shadow-xl transition cursor-pointer group"
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