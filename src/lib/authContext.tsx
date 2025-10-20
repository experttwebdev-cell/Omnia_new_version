import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface Seller {
  id: string;
  email: string;
  company_name: string;
  full_name: string;
  role: 'seller' | 'superadmin';
  status: 'active' | 'trial' | 'suspended';
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
}

interface Subscription {
  id: string;
  seller_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  max_products: number;
  max_optimizations_monthly: number;
  max_articles_monthly: number;
  max_campaigns: number;
  max_chat_responses_monthly: number;
  features: Record<string, any>;
  stripe_price_id: string;
}

interface AuthContextType {
  user: User | null;
  seller: Seller | null;
  subscription: Subscription | null;
  plan: SubscriptionPlan | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, companyName: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSellerData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSellerData = async (userId: string) => {
    try {
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (sellerError) throw sellerError;

      if (sellerData) {
        setSeller(sellerData);

        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('seller_id', sellerData.id)
          .eq('status', 'active')
          .maybeSingle();

        if (subError) throw subError;

        if (subData) {
          setSubscription(subData);

          const { data: planData, error: planError } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', subData.plan_id)
            .single();

          if (planError) throw planError;
          setPlan(planData);
        }
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    }
  };

  const refreshSellerData = async () => {
    if (user) {
      await fetchSellerData(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSellerData(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchSellerData(session.user.id);
      } else {
        setSeller(null);
        setSubscription(null);
        setPlan(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, companyName: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) return { error };

    if (data.user) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const { error: sellerError } = await supabase
        .from('sellers')
        .insert({
          id: data.user.id,
          email: email,
          company_name: companyName,
          full_name: fullName,
          role: 'seller',
          status: 'trial',
          trial_ends_at: trialEndsAt.toISOString(),
        });

      if (sellerError) {
        console.error('Error creating seller:', sellerError);
        return { error: sellerError };
      }

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          seller_id: data.user.id,
          plan_id: 'starter',
          status: 'trial',
          current_period_start: new Date().toISOString(),
          current_period_end: trialEndsAt.toISOString(),
          cancel_at_period_end: false,
        });

      if (subError) {
        console.error('Error creating subscription:', subError);
        return { error: subError };
      }

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const { error: usageError } = await supabase
        .from('usage_tracking')
        .insert({
          seller_id: data.user.id,
          month: currentMonth.toISOString().split('T')[0],
          products_count: 0,
          optimizations_count: 0,
          articles_count: 0,
          chat_responses_count: 0,
        });

      if (usageError) {
        console.error('Error creating usage tracking:', usageError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSeller(null);
    setSubscription(null);
    setPlan(null);
  };

  const value = {
    user,
    seller,
    subscription,
    plan,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSellerData,
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
