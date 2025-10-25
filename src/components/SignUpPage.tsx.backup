import { useState, useEffect } from 'react';
import { ShoppingBag, Mail, Lock, Building, User, AlertCircle, ArrowLeft, CheckCircle, Package, Check, ArrowRight, CreditCard } from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabase';

interface SignUpPageProps {
  planId?: string;
  onLogin: () => void;
  onBack: () => void;
}

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  max_products: number;
  max_optimizations_monthly: number;
  max_articles_monthly: number;
  max_campaigns: number;
  max_chat_responses_monthly: number;
  features: Record<string, any>;
  stripe_price_id: string;
  stripe_price_id_yearly?: string;
}

export function SignUpPage({ planId: initialPlanId, onLogin, onBack }: SignUpPageProps) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || 'starter');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      setLoadingPlans(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async () => {
    setLoading(true);
    setError('');

    try {
      const { error, sellerId } = await signUp(email, password, companyName, fullName, selectedPlanId);

      if (error) {
        setError(error.message || 'Erreur lors de l\'inscription');
        setLoading(false);
        return;
      }

      if (sellerId) {
        const selectedPlan = plans.find(p => p.id === selectedPlanId);
        if (!selectedPlan) {
          setError('Plan non trouvé');
          setLoading(false);
          return;
        }

        console.log('Redirecting to Stripe checkout...');
        setSuccess(true);
      }
    } catch (err) {
      setError('Une erreur est survenue');
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedPrice = selectedPlan
    ? (billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)
    : 0;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Compte créé avec succès!
            </h2>

            <p className="text-gray-600 mb-6">
              Votre compte a été créé. Vous allez maintenant être redirigé vers le paiement sécurisé.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm">
                ✨ Essai gratuit de 14 jours inclus dans tous les forfaits!
              </p>
            </div>

            <button
              onClick={onLogin}
              className="w-full text-white py-4 rounded-xl font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/80 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour
        </button>

        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Omnia AI</h1>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2 text-center">Créer un compte</h2>
          <p className="text-gray-300 text-center mb-2">
            Essai gratuit de 14 jours
          </p>
          <p className="text-sm text-blue-300 text-center mb-8">
            Aucune carte bancaire requise
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Choisir un forfait
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedPlan === plan.id
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/20 bg-white/5 hover:border-white/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="w-4 h-4 text-blue-400" />
                      <span className="text-white font-semibold text-sm">{plan.name}</span>
                    </div>
                    <div className="text-gray-300 text-xs">{plan.price}</div>
                    <div className="text-gray-400 text-xs">{plan.products}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jean Dupont"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Nom de l'entreprise
              </label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ma Boutique"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Email professionnel
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Création du compte...
                </>
              ) : (
                'Commencer l\'essai gratuit'
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              En créant un compte, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
            </p>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Déjà un compte?{' '}
              <button
                onClick={onLogin}
                className="text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
