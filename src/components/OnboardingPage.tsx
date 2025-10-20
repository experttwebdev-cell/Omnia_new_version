import { useState } from 'react';
import { ShoppingBag, CheckCircle, ArrowRight, Store, Key, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

interface OnboardingPageProps {
  onComplete: () => void;
  onSkipToHome?: () => void;
}

export function OnboardingPage({ onComplete, onSkipToHome }: OnboardingPageProps) {
  const { seller } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [shopifyStore, setShopifyStore] = useState('');
  const [shopifyToken, setShopifyToken] = useState('');
  const [storeName, setStoreName] = useState('');

  const handleConnectShopify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!seller?.id) {
        throw new Error('Utilisateur non connecté');
      }

      // Valider le format du store
      let cleanStoreName = shopifyStore.trim().toLowerCase();
      if (cleanStoreName.includes('.myshopify.com')) {
        cleanStoreName = cleanStoreName.replace('.myshopify.com', '');
      }

      // Créer le store dans la base de données
      const { data, error: insertError } = await supabase
        .from('shopify_stores')
        .insert({
          seller_id: seller.id,
          store_name: storeName || cleanStoreName,
          store_url: `${cleanStoreName}.myshopify.com`,
          api_token: shopifyToken.trim(),
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('Store connected:', data);
      setStep(3);

    } catch (err) {
      console.error('Connection error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkipToHome) {
      onSkipToHome();
    } else {
      onComplete();
    }
  };

  const handleFinish = () => {
    onComplete();
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg transform hover:scale-105 transition-transform duration-300">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Bienvenue sur Omnia AI! 🎉
              </h1>
              <p className="text-xl text-gray-600">
                Votre abonnement est activé avec un essai gratuit de 14 jours
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border-2 border-blue-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 text-lg">
                Ce qui est inclus dans votre essai:
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3 group">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base">Enrichissement IA illimité pendant 14 jours</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base">Optimisation SEO automatique</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base">Assistant chat IA pour vos clients</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-base">Génération d'articles de blog</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
              >
                Connecter ma boutique Shopify
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleSkip}
                className="w-full py-4 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
              >
                Je ferai ça plus tard
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-6 font-medium">
              Aucun paiement pendant 14 jours • Annulation à tout moment
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Store className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Connectez votre boutique Shopify
              </h1>
              <p className="text-gray-600">
                Entrez vos informations Shopify pour commencer l'optimisation
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleConnectShopify} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de votre boutique (optionnel)
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ma Boutique"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domaine Shopify *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={shopifyStore}
                    onChange={(e) => setShopifyStore(e.target.value)}
                    placeholder="votre-boutique"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="flex items-center px-4 py-3 bg-gray-100 rounded-xl text-gray-600 font-medium">
                    .myshopify.com
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token d'accès API *
                </label>
                <input
                  type="password"
                  required
                  value={shopifyToken}
                  onChange={(e) => setShopifyToken(e.target.value)}
                  placeholder="shpat_..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-medium text-gray-900 mb-1">Comment obtenir votre token?</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Allez dans votre admin Shopify</li>
                      <li>Paramètres → Apps et canaux de vente</li>
                      <li>Développer des apps → Créer une app</li>
                      <li>Configurez les permissions nécessaires</li>
                      <li>Générez un token d'accès API</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Passer cette étape
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Connexion...' : 'Connecter'}
                  {!loading && <ArrowRight className="w-5 h-5" />}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Tout est prêt! 🚀
            </h1>

            <p className="text-xl text-gray-600 mb-8">
              Votre boutique Shopify est maintenant connectée
            </p>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8 border border-green-200">
              <h3 className="font-semibold text-gray-900 mb-3">Prochaines étapes:</h3>
              <ul className="space-y-2 text-left text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Importez vos produits depuis Shopify</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Lancez l'enrichissement IA automatique</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Optimisez votre SEO en un clic</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Activez le chat IA pour vos clients</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 mx-auto max-w-md"
            >
              Accéder au Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
