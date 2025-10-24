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
  BarChart3,
  Headphones,
  FileText,
  MessageCircle,
  ChevronDown
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
  const { user, signIn } = useAuth();
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

  // Enhanced redirection logic
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
      console.log('🔍 Chargement des forfaits...');
      setPlans(getDefaultPlans());
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

  // Enhanced redirection function
  const redirectToDashboard = () => {
    console.log('🔄 Redirection vers le dashboard...');
    
    // First try the callback function
    if (onSignupSuccess) {
      console.log('📞 Utilisation du callback onSignupSuccess');
      onSignupSuccess();
      return;
    }
    
    // Then try to use the auth context signIn
    if (signIn) {
      console.log('🔐 Tentative de connexion automatique...');
      signIn(email, password)
        .then(() => {
          console.log('✅ Connexion automatique réussie');
          window.location.href = '/dashboard';
        })
        .catch((err) => {
          console.log('⚠️ Connexion automatique échouée, redirection directe:', err);
          window.location.href = '/dashboard';
        });
      return;
    }
    
    // Fallback: direct navigation
    console.log('📍 Redirection directe vers /dashboard');
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
          },
          // Auto confirm to skip email verification for immediate access
          autoConfirm: true
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

      // Create seller profile
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
        // Continue anyway as the user account was created successfully
      }

      console.log('✅ Inscription réussie! Redirection...');
      
      setSuccess(true);
      
      // Immediate redirection without delay
      setTimeout(() => {
        redirectToDashboard();
      }, 500); // Very short delay for better UX

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

  // ... rest of the component code (getPlanIcon, getPlanColor, formatLimit, etc.) remains the same

  // Enhanced success component with immediate redirect
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
                Redirection vers votre dashboard...
              </p>
              
              <div className="flex justify-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-pink-600 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            <button
              onClick={redirectToDashboard}
              className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
            >
              Cliquez ici si la redirection ne se fait pas automatiquement
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ... rest of the component JSX remains the same
}