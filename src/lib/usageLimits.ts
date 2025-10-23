// Types pour le suivi d'utilisation
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

// Fonction pour calculer le pourcentage d'utilisation
const calculatePercentage = (used: number, limit: number): number => {
  if (limit === -1) return 0; // Illimité
  if (limit === 0) return 100; // Non inclus
  return Math.min((used / limit) * 100, 100);
};

// Fonction pour vérifier si l'utilisateur peut utiliser la fonctionnalité
const canUseFeature = (used: number, limit: number): boolean => {
  if (limit === -1) return true; // Illimité
  if (limit === 0) return false; // Non inclus
  return used < limit;
};

// Mock data - À remplacer par des appels API réels
const mockUsageData = {
  'starter': {
    products: { used: 85, limit: 100 },
    optimizations: { used: 200, limit: 300 },
    articles: { used: 0, limit: 1 },
    chatResponses: { used: 150, limit: 200 },
    campaigns: { used: 0, limit: 1 }
  },
  'professional': {
    products: { used: 1250, limit: 2000 },
    optimizations: { used: 3500, limit: 5000 },
    articles: { used: 3, limit: 5 },
    chatResponses: { used: 3200, limit: 5000 },
    campaigns: { used: 2, limit: 3 }
  },
  'enterprise': {
    products: { used: 5000, limit: -1 },
    optimizations: { used: 15000, limit: -1 },
    articles: { used: 25, limit: -1 },
    chatResponses: { used: 12000, limit: -1 },
    campaigns: { used: 8, limit: -1 }
  }
};

// Mock plan data
const mockPlans = {
  'starter': {
    id: 'starter',
    name: 'Starter',
    limits: {
      max_products: 100,
      max_optimizations_monthly: 300,
      max_articles_monthly: 1,
      max_chat_responses_monthly: 200,
      max_campaigns: 1
    }
  },
  'professional': {
    id: 'professional',
    name: 'Professional',
    limits: {
      max_products: 2000,
      max_optimizations_monthly: 5000,
      max_articles_monthly: 5,
      max_chat_responses_monthly: 5000,
      max_campaigns: 3
    }
  },
  'enterprise': {
    id: 'enterprise',
    name: 'Enterprise',
    limits: {
      max_products: -1,
      max_optimizations_monthly: -1,
      max_articles_monthly: -1,
      max_chat_responses_monthly: -1,
      max_campaigns: -1
    }
  }
};

// Fonction principale pour obtenir le statut d'utilisation
export async function getUsageStatus(sellerId: string, planId: string): Promise<UsageStatus> {
  // Simulation d'un appel API
  await new Promise(resolve => setTimeout(resolve, 500));

  const planData = mockPlans[planId as keyof typeof mockPlans];
  const usageData = mockUsageData[planId as keyof typeof mockUsageData];

  if (!planData || !usageData) {
    throw new Error('Plan non trouvé');
  }

  const usage: UsageStats = {
    products: {
      used: usageData.products.used,
      limit: planData.limits.max_products,
      percentage: calculatePercentage(usageData.products.used, planData.limits.max_products),
      canUse: canUseFeature(usageData.products.used, planData.limits.max_products)
    },
    optimizations: {
      used: usageData.optimizations.used,
      limit: planData.limits.max_optimizations_monthly,
      percentage: calculatePercentage(usageData.optimizations.used, planData.limits.max_optimizations_monthly),
      canUse: canUseFeature(usageData.optimizations.used, planData.limits.max_optimizations_monthly)
    },
    articles: {
      used: usageData.articles.used,
      limit: planData.limits.max_articles_monthly,
      percentage: calculatePercentage(usageData.articles.used, planData.limits.max_articles_monthly),
      canUse: canUseFeature(usageData.articles.used, planData.limits.max_articles_monthly)
    },
    chatResponses: {
      used: usageData.chatResponses.used,
      limit: planData.limits.max_chat_responses_monthly,
      percentage: calculatePercentage(usageData.chatResponses.used, planData.limits.max_chat_responses_monthly),
      canUse: canUseFeature(usageData.chatResponses.used, planData.limits.max_chat_responses_monthly)
    },
    campaigns: {
      used: usageData.campaigns.used,
      limit: planData.limits.max_campaigns,
      percentage: calculatePercentage(usageData.campaigns.used, planData.limits.max_campaigns),
      canUse: canUseFeature(usageData.campaigns.used, planData.limits.max_campaigns)
    }
  };

  // Période actuelle (mois en cours)
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    usage,
    plan: planData,
    period: {
      start: periodStart.toISOString(),
      end: periodEnd.toISOString()
    }
  };
}

// Fonction pour formater les limites
export function formatLimit(value: number): string {
  if (value === -1) return 'Illimité';
  if (value === 0) return 'Non inclus';
  return value.toLocaleString('fr-FR');
}

// Fonction pour obtenir la couleur en fonction du pourcentage d'utilisation
export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 75) return 'text-yellow-600';
  return 'text-green-600';
}

// Fonction pour obtenir la couleur de la barre de progression
export function getUsageBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-500';
  if (percentage >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
}

// Fonction pour obtenir la couleur de fond en fonction du pourcentage
export function getUsageBgColor(percentage: number): string {
  if (percentage >= 90) return 'bg-red-50 border-red-200';
  if (percentage >= 75) return 'bg-yellow-50 border-yellow-200';
  return 'bg-green-50 border-green-200';
}

// Fonction pour mettre à jour l'utilisation (simulation)
export async function updateUsage(sellerId: string, feature: keyof UsageStats, increment: number = 1): Promise<void> {
  // Simulation d'un appel API pour mettre à jour l'utilisation
  await new Promise(resolve => setTimeout(resolve, 200));
  console.log(`Mise à jour usage: ${feature} +${increment} pour seller ${sellerId}`);
  
  // En production, cela appellerait votre API pour incrémenter le compteur
}