import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';
import {
  Package,
  Sparkles,
  CheckCircle,
  Clock,
  BarChart3,
  Users,
  AlertTriangle,
  RefreshCw,
  Store as StoreIcon,
  TrendingUp,
  Target,
  Gauge
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface SellerStats {
  totalProducts: number;
  totalInventory: number;
  activeProducts: number;
  lowStockProducts: number;
  uniqueVendors: number;
  enrichedProducts: number;
  syncedProducts: number;
  pendingSyncProducts: number;
  productTypes: Array<{ type: string; count: number }>;
  performanceMetrics?: {
    syncSuccessRate: number;
    avgConfidenceScore: number;
    highConfidenceProducts: number;
  };
}

interface SellerMenuProps {
  compact?: boolean;
  onProductSelect?: (productId: string) => void;
}

export function SellerMenu({ compact = false, onProductSelect }: SellerMenuProps) {
  const { seller } = useAuth();
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchSellerData = useCallback(async () => {
    if (!seller) {
      setLoading(false);
      return;
    }

    try {
      setError('');
      if (!loading) setRefreshing(true);

      const { data: allProducts, error: productsError } = await supabase
        .from('shopify_products')
        .select('*')
        .eq('seller_id', seller.id);

      if (productsError) throw productsError;

      const products = allProducts || [];

      // Calculate stats
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.status === 'active').length;
      const lowStockProducts = products.filter(p => (p.inventory_quantity || 0) < 10 && (p.inventory_quantity || 0) > 0).length;
      const totalInventory = products.reduce((sum, p) => sum + (p.inventory_quantity || 0), 0);
      const uniqueVendors = new Set(products.map(p => p.vendor).filter(Boolean)).size;
      const enrichedProducts = products.filter(p => p.enrichment_status === 'enriched').length;
      const syncedProducts = products.filter(p => p.shopify_sync_status === 'synced').length;
      const pendingSyncProducts = products.filter(p => p.shopify_sync_status === 'pending').length;

      // Product types
      const categoryCount = new Map<string, number>();
      products.forEach(p => {
        const cat = p.category || 'Uncategorized';
        categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
      });
      const productTypes = Array.from(categoryCount.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

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
        performanceMetrics
      });
    } catch (err) {
      console.error('Error fetching seller data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load seller data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [seller?.id]);

  useEffect(() => {
    fetchSellerData();

    const productSubscription = supabase
      .channel('seller-products')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopify_products'
        },
        fetchSellerData
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productSubscription);
    };
  }, [fetchSellerData]);

  const handleRefresh = () => {
    fetchSellerData();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {!compact && (
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Seller Analytics</h2>
            <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
          </div>
        )}
        <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
          {[...Array(compact ? 4 : 8)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-16"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700 text-sm mb-2">{error}</p>
        <button
          onClick={fetchSellerData}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Seller Analytics</h2>
            <p className="text-gray-600 text-sm">AI-powered product insights</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      )}

      {/* Empty State */}
      {stats.totalProducts === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-6 text-center">
          <StoreIcon className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-2">Welcome to Seller Analytics!</h3>
          <p className="text-gray-600 text-sm mb-4">
            Connect your store and import products to see analytics
          </p>
        </div>
      )}

      {/* Key Metrics */}
      <div className={`grid ${compact ? 'grid-cols-2 gap-3' : 'grid-cols-2 md:grid-cols-4 gap-4'}`}>
        <StatCard
          title="Products"
          value={stats.totalProducts}
          icon={Package}
          color="blue"
          compact={compact}
        />
        <StatCard
          title="AI Enriched"
          value={stats.enrichedProducts}
          icon={Sparkles}
          color="purple"
          subtitle={compact ? undefined : `${Math.round((stats.enrichedProducts / stats.totalProducts) * 100)}%`}
          compact={compact}
        />
        <StatCard
          title="Synced"
          value={stats.syncedProducts}
          icon={CheckCircle}
          color="green"
          subtitle={compact ? undefined : `${Math.round((stats.syncedProducts / stats.enrichedProducts) * 100)}%`}
          compact={compact}
        />
        <StatCard
          title="Pending"
          value={stats.pendingSyncProducts}
          icon={Clock}
          color="orange"
          alert={stats.pendingSyncProducts > 10}
          compact={compact}
        />
      </div>

      {/* Performance Metrics */}
      {!compact && stats.performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Confidence Score"
            value={`${Math.round(stats.performanceMetrics.avgConfidenceScore)}%`}
            icon={Gauge}
            color="blue"
          />
          <MetricCard
            title="High Confidence"
            value={stats.performanceMetrics.highConfidenceProducts}
            icon={Target}
            color="green"
          />
          <MetricCard
            title="Sync Success"
            value={`${Math.round(stats.performanceMetrics.syncSuccessRate)}%`}
            icon={TrendingUp}
            color="purple"
          />
        </div>
      )}

      {/* Inventory & Types */}
      {!compact && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Product Types */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-4 h-4 text-blue-500" />
              <h3 className="font-semibold text-gray-800">Top Categories</h3>
            </div>
            <div className="space-y-2">
              {stats.productTypes.slice(0, 5).map((type, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{type.type}</span>
                  <span className="text-gray-500 font-medium">{type.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Insights */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              <h3 className="font-semibold text-gray-800">Inventory</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Total Stock</span>
                </div>
                <span className="font-medium text-gray-800">{stats.totalInventory}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700">Low Stock</span>
                </div>
                <span className="font-medium text-orange-600">{stats.lowStockProducts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">Vendors</span>
                </div>
                <span className="font-medium text-green-600">{stats.uniqueVendors}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simplified StatCard
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple' | 'orange';
  subtitle?: string;
  alert?: boolean;
  compact?: boolean;
}

function StatCard({ title, value, icon: Icon, color, subtitle, alert, compact }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    purple: 'bg-purple-500 text-white',
    orange: 'bg-orange-500 text-white'
  };

  if (compact) {
    return (
      <div className={`bg-white rounded-lg border ${alert ? 'border-orange-300' : 'border-gray-200'} p-3`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className="text-lg font-bold text-gray-800">{value.toLocaleString()}</p>
          </div>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${alert ? 'border-orange-300' : 'border-gray-200'} p-4 hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// Simplified MetricCard
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'purple';
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
    green: 'bg-gradient-to-br from-green-500 to-green-600',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-600'
  };

  return (
    <div className={`${colorClasses[color]} text-white rounded-lg p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/90">{title}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}