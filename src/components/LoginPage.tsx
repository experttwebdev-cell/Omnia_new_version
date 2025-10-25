import { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Mail, 
  Lock, 
  AlertCircle, 
  ArrowLeft,
  Eye,
  EyeOff,
  Shield,
  Sparkles,
  Zap,
  CheckCircle,
  X,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/authContext';

interface LoginPageProps {
  onSignUp: () => void;
  onBack: () => void;
  onLoginSuccess?: () => void;
}

// Forgot Password Modal Component
function ForgotPasswordModal({ 
  isOpen, 
  onClose, 
  onBackToLogin 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onBackToLogin: () => void;
}) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message || 'Erreur lors de l\'envoi de l\'email');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Password recovery error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    setSuccess(false);
    setLoading(false);
    onClose();
  };

  const resetForm = () => {
    setEmail('');
    setError('');
    setSuccess(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>
          
          <h2 className="text-xl font-bold text-gray-900">
            Mot de passe oublié
          </h2>
          
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Email envoyé avec succès !
                </h3>
                <p className="text-green-700 text-sm">
                  Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>. 
                  Ce lien expirera dans 1 heure.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                <p>💡 <strong>Astuce :</strong> Vérifiez vos spams si vous ne voyez pas l'email.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetForm}
                  className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  Envoyer à un autre email
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105"
                >
                  Compris
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Réinitialiser votre mot de passe
                </h3>
                <p className="text-gray-600 text-sm">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Adresse email
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                      placeholder="votre@email.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 relative overflow-hidden group"
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                    backgroundSize: '200% 200%'
                  }}
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 50%, #667eea 100%)',
                      backgroundSize: '200% 200%',
                      animation: 'gradientShift 3s ease infinite'
                    }}
                  />
                  
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        <span>Envoyer le lien de réinitialisation</span>
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 text-sm">💡</span>
                  </div>
                  <div>
                    <p className="text-blue-800 text-sm font-medium">Conseil de sécurité</p>
                    <p className="text-blue-700 text-xs mt-1">
                      Le lien de réinitialisation expire après 1 heure pour votre sécurité.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoginPage({ onSignUp, onBack, onLoginSuccess }: LoginPageProps) {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('✅ Utilisateur déjà connecté, redirection vers le dashboard');
      redirectToDashboard();
    }
  }, [user]);

  const redirectToDashboard = () => {
    console.log('🔄 Redirection vers le dashboard...');
    
    if (onLoginSuccess) {
      onLoginSuccess();
      return;
    }
    
    window.location.href = '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Tentative de connexion...');

      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        console.error('❌ Erreur de connexion:', signInError);
        
        let errorMessage = signInError.message || 'Email ou mot de passe incorrect';
        
        // Messages d'erreur plus précis
        if (signInError.message.includes('Invalid login credentials')) {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (signInError.message.includes('Email not confirmed')) {
          errorMessage = 'Veuillez confirmer votre email avant de vous connecter';
        } else if (signInError.message.includes('Failed to fetch')) {
          errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
        }
        
        setError(errorMessage);
      } else if (data.user) {
        console.log('✅ Connexion réussie! Redirection...');

        // Immediate redirection
        redirectToDashboard();
      }
    } catch (err) {
      console.error('💥 Erreur lors de la connexion:', err);
      setError('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Handle demo login for testing
  const handleDemoLogin = async () => {
    setEmail('demo@omnia-ai.com');
    setPassword('demo123');
    
    // Auto-submit after a short delay to show the filled fields
    setTimeout(() => {
      handleSubmit(new Event('submit') as any);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Bouton retour */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-all duration-200 hover:gap-3 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Retour à l'accueil</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* En-tête avec logo */}
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

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Content de vous revoir !</h2>
            <p className="text-gray-600">
              Accédez à votre tableau de bord personnalisé
            </p>
          </div>

          {/* Bannière de sécurité */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900 text-sm">Connexion sécurisée</p>
              <p className="text-blue-700 text-xs">Vos données sont protégées par un chiffrement de niveau bancaire</p>
            </div>
          </div>

          {/* Demo Login Button (for development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6">
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <Zap className="w-4 h-4" />
                Connexion Démo (Développement)
              </button>
              <p className="text-xs text-gray-500 text-center mt-2">
                Compte de test pré-rempli
              </p>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
                <p className="text-red-700 text-xs mt-1">
                  Vérifiez vos identifiants ou{' '}
                  <button 
                    onClick={() => setShowForgotPassword(true)}
                    className="underline font-medium hover:text-red-800"
                  >
                    réinitialisez votre mot de passe
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Champ email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Adresse email
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className={`w-5 h-5 transition-colors ${
                    error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-blue-500'
                  }`} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  className={`w-full pl-10 pr-4 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                    error 
                      ? 'border-red-300 bg-red-50 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  placeholder="votre@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Champ mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Mot de passe
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className={`w-5 h-5 transition-colors ${
                    error ? 'text-red-500' : 'text-gray-400 group-focus-within:text-blue-500'
                  }`} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  required
                  className={`w-full pl-10 pr-12 py-4 bg-white border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all duration-200 ${
                    error 
                      ? 'border-red-300 bg-red-50 focus:border-red-500' 
                      : 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  }`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Case à cocher "Se souvenir de moi" */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                    disabled={loading}
                  />
                  <div className={`w-5 h-5 border-2 rounded transition-all duration-200 ${
                    rememberMe 
                      ? 'bg-blue-600 border-blue-600' 
                      : 'bg-white border-gray-300'
                  }`}>
                    {rememberMe && (
                      <CheckCircle className="w-4 h-4 text-white absolute top-0.5 left-0.5" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-700 select-none">Se souvenir de moi</span>
              </label>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 relative overflow-hidden group"
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                backgroundSize: '200% 200%'
              }}
            >
              {/* Animation de fond */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'linear-gradient(135deg, #764ba2 0%, #f093fb 50%, #667eea 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 3s ease infinite'
                }}
              />
              
              {/* Contenu du bouton */}
              <span className="relative z-10 flex items-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Se connecter</span>
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Séparateur */}
          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">ou</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Lien vers inscription */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Nouveau sur Omnia AI ?
            </p>
            <button
              onClick={onSignUp}
              disabled={loading}
              className="w-full border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-semibold transition-all duration-300 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Créer un compte gratuit
            </button>
          </div>

          {/* Informations de sécurité */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>SSL Sécurisé</span>
              </div>
              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>RGPD Compliant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Omnia AI. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        onBackToLogin={() => setShowForgotPassword(false)}
      />

      {/* Styles d'animation */}
      <style jsx>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  ); 
} 