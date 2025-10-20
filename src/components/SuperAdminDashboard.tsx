import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Search,
  Filter,
  Download,
  Eye,
  Ban,
  CheckCircle,
  Clock,
  Crown,
  Edit,
  X,
  Save,
  RefreshCw,
  MoreVertical,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

// Types
interface SellerData {
  id: string;
  email: string;
  company_name: string;
  full_name: string;
  role: string;
  status: 'active' | 'trial' | 'suspended' | 'inactive';
  trial_ends_at: string | null;
  created_at: string;
  last_login_at?: string;
  subscription?: {
    plan_id: string;
    status: string;
    current_period_end: string;
    max_products: number;
    max_optimizations_monthly: number;
    max_articles_monthly: number;
    max_chat_responses_monthly: number;
  };
  products_count: number;
  usage?: {
    optimizations_used: number;
    articles_used: number;
    chat_responses_used: number;
  };
}

interface DashboardStats {
  total_sellers: number;
  active_subscriptions: number;
  trial_users: number;
  suspended_users: number;
  total_products: number;
  monthly_revenue: number;
  growth_rate: number;
}

interface QuotaForm {
  max_products: number;
  max_optimizations_monthly: number;
  max_articles_monthly: number;
  max_chat_responses_monthly: number;
}

// Custom hook for data management
const useSuperAdminData = () => {
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sellersResponse, subscriptionsResponse, productsResponse, usageResponse] = await Promise.all([
        supabase.from('sellers').select('*').order('created_at', { ascending: false }),
        supabase.from('subscriptions').select('*'),
        supabase.from('shopify_products').select('seller_id', { count: 'exact', head: true }),
        supabase.from('seller_usage').select('*')
      ]);

      if (sellersResponse.error) throw sellersResponse.error;
      if (subscriptionsResponse.error) throw subscriptionsResponse.error;

      const usageMap = new Map();
      usageResponse.data?.forEach(usage => {
        usageMap.set(usage.seller_id, usage);
      });

      const enrichedSellers = await Promise.all(
        (sellersResponse.data || []).map(async (seller) => {
          const subscription = subscriptionsResponse.data?.find(
            sub => sub.seller_id === seller.id && sub.status === 'active'
          ) || null;

          const { count } = await supabase
            .from('shopify_products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', seller.id);

          return {
            ...seller,
            subscription: subscription ? {
              plan_id: subscription.plan_id,
              status: subscription.status,
              current_period_end: subscription.current_period_end,
              max_products: subscription.max_products || 0,
              max_optimizations_monthly: subscription.max_optimizations_monthly || 0,
              max_articles_monthly: subscription.max_articles_monthly || 0,
              max_chat_responses_monthly: subscription.max_chat_responses_monthly || 0
            } : undefined,
            products_count: count || 0,
            usage: usageMap.get(seller.id)
          };
        })
      );

      setSellers(enrichedSellers);

      const trialCount = enrichedSellers.filter(s => s.status === 'trial').length;
      const activeSubsCount = subscriptionsResponse.data?.filter(s => s.status === 'active').length || 0;
      const suspendedCount = enrichedSellers.filter(s => s.status === 'suspended').length;

      setStats({
        total_sellers: enrichedSellers.length,
        active_subscriptions: activeSubsCount,
        trial_users: trialCount,
        suspended_users: suspendedCount,
        total_products: productsResponse.count || 0,
        monthly_revenue: activeSubsCount * 79,
        growth_rate: 12.5, // This could be calculated from historical data
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    sellers,
    stats,
    loading,
    error,
    lastUpdated,
    refreshData: loadData,
    setSellers
  };
};

// Stats Cards Component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  className = '',
  formatValue 
}: {
  title: string;
  value: number;
  icon: any;
  trend?: number;
  className?: string;
  formatValue?: (val: number) => string;
}) => (
  <div className={`bg-white rounded-xl border-2 border-gray-200 p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
        <Icon className="w-6 h-6 text-gray-700" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm font-medium ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1">
      {formatValue ? formatValue(value) : value}
    </p>
    <p className="text-sm font-medium text-gray-600">{title}</p>
  </div>
);

// Seller Status Badge Component
const StatusBadge = ({ status }: { status: SellerData['status'] }) => {
  const statusConfig = {
    active: { icon: CheckCircle, className: 'bg-green-100 text-green-700', label: 'Actif' },
    trial: { icon: Clock, className: 'bg-yellow-100 text-yellow-700', label: 'Essai' },
    suspended: { icon: Ban, className: 'bg-red-100 text-red-700', label: 'Suspendu' },
    inactive: { icon: X, className: 'bg-gray-100 text-gray-700', label: 'Inactif' }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Quota Usage Bar Component
const QuotaBar = ({ used, total, label }: { used: number; total: number; label: string }) => {
  const percentage = total > 0 ? Math.min((used / total) * 100, 100) : 0;
  const isOverLimit = used > total;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className={isOverLimit ? 'text-red-600 font-medium' : ''}>
          {used} / {total}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isOverLimit ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

export function SuperAdminDashboard() {
  const { seller } = useAuth();
  const {
    sellers,
    stats,
    loading,
    error,
    lastUpdated,
    refreshData,
    setSellers
  } = useSuperAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [quotaForm, setQuotaForm] = useState<QuotaForm>({
    max_products: 0,
    max_optimizations_monthly: 0,
    max_articles_monthly: 0,
    max_chat_responses_monthly: 0
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showUsage, setShowUsage] = useState<string | null>(null);

  // Filter sellers with useMemo for performance
  const filteredSellers = useMemo(() => {
    return sellers.filter(s => {
      const matchesSearch = 
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesPlan = planFilter === 'all' || s.subscription?.plan_id === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [sellers, searchTerm, statusFilter, planFilter]);

  const updateSellerStatus = async (sellerId: string, newStatus: string) => {
    setActionLoading(sellerId);
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status: newStatus })
        .eq('id', sellerId);

      if (error) throw error;

      // Optimistic update
      setSellers(prev => prev.map(s => 
        s.id === sellerId ? { ...s, status: newStatus as any } : s
      ));
    } catch (error) {
      console.error('Error updating seller status:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setActionLoading(null);
    }
  };

  const openQuotaEditor = async (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    if (seller?.subscription) {
      setQuotaForm({
        max_products: seller.subscription.max_products || 0,
        max_optimizations_monthly: seller.subscription.max_optimizations_monthly || 0,
        max_articles_monthly: seller.subscription.max_articles_monthly || 0,
        max_chat_responses_monthly: seller.subscription.max_chat_responses_monthly || 0
      });
      setEditingQuota(sellerId);
    }
  };

  const saveQuota = async () => {
    if (!editingQuota) return;

    setActionLoading('quota');
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update(quotaForm)
        .eq('seller_id', editingQuota)
        .eq('status', 'active');

      if (error) throw error;

      setEditingQuota(null);
      await refreshData();
    } catch (error) {
      console.error('Error updating quota:', error);
      alert('Erreur lors de la mise à jour des quotas');
    } finally {
      setActionLoading(null);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Company', 'Email', 'Status', 'Plan', 'Products', 'Created At'],
      ...filteredSellers.map(s => [
        s.company_name,
        s.email,
        s.status,
        s.subscription?.plan_id || 'None',
        s.products_count,
        new Date(s.created_at).toLocaleDateString('fr-FR')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sellers-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (seller?.role !== 'super_admin') {
    return (
      <div className="text-center py-12">
        <Ban className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h3>
        <p className="text-gray-600">Vous n'avez pas les permissions pour accéder à cette page.</p>
      </div>
    );
  }

  if (loading && !lastUpdated) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-gray-600">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h2>
          <p className="text-gray-600">
            Vue d'ensemble de la plateforme
            {lastUpdated && (
              <span className="text-sm text-gray-500 ml-2">
                • Dernière mise à jour: {lastUpdated.toLocaleTimeString('fr-FR')}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            <Download className="w-5 h-5" />
            Exporter
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Erreur:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          <StatsCard
            title="Vendeurs Totaux"
            value={stats.total_sellers}
            icon={Users}
            trend={5.2}
          />
          <StatsCard
            title="Abonnements Actifs"
            value={stats.active_subscriptions}
            icon={CheckCircle}
            trend={8.1}
          />
          <StatsCard
            title="Utilisateurs en Essai"
            value={stats.trial_users}
            icon={Clock}
            trend={-2.3}
          />
          <StatsCard
            title="Produits Totaux"
            value={stats.total_products}
            icon={Package}
            trend={12.7}
          />
          <StatsCard
            title="MRR Mensuel"
            value={stats.monthly_revenue}
            icon={DollarSign}
            className="bg-gradient-to-br from-blue-600 to-purple-600 text-white"
            formatValue={(val) => `${val}€`}
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email, entreprise ou nom..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="trial">Essai</option>
                <option value="suspended">Suspendus</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tous les plans</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {filteredSellers.length} vendeur{filteredSellers.length !== 1 ? 's' : ''} trouvé{filteredSellers.length !== 1 ? 's' : ''}
        </span>
        {searchTerm || statusFilter !== 'all' || planFilter !== 'all' ? (
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setPlanFilter('all');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Réinitialiser les filtres
          </button>
        ) : null}
      </div>

      {/* Sellers Table */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Vendeur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Plan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Produits</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Utilisation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Créé le</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSellers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{s.company_name}</p>
                      <p className="text-sm text-gray-600">{s.email}</p>
                      <p className="text-xs text-gray-500">{s.full_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-900">
                        {s.subscription?.plan_id || 'Aucun'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {s.products_count}
                      </span>
                      {s.subscription?.max_products && (
                        <span className="text-xs text-gray-500">
                          / {s.subscription.max_products}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setShowUsage(showUsage === s.id ? null : s.id)}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Voir
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openQuotaEditor(s.id)}
                        disabled={actionLoading !== null}
                        className="p-2 hover:bg-blue-100 rounded-lg transition disabled:opacity-50"
                        title="Modifier les quotas"
                      >
                        <Edit className="w-4 h-4 text-blue-600" />
                      </button>
                      
                      {s.status === 'active' ? (
                        <button
                          onClick={() => updateSellerStatus(s.id, 'suspended')}
                          disabled={actionLoading === s.id}
                          className="p-2 hover:bg-red-100 rounded-lg transition disabled:opacity-50"
                          title="Suspendre"
                        >
                          <Ban className="w-4 h-4 text-red-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSellerStatus(s.id, 'active')}
                          disabled={actionLoading === s.id}
                          className="p-2 hover:bg-green-100 rounded-lg transition disabled:opacity-50"
                          title="Activer"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredSellers.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Aucun vendeur trouvé</p>
            {(searchTerm || statusFilter !== 'all' || planFilter !== 'all') && (
              <p className="text-sm text-gray-500 mt-1">
                Essayez de modifier vos critères de recherche
              </p>
            )}
          </div>
        )}
      </div>

      {/* Usage Details */}
      {showUsage && (
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Détails d'utilisation - {sellers.find(s => s.id === showUsage)?.company_name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sellers.find(s => s.id === showUsage)?.subscription && (
              <>
                <QuotaBar
                  used={sellers.find(s => s.id === showUsage)?.usage?.optimizations_used || 0}
                  total={sellers.find(s => s.id === showUsage)?.subscription?.max_optimizations_monthly || 0}
                  label="Optimisations SEO"
                />
                <QuotaBar
                  used={sellers.find(s => s.id === showUsage)?.usage?.articles_used || 0}
                  total={sellers.find(s => s.id === showUsage)?.subscription?.max_articles_monthly || 0}
                  label="Articles Blog"
                />
                <QuotaBar
                  used={sellers.find(s => s.id === showUsage)?.usage?.chat_responses_used || 0}
                  total={sellers.find(s => s.id === showUsage)?.subscription?.max_chat_responses_monthly || 0}
                  label="Réponses Chat"
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* Quota Editor Modal */}
      {editingQuota && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Modifier les Quotas</h3>
              <button
                onClick={() => setEditingQuota(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                disabled={actionLoading === 'quota'}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Produits
                </label>
                <input
                  type="number"
                  value={quotaForm.max_products}
                  onChange={(e) => setQuotaForm({ ...quotaForm, max_products: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Optimisations SEO / Mois
                </label>
                <input
                  type="number"
                  value={quotaForm.max_optimizations_monthly}
                  onChange={(e) => setQuotaForm({ ...quotaForm, max_optimizations_monthly: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Articles Blog / Mois
                </label>
                <input
                  type="number"
                  value={quotaForm.max_articles_monthly}
                  onChange={(e) => setQuotaForm({ ...quotaForm, max_articles_monthly: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Réponses Chat / Mois
                </label>
                <input
                  type="number"
                  value={quotaForm.max_chat_responses_monthly}
                  onChange={(e) => setQuotaForm({ ...quotaForm, max_chat_responses_monthly: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingQuota(null)}
                disabled={actionLoading === 'quota'}
                className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={saveQuota}
                disabled={actionLoading === 'quota'}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {actionLoading === 'quota' ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {actionLoading === 'quota' ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}