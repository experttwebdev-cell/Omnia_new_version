// Add these functions to your existing AuthContext
interface AuthContextType {
  // ... existing properties ...
  
  // Add these subscription management functions
  createCheckoutSession: (planId: string, billingPeriod: 'monthly' | 'yearly') => Promise<{ error: any; sessionUrl?: string }>;
  updateSubscription: (newPlanId: string) => Promise<{ error: any }>;
  cancelSubscription: () => Promise<{ error: any }>;
  resumeSubscription: () => Promise<{ error: any }>;
  updatePaymentMethod: () => Promise<{ error: any }>;
}

// In your AuthProvider component, add these functions:

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
  // Implementation for updating subscription
  console.log('Update subscription to:', newPlanId);
  return { error: null };
};

const cancelSubscription = async () => {
  // Implementation for canceling subscription
  console.log('Cancel subscription');
  return { error: null };
};

const resumeSubscription = async () => {
  // Implementation for resuming subscription
  console.log('Resume subscription');
  return { error: null };
};

const updatePaymentMethod = async () => {
  // Implementation for updating payment method
  console.log('Update payment method');
  return { error: null };
};

// Add these to your context value
const value = {
  // ... existing values ...
  createCheckoutSession,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  updatePaymentMethod,
};