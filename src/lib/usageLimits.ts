import { supabase } from './supabase';

export interface UsageStats {
  products: {
    used: number;
    limit: number;
    percentage: number;
    canUse: boolean;
  };
  optimizations: {
    used: number;
    limit: number;
    percentage: number;
    canUse: boolean;
  };
  articles: {
    used: number;
    limit: number;
    percentage: number;
    canUse: boolean;
  };
  chatResponses: {
    used: number;
    limit: number;
    percentage: number;
    canUse: boolean;
  };
  campaigns: {
    used: number;
    limit: number;
    canUse: boolean;
  };
}

export interface UsageStatus {
  usage: UsageStats;
  plan: {
    id: string;
    name: string;
    limits: {
      max_products: number;
      max_optimizations_monthly: number;
      max_articles_monthly: number;
      max_chat_responses_monthly: number;
      max_campaigns: number;
    };
  };
  period: {
    start: string;
    end: string;
  };
}

const calculatePercentage = (used: number, limit: number): number => {
  if (limit === -1) return 0;
  if (limit === 0) return 100;
  return Math.min((used / limit) * 100, 100);
};

const canUseFeature = (used: number, limit: number): boolean => {
  if (limit === -1) return true;
  if (limit === 0) return false;
  return used < limit;
};

export async function getUsageStatus(sellerId: string, planId?: string): Promise<UsageStatus> {
  try {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        plan_id,
        current_period_start,
        current_period_end,
        subscription_plans (
          id,
          name,
          max_products,
          max_optimizations_monthly,
          max_articles_monthly,
          max_chat_responses_monthly,
          max_campaigns
        )
      `)
      .eq('seller_id', sellerId)
      .eq('status', 'active')
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      throw subError;
    }

    let planData: any;
    let periodStart: string;
    let periodEnd: string;

    if (subscription && subscription.subscription_plans) {
      planData = subscription.subscription_plans;
      periodStart = subscription.current_period_start;
      periodEnd = subscription.current_period_end;
    } else {
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId || 'starter')
        .maybeSingle();

      if (planError || !plan) {
        throw new Error('Plan not found');
      }

      planData = plan;
      const now = new Date();
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    }

    const { count: productsCount } = await supabase
      .from('shopify_products')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    const { count: articlesCount } = await supabase
      .from('blog_articles')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    const { count: campaignsCount } = await supabase
      .from('blog_campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId);

    const { count: chatMessagesCount } = await supabase
      .from('chat_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', sellerId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    const { data: usageData } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('seller_id', sellerId)
      .maybeSingle();

    const productsUsed = productsCount || 0;
    const articlesUsed = articlesCount || 0;
    const campaignsUsed = campaignsCount || 0;
    const chatUsed = chatMessagesCount || 0;
    const optimizationsUsed = usageData?.ai_enrichments_used || 0;

    const usage: UsageStats = {
      products: {
        used: productsUsed,
        limit: planData.max_products,
        percentage: calculatePercentage(productsUsed, planData.max_products),
        canUse: canUseFeature(productsUsed, planData.max_products)
      },
      optimizations: {
        used: optimizationsUsed,
        limit: planData.max_optimizations_monthly,
        percentage: calculatePercentage(optimizationsUsed, planData.max_optimizations_monthly),
        canUse: canUseFeature(optimizationsUsed, planData.max_optimizations_monthly)
      },
      articles: {
        used: articlesUsed,
        limit: planData.max_articles_monthly,
        percentage: calculatePercentage(articlesUsed, planData.max_articles_monthly),
        canUse: canUseFeature(articlesUsed, planData.max_articles_monthly)
      },
      chatResponses: {
        used: chatUsed,
        limit: planData.max_chat_responses_monthly,
        percentage: calculatePercentage(chatUsed, planData.max_chat_responses_monthly),
        canUse: canUseFeature(chatUsed, planData.max_chat_responses_monthly)
      },
      campaigns: {
        used: campaignsUsed,
        limit: planData.max_campaigns,
        percentage: calculatePercentage(campaignsUsed, planData.max_campaigns),
        canUse: canUseFeature(campaignsUsed, planData.max_campaigns)
      }
    };

    return {
      usage,
      plan: {
        id: planData.id,
        name: planData.name,
        limits: {
          max_products: planData.max_products,
          max_optimizations_monthly: planData.max_optimizations_monthly,
          max_articles_monthly: planData.max_articles_monthly,
          max_chat_responses_monthly: planData.max_chat_responses_monthly,
          max_campaigns: planData.max_campaigns
        }
      },
      period: {
        start: periodStart,
        end: periodEnd
      }
    };
  } catch (error) {
    console.error('Error in getUsageStatus:', error);
    throw error;
  }
}

export function formatLimit(value: number): string {
  if (value === -1) return 'Illimité';
  if (value === 0) return 'Non inclus';
  return value.toLocaleString('fr-FR');
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

export function getUsageBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

export function getUsageBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-50 border-red-200';
  if (percentage >= 75) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

export async function updateUsage(sellerId: string, feature: keyof UsageStats, increment: number = 1): Promise<void> {
  try {
    const fieldMap = {
      products: 'products_count',
      optimizations: 'ai_enrichments_used',
      articles: 'blog_articles_used',
      chatResponses: 'chat_messages_used',
      campaigns: 'campaigns_used'
    };

    const fieldName = fieldMap[feature];

    if (!fieldName) {
      console.warn('Unknown feature type:', feature);
      return;
    }

    const { error } = await supabase.rpc('increment_usage', {
      p_seller_id: sellerId,
      p_action: feature,
      p_amount: increment
    });

    if (error) {
      console.error('Error updating usage:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to update usage:', error);
  }
}
