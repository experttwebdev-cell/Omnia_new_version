import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Shield,
  Phone,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

// Validation types and utilities
interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  company_name: string;
  phone: string;
  website?: string;
  selectedPlan?: string;
  billingPeriod: 'monthly' | 'annual';
  acceptTerms: boolean;
  acceptMarketing: boolean;
}

interface ValidationRules {
  [key: string]: {
    validate: (value: any, form?: SignUpForm) => boolean;
    message: string;
  };
}

interface PasswordStrength {
  score: number;
  feedback: string[];
}

export function SignUp() {
  const { seller } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [form, setForm] = useState<SignUpForm>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    company_name: '',
    phone: '',
    website: '',
    selectedPlan: undefined,
    billingPeriod: 'monthly',
    acceptTerms: false,
    acceptMarketing: false
  });
  const [errors, setErrors] = useState<Partial<SignUpForm>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof SignUpForm, boolean>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [] });
  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch plans and redirect if already authenticated
  useEffect(() => {
    if (seller) {
      window.location.href = '/dashboard';
    }

    // Fetch subscription plans
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly');
      if (data) {
        setPlans(data);
        // Set default plan to first one
        if (data.length > 0 && !form.selectedPlan) {
          setForm(prev => ({ ...prev, selectedPlan: data[0].id }));
        }
      }
    };
    fetchPlans();
  }, [seller]);

  // Validation rules
  const validationRules: ValidationRules = {
    email: {
      validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Adresse email invalide'
    },
    password: {
      validate: (value) => value.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value),
      message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial'
    },
    confirmPassword: {
      validate: (value, form) => value === form?.password,
      message: 'Les mots de passe ne correspondent pas'
    },
    full_name: {
      validate: (value) => value.trim().length >= 2,
      message: 'Le nom complet doit contenir au moins 2 caractères'
    },
    company_name: {
      validate: (value) => value.trim().length >= 2,
      message: 'Le nom de l\'entreprise doit contenir au moins 2 caractères'
    },
    phone: {
      validate: (value) => /^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/\s/g, '')),
      message: 'Numéro de téléphone invalide'
    },
    website: {
      validate: (value) => !value || /^https?:\/\/.+\..+/.test(value),
      message: 'URL de site web invalide'
    },
    acceptTerms: {
      validate: (value) => value === true,
      message: 'Vous devez accepter les conditions d\'utilisation'
    },
    selectedPlan: {
      validate: (value) => !!value,
      message: 'Veuillez sélectionner un plan d\'abonnement'
    }
  };

  // Check password strength
  const checkPasswordStrength = (password: string): PasswordStrength => {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Au moins 8 caractères');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Une lettre minuscule');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Une lettre majuscule');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Un chiffre');
    }

    if (/[@$!%*?&]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Un caractère spécial (@$!%*?&)');
    }

    return { score, feedback };
  };

  // Validate field
  const validateField = (name: keyof SignUpForm, value: any): string => {
    const rule = validationRules[name];
    if (!rule) return '';
    
    if (!rule.validate(value, form)) {
      return rule.message;
    }
    return '';
  };

  // Validate form step
  const validateStep = (step: number): boolean => {
    const stepFields: { [key: number]: (keyof SignUpForm)[] } = {
      1: ['email', 'password', 'confirmPassword'],
      2: ['full_name', 'company_name', 'phone', 'website'],
      3: ['acceptTerms', 'selectedPlan']
    };

    const fieldsToValidate = stepFields[step] || [];
    const newErrors: Partial<SignUpForm> = {};

    fieldsToValidate.forEach(field => {
      const error = validateField(field, form[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof SignUpForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setServerError(null);

    // Real-time validation for touched fields
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: error || undefined
      }));
    }

    // Check password strength in real-time
    if (field === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  // Handle blur
  const handleBlur = (field: keyof SignUpForm) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, form[field]);
    setErrors(prev => ({
      ...prev,
      [field]: error || undefined
    }));
  };

  // Next step
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  // Previous step
  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateStep(step)) {
      return;
    }

    if (step < 3) {
      nextStep();
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            company_name: form.company_name,
            role: 'seller'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create seller profile
        const { error: sellerError } = await supabase
          .from('sellers')
          .insert([
            {
              id: authData.user.id,
              email: form.email,
              full_name: form.full_name,
              company_name: form.company_name,
              phone: form.phone,
              website: form.website,
              role: 'seller',
              status: 'trial',
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days trial
            }
          ]);

        if (sellerError) throw sellerError;

        // Create subscription
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert([
            {
              seller_id: authData.user.id,
              plan_id: form.selectedPlan,
              status: 'trial',
              billing_period: form.billingPeriod,
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            }
          ]);

        if (subscriptionError) throw subscriptionError;

        setSuccess(true);

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '#dashboard';
          window.location.reload();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      
      // Handle specific Supabase errors
      if (error.message.includes('already registered')) {
        setServerError('Un compte existe déjà avec cette adresse email');
      } else if (error.message.includes('invalid_email')) {
        setServerError('Adresse email invalide');
      } else if (error.message.includes('weak_password')) {
        setServerError('Le mot de passe est trop faible');
      } else {
        setServerError('Une erreur est survenue lors de la création du compte. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const PasswordStrengthIndicator = () => {
    if (!form.password) return null;

    const strengthColors = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-green-500'
    ];

    const strengthLabels = [
      'Très faible',
      'Faible',
      'Moyen',
      'Fort',
      'Très fort'
    ];

    return (
      <div className="mt-3 space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-all ${
                index <= passwordStrength.score
                  ? strengthColors[passwordStrength.score - 1]
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            Force du mot de passe: <strong>{strengthLabels[passwordStrength.score - 1] || 'Très faible'}</strong>
          </span>
        </div>
        {passwordStrength.feedback.length > 0 && (
          <div className="text-sm text-gray-600 space-y-1">
            <p className="font-medium">Requis:</p>
            <ul className="list-disc list-inside space-y-1">
              {passwordStrength.feedback.map((item, index) => (
                <li key={index} className="text-red-500">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Compte créé avec succès !</h2>
          <p className="text-gray-600 mb-6">
            Votre compte <strong>{form.email}</strong> a été créé avec un essai gratuit de 14 jours.
            Vous allez être redirigé vers votre dashboard...
          </p>
          <div className="animate-pulse text-sm text-blue-600">
            Redirection en cours...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Étape {step} sur 3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
            <p className="text-gray-600">
              Rejoignez notre plateforme et boostez vos ventes
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.email
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="votre@email.com"
                    />
                    {touched.email && !errors.email && form.email && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      onBlur={() => handleBlur('password')}
                      className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.password
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Votre mot de passe"
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
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      onBlur={() => handleBlur('confirmPassword')}
                      className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.confirmPassword
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Confirmez votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Profile Information */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      onBlur={() => handleBlur('full_name')}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.full_name
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Votre nom complet"
                    />
                    {touched.full_name && !errors.full_name && form.full_name && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.full_name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      onBlur={() => handleBlur('company_name')}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.company_name
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="Votre entreprise"
                    />
                    {touched.company_name && !errors.company_name && form.company_name && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.company_name && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.company_name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      onBlur={() => handleBlur('phone')}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.phone
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="+33 1 23 45 67 89"
                    />
                    {touched.phone && !errors.phone && form.phone && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site web (optionnel)
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      onBlur={() => handleBlur('website')}
                      className={`w-full pl-10 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition ${
                        errors.website
                          ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                          : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                      placeholder="https://votre-site.com"
                    />
                    {touched.website && !errors.website && form.website && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {errors.website && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.website}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Subscription Selection */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6">
                  <h3 className="font-bold text-gray-900 mb-3 text-lg">Choisissez votre formule d'abonnement</h3>
                  <p className="text-gray-700 text-sm">
                    Sélectionnez votre forfait et votre période de facturation. Vous bénéficierez de 14 jours d'essai gratuit.
                  </p>
                </div>

                {/* Billing Period Toggle */}
                <div className="flex justify-center">
                  <div className="inline-flex rounded-lg border-2 border-gray-300 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => handleChange('billingPeriod', 'monthly')}
                      className={`px-6 py-2 rounded-md font-medium transition ${
                        form.billingPeriod === 'monthly'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Mensuel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('billingPeriod', 'annual')}
                      className={`px-6 py-2 rounded-md font-medium transition relative ${
                        form.billingPeriod === 'annual'
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Annuel
                      <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                        -17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {plans.map((plan) => {
                    const price = form.billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly;
                    const isSelected = form.selectedPlan === plan.id;

                    return (
                      <div
                        key={plan.id}
                        onClick={() => handleChange('selectedPlan', plan.id)}
                        className={`cursor-pointer rounded-lg border-2 p-5 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
                          {isSelected && (
                            <CheckCircle className="w-6 h-6 text-blue-600" />
                          )}
                        </div>
                        <div className="mb-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-gray-900">€{price}</span>
                            <span className="text-gray-600">/{form.billingPeriod === 'annual' ? 'an' : 'mois'}</span>
                          </div>
                          {form.billingPeriod === 'annual' && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                              Économisez €{(plan.price_monthly * 12) - plan.price_annual}/an
                            </p>
                          )}
                        </div>
                        <ul className="space-y-2 text-sm text-gray-700">
                          {plan.name === 'Starter Lite' && (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Jusqu'à 100 produits</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Support par email</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Optimisations SEO basiques</span>
                              </li>
                            </>
                          )}
                          {plan.name === 'Professional AI' && (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Produits illimités</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Support prioritaire</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>IA avancée + Chat client</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Blog automatique</span>
                              </li>
                            </>
                          )}
                          {plan.name === 'Enterprise Commerce+' && (
                            <>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Tout de Professional +</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Support dédié 24/7</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>Multi-boutiques</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                <span>API personnalisée</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>

                {errors.selectedPlan && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    {errors.selectedPlan}
                  </p>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-yellow-900 mb-1">14 jours d'essai gratuit</p>
                      <p className="text-sm text-yellow-800">
                        Vous ne serez pas facturé pendant la période d'essai. Après 14 jours, vous devrez effectuer le paiement via Stripe pour continuer.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptTerms}
                      onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      J'accepte les{' '}
                      <a href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                        conditions d'utilisation
                      </a>{' '}
                      et la{' '}
                      <a href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                        politique de confidentialité
                      </a>
                    </span>
                  </label>
                  {errors.acceptTerms && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <XCircle className="w-4 h-4" />
                      {errors.acceptTerms}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.acceptMarketing}
                      onChange={(e) => handleChange('acceptMarketing', e.target.checked)}
                      className="mt-1 w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Je souhaite recevoir des conseils marketing et des offres spéciales par email
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Retour
                </button>
              )}
              
              <button
                type={step === 3 ? 'submit' : 'button'}
                onClick={step < 3 ? nextStep : undefined}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Création du compte...
                  </>
                ) : step === 3 ? (
                  <>
                    <Shield className="w-5 h-5" />
                    Créer mon compte
                  </>
                ) : (
                  <>
                    Continuer
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Déjà un compte ?{' '}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition"
              >
                Se connecter
              </a>
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" />
            Vos données sont sécurisées et cryptées
          </p>
        </div>
      </div>
    </div>
  );
}

export { SignUp as SignUpPage };