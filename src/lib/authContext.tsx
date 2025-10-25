import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

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
  description?: string | null;
  popular?: boolean;
  best_value?: boolean;
  recommended?: boolean;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  amount: number;
  current_period_start: number;
  current_period_end: number;
  stripe_subscription_id: string | null;
  plan?: Plan;
}

interface Seller {
  id: string;
  email: string;
  created_at: string;
  subscription_plan_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  seller: Seller | null;
  subscription: Subscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, planId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  createCheckoutSession: (planId: string, billingPeriod: 'monthly' | 'yearly') => Promise<{ error: any; sessionUrl?: string }>;
  updateSubscription: (newPlanId: string) => Promise<{ error: any }>;
  cancelSubscription: () => Promise<{ error: any }>;
  resumeSubscription: () => Promise<{ error: any }>;
  updatePaymentMethod: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSeller = async (userId: string) => {
    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('user_accounts')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (sellerError) {
        console.error('Error fetching seller:', sellerError);
        return;
      }

      if (sellerData) {
        setSeller(sellerData as Seller);
      }
    } catch (error) {
      console.error('Error in fetchSeller:', error);
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        return;
      }

      if (subData) {
        setSubscription({
          ...subData,
          plan: subData.plan as Plan
        });
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await Promise.all([
            fetchSeller(initialSession.user.id),
            fetchSubscription(initialSession.user.id)
          ]);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await Promise.all([
            fetchSeller(currentSession.user.id),
            fetchSubscription(currentSession.user.id)
          ]);
        } else {
          setSeller(null);
          setSubscription(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, planId?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            plan_id: planId || 'starter',
          },
        },
      });

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSeller(null);
    setSubscription(null);
  };

  const createCheckoutSession = async (planId: string, billingPeriod: 'monthly' | 'yearly') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { error: { message: 'Not authenticated' } };
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          billing_period: billingPeriod,
          success_url: `${window.location.origin}/dashboard?checkout=success`,
          cancel_url: `${window.location.origin}/pricing?checkout=cancelled`,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: { message: result.error || 'Failed to create checkout session' } };
      }

      return { error: null, sessionUrl: result.url };
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return { error: { message: 'Failed to create checkout session' } };
    }
  };

  const updateSubscription = async (newPlanId: string) => {
    console.log('Update subscription to:', newPlanId);
    return { error: null };
  };

  const cancelSubscription = async () => {
    console.log('Cancel subscription');
    return { error: null };
  };

  const resumeSubscription = async () => {
    console.log('Resume subscription');
    return { error: null };
  };

  const updatePaymentMethod = async () => {
    console.log('Update payment method');
    return { error: null };
  };

  const value = {
    user,
    session,
    seller,
    subscription,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSubscription,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
    resumeSubscription,
    updatePaymentMethod,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
