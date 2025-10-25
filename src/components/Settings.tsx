import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, RefreshCw, Globe, Activity, MessageSquare, User, Mail, Building, Calendar, CreditCard, TrendingUp, Check, X } from 'lucide-react';
import { Language } from '../lib/translations';
import { LoadingAnimation } from './LoadingAnimation';
import { useLanguage } from '../App';
import { useAuth } from '../lib/authContext';
import { ConnectionDiagnostics } from './ConnectionDiagnostics';
import { AiProviderConfig } from './AiProviderConfig';

interface SettingsData {
  enrichment_mode: 'manual' | 'auto';
  enrichment_frequency: 'on_import' | 'daily' | 'weekly' | 'manual';
  chat_welcome_message: string;
  chat_tone: 'professional' | 'friendly' | 'enthusiastic' | 'casual';
  chat_response_length: 'concise' | 'balanced' | 'detailed';
  chat_enabled: boolean;
}

interface UserProfile {
  full_name: string;
  company_name: string;
  email: string;
}

export function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const { seller, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'chat' | 'diagnostics' | 'ai' | 'subscription'>('profile');
  const [settings, setSettings] = useState<SettingsData>({
    enrichment_mode: 'manual',
    enrichment_frequency: 'manual',
    chat_welcome_message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    chat_tone: 'friendly',
    chat_response_length: 'balanced',
    chat_enabled: true
  });
  const [profile, setProfile] = useState<UserProfile>({
    full_name: '',
    company_name: '',
    email: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      if (!seller) return;

      setProfile({
        full_name: seller.full_name || '',
        company_name: seller.company_name || '',
        email: seller.email || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('enrichment_mode, enrichment_frequency, chat_welcome_message, chat_tone, chat_response_length, chat_enabled')
        .limit(1)
        .maybeSingle();

      if (stores) {
        setSettings({
          enrichment_mode: stores.enrichment_mode as 'manual' | 'auto',
          enrichment_frequency: stores.enrichment_frequency as 'on_import' | 'daily' | 'weekly' | 'manual',
          chat_welcome_message: stores.chat_welcome_message || 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
          chat_tone: (stores.chat_tone as 'professional' | 'friendly' | 'enthusiastic' | 'casual') || 'friendly',
          chat_response_length: (stores.chat_response_length as 'concise' | 'balanced' | 'detailed') || 'balanced',
          chat_enabled: stores.chat_enabled ?? true
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setMessage('');

      const { error } = await supabase
        .from('sellers')
        .update({
          full_name: profile.full_name,
          company_name: profile.company_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', seller?.id);

      if (error) throw error;

      setMessage('Profil mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setMessage('');

      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        setMessage('Aucun magasin trouvé. Veuillez d\'abord connecter un magasin Shopify.');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('shopify_stores')
        .update({
          enrichment_mode: settings.enrichment_mode,
          enrichment_frequency: settings.enrichment_frequency,
          chat_welcome_message: settings.chat_welcome_message,
          chat_tone: settings.chat_tone,
          chat_response_length: settings.chat_response_length,
          chat_enabled: settings.chat_enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', stores[0].id);

      if (error) throw error;

      setMessage('Paramètres sauvegardés avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            Paramètres
          </h1>
          <p className="text-gray-600 mt-2">Gérez votre profil et vos préférences</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('succès') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4 inline-block mr-2" />
              Mon Profil
            </button>
            <button
              onClick={() => setActiveTab('store')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'store'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-4 h-4 inline-block mr-2" />
              Magasin
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline-block mr-2" />
              Chat IA
            </button>
            <button
              onClick={() => setActiveTab('subscription')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subscription'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4 inline-block mr-2" />
              Abonnement
            </button>
            {seller?.role === 'superadmin' && (
              <>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'ai'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 inline-block mr-2" />
                  Fournisseurs IA
                </button>
                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'diagnostics'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 inline-block mr-2" />
                  Diagnostics
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Informations du Profil</h2>
                <p className="text-gray-600 mb-6">Gérez vos informations personnelles et votre compte</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nom Complet
                  </label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    Nom de l'Entreprise
                  </label>
                  <input
                    type="text"
                    value={profile.company_name}
                    onChange={(e) => setProfile({ ...profile, company_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mon E-Commerce"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Membre depuis
                  </label>
                  <input
                    type="text"
                    value={seller?.created_at ? new Date(seller.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Informations du Compte</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p><strong>Statut:</strong> <span className={`px-2 py-1 rounded-full text-xs ${seller?.status === 'trial' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>{seller?.status === 'trial' ? 'Essai Gratuit' : 'Actif'}</span></p>
                    {seller?.trial_ends_at && seller?.status === 'trial' && (
                      <p><strong>Trial se termine le:</strong> {new Date(seller.trial_ends_at).toLocaleDateString('fr-FR')}</p>
                    )}
                    <p><strong>Rôle:</strong> {seller?.role === 'superadmin' ? 'Super Administrateur' : 'Vendeur'}</p>
                  </div>
                </div>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Sauvegarder le Profil
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'store' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Paramètres du Magasin</h2>
                <p className="text-gray-600">Configuration de l'enrichissement automatique</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mode d'enrichissement
                </label>
                <select
                  value={settings.enrichment_mode}
                  onChange={(e) => setSettings({ ...settings, enrichment_mode: e.target.value as 'manual' | 'auto' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manuel</option>
                  <option value="auto">Automatique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence d'enrichissement
                </label>
                <select
                  value={settings.enrichment_frequency}
                  onChange={(e) => setSettings({ ...settings, enrichment_frequency: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Manuel uniquement</option>
                  <option value="on_import">À l'importation</option>
                  <option value="daily">Quotidien</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Langue
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Configuration du Chat IA</h2>
                <p className="text-gray-600">Personnalisez le comportement de votre assistant IA</p>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    checked={settings.chat_enabled}
                    onChange={(e) => setSettings({ ...settings, chat_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Activer le chat IA</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message de bienvenue
                </label>
                <textarea
                  value={settings.chat_welcome_message}
                  onChange={(e) => setSettings({ ...settings, chat_welcome_message: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ton des réponses
                </label>
                <select
                  value={settings.chat_tone}
                  onChange={(e) => setSettings({ ...settings, chat_tone: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="professional">Professionnel</option>
                  <option value="friendly">Amical</option>
                  <option value="enthusiastic">Enthousiaste</option>
                  <option value="casual">Décontracté</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur des réponses
                </label>
                <select
                  value={settings.chat_response_length}
                  onChange={(e) => setSettings({ ...settings, chat_response_length: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="concise">Concis</option>
                  <option value="balanced">Équilibré</option>
                  <option value="detailed">Détaillé</option>
                </select>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Sauvegarder
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'subscription' && (
            <SubscriptionManagement seller={seller} />
          )}

          {activeTab === 'ai' && (
            <AiProviderConfig />
          )}

          {activeTab === 'diagnostics' && (
            <ConnectionDiagnostics />
          )}
        </div>
      </div>
    </div>
  );
}

function SubscriptionManagement({ seller }: { seller: any }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [seller]);

  const fetchData = async () => {
    try {
      const [plansResult, subResult, usageResult] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('price_monthly'),
        supabase
          .from('subscriptions')
          .select('*, subscription_plans(*)')
          .eq('seller_id', seller?.id)
          .in('status', ['active', 'trial'])
          .maybeSingle(),
        supabase
          .from('subscription_usage')
          .select('*')
          .eq('seller_id', seller?.id)
          .maybeSingle()
      ]);

      if (plansResult.data) setPlans(plansResult.data);
      if (subResult.data) setCurrentSubscription(subResult.data);
      if (usageResult.data) setUsage(usageResult.data);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingAnimation type="data" message="Chargement..." />;
  }

  const currentPlan = currentSubscription?.subscription_plans;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion de l'abonnement</h2>
        <p className="text-gray-600">Gérez votre plan et votre facturation</p>
      </div>

      {currentSubscription && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Plan Actuel</h3>
              <p className="text-2xl font-bold text-blue-600 mb-2">{currentPlan?.name}</p>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl font-bold text-gray-800">
                  €{currentSubscription.billing_period === 'annual' ? currentPlan?.price_annual : currentPlan?.price_monthly}
                </span>
                <span className="text-gray-600">/ {currentSubscription.billing_period === 'annual' ? 'an' : 'mois'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  currentSubscription.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentSubscription.status === 'active' ? 'Actif' : 'Essai'}
                </span>
                {currentSubscription.billing_period === 'annual' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Économie de 2 mois
                  </span>
                )}
              </div>
            </div>
            <TrendingUp className="w-12 h-12 text-blue-500" />
          </div>
          {seller?.trial_ends_at && seller?.status === 'trial' && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <p className="text-sm text-gray-600">
                <Calendar className="w-4 h-4 inline mr-1" />
                Période d'essai jusqu'au: {new Date(seller.trial_ends_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Usage & Limits Table */}
      {currentPlan && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Limites et Consommation</h3>
            <p className="text-sm text-gray-600 mt-1">Suivez votre utilisation par rapport aux limites de votre plan</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ressource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Limite
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisé
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponible
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Products */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Produits
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.products_limit === -1 ? 'Illimité' : currentPlan.products_limit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usage?.products_count || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.products_limit === -1 ? 'Illimité' : Math.max(0, currentPlan.products_limit - (usage?.products_count || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentPlan.products_limit === -1 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Illimité</span>
                    ) : (usage?.products_count || 0) / currentPlan.products_limit > 0.9 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critique</span>
                    ) : (usage?.products_count || 0) / currentPlan.products_limit > 0.7 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Attention</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">OK</span>
                    )}
                  </td>
                </tr>
                {/* AI Enrichments */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    AI Enrichissements
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.ai_enrichments_limit === -1 ? 'Illimité' : `${currentPlan.ai_enrichments_limit}/mois`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usage?.ai_enrichments_used || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.ai_enrichments_limit === -1 ? 'Illimité' : Math.max(0, currentPlan.ai_enrichments_limit - (usage?.ai_enrichments_used || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentPlan.ai_enrichments_limit === -1 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Illimité</span>
                    ) : (usage?.ai_enrichments_used || 0) / currentPlan.ai_enrichments_limit > 0.9 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critique</span>
                    ) : (usage?.ai_enrichments_used || 0) / currentPlan.ai_enrichments_limit > 0.7 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Attention</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">OK</span>
                    )}
                  </td>
                </tr>
                {/* Blog Articles */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Articles Blog
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.blog_articles_limit === -1 ? 'Illimité' : `${currentPlan.blog_articles_limit}/mois`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usage?.blog_articles_used || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.blog_articles_limit === -1 ? 'Illimité' : Math.max(0, currentPlan.blog_articles_limit - (usage?.blog_articles_used || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentPlan.blog_articles_limit === -1 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Illimité</span>
                    ) : (usage?.blog_articles_used || 0) / currentPlan.blog_articles_limit > 0.9 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critique</span>
                    ) : (usage?.blog_articles_used || 0) / currentPlan.blog_articles_limit > 0.7 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Attention</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">OK</span>
                    )}
                  </td>
                </tr>
                {/* Chat Messages */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Messages Chat
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.chat_messages_limit === -1 ? 'Illimité' : `${currentPlan.chat_messages_limit}/mois`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usage?.chat_messages_used || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.chat_messages_limit === -1 ? 'Illimité' : Math.max(0, currentPlan.chat_messages_limit - (usage?.chat_messages_used || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentPlan.chat_messages_limit === -1 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Illimité</span>
                    ) : (usage?.chat_messages_used || 0) / currentPlan.chat_messages_limit > 0.9 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critique</span>
                    ) : (usage?.chat_messages_used || 0) / currentPlan.chat_messages_limit > 0.7 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Attention</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">OK</span>
                    )}
                  </td>
                </tr>
                {/* SEO Optimizations */}
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Optimisations SEO
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.seo_optimizations_limit === -1 ? 'Illimité' : `${currentPlan.seo_optimizations_limit}/mois`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {usage?.seo_optimizations_used || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {currentPlan.seo_optimizations_limit === -1 ? 'Illimité' : Math.max(0, currentPlan.seo_optimizations_limit - (usage?.seo_optimizations_used || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentPlan.seo_optimizations_limit === -1 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Illimité</span>
                    ) : (usage?.seo_optimizations_used || 0) / currentPlan.seo_optimizations_limit > 0.9 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Critique</span>
                    ) : (usage?.seo_optimizations_used || 0) / currentPlan.seo_optimizations_limit > 0.7 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Attention</span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">OK</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Les limites mensuelles se réinitialisent au début de chaque période de facturation.
            </p>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Plans Disponibles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan?.id === plan.id;
            const isDowngrade = currentPlan && plan.price_monthly < currentPlan.price_monthly;
            const isUpgrade = currentPlan && plan.price_monthly > currentPlan.price_monthly;

            return (
              <div
                key={plan.id}
                className={`rounded-lg border-2 p-6 ${
                  isCurrentPlan
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                } transition-all`}
              >
                <h4 className="text-xl font-bold text-gray-800 mb-2">{plan.name}</h4>
                <div className="mb-4">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">€{plan.price_monthly}</span>
                    <span className="text-gray-600">/mois</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    ou €{plan.price_annual}/an
                    <span className="block text-green-600 font-medium">Économisez 2 mois!</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 text-sm text-gray-700">
                  {plan.name === 'Starter Lite' && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Jusqu'à 100 produits</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Support par email</span>
                      </li>
                    </>
                  )}
                  {plan.name === 'Professional AI' && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Produits illimités</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>IA avancée + Chat</span>
                      </li>
                    </>
                  )}
                  {plan.name === 'Enterprise Commerce+' && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Tout de Professional +</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>Multi-boutiques</span>
                      </li>
                    </>
                  )}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                  >
                    Plan Actuel
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => alert('Upgrade vers ' + plan.name + '\n\nContactez le support ou utilisez Stripe pour mettre à niveau votre plan.')}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition shadow-lg"
                  >
                    Passer à ce plan
                  </button>
                ) : isDowngrade ? (
                  <button
                    onClick={() => alert('Downgrade vers ' + plan.name + '\n\nContactez le support pour rétrograder votre plan.')}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition border border-gray-300"
                  >
                    Rétrograder
                  </button>
                ) : (
                  <button
                    onClick={() => alert('Souscrire à ' + plan.name + '\n\nUtilisez la page de paiement Stripe pour souscrire.')}
                    className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white rounded-lg font-medium transition shadow-lg"
                  >
                    Choisir ce plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">💳 Paiement via Stripe</h4>
        <p className="text-sm text-yellow-800 mb-3">
          Pour mettre à jour votre abonnement ou changer votre mode de facturation (mensuel/annuel),
          vous serez redirigé vers notre page de paiement sécurisée Stripe.
        </p>
        <p className="text-sm text-yellow-800">
          Les changements de plan prennent effet immédiatement et sont calculés au prorata.
        </p>
      </div>
    </div>
  );
}
