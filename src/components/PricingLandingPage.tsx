import { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  ShoppingBag,
  MessageCircle,
  FileText,
  BarChart3,
  Shield,
  Headphones
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_products: number;
  max_optimizations_monthly: number;
  max_articles_monthly: number;
  max_campaigns: number;
  max_chat_responses_monthly: number;
  features: Record<string, any>;
  stripe_price_id: string;
}

interface PricingLandingPageProps {
  onSignUp: (planId: string) => void;
  onLogin: () => void;
}

export function PricingLandingPage({ onSignUp, onLogin }: PricingLandingPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Sparkles className="w-8 h-8" />;
      case 'professional':
        return <Zap className="w-8 h-8" />;
      case 'enterprise':
        return <Crown className="w-8 h-8" />;
      default:
        return <ShoppingBag className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'from-blue-600 to-cyan-600';
      case 'professional':
        return 'from-purple-600 to-pink-600';
      case 'enterprise':
        return 'from-orange-600 to-red-600';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Illimité';
    return value.toLocaleString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-6">
              <ShoppingBag className="w-12 h-12 text-blue-400" />
              <h1 className="text-5xl font-bold text-white">Omnia AI</h1>
            </div>
            <p className="text-2xl text-blue-100 mb-4">
              Optimisez votre catalogue produits avec l'IA
            </p>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Enrichissement automatique, SEO intelligent, génération de contenu et bien plus encore.
              Transformez votre boutique en ligne en machine à vendre.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Enrichissement IA</h3>
              <p className="text-gray-300 text-sm">
                Descriptions optimisées, attributs extraits automatiquement
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Chat IA Produits</h3>
              <p className="text-gray-300 text-sm">
                Assistant intelligent pour trouver les produits parfaits
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Blog & SEO</h3>
              <p className="text-gray-300 text-sm">
                Articles de blog générés automatiquement pour booster votre SEO
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
              <p className="text-gray-300 text-sm">
                Tableaux de bord et insights pour suivre vos performances
              </p>
            </div>
          </div>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <button
              onClick={() => setSelectedBilling('monthly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedBilling === 'monthly'
                  ? 'bg-white text-gray-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setSelectedBilling('yearly')}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                selectedBilling === 'yearly'
                  ? 'bg-white text-gray-900'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Annuel
              <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                -20%
              </span>
            </button>
          </div>

          {/* Pricing Cards */}
          {loading ? (
            <div className="text-center text-white py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" />
              <p className="mt-4">Chargement des offres...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => {
                const price = selectedBilling === 'yearly'
                  ? (Number(plan.price_monthly) * 12 * 0.8).toFixed(2)
                  : Number(plan.price_monthly).toFixed(2);
                const pricePerMonth = selectedBilling === 'yearly'
                  ? (Number(price) / 12).toFixed(2)
                  : price;

                const isPopular = index === 1;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white/10 backdrop-blur-sm rounded-3xl p-8 border-2 transition-all hover:scale-105 ${
                      isPopular
                        ? 'border-purple-500 shadow-2xl shadow-purple-500/50'
                        : 'border-white/20'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                        ⭐ Plus Populaire
                      </div>
                    )}

                    <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(plan.id)} rounded-2xl flex items-center justify-center mb-6 text-white`}>
                      {getPlanIcon(plan.id)}
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-bold text-white">
                        {pricePerMonth}€
                      </span>
                      <span className="text-gray-300">/mois</span>
                    </div>

                    {selectedBilling === 'yearly' && (
                      <p className="text-sm text-green-400 mb-6">
                        Soit {price}€ facturé annuellement
                      </p>
                    )}

                    <button
                      onClick={() => onSignUp(plan.id)}
                      className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-8 ${
                        isPopular
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg'
                          : 'bg-white hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      Essai gratuit 14 jours
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {formatLimit(plan.max_products)}
                          </span>
                          <span className="text-gray-300"> produits</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {formatLimit(plan.max_optimizations_monthly)}
                          </span>
                          <span className="text-gray-300"> optimisations IA/mois</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {formatLimit(plan.max_articles_monthly)}
                          </span>
                          <span className="text-gray-300"> articles blog/mois</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {formatLimit(plan.max_chat_responses_monthly)}
                          </span>
                          <span className="text-gray-300"> réponses chat/mois</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="text-white font-semibold">
                            {formatLimit(plan.max_campaigns)}
                          </span>
                          <span className="text-gray-300"> campagnes actives</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/20 pt-6 space-y-3">
                      {plan.features.analytics && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <BarChart3 className="w-4 h-4" />
                          Analytics {plan.features.analytics}
                        </div>
                      )}
                      {plan.features.support && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Headphones className="w-4 h-4" />
                          Support {plan.features.support}
                        </div>
                      )}
                      {plan.features.api && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                          <Shield className="w-4 h-4" />
                          Accès API
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* CTA Section */}
          <div className="text-center bg-white/10 backdrop-blur-sm rounded-3xl p-12 border border-white/20">
            <h2 className="text-3xl font-bold text-white mb-4">
              Déjà client?
            </h2>
            <p className="text-gray-300 mb-6">
              Connectez-vous pour accéder à votre tableau de bord
            </p>
            <button
              onClick={onLogin}
              className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 rounded-xl font-semibold transition-all"
            >
              Se connecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
