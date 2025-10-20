import { useState, useEffect, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { Dashboard } from './components/Dashboard';
import { OnboardingPage } from './components/OnboardingPage';
import { PricingLandingPage } from './components/PricingLandingPage';
import { supabase } from './lib/supabase';

const LanguageContext = createContext<{
  language: string;
  setLanguage: (lang: string) => void;
}>({
  language: 'fr',
  setLanguage: () => {}
});

export const useLanguage = () => useContext(LanguageContext);

function AppContent() {
  const { user, seller, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'landing' | 'signup' | 'login' | 'onboarding' | 'dashboard'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');
  const [hasStore, setHasStore] = useState<boolean | null>(null);
  const [hasProducts, setHasProducts] = useState<boolean | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash.startsWith('onboarding')) {
        setCurrentView('onboarding');
      } else if (hash.startsWith('dashboard')) {
        setCurrentView('dashboard');
      } else if (hash.startsWith('signup')) {
        setCurrentView('signup');
      } else if (hash.startsWith('login')) {
        setCurrentView('login');
      } else if (hash === '') {
        setCurrentView('landing');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user, loading]);

  useEffect(() => {
    const checkStoreAndProducts = async () => {
      if (!seller?.id || loading) return;

      try {
        const { data: storeData, error: storeError } = await supabase
          .from('shopify_stores')
          .select('id')
          .eq('seller_id', seller.id)
          .maybeSingle();

        if (storeError) {
          console.error('Error checking store:', storeError);
          setHasStore(false);
          setHasProducts(false);
          return;
        }

        setHasStore(!!storeData);

        const { count, error: productsError } = await supabase
          .from('shopify_products')
          .select('id', { count: 'exact', head: true })
          .eq('seller_id', seller.id);

        if (productsError) {
          console.error('Error checking products:', productsError);
          setHasProducts(false);
          return;
        }

        setHasProducts((count || 0) > 0);
      } catch (err) {
        console.error('Error checking store/products:', err);
        setHasStore(false);
        setHasProducts(false);
      }
    };

    checkStoreAndProducts();
  }, [seller, loading]);

  useEffect(() => {
    if (user && !loading && hasStore !== null && hasProducts !== null && currentView === 'landing') {
      if (!hasStore) {
        window.location.hash = 'onboarding';
        setCurrentView('onboarding');
      }
    }
  }, [user, loading, hasStore, hasProducts, currentView]);

  const handleSignUp = (planId: string) => {
    console.log('Sign up clicked with plan:', planId);
    setSelectedPlan(planId);
    window.location.hash = 'signup';
    setCurrentView('signup');
  };

  const handleLogin = () => {
    console.log('Login clicked');
    window.location.hash = 'login';
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    window.location.hash = '';
    setCurrentView('landing');
  };

  if (currentView === 'landing') {
    return <PricingLandingPage
      onSignUp={handleSignUp}
      onLogin={handleLogin}
      onDashboard={() => {
        window.location.hash = 'dashboard';
        setCurrentView('dashboard');
      }}
      isLoggedIn={!!user && !loading}
    />;
  }

  if (currentView === 'signup') {
    return (
      <SignUpPage
        planId={selectedPlan}
        onLogin={handleLogin}
        onBack={handleBackToLanding}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onSignUp={() => handleSignUp('professional')}
        onBack={handleBackToLanding}
      />
    );
  }

  if (currentView === 'onboarding') {
    if (!user && !loading) {
      window.location.hash = 'login';
      setCurrentView('login');
      return null;
    }
    return <OnboardingPage
      onComplete={() => {
        window.location.hash = 'dashboard';
        setCurrentView('dashboard');
        setHasStore(true);
      }}
      onSkipToHome={() => {
        window.location.hash = '';
        setCurrentView('landing');
      }}
    />;
  }

  if (currentView === 'dashboard') {
    if (!user && !loading) {
      window.location.hash = 'login';
      setCurrentView('login');
      return null;
    }
    return <Dashboard />;
  }

  return <PricingLandingPage
    onSignUp={handleSignUp}
    onLogin={handleLogin}
    onDashboard={() => {
      window.location.hash = 'dashboard';
      setCurrentView('dashboard');
    }}
    isLoggedIn={!!user && !loading}
  />;
}

function App() {
  const [language, setLanguage] = useState('fr');

  return (
    <AuthProvider>
      <LanguageContext.Provider value={{ language, setLanguage }}>
        <AppContent />
      </LanguageContext.Provider>
    </AuthProvider>
  );
}

export default App;
