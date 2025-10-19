import { useState, useEffect } from 'react';
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
  Crown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

interface SellerData {
  id: string;
  email: string;
  company_name: string;
  full_name: string;
  role: string;
  status: string;
  trial_ends_at: string | null;
  created_at: string;
  subscription: {
    plan_id: string;
    status: string;
    current_period_end: string;
  } | null;
  products_count: number;
}

interface DashboardStats {
  total_sellers: number;
  active_subscriptions: number;
  trial_users: number;
  total_products: number;
  monthly_revenue: number;
}

export function SuperAdminDashboard() {
  const { seller } = useAuth();
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (seller?.role === 'super_admin') {
      loadData();
    }
  }, [seller]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sellersData, subscriptionsData, productsData] = await Promise.all([
        supabase
          .from('sellers')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('subscriptions')
          .select('*'),

        supabase
          .from('shopify_products')
          .select('seller_id', { count: 'exact', head: true })
      ]);

      if (sellersData.data) {
        const enrichedSellers = await Promise.all(
          sellersData.data.map(async (s) => {
            const subscription = subscriptionsData.data?.find(
              (sub) => sub.seller_id === s.id && sub.status === 'active'
            ) || null;

            const { count } = await supabase
              .from('shopify_products')
              .select('id', { count: 'exact', head: true })
              .eq('seller_id', s.id);

            return {
              ...s,
              subscription,
              products_count: count || 0,
            };
          })
        );

        setSellers(enrichedSellers);

        const trialCount = enrichedSellers.filter((s) => s.status === 'trial').length;
        const activeSubsCount = subscriptionsData.data?.filter((s) => s.status === 'active').length || 0;

        setStats({
          total_sellers: enrichedSellers.length,
          active_subscriptions: activeSubsCount,
          trial_users: trialCount,
          total_products: productsData.count || 0,
          monthly_revenue: activeSubsCount * 79,
        });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSellerStatus = async (sellerId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sellers')
        .update({ status: newStatus })
        .eq('id', sellerId);

      if (error) throw error;
      await loadData();
    } catch (error) {
      console.error('Error updating seller status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const filteredSellers = sellers.filter((s) => {
    const matchesSearch =
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.company_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h2>
          <p className="text-gray-600">Vue d'ensemble de la plateforme</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
          <Download className="w-5 h-5" />
          Exporter
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Vendeurs</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_sellers}</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-green-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Abonnements</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.active_subscriptions}</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-yellow-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Essais</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.trial_users}</p>
          </div>

          <div className="bg-white rounded-xl border-2 border-purple-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Produits</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total_products}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium">MRR</span>
            </div>
            <p className="text-3xl font-bold">{stats.monthly_revenue}€</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par email ou entreprise..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

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
            </select>
          </div>
        </div>
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
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        s.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : s.status === 'trial'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {s.status === 'active' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : s.status === 'trial' ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <Ban className="w-3 h-3" />
                      )}
                      {s.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{s.products_count}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {new Date(s.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      {s.status === 'active' ? (
                        <button
                          onClick={() => updateSellerStatus(s.id, 'suspended')}
                          className="p-2 hover:bg-red-100 rounded-lg transition"
                        >
                          <Ban className="w-4 h-4 text-red-600" />
                        </button>
                      ) : (
                        <button
                          onClick={() => updateSellerStatus(s.id, 'active')}
                          className="p-2 hover:bg-green-100 rounded-lg transition"
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
            <p className="text-gray-600">Aucun vendeur trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}
