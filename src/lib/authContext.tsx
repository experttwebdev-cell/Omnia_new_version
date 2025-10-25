import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface Seller {
  id: string;
  user_id: string | null;
  email: string;
  company_name?: string | null;
  full_name?: string | null;
  role: string;
  status: string;
  trial_ends_at?: string | null;
  created_at?: string;
  updated_at?: string;
  stripe_customer_id?: string | null;
  email_verified?: boolean;
  subscription_status: string;
  current_plan_id?: string | null;
}

interface SubscriptionPlan {
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
  seller_id: string;
  plan_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end?: boolean;
  stripe_subscription_id?: string | null;
  billing_period?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  seller: Seller | null;
  subscription: (Subscription & { plan?: SubscriptionPlan }) | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, planId?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
  refreshSeller: () => Promise<void>;
  createCheckoutSession: (planId: string, billingPeriod: 'monthly' | 'yearly') => Promise<{ error: any; sessionUrl?: string }>;
  updateSubscription: (newPlanId: string) => Promise<{ error: any }>;
  cancelSubscription: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [subscription, setSubscription] = useState<(Subscription & { plan?: SubscriptionPlan }) | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSeller = async (userId: string) => {
    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
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

  const fetchSubscription = async (sellerId: string) => {
    try {
      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('seller_id', sellerId)
        .in('status', ['active', 'trial'])
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        return;
      }

      if (subData) {
        setSubscription({
          ...subData,
          plan: Array.isArray(subData.plan) ? subData.plan[0] : subData.plan
        } as Subscription & { plan?: SubscriptionPlan });
      }
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
    }
  };

  const refreshSeller = async () => {
    if (user) {
      await fetchSeller(user.id);
    }
  };

  const refreshSubscription = async () => {
    if (seller) {
      await fetchSubscription(seller.id);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          const { data: sellerData } = await supabase
            .from('sellers')
            .select('*')
            .eq('user_id', initialSession.user.id)
            .maybeSingle();

          if (sellerData) {
            setSeller(sellerData as Seller);
            await fetchSubscription(sellerData.id);
          }
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
          const { data: sellerData } = await supabase
            .from('sellers')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .maybeSingle();

          if (sellerData) {
            setSeller(sellerData as Seller);
            await fetchSubscription(sellerData.id);
          }
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
    refreshSeller,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
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
