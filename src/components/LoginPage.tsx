import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';

interface Seller {
  id: string;
  email: string;
  company_name: string;
  full_name: string;
  role: string;
  status: string;
  // Add other fields as needed
}

interface LoginPageProps {
  onSignUp: () => void;
  onBack: () => void;
}

// Mock authentication function - replace with your actual API call
const mockSignIn = async (email: string, password: string): Promise<{ error?: { message: string }, user?: Seller }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock users data - in real app, this would come from your API
  const mockUsers = [
    {
      idx: 1,
      id: "069bb27f-d745-410c-a5d8-5224e2483d85",
      email: "otmane.benyahya@sweetdeco.com",
      company_name: "Decora Home",
      full_name: "Otmane BENYAHYA",
      role: "seller",
      status: "trial",
      trial_ends_at: "2025-11-03 22:00:12.361+00",
      created_at: "2025-10-20 21:00:12.30828+00",
      updated_at: "2025-10-23 10:10:40.934193+00",
      stripe_customer_id: null,
      email_verified: false,
      subscription_status: "inactive",
      current_plan_id: null,
      // For demo purposes - in production, passwords should be hashed and stored securely
      password: "password123" // Remove this in production
    }
  ];

  const user = mockUsers.find(u => u.email === email);
  
  if (!user) {
    return { error: { message: 'Aucun compte trouvé avec cet email' } };
  }

  // In production, you should compare hashed passwords
  if (user.password !== password) {
    return { error: { message: 'Mot de passe incorrect' } };
  }

  // Return user data without password
  const { password: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword as Seller };
};

export function LoginPage({ onSignUp, onBack }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation basique
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
      const { error, user } = await mockSignIn(email, password);

      if (error) {
        setError(error.message || 'Email ou mot de passe incorrect');
      } else if (user) {
        // Login successful - handle the user data
        console.log('Login successful:', user);
        
        // Store user data in localStorage or context
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Redirect or update app state
        window.location.href = '/dashboard'; // Or use your router
      }
    } catch (err) {
      setError('Une erreur inattendue est survenue');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Implémentation future de la récupération de mot de passe
    alert('Fonctionnalité de récupération de mot de passe à venir');
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

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium text-sm">{error}</p>
                <p className="text-red-700 text-xs mt-1">
                  Vérifiez vos identifiants ou{' '}
                  <button 
                    onClick={handleForgotPassword}
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
                  onClick={handleForgotPassword}
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