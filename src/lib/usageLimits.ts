import { supabase } from './supabase';

export interface UsageStats {
  products_count: number;
  optimizations_this_month: number;
  articles_this_month: number;
  chat_responses_this_month: number;
  campaigns_active: number;
}

export interface UsageLimits {
  max_products: number;
  max_optimizations_monthly: number;
  max_articles_monthly: number;
  max_campaigns: number;
  max_chat_responses_monthly: number;
}

export interface UsageStatus {
  stats: UsageStats;
  limits: UsageLimits;
  usage: {
    products: { used: number; limit: number; percentage: number; canUse: boolean };
    optimizations: { used: number; limit: number; percentage: number; canUse: boolean };
    articles: { used: number; limit: number; percentage: number; canUse: boolean };
    campaigns: { used: number; limit: number; percentage: number; canUse: boolean };
    chatResponses: { used: number; limit: number; percentage: number; canUse: boolean };
  };
}

export async function getUsageStats(sellerId: string): Promise<UsageStats | null> {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [productsCount, optimizationsCount, articlesCount, chatCount, campaignsCount] = await Promise.all([
      supabase
        .from('shopify_products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', sellerId),

      supabase
        .from('shopify_products')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('enrichment_status', 'enriched')
        .gte('updated_at', firstDayOfMonth),

      supabase
        .from('blog_articles')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .gte('created_at', firstDayOfMonth),

      supabase
        .from('chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .gte('created_at', firstDayOfMonth),

      supabase
        .from('blog_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', sellerId)
        .eq('status', 'active')
    ]);

    return {
      products_count: productsCount.count || 0,
      optimizations_this_month: optimizationsCount.count || 0,
      articles_this_month: articlesCount.count || 0,
      chat_responses_this_month: chatCount.count || 0,
      campaigns_active: campaignsCount.count || 0,
    };
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    return null;
  }
}

export async function getUsageStatus(sellerId: string, planId: string): Promise<UsageStatus | null> {
  try {
    const [stats, planData] = await Promise.all([
      getUsageStats(sellerId),
      supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()
    ]);

    if (!stats || !planData.data) return null;

    const limits: UsageLimits = {
      max_products: planData.data.max_products,
      max_optimizations_monthly: planData.data.max_optimizations_monthly,
      max_articles_monthly: planData.data.max_articles_monthly,
      max_campaigns: planData.data.max_campaigns,
      max_chat_responses_monthly: planData.data.max_chat_responses_monthly,
    };

    const calculateUsage = (used: number, limit: number) => {
      const isUnlimited = limit === -1;
      const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
      const canUse = isUnlimited || used < limit;
      return { used, limit, percentage, canUse };
    };

    return {
      stats,
      limits,
      usage: {
        products: calculateUsage(stats.products_count, limits.max_products),
        optimizations: calculateUsage(stats.optimizations_this_month, limits.max_optimizations_monthly),
        articles: calculateUsage(stats.articles_this_month, limits.max_articles_monthly),
        campaigns: calculateUsage(stats.campaigns_active, limits.max_campaigns),
        chatResponses: calculateUsage(stats.chat_responses_this_month, limits.max_chat_responses_monthly),
      },
    };
  } catch (error) {
    console.error('Error getting usage status:', error);
    return null;
  }
}

export async function checkCanUseFeature(
  sellerId: string,
  planId: string,
  feature: 'products' | 'optimizations' | 'articles' | 'campaigns' | 'chatResponses'
): Promise<boolean> {
  const status = await getUsageStatus(sellerId, planId);
  if (!status) return false;
  return status.usage[feature].canUse;
}

export async function incrementUsage(
  sellerId: string,
  feature: 'optimizations' | 'articles' | 'chatResponses'
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    switch (feature) {
      case 'optimizations':
        break;
      case 'articles':
        break;
      case 'chatResponses':
        break;
    }

    return true;
  } catch (error) {
    console.error('Error incrementing usage:', error);
    return false;
  }
}

export function formatLimit(value: number): string {
  if (value === -1) return 'Illimité';
  return value.toLocaleString('fr-FR');
}

export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600 bg-red-50 border-red-200';
  if (percentage >= 75) return 'text-orange-600 bg-orange-50 border-orange-200';
  if (percentage >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  return 'text-green-600 bg-green-50 border-green-200';
}

export function getUsageBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-600';
  if (percentage >= 75) return 'bg-orange-600';
  if (percentage >= 50) return 'bg-yellow-600';
  return 'bg-green-600';
}
