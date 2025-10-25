import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { EmailVerification } from './components/EmailVerification';
import { Dashboard } from './components/Dashboard';
import { PricingLandingPage } from './components/PricingLandingPage';

type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    dashboard: 'Tableau de bord',
    products: 'Produits',
    settings: 'Paramètres',
    logout: 'Déconnexion',
  },
  en: {
    dashboard: 'Dashboard',
    products: 'Products',
    settings: 'Settings',
    logout: 'Logout',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

type ViewType = 'landing' | 'signup' | 'login' | 'verify-email' | 'dashboard';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');

  useEffect(() => {
    const hash = window.location.hash;
    const path = window.location.pathname;

    if (hash.includes('/verify-email') || hash.includes('type=signup')) {
      setCurrentView('verify-email');
    } else if (path === '/dashboard' || hash.includes('/dashboard')) {
      if (user && !loading) {
        setCurrentView('dashboard');
      } else if (!loading && !user) {
        setCurrentView('landing');
      }
    } else if (user && !loading) {
      setCurrentView('dashboard');
    }
  }, [user, loading]);

  useEffect(() => {
    if (user && !loading && currentView !== 'verify-email') {
      setCurrentView('dashboard');
    }
  }, [user, loading]);

  const handleSignUp = (planId: string) => {
    setSelectedPlan(planId);
    setCurrentView('signup');
  };

  const handleLogin = () => {
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleVerificationSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleSignupSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleLoginSuccess = () => {
    setCurrentView('dashboard');
  };

  const handleManageSubscription = () => {
    window.location.href = '/#/settings';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'verify-email') {
    return (
      <EmailVerification
        onSuccess={handleVerificationSuccess}
        onBack={handleBackToLanding}
      />
    );
  }

  if (currentView === 'dashboard') {
    if (!user) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vous devez être connecté
            </h2>
            <button
              onClick={handleLogin}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Se connecter
            </button>
          </div>
        </div>
      );
    }

    return <Dashboard />;
  }

  if (currentView === 'signup') {
    return (
      <SignUpPage
        planId={selectedPlan}
        onLogin={handleLogin}
        onBack={handleBackToLanding}
        onSignupSuccess={handleSignupSuccess}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onSignUp={() => handleSignUp('professional')}
        onBack={handleBackToLanding}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <PricingLandingPage
      onSignUp={handleSignUp}
      onLogin={handleLogin}
      onManageSubscription={handleManageSubscription}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
