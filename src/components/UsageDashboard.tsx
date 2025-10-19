import { useState, useEffect } from 'react';
import {
  Package,
  Sparkles,
  FileText,
  MessageCircle,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Crown,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { getUsageStatus, formatLimit, getUsageColor, getUsageBarColor, type UsageStatus } from '../lib/usageLimits';

export function UsageDashboard() {
  const { seller, plan } = useAuth();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (seller && plan) {
      loadUsageStatus();
    }
  }, [seller, plan]);

  const loadUsageStatus = async () => {
    if (!seller || !plan) return;

    setLoading(true);
    try {
      const status = await getUsageStatus(seller.id, plan.id);
      setUsageStatus(status);
    } catch (error) {
      console.error('Error loading usage status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!usageStatus || !plan) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Impossible de charger les statistiques d'utilisation</p>
      </div>
    );
  }

  const usageItems = [
    {
      key: 'products',
      icon: Package,
      label: 'Produits',
      description: 'Produits dans votre catalogue',
      color: 'blue',
    },
    {
      key: 'optimizations',
      icon: Sparkles,
      label: 'Optimisations IA',
      description: 'Enrichissements ce mois-ci',
      color: 'purple',
    },
    {
      key: 'articles',
      icon: FileText,
      label: 'Articles Blog',
      description: 'Articles générés ce mois-ci',
      color: 'green',
    },
    {
      key: 'chatResponses',
      icon: MessageCircle,
      label: 'Réponses Chat',
      description: 'Conversations ce mois-ci',
      color: 'pink',
    },
    {
      key: 'campaigns',
      icon: Target,
      label: 'Campagnes',
      description: 'Campagnes actives',
      color: 'orange',
    },
  ];

  const isTrialing = seller?.status === 'trial';
  const trialEndsAt = seller?.trial_ends_at ? new Date(seller.trial_ends_at) : null;
  const daysRemaining = trialEndsAt
    ? Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Plan Info */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-blue-100">
                {Number(plan.price_monthly).toFixed(2)}€/mois
              </p>
            </div>
          </div>
          {isTrialing && (
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm font-semibold">
                Essai gratuit - {daysRemaining} jours restants
              </p>
            </div>
          )}
        </div>

        {isTrialing && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-blue-100">
              🎉 Profitez de toutes les fonctionnalités pendant votre période d'essai.
              Aucune carte bancaire requise!
            </p>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {usageItems.map((item) => {
          const usage = usageStatus.usage[item.key as keyof typeof usageStatus.usage];
          const isUnlimited = usage.limit === -1;
          const isNearLimit = usage.percentage >= 75 && !isUnlimited;
          const isOverLimit = usage.percentage >= 100 && !isUnlimited;

          return (
            <div
              key={item.key}
              className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                isOverLimit
                  ? 'border-red-200 bg-red-50'
                  : isNearLimit
                  ? 'border-yellow-200 bg-yellow-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-${item.color}-100 rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                </div>
                {isOverLimit ? (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                ) : usage.canUse ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : null}
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-1">{item.label}</h4>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {usage.used.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-gray-600">
                    / {isUnlimited ? '∞' : usage.limit.toLocaleString('fr-FR')}
                  </span>
                </div>

                {!isUnlimited && (
                  <>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getUsageBarColor(usage.percentage)}`}
                        style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-medium ${
                        isOverLimit
                          ? 'text-red-600'
                          : isNearLimit
                          ? 'text-yellow-600'
                          : 'text-gray-600'
                      }`}>
                        {usage.percentage.toFixed(0)}% utilisé
                      </span>
                      {isOverLimit && (
                        <span className="text-red-600 font-semibold">
                          Limite atteinte
                        </span>
                      )}
                    </div>
                  </>
                )}

                {isUnlimited && (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Utilisation illimitée
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {(usageStatus.usage.products.percentage >= 75 ||
        usageStatus.usage.optimizations.percentage >= 75) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vous approchez de vos limites
              </h3>
              <p className="text-gray-700 mb-4">
                Passez à un plan supérieur pour débloquer plus de ressources et continuer à faire grandir votre activité.
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all">
                Voir les plans
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Period Info */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Informations de facturation</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Plan actuel:</span> {plan.name}
          </p>
          <p>
            <span className="font-medium">Statut:</span>{' '}
            {isTrialing ? 'Période d\'essai' : 'Actif'}
          </p>
          {isTrialing && trialEndsAt && (
            <p>
              <span className="font-medium">Fin de l'essai:</span>{' '}
              {trialEndsAt.toLocaleDateString('fr-FR')}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-4">
            Les statistiques d'utilisation se réinitialisent le 1er de chaque mois.
          </p>
        </div>
      </div>
    </div>
  );
}
