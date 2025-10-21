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
  Calendar
} from 'lucide-react';
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
  features: string[] | Record<string, any>;
  stripe_price_id?: string;
  stripe_price_id_yearly?: string;
  description: string;
  popular?: boolean;
  trial_days: number;
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      console.log('🔍 Chargement des forfaits depuis la base de données...');
      
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('❌ Erreur lors du chargement des forfaits:', error);
        throw error;
      }

      console.log('📦 Données reçues de la base de données:', data);

      if (data && data.length > 0) {
        // Formater les données pour correspondre à l'interface
        const formattedPlans = data.map(plan => {
          // Gestion sécurisée du parsing des features
          let features: Record<string, any> = {};
          try {
            if (typeof plan.features === 'string') {
              features = JSON.parse(plan.features);
            } else if (plan.features && typeof plan.features === 'object') {
              features = plan.features;
            }
          } catch (parseError) {
            console.warn(`❌ Erreur de parsing des features pour ${plan.name}:`, parseError);
            features = {};
          }

          return {
            id: plan.id,
            name: plan.name,
            price_monthly: typeof plan.price_monthly === 'string' ? parseFloat(plan.price_monthly) : plan.price_monthly,
            price_yearly: typeof plan.price_yearly === 'string' ? parseFloat(plan.price_yearly) : 
                         typeof plan.price_annual === 'string' ? parseFloat(plan.price_annual) : plan.price_yearly,
            max_products: plan.max_products,
            max_optimizations_monthly: plan.max_optimizations_monthly,
            max_articles_monthly: plan.max_articles_monthly,
            max_campaigns: plan.max_campaigns,
            max_chat_responses_monthly: plan.max_chat_responses_monthly,
            features: features,
            stripe_price_id: plan.stripe_price_id,
            stripe_price_id_yearly: plan.stripe_price_id_yearly,
            description: plan.description,
            popular: plan.id === 'professional',
            trial_days: plan.trial_days || 14
          };
        });

        console.log('✅ Forfaits formatés:', formattedPlans);

        // Filtrer les forfaits qui ont au moins un ID de prix Stripe
        const configuredPlans = formattedPlans.filter(plan => {
          const hasMonthly = plan.stripe_price_id && plan.stripe_price_id.startsWith('price_');
          const hasYearly = plan.stripe_price_id_yearly && plan.stripe_price_id_yearly.startsWith('price_');
          
          console.log(`🔍 Forfait ${plan.name}:`, {
            monthly: plan.stripe_price_id,
            yearly: plan.stripe_price_id_yearly,
            hasMonthly,
            hasYearly
          });
          
          return hasMonthly || hasYearly;
        });

        console.log('🎯 Forfaits configurés:', configuredPlans);

        if (configuredPlans.length === 0) {
          console.warn('⚠️ Aucun forfait n\'a d\'ID de prix Stripe configuré');
          setError('Les forfaits ne sont pas encore configurés. Veuillez réessayer plus tard ou contacter le support.');
          // Utiliser les forfaits par défaut en attendant
          setPlans(getDefaultPlans());
          setLoadingPlans(false);
          return;
        }

        setPlans(configuredPlans);
      } else {
        console.log('📋 Utilisation des forfaits par défaut');
        setPlans(getDefaultPlans());
      }
    } catch (error) {
      console.error('💥 Erreur critique lors du chargement des forfaits:', error);
      setPlans(getDefaultPlans());
      setError('Impossible de charger les forfaits. Utilisation des forfaits par défaut.');
    } finally {
      setLoadingPlans(false);
    }
  };

  const getDefaultPlans = (): Plan[] => [
    {
      id: 'starter',
      name: 'Starter Lite',
      price_monthly: 9.99,
      price_yearly: 99.00,
      max_products: 100,
      max_optimizations_monthly: 300,
      max_articles_monthly: 1,
      max_campaigns: 1,
      max_chat_responses_monthly: 200,
      features: {
        support: 'email',
        analytics: 'basic',
        billing_periods: ['monthly', 'annual']
      },
      description: 'Parfait pour débuter avec l\'IA',
      stripe_price_id: 'price_starter',
      stripe_price_id_yearly: 'price_starter_yearly',
      popular: false,
      trial_days: 14
    },
    {
      id: 'professional',
      name: 'Professional AI',
      price_monthly: 79.00,
      price_yearly: 790.00,
      max_products: 2000,
      max_optimizations_monthly: 5000,
      max_articles_monthly: 5,
      max_campaigns: 3,
      max_chat_responses_monthly: 5000,
      features: {
        api: true,
        support: 'priority',
        analytics: 'advanced',
        billing_periods: ['monthly', 'annual']
      },
      description: 'Solution complète pour professionnels',
      stripe_price_id: 'price_professional',
      stripe_price_id_yearly: 'price_professional_yearly',
      popular: true,
      trial_days: 14
    },
    {
      id: 'enterprise',
      name: 'Enterprise Commerce+',
      price_monthly: 199.00,
      price_yearly: 1990.00,
      max_products: -1,
      max_optimizations_monthly: -1,
      max_articles_monthly: -1,
      max_campaigns: -1,
      max_chat_responses_monthly: -1,
      features: {
        api: true,
        support: 'dedicated',
        analytics: 'enterprise',
        unlimited: true,
        whitelabel: true,
        billing_periods: ['monthly', 'annual']
      },
      description: 'Entreprise avec tout illimité',
      stripe_price_id: 'price_enterprise',
      stripe_price_id_yearly: 'price_enterprise_yearly',
      popular: false,
      trial_days: 14
    }
  ];

  const getFeaturesList = (plan: Plan): string[] => {
    // Si les features sont déjà un tableau, les retourner directement
    if (Array.isArray(plan.features)) {
      return plan.features;
    }

    const features: string[] = [];
    const featureObj = plan.features as Record<string, any>;

    // Features basées sur le type de forfait
    if (plan.id === 'starter') {
      features.push(`Jusqu'à ${plan.max_products} produits`);
      features.push(`${plan.max_optimizations_monthly} optimisations SEO/mois`);
      features.push(`${plan.max_articles_monthly} article de blog/mois`);
      features.push(`${plan.max_chat_responses_monthly} réponses chat/mois`);
      features.push('Support par email');
      features.push('Analytics basiques');
    } else if (plan.id === 'professional') {
      features.push(`Jusqu'à ${plan.max_products} produits`);
      features.push(`${plan.max_optimizations_monthly} optimisations SEO/mois`);
      features.push(`${plan.max_articles_monthly} articles de blog/mois`);
      features.push(`${plan.max_chat_responses_monthly} réponses chat/mois`);
      features.push('Support prioritaire');
      features.push('Analytics avancées');
      if (featureObj.api) features.push('API complète');
    } else if (plan.id === 'enterprise') {
      features.push('Produits illimités');
      features.push('Optimisations SEO illimitées');
      features.push('Articles de blog illimités');
      features.push('Réponses chat illimitées');
      features.push('Support dédié 24/7');
      features.push('Analytics enterprise');
      if (featureObj.api) features.push('API personnalisée');
      if (featureObj.whitelabel) features.push('Solution white-label');
    }

    // Ajouter les features supplémentaires depuis l'objet
    if (featureObj.support) {
      const supportMap: Record<string, string> = {
        'email': 'Support email',
        'priority': 'Support prioritaire',
        'dedicated': 'Support dédié 24/7'
      };
      if (supportMap[featureObj.support]) {
        features.push(supportMap[featureObj.support]);
      }
    }

    if (featureObj.analytics) {
      const analyticsMap: Record<string, string> = {
        'basic': 'Analytics basiques',
        'advanced': 'Analytics avancées',
        'enterprise': 'Analytics enterprise'
      };
      if (analyticsMap[featureObj.analytics]) {
        features.push(analyticsMap[featureObj.analytics]);
      }
    }

    return features;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !confirmPassword || !companyName || !fullName) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async () => {
    setLoading(true);
    setError('');

    try {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      if (!selectedPlan) {
        setError('Veuillez sélectionner un forfait valide');
        setLoading(false);
        return;
      }

      console.log('🚀 Début du processus d\'inscription:', {
        plan: selectedPlan.name,
        billing: billingCycle,
        planData: selectedPlan
      });

      // Utiliser stripe_price_id pour monthly et stripe_price_id_yearly pour yearly
      const priceIdToUse = billingCycle === 'yearly' 
        ? selectedPlan.stripe_price_id_yearly 
        : selectedPlan.stripe_price_id;

      if (!priceIdToUse || !priceIdToUse.startsWith('price_')) {
        const availablePlans = plans.filter(p => 
          (billingCycle === 'monthly' && p.stripe_price_id) || 
          (billingCycle === 'yearly' && p.stripe_price_id_yearly)
        );

        if (availablePlans.length > 0) {
          setError(
            `Le forfait "${selectedPlan.name}" n'est pas disponible pour la facturation ${billingCycle === 'monthly' ? 'mensuelle' : 'annuelle'}. ` +
            `Veuillez sélectionner un autre forfait parmi: ${availablePlans.map(p => p.name).join(', ')}`
          );
        } else {
          setError(
            `Aucun forfait n'est disponible pour la facturation ${billingCycle === 'monthly' ? 'mensuelle' : 'annuelle'}. ` +
            'Veuillez contacter le support.'
          );
        }
        setLoading(false);
        return;
      }

      console.log('✅ ID de prix Stripe à utiliser:', priceIdToUse);

      // 1. Create user account first
      const { error: signUpError } = await signUp(
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

      // 2. Get the session after signup
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Erreur d\'authentification après l\'inscription');
        setLoading(false);
        return;
      }

      console.log('🔑 Session obtenue, création du checkout Stripe...');

      // 3. Create Stripe Checkout session
      const response = await fetch('/api/functions/v1/create-stripe-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          billing_period: billingCycle,
          success_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/signup?checkout=cancelled`
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur Stripe - Response text:', errorText);
        let errorMessage = 'Erreur lors de la création de la session de paiement';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Réponse Stripe:', result);

      if (!result.success) {
        throw new Error(result.error || 'Échec de la création de la session de paiement');
      }

      if (!result.url) {
        throw new Error('URL de paiement non reçue');
      }

      // 4. Redirect to Stripe Checkout
      console.log('🔗 Redirection vers Stripe...');
      window.location.href = result.url;

    } catch (err) {
      console.error('💥 Erreur lors de l\'inscription:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
      setLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedPrice = selectedPlan
    ? (billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)
    : 0;

  const yearlySavings = selectedPlan ? Math.round((1 - (selectedPlan.price_yearly / (selectedPlan.price_monthly * 12))) * 100) : 0;

  // [Le JSX reste exactement le même que dans la version précédente]
  // Je garde le même JSX pour éviter la duplication

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

          {step === 2 && (
            <div className="space-y-8">
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