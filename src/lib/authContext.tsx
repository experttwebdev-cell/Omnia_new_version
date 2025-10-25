import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface Seller {
  id: string;
  user_id: string;
  store_name: string;
  shopify_store_url?: string;
  shopify_access_token?: string;
  openai_api_key?: string;
  plan_id: string;
  subscription_status: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

interface Subscription {
  id: string;
  seller_id: string;
  plan_id: string;
  status: string;
  current_period_start?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

interface AuthContextType {
  user: User | null;
  seller: Seller | null;
  subscription: Subscription | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, storeName: string, planId: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createCheckoutSession: (planId: string, billingPeriod: 'monthly' | 'yearly') => Promise<{ error: any; sessionUrl?: string }>;
  updateSubscription: (newPlanId: string) => Promise<{ error: any }>;
  cancelSubscription: () => Promise<{ error: any }>;
  resumeSubscription: () => Promise<{ error: any }>;
  updatePaymentMethod: () => Promise<{ error: any }>;
  refreshSeller: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSeller = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching seller:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchSeller:', error);
      return null;
    }
  };

  const fetchSubscription = async (sellerId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in fetchSubscription:', error);
      return null;
    }
  };

  const refreshSeller = async () => {
    if (user) {
      const sellerData = await fetchSeller(user.id);
      setSeller(sellerData);

      if (sellerData) {
        const subscriptionData = await fetchSubscription(sellerData.id);
        setSubscription(subscriptionData);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchSeller(session.user.id).then(sellerData => {
          setSeller(sellerData);

          if (sellerData) {
            fetchSubscription(sellerData.id).then(subscriptionData => {
              setSubscription(subscriptionData);
              setLoading(false);
            });
          } else {
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          setUser(session?.user ?? null);

          if (session?.user) {
            const sellerData = await fetchSeller(session.user.id);
            setSeller(sellerData);

            if (sellerData) {
              const subscriptionData = await fetchSubscription(sellerData.id);
              setSubscription(subscriptionData);
            }
          } else {
            setSeller(null);
            setSubscription(null);
          }

          setLoading(false);
        })();
      }
    );

    return () => {
      authSubscription.unsubscribe();
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

  const signUp = async (email: string, password: string, storeName: string, planId: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            store_name: storeName,
            plan_id: planId,
          },
        },
      });

      if (error) return { error };

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
    seller,
    subscription,
    loading,
    signIn,
    signUp,
    signOut,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
    resumeSubscription,
    updatePaymentMethod,
    refreshSeller,
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
