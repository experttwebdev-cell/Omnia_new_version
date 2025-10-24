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
  Star,
  Crown,
  Rocket,
  TrendingUp,
  Target,
  BarChart3,
  Headphones,
  Globe,
  FileText,
  MessageCircle,
  Search,
  Image,
  Lightbulb,
  Users,
  Database,
  Server,
  HelpCircle,
  Play,
  Award,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { supabase } from '../lib/supabase';

interface SignUpPageProps {
  planId?: string;
  onLogin: () => void;
  onBack: () => void;
  onSignupSuccess?: () => void;
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
  stripe_price_id?: string;
  stripe_price_id_yearly?: string;
  description: string;
  popular?: boolean;
  best_value?: boolean;
  recommended?: boolean;
  trial_days: number;
}

export function SignUpPage({ planId: initialPlanId, onLogin, onBack, onSignupSuccess }: SignUpPageProps) {
  const { signUp, user } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId || 'professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPlanComparison, setShowPlanComparison] = useState(false);
  const [activeFeatureTab, setActiveFeatureTab] = useState('all');
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // URL de base pour les Edge Functions
  const EDGE_FUNCTION_BASE_URL = 'https://ufdhzgqrubbnornjdvgv.supabase.co/functions/v1';

  // Redirection automatique si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      console.log('✅ Utilisateur déjà connecté, redirection vers le dashboard');
      redirectToDashboard();
    }
  }, [user]);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    calculatePasswordStrength(password);
  }, [password]);

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    setPasswordStrength(score);
  };

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

      if (data && data.length > 0) {
        const formattedPlans = data.map(plan => {
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
            price_monthly: typeof plan.price_monthly === 'string' 
              ? parseFloat(plan.price_monthly.toString().replace(',', '.')) 
              : Number(plan.price_monthly),
            price_yearly: typeof plan.price_yearly === 'string'
              ? parseFloat(plan.price_yearly.toString().replace(',', '.'))
              : Number(plan.price_yearly),
            max_products: plan.max_products || 0,
            max_optimizations_monthly: plan.max_optimizations_monthly || 0,
            max_articles_monthly: plan.max_articles_monthly || 0,
            max_campaigns: plan.max_campaigns || 0,
            max_chat_responses_monthly: plan.max_chat_responses_monthly || 0,
            features: features,
            stripe_price_id: plan.stripe_price_id_monthly,
            stripe_price_id_yearly: plan.stripe_price_id_yearly,
            description: plan.description || '',
            popular: plan.popular || plan.id === 'professional',
            best_value: plan.best_value || plan.id === 'professional',
            recommended: plan.recommended || plan.id === 'enterprise',
            trial_days: plan.trial_days || 14
          };
        });

        const configuredPlans = formattedPlans.filter(plan => {
          const hasMonthly = plan.stripe_price_id && plan.stripe_price_id.startsWith('price_');
          const hasYearly = plan.stripe_price_id_yearly && plan.stripe_price_id_yearly.startsWith('price_');
          return hasMonthly || hasYearly;
        });

        if (configuredPlans.length === 0) {
          setError('Les forfaits ne sont pas encore configurés. Veuillez réessayer plus tard ou contacter le support.');
          setPlans(getDefaultPlans());
        } else {
          setPlans(configuredPlans);
        }
      } else {
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
      name: 'Starter',
      price_monthly: 49,
      price_yearly: 470,
      max_products: 500,
      max_optimizations_monthly: 1000,
      max_articles_monthly: 10,
      max_campaigns: 3,
      max_chat_responses_monthly: 500,
      features: {
        analytics: 'Basique',
        support: 'Email',
        api: false,
        backup: false,
        support_chat: true,
        support_phone: false,
        dedicated_manager: false,
        custom_training: false,
        sla: false,
        data_export: false,
        full_api: false
      },
      description: 'Parfait pour les petites boutiques qui débutent avec l\'IA',
      popular: false,
      best_value: false,
      recommended: false,
      trial_days: 14
    },
    {
      id: 'professional',
      name: 'Professional',
      price_monthly: 99,
      price_yearly: 950,
      max_products: 5000,
      max_optimizations_monthly: 10000,
      max_articles_monthly: 50,
      max_campaigns: 10,
      max_chat_responses_monthly: 5000,
      features: {
        analytics: 'Avancé',
        support: 'Prioritaire',
        api: true,
        backup: true,
        support_chat: true,
        support_phone: true,
        dedicated_manager: false,
        custom_training: true,
        sla: true,
        data_export: true,
        full_api: true
      },
      description: 'Idéal pour les e-commerces en croissance avec un volume important',
      popular: true,
      best_value: true,
      recommended: false,
      trial_days: 14
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price_monthly: 299,
      price_yearly: 2870,
      max_products: -1,
      max_optimizations_monthly: -1,
      max_articles_monthly: -1,
      max_campaigns: -1,
      max_chat_responses_monthly: -1,
      features: {
        analytics: 'Entreprise',
        support: 'Dédié 24/7',
        api: true,
        backup: true,
        support_chat: true,
        support_phone: true,
        dedicated_manager: true,
        custom_training: true,
        sla: true,
        data_export: true,
        full_api: true
      },
      description: 'Solution complète pour les grandes entreprises et marketplaces',
      popular: false,
      best_value: false,
      recommended: true,
      trial_days: 14
    }
  ];

  const validateStep1 = () => {
    const errors: Record<string, string> = {};

    if (!fullName.trim()) errors.fullName = 'Le nom complet est requis';
    if (!companyName.trim()) errors.companyName = 'Le nom de l\'entreprise est requis';
    
    if (!email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!password) {
      errors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      errors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    } else if (passwordStrength < 2) {
      errors.password = 'Le mot de passe est trop faible';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateStep1()) {
      return;
    }

    setStep(2);
  };

  const redirectToDashboard = () => {
    console.log('🔄 Redirection vers le dashboard...');
    
    if (onSignupSuccess) {
      onSignupSuccess();
      return;
    }
    
    window.location.href = '/dashboard';
  };

  const handleDirectSignup = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🚀 Début de l\'inscription directe...');

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            company_name: companyName,
            plan_id: selectedPlanId,
            billing_cycle: billingCycle
          }
        }
      });

      if (signUpError) {
        console.error('❌ Erreur lors de la création du compte:', signUpError);
        
        let errorMessage = signUpError.message || 'Erreur lors de la création du compte';
        
        if (signUpError.message.includes('user already registered')) {
          errorMessage = 'Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.';
        } else if (signUpError.message.includes('email')) {
          errorMessage = 'Format d\'email invalide.';
        } else if (signUpError.message.includes('password')) {
          errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
        } else if (signUpError.message.includes('Failed to fetch')) {
          errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
        }
        
        throw new Error(errorMessage);
      }

      if (!authData.user) {
        throw new Error('Erreur lors de la création du compte utilisateur');
      }

      console.log('✅ Compte utilisateur créé avec succès:', authData.user.id);

      const { error: sellerError } = await supabase
        .from('sellers')
        .insert({
          id: authData.user.id,
          email: email,
          full_name: fullName,
          company_name: companyName,
          status: 'trial',
          subscription_status: 'inactive',
          current_plan_id: selectedPlanId,
          trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (sellerError) {
        console.error('⚠️ Erreur lors de la création du profil seller:', sellerError);
      }

      console.log('✅ Inscription réussie! Redirection...');
      
      setSuccess(true);
      
      setTimeout(() => {
        redirectToDashboard();
      }, 3000);

    } catch (err) {
      console.error('💥 Erreur lors de l\'inscription:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de l\'inscription');
      setLoading(false);
    }
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

      await handleDirectSignup();

    } catch (err) {
      console.error('💥 Erreur lors de l\'inscription:', err);
      
      let errorMessage = 'Une erreur est survenue lors de l\'inscription';
      
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (err.message.includes('Failed to fetch')) {
          errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
        }
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Rocket className="w-6 h-6" />;
      case 'professional':
        return <Zap className="w-6 h-6" />;
      case 'enterprise':
        return <Crown className="w-6 h-6" />;
      default:
        return <ShoppingBag className="w-6 h-6" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          light: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          text: 'text-blue-600'
        };
      case 'professional':
        return {
          gradient: 'from-purple-500 to-pink-500',
          light: 'from-purple-50 to-pink-50',
          border: 'border-purple-200',
          text: 'text-purple-600'
        };
      case 'enterprise':
        return {
          gradient: 'from-violet-600 to-purple-600',
          light: 'from-violet-50 to-purple-50',
          border: 'border-violet-200',
          text: 'text-violet-600'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-700',
          light: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-600'
        };
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Illimité';
    if (value === 0) return 'Non inclus';
    return value.toLocaleString('fr-FR');
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedPrice = selectedPlan
    ? (billingCycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly)
    : 0;

  const yearlySavings = selectedPlan ? Math.round((1 - (selectedPlan.price_yearly / (selectedPlan.price_monthly * 12))) * 100) : 0;

  const PasswordStrengthIndicator = () => {
    if (!password) return null;

    const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

    return (
      <div className="mt-2">
        <div className="flex gap-1 mb-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1 flex-1 rounded-full transition-all ${
                level <= passwordStrength ? strengthColors[passwordStrength - 1] : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <p className={`text-xs ${
          passwordStrength <= 2 ? 'text-red-600' : 
          passwordStrength <= 3 ? 'text-orange-600' : 
          'text-green-600'
        }`}>
          Force du mot de passe: {strengthLabels[passwordStrength - 1]}
        </p>
      </div>
    );
  };

  const PlanSkeleton = () => (
    <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-gray-200 rounded"></div>
        <div className="h-6 bg-gray-200 rounded w-24"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-4"></div>
      <div className="space-y-2 mb-6">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
      <div className="h-12 bg-gray-200 rounded-lg"></div>
    </div>
  );

  const PlanComparisonModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Comparaison des forfaits</h3>
            <button
              onClick={() => setShowPlanComparison(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-4 font-semibold text-gray-900">Fonctionnalités</th>
                {plans.map(plan => (
                  <th key={plan.id} className="text-center py-4 font-semibold text-gray-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Produits maximum', key: 'max_products' },
                { feature: 'Optimisations IA/mois', key: 'max_optimizations_monthly' },
                { feature: 'Articles blog/mois', key: 'max_articles_monthly' },
                { feature: 'Réponses chat/mois', key: 'max_chat_responses_monthly' },
                { feature: 'Campagnes marketing', key: 'max_campaigns' },
                { feature: 'Support par chat', key: 'support_chat' },
                { feature: 'Support téléphonique', key: 'support_phone' },
                { feature: 'Manager dédié', key: 'dedicated_manager' },
                { feature: 'Analytics', key: 'analytics' },
                { feature: 'Accès API complet', key: 'full_api' },
              ].map((row, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-4 font-medium text-gray-700">{row.feature}</td>
                  {plans.map(plan => {
                    let value = plan[row.key as keyof Plan];
                    if (value === undefined) {
                      value = plan.features[row.key];
                    }
                    
                    return (
                      <td key={plan.id} className="text-center py-4">
                        {typeof value === 'number' ? (
                          <span className="font-semibold text-gray-900">
                            {formatLimit(value)}
                          </span>
                        ) : value === true ? (
                          <Check className="w-5 h-5 text-green-500 inline" />
                        ) : typeof value === 'string' ? (
                          <span className="text-sm text-gray-700">{value}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Bienvenue sur Omnia AI!
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-blue-800 text-lg font-semibold mb-3">
                <Sparkles className="w-5 h-5" />
                <span>Essai gratuit de 14 jours activé</span>
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Explorez toutes les fonctionnalités gratuitement pendant 14 jours!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2 justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                  <span>Accès immédiat</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Aucune carte requise</span>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <span>Email de confirmation envoyé</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="font-semibold text-gray-900">Prochaines étapes:</h4>
              <div className="space-y-2 text-sm text-gray-600 text-left max-w-md mx-auto">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <span>Vérifiez votre email pour confirmer votre compte</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <span>Configurez votre boutique en 5 minutes</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <span>Lancez votre première optimisation IA</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span className="ml-2 text-sm">Redirection automatique...</span>
            </div>

            <button
              onClick={redirectToDashboard}
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm"
            >
              Cliquez ici si la redirection ne fonctionne pas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {showPlanComparison && <PlanComparisonModal />}
      
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
              {step === 1 ? 'Créez votre compte en 2 minutes' : '14 jours d\'essai gratuit, sans engagement'}
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
                <p className="text-red-600 text-xs mt-1">
                  Si le problème persiste, contactez-nous à support@omnia-ai.com
                </p>
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
                      className={`w-full pl-11 pr-4 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        fieldErrors.fullName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  {fieldErrors.fullName && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.fullName}</p>
                  )}
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
                      className={`w-full pl-11 pr-4 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        fieldErrors.companyName ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="Ma Boutique"
                    />
                  </div>
                  {fieldErrors.companyName && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.companyName}</p>
                  )}
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
                      className={`w-full pl-11 pr-4 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        fieldErrors.email ? 'border-red-300' : 'border-gray-200'
                      }`}
                      placeholder="votre@entreprise.com"
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
                  )}
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
                      className={`w-full pl-11 pr-12 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        fieldErrors.password ? 'border-red-300' : 'border-gray-200'
                      }`}
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
                  <PasswordStrengthIndicator />
                  {fieldErrors.password && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
                  )}
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
                      className={`w-full pl-11 pr-12 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                        fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                      }`}
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
                  {fieldErrors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                  )}
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
                    Annuel {yearlySavings > 0 && (
                      <span className="text-green-500 ml-1">-{yearlySavings}%</span>
                    )}
                  </button>
                </div>
              </div>

              {loadingPlans ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <PlanSkeleton />
                  <PlanSkeleton />
                  <PlanSkeleton />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const colors = getPlanColor(plan.id);
                    const isPopular = plan.popular;
                    const isBestValue = plan.best_value;
                    const isRecommended = plan.recommended;

                    return (
                      <div
                        key={plan.id}
                        className={`relative bg-white rounded-2xl border-2 transition-all cursor-pointer hover:scale-105 ${
                          selectedPlanId === plan.id
                            ? `${colors.border} shadow-xl scale-105`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPlanId(plan.id)}
                      >
                        {isBestValue && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                              ⭐ MEILLEUR RAPPORT
                            </span>
                          </div>
                        )}

                        {isPopular && !isBestValue && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                              POPULAIRE
                            </span>
                          </div>
                        )}

                        {isRecommended && !isBestValue && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-violet-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                              🏆 RECOMMANDÉ
                            </span>
                          </div>
                        )}

                        <div className="p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradient} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                              {getPlanIcon(plan.id)}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                              <p className="text-gray-600 text-sm">{plan.description}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">
                              {billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly}€
                            </span>
                            <span className="text-gray-600">
                              {billingCycle === 'yearly' ? '/an' : '/mois'}
                            </span>
                            {billingCycle === 'yearly' && plan.price_monthly > 0 && (
                              <p className="text-green-600 text-sm mt-1">
                                Soit {(plan.price_yearly / 12).toFixed(2)}€/mois
                              </p>
                            )}
                          </div>

                          <div className="space-y-2 mb-6">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-blue-500" />
                              <span className="text-sm text-gray-700">
                                {formatLimit(plan.max_products)} produits
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-purple-500" />
                              <span className="text-sm text-gray-700">
                                {formatLimit(plan.max_optimizations_monthly)} optimisations/mois
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-green-500" />
                              <span className="text-sm text-gray-700">
                                {formatLimit(plan.max_articles_monthly)} articles/mois
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm text-gray-700">
                                {formatLimit(plan.max_chat_responses_monthly)} réponses chat/mois
                              </span>
                            </div>
                            {plan.features.support && (
                              <div className="flex items-center gap-2">
                                <Headphones className="w-4 h-4 text-red-500" />
                                <span className="text-sm text-gray-700">
                                  Support {plan.features.support}
                                </span>
                              </div>
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
                    );
                  })}
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={() => setShowPlanComparison(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1 mx-auto"
                >
                  Comparer tous les forfaits en détail
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Récapitulatif et actions */}
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-2">Récapitulatif</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Forfait:</strong> {selectedPlan?.name}</p>
                      <p><strong>Facturation:</strong> {billingCycle === 'monthly' ? 'Mensuelle' : 'Annuelle'}</p>
                      <p><strong>Prix:</strong> {selectedPrice}€{billingCycle === 'yearly' ? '/an' : '/mois'}</p>
                      <p><strong>Essai gratuit:</strong> {selectedPlan?.trial_days || 14} jours</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">{selectedPlan?.trial_days || 14} jours d'essai gratuit</span>
                    </div>
                    
                    <button
                      onClick={handleStep2Submit}
                      disabled={loading || loadingPlans}
                      className="w-full md:w-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Création du compte...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          <span>Commencer l'essai gratuit</span>
                        </>
                      )}
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                      Aucune carte de crédit requise • Accès immédiat
                    </p>
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