import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Mail, 
  Lock, 
  Building, 
  User, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle, 
  Package, 
  Check, 
  ArrowRight, 
  CreditCard,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  Zap,
  Calendar,
  Users,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabase';
import { getEnvVar } from '../lib/supabase';

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
  features: string[] | Record<string, any>;
  stripe_price_id: string;
  stripe_price_id_yearly?: string;
  description: string;
  popular?: boolean;
}

// Helper function to convert features to display format
const getFeaturesList = (plan: Plan): string[] => {
  if (Array.isArray(plan.features)) {
    return plan.features;
  }

  // Convert database JSONB features to readable strings
  const features: string[] = [];

  if (plan.id === 'starter') {
    features.push(`Jusqu'à ${plan.max_products} produits`);
    features.push(`${plan.max_optimizations_monthly} optimisations SEO/mois`);
    features.push(`${plan.max_articles_monthly} article de blog/mois`);
    features.push(`${plan.max_chat_responses_monthly} réponses chat/mois`);
    features.push('Support par email');
  } else if (plan.id === 'professional') {
    features.push(`Jusqu'à ${plan.max_products} produits`);
    features.push(`${plan.max_optimizations_monthly} optimisations SEO/mois`);
    features.push(`${plan.max_articles_monthly} articles de blog/mois`);
    features.push(`${plan.max_chat_responses_monthly} réponses chat/mois`);
    features.push('Support prioritaire');
    features.push('Analytics avancées');
    features.push('API complète');
  } else if (plan.id === 'enterprise') {
    features.push('Produits illimités');
    features.push('Optimisations SEO illimitées');
    features.push('Articles de blog illimités');
    features.push('Réponses chat illimitées');
    features.push('Support dédié 24/7');
    features.push('Analytics enterprise');
    features.push('API personnalisée');
    features.push('White label');
  }

  return features;
};

export function SignUpPage({ planId: initialPlanId, onLogin, onBack }: SignUpPageProps) {
  const { signUp } = useAuth();
  const [step, setStep] = useState(1);

  // Debug: log whenever step changes
  useEffect(() => {
    console.log('Current step:', step);
  }, [step]);
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

      // Use database data if available, otherwise fallback to defaults
      if (data && data.length > 0) {
        // Mark the professional plan as popular
        const plansWithPopular = data.map(plan => ({
          ...plan,
          popular: plan.id === 'professional'
        }));
        setPlans(plansWithPopular);
        setLoadingPlans(false);
        return;
      }

      // Fallback to default plans if database is empty
      const defaultPlans: Plan[] = [
        {
          id: 'starter',
          name: 'Starter',
          price_monthly: 29,
          price_yearly: 278,
          max_products: 100,
          max_optimizations_monthly: 50,
          max_articles_monthly: 10,
          max_campaigns: 3,
          max_chat_responses_monthly: 1000,
          features: [
            '100 produits maximum',
            '50 optimisations SEO/mois',
            '10 articles de blog/mois',
            '3 campagnes marketing',
            '1000 réponses chat/mois',
            'Support email'
          ],
          stripe_price_id: '',
          description: 'Parfait pour commencer'
        },
        {
          id: 'professional',
          name: 'Professional',
          price_monthly: 79,
          price_yearly: 758,
          max_products: 500,
          max_optimizations_monthly: 200,
          max_articles_monthly: 50,
          max_campaigns: 10,
          max_chat_responses_monthly: 5000,
          features: [
            '500 produits maximum',
            '200 optimisations SEO/mois',
            '50 articles de blog/mois',
            '10 campagnes marketing',
            '5000 réponses chat/mois',
            'Support prioritaire',
            'Analytics avancées'
          ],
          stripe_price_id: '',
          popular: true,
          description: 'Recommandé pour les entreprises'
        },
        {
          id: 'enterprise',
          name: 'Enterprise',
          price_monthly: 199,
          price_yearly: 1910,
          max_products: -1, // Illimité
          max_optimizations_monthly: -1,
          max_articles_monthly: -1,
          max_campaigns: -1,
          max_chat_responses_monthly: -1,
          features: [
            'Produits illimités',
            'Optimisations SEO illimitées',
            'Articles de blog illimités',
            'Campagnes marketing illimitées',
            'Réponses chat illimitées',
            'Support dédié 24/7',
            'API personnalisée',
            'Formation équipe'
          ],
          stripe_price_id: '',
          description: 'Solution complète pour les grandes entreprises'
        }
      ];

      setPlans(defaultPlans);
    } catch (error) {
      console.error('Error loading plans:', error);
      // Plans par défaut en cas d'erreur
      setPlans([
        {
          id: 'starter',
          name: 'Starter',
          price_monthly: 29,
          price_yearly: 278,
          max_products: 100,
          max_optimizations_monthly: 50,
          max_articles_monthly: 10,
          max_campaigns: 3,
          max_chat_responses_monthly: 1000,
          features: ['100 produits', '50 optimisations/mois', '10 articles/mois', 'Support email'],
          stripe_price_id: '',
          description: 'Parfait pour commencer'
        },
        {
          id: 'professional',
          name: 'Professional',
          price_monthly: 79,
          price_yearly: 758,
          max_products: 500,
          max_optimizations_monthly: 200,
          max_articles_monthly: 50,
          max_campaigns: 10,
          max_chat_responses_monthly: 5000,
          features: ['500 produits', '200 optimisations/mois', '50 articles/mois', 'Support prioritaire'],
          stripe_price_id: '',
          popular: true,
          description: 'Recommandé pour les entreprises'
        }
      ]);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    console.log('Step 1 form submitted', { email, password, confirmPassword, companyName, fullName });

    // Validation
    if (!email || !password || !confirmPassword || !companyName || !fullName) {
      console.log('Validation failed: missing fields');
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      console.log('Validation failed: invalid email');
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (password.length < 6) {
      console.log('Validation failed: password too short');
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      console.log('Validation failed: passwords do not match');
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    console.log('Validation passed, moving to step 2');
    setStep(2);
  };

  const handleStep2Submit = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Créer le compte utilisateur avec le plan et cycle de facturation sélectionnés
      const { error: signUpError, sellerId } = await signUp(
        email,
        password,
        companyName,
        fullName,
        selectedPlanId,
        billingCycle
      );

      if (signUpError) {
        setError(signUpError.message || 'Erreur lors de la création du compte');
        setLoading(false);
        return;
      }

      if (!sellerId) {
        setError('Erreur lors de la création du vendeur');
        setLoading(false);
        return;
      }

      // 2. Créer une session Stripe Checkout
      const { data: { session }, error: authError } = await supabase.auth.getSession();

      if (authError || !session) {
        setError('Erreur d\'authentification');
        setLoading(false);
        return;
      }

      const supabaseUrl = getEnvVar('SUPABASE_URL');
      const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

      console.log('Creating Stripe checkout session...', {
        plan_id: selectedPlanId,
        billing_period: billingCycle
      });

      const checkoutResponse = await fetch(`${supabaseUrl}/functions/v1/create-stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseAnonKey
        },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          billing_period: billingCycle,
          success_url: `${window.location.origin}/#dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/#signup?checkout=cancelled`
        })
      });

      console.log('Checkout response status:', checkoutResponse.status);

      if (!checkoutResponse.ok) {
        let errorMessage = 'Erreur lors de la création de la session de paiement';
        try {
          const errorData = await checkoutResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Erreur HTTP ${checkoutResponse.status}: ${checkoutResponse.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let checkoutData;
      try {
        checkoutData = await checkoutResponse.json();
      } catch (e) {
        throw new Error('Réponse invalide du serveur de paiement');
      }

      if (!checkoutData.url) {
        throw new Error('URL de paiement non reçue');
      }

      // 3. Rediriger vers Stripe Checkout
      console.log('Redirecting to Stripe Checkout:', checkoutData.url);
      window.location.href = checkoutData.url;

    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedPrice = selectedPlan
    ? (billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)
    : 0;

  const yearlySavings = selectedPlan ? Math.round((1 - (selectedPlan.price_yearly / (selectedPlan.price_monthly * 12))) * 100) : 0;

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenue sur Omnia AI!
            </h2>

            <p className="text-gray-600 mb-6">
              Votre essai gratuit de 14 jours commence maintenant. Redirection vers votre tableau de bord...
            </p>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-800 text-lg font-semibold mb-3">
                <Sparkles className="w-5 h-5" />
                <span>Essai gratuit de 14 jours</span>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Aucune carte bancaire requise. Explorez toutes les fonctionnalités gratuitement!
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
              <div className="space-y-2 text-sm text-gray-700">
                <p><strong>Forfait sélectionné:</strong> {selectedPlan?.name}</p>
                <p><strong>Facturation future:</strong> {billingCycle === 'monthly' ? 'Mensuelle' : 'Annuelle'}</p>
                <p className="text-xs text-gray-500 mt-2">
                  Après l'essai: {selectedPrice}€{billingCycle === 'yearly' ? '/an' : '/mois'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <button
          onClick={step === 1 ? onBack : () => setStep(1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-all duration-200 hover:gap-3 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Retour</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 shadow-lg">
                  <ShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Omnia AI
                </h1>
                <p className="text-xs text-gray-500">E-commerce intelligent</p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 1 ? 'Commencer votre essai gratuit' : 'Choisissez votre forfait'}
            </h2>
            <p className="text-gray-600">
              {step === 1 ? 'Créez votre compte en 2 minutes' : '14 jours d\'essai gratuit, sans carte bancaire'}
            </p>
          </div>

          {/* Étapes de progression */}
          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step === 1 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110 shadow-lg' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                1
              </div>
              <span className={`font-medium ${step === 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                Informations
              </span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded-full" />
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                step === 2 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110 shadow-lg' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                2
              </div>
              <span className={`font-medium ${step === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                Forfait
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Étape 1: Informations de base */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom de l'entreprise <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="Ma Boutique"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email professionnel <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="votre@entreprise.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full pl-11 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 text-sm">Inscription sécurisée</p>
                  <p className="text-blue-700 text-xs">Vos données sont protégées et ne seront jamais partagées</p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
              >
                <span>Continuer vers le choix du forfait</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}

          {/* Étape 2: Choix du forfait */}
          {step === 2 && (
            <div className="space-y-8">
              {/* Sélecteur de cycle de facturation */}
              <div className="flex justify-center">
                <div className="bg-gray-100 rounded-xl p-1 flex">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      billingCycle === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Mensuel
                  </button>
                  <button
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-6 py-3 rounded-lg font-semibold transition ${
                      billingCycle === 'yearly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Annuel <span className="text-green-500 ml-1">-{yearlySavings}%</span>
                  </button>
                </div>
              </div>

              {/* Grille des forfaits */}
              {loadingPlans ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative bg-white rounded-2xl border-2 transition-all cursor-pointer hover:scale-105 ${
                        selectedPlanId === plan.id
                          ? 'border-blue-500 shadow-xl'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${plan.popular ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                      onClick={() => setSelectedPlanId(plan.id)}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                            POPULAIRE
                          </span>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Package className={`w-6 h-6 ${
                            plan.id === 'starter' ? 'text-blue-600' :
                            plan.id === 'professional' ? 'text-purple-600' :
                            'text-pink-600'
                          }`} />
                          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        </div>

                        <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">
                            {billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly}€
                          </span>
                          <span className="text-gray-600">
                            {billingCycle === 'yearly' ? '/an' : '/mois'}
                          </span>
                          {billingCycle === 'yearly' && (
                            <p className="text-green-600 text-sm mt-1">
                              Soit {(plan.price_yearly / 12).toFixed(0)}€/mois
                            </p>
                          )}
                        </div>

                        <div className="space-y-2 mb-6">
                          {getFeaturesList(plan).slice(0, 4).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{feature}</span>
                            </div>
                          ))}
                          {getFeaturesList(plan).length > 4 && (
                            <p className="text-sm text-blue-600 font-medium">
                              +{getFeaturesList(plan).length - 4} fonctionnalités
                            </p>
                          )}
                        </div>

                        <div className={`w-full py-3 rounded-lg text-center font-semibold transition ${
                          selectedPlanId === plan.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {selectedPlanId === plan.id ? 'Sélectionné' : 'Choisir'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Récapitulatif et actions */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-2">Récapitulatif</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Forfait:</strong> {selectedPlan?.name}</p>
                      <p><strong>Facturation:</strong> {billingCycle === 'monthly' ? 'Mensuelle' : 'Annuelle'}</p>
                      <p><strong>Prix:</strong> {selectedPrice}€{billingCycle === 'yearly' ? '/an' : '/mois'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">14 jours d'essai gratuit</span>
                    </div>
                    <button
                      onClick={handleStep2Submit}
                      disabled={loading}
                      className="w-full md:w-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Redirection vers Stripe...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span>Commencer l'essai gratuit</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Sécurité et garanties */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Paiement sécurisé</p>
                  <p className="text-sm text-gray-600">Cryptage SSL 256-bit</p>
                </div>
                <div className="p-4">
                  <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Sans engagement</p>
                  <p className="text-sm text-gray-600">Annulation à tout moment</p>
                </div>
                <div className="p-4">
                  <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-900">Support 7j/7</p>
                  <p className="text-sm text-gray-600">Équipe dédiée</p>
                </div>
              </div>
            </div>
          )}

          {/* Lien de connexion */}
          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Déjà un compte?{' '}
              <button
                onClick={onLogin}
                className="text-blue-600 hover:text-blue-700 font-semibold transition"
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