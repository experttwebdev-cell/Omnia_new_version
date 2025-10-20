// components/SellerProfile.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Building, Calendar, CreditCard, AlertTriangle } from 'lucide-react';

export default function SellerProfile() {
  const [seller, setSeller] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Récupérer les données du seller
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', user.id)
        .single();

      // Récupérer l'abonnement
      const { data: subscriptionData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('seller_id', user.id)
        .single();

      setSeller(sellerData);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Chargement...</div>;
  }

  if (!seller) {
    return <div className="p-4 text-center">Profil non trouvé</div>;
  }

  const isTrialActive = new Date(seller.trial_ends_at) > new Date();
  const daysLeft = Math.ceil((new Date(seller.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Bannière d'alerte essai */}
      {seller.status === 'trial' && isTrialActive && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-800">Essai gratuit actif</p>
              <p className="text-yellow-700 text-sm">
                {daysLeft} jour(s) restant(s) sur votre essai gratuit
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <h1 className="text-2xl font-bold">{seller.company_name}</h1>
          <p className="text-blue-100">{seller.plan_type} • {seller.billing_period}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Informations de contact */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations de contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{seller.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <p className="mt-1 text-gray-900">{seller.full_name}</p>
              </div>
            </div>
          </div>

          {/* Informations entreprise */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Informations entreprise
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
                <p className="mt-1 text-gray-900">{seller.company_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Statut</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  seller.status === 'active' ? 'bg-green-100 text-green-800' :
                  seller.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {seller.status}
                </span>
              </div>
            </div>
          </div>

          {/* Abonnement */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Abonnement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan</label>
                <p className="mt-1 text-gray-900 capitalize">{seller.plan_type}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Période de facturation</label>
                <p className="mt-1 text-gray-900 capitalize">{seller.billing_period}</p>
              </div>
              {subscription && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Statut abonnement</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                      subscription.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {subscription.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Période actuelle</label>
                    <p className="mt-1 text-gray-900 text-sm">
                      {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                      {new Date(subscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dates importantes */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Dates importantes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {seller.trial_ends_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fin de l'essai</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(seller.trial_ends_at).toLocaleDateString()}
                  </p>
                </div>
              )}
              {seller.current_period_end && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fin de la période</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(seller.current_period_end).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}