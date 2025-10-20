// components/SellerProfile.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  User, 
  Building, 
  Calendar, 
  CreditCard, 
  AlertTriangle, 
  Edit3,
  Save,
  X,
  Mail,
  Phone,
  Globe,
  Shield,
  Zap,
  TrendingUp,
  Package,
  Settings
} from 'lucide-react';

export default function SellerProfile() {
  const [seller, setSeller] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [formData, setFormData] = useState({
    company_name: '',
    full_name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'France'
  });

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
      
      // Pré-remplir le formulaire
      if (sellerData) {
        setFormData({
          company_name: sellerData.company_name || '',
          full_name: sellerData.full_name || '',
          email: sellerData.email || '',
          phone: sellerData.phone || '',
          website: sellerData.website || '',
          address: sellerData.address || '',
          city: sellerData.city || '',
          postal_code: sellerData.postal_code || '',
          country: sellerData.country || 'France'
        });
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('sellers')
        .update(formData)
        .eq('id', user.id);

      if (error) throw error;

      // Rafraîchir les données
      await fetchSellerData();
      setEditing(false);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      company_name: seller.company_name || '',
      full_name: seller.full_name || '',
      email: seller.email || '',
      phone: seller.phone || '',
      website: seller.website || '',
      address: seller.address || '',
      city: seller.city || '',
      postal_code: seller.postal_code || '',
      country: seller.country || 'France'
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profil non trouvé</h2>
          <p className="text-gray-600">Impossible de charger les informations de votre compte.</p>
        </div>
      </div>
    );
  }

  const isTrialActive = seller.trial_ends_at && new Date(seller.trial_ends_at) > new Date();
  const daysLeft = seller.trial_ends_at ? Math.ceil((new Date(seller.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'subscription', label: 'Abonnement', icon: CreditCard },
    { id: 'business', label: 'Entreprise', icon: Building },
  ];

  const planFeatures = {
    starter: ['100 produits max', 'Support email', 'Flux Google Shopping', 'Génération de contenu basique'],
    professional: ['Produits illimités', 'Support prioritaire', 'Flux multi-plateformes', 'Génération de contenu avancée', 'Analytics'],
    enterprise: ['Toutes fonctionnalités Pro', 'Support dédié 24/7', 'API personnalisée', 'Formation équipe', 'SLAs garantis']
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec stats */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold">{seller.company_name}</h1>
              <p className="text-blue-100 mt-2">
                Plan {seller.plan_type} • {seller.billing_period === 'monthly' ? 'Mensuel' : 'Annuel'}
              </p>
            </div>
            <div className="mt-4 lg:mt-0 flex items-center gap-4">
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier le profil
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bannière d'alerte essai */}
          {seller.status === 'trial' && isTrialActive && (
            <div className="mt-6 bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-300" />
                <div>
                  <p className="font-semibold text-yellow-100">Essai gratuit actif</p>
                  <p className="text-yellow-200 text-sm">
                    {daysLeft} jour(s) restant(s) sur votre essai gratuit. Passez à un plan payant pour continuer.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Onglet Profil */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informations personnelles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Votre nom complet"
                      />
                    ) : (
                      <p className="text-gray-900 text-lg font-medium">{seller.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <p className="text-gray-900">{seller.email}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="+33 6 12 34 56 78"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{seller.phone || 'Non renseigné'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site web
                    </label>
                    {editing ? (
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="https://votre-site.com"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">{seller.website || 'Non renseigné'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Adresse */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5 text-blue-600" />
                  Adresse de l'entreprise
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="123 Rue de la Paix"
                      />
                    ) : (
                      <p className="text-gray-900">{seller.address || 'Non renseignée'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ville
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Paris"
                      />
                    ) : (
                      <p className="text-gray-900">{seller.city || 'Non renseignée'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Code postal
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="75001"
                      />
                    ) : (
                      <p className="text-gray-900">{seller.postal_code || 'Non renseigné'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pays
                    </label>
                    {editing ? (
                      <select
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                        <option value="Canada">Canada</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{seller.country || 'France'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar avec statut et actions rapides */}
            <div className="space-y-6">
              {/* Statut du compte */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statut du compte</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Statut</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      seller.status === 'active' ? 'bg-green-100 text-green-800' :
                      seller.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {seller.status === 'active' ? 'Actif' : 
                       seller.status === 'trial' ? 'Essai' : 'Suspendu'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Membre depuis</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(seller.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions rapides */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition">
                    <Settings className="w-5 h-5 text-gray-400" />
                    <span>Paramètres du compte</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition">
                    <Shield className="w-5 h-5 text-gray-400" />
                    <span>Sécurité et mot de passe</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 text-left rounded-lg hover:bg-gray-50 transition">
                    <Package className="w-5 h-5 text-gray-400" />
                    <span>Gérer les produits</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Abonnement */}
        {activeTab === 'subscription' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Détails de l'abonnement */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Votre abonnement
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan actuel</label>
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-lg font-bold text-gray-900 capitalize">{seller.plan_type}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Période de facturation</label>
                    <p className="text-lg font-semibold text-gray-900 capitalize">
                      {seller.billing_period === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </p>
                  </div>

                  {subscription && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Statut de l'abonnement</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          subscription.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {subscription.status === 'active' ? 'Actif' : 
                           subscription.status === 'trial' ? 'Essai' : 'Inactif'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Période actuelle</label>
                        <p className="text-gray-900">
                          {new Date(subscription.current_period_start).toLocaleDateString()} - {' '}
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}

                  {seller.trial_ends_at && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fin de l'essai gratuit</label>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-900">
                          {new Date(seller.trial_ends_at).toLocaleDateString()} 
                          {isTrialActive && ` (${daysLeft} jour(s) restant(s))`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fonctionnalités du plan */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Fonctionnalités incluses
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(planFeatures[seller.plan_type] || planFeatures.starter).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions d'abonnement */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Gérer l'abonnement</h3>
                <div className="flex flex-wrap gap-3">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
                    Changer de plan
                  </button>
                  <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition">
                    Mettre à jour le paiement
                  </button>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition">
                    Suspendre l'abonnement
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar - Comparaison des plans */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Votre plan actuel</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {seller.plan_type === 'starter' && '29€'}
                    {seller.plan_type === 'professional' && '79€'}
                    {seller.plan_type === 'enterprise' && '199€'}
                  </div>
                  <p className="text-gray-600">
                    {seller.billing_period === 'monthly' ? 'par mois' : 'par an'}
                  </p>
                  {seller.billing_period === 'yearly' && (
                    <p className="text-green-600 text-sm mt-1">Économisez 20%</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Besoin de plus ?</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Passez à un plan supérieur pour débloquer plus de fonctionnalités.
                </p>
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-lg font-semibold transition">
                  Voir les plans supérieurs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Entreprise */}
        {activeTab === 'business' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              Informations de l'entreprise
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="Nom de votre entreprise"
                  />
                ) : (
                  <p className="text-gray-900 text-lg font-medium">{seller.company_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numéro SIRET
                </label>
                <p className="text-gray-900">{seller.siret || 'Non renseigné'}</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description de l'entreprise
                </label>
                <p className="text-gray-900">{seller.description || 'Aucune description'}</p>
              </div>
            </div>

            {/* Statistiques de l'entreprise */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Produits</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Commandes</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">0€</div>
                <div className="text-sm text-gray-600">Chiffre d'affaires</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Articles de blog</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}