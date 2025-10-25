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
  ArrowUpRight,
  Calendar,
  RefreshCw,
  Zap,
  BarChart3,
  Info
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { getUsageStatus, formatLimit, getUsageBarColor, getUsageBgColor, type UsageStatus } from '../lib/usageLimits';

export function UsageDashboard() {
  const { user } = useAuth();
  const [usageStatus, setUsageStatus] = useState<UsageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadUsageStatus();
    }
  }, [user]);

  const loadUsageStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Pour la démo, on utilise 'professional' comme plan par défaut
      // En production, vous récupéreriez le plan réel de l'utilisateur
      const status = await getUsageStatus(user.id, 'professional');
      setUsageStatus(status);
    } catch (error) {
      console.error('Error loading usage status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUsageStatus();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        <p className="text-gray-600">Chargement des statistiques d'utilisation...</p>
      </div>
    );
  }

  if (!usageStatus) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">Impossible de charger les statistiques d'utilisation</p>
        <button
          onClick={handleRefresh}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const usageItems = [
    {
      key: 'products' as const,
      icon: Package,
      label: 'Produits',
      description: 'Produits dans votre catalogue',
      color: 'blue',
      helpText: 'Nombre maximum de produits que vous pouvez avoir dans votre catalogue'
    },
    {
      key: 'optimizations' as const,
      icon: Sparkles,
      label: 'Optimisations IA',
      description: 'Enrichissements ce mois-ci',
      color: 'purple',
      helpText: 'Nombre d\'optimisations IA que vous pouvez effectuer par mois'
    },
    {
      key: 'articles' as const,
      icon: FileText,
      label: 'Articles Blog',
      description: 'Articles générés ce mois-ci',
      color: 'green',
      helpText: 'Nombre d\'articles de blog que vous pouvez générer par mois'
    },
    {
      key: 'chatResponses' as const,
      icon: MessageCircle,
      label: 'Réponses Chat',
      description: 'Conversations ce mois-ci',
      color: 'pink',
      helpText: 'Nombre de réponses du chat IA que vous pouvez utiliser par mois'
    },
    {
      key: 'campaigns' as const,
      icon: Target,
      label: 'Campagnes',
      description: 'Campagnes marketing actives',
      color: 'orange',
      helpText: 'Nombre de campagnes marketing que vous pouvez créer simultanément'
    },
  ];

  const isTrialing = true; // À remplacer par la donnée réelle de l'utilisateur
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 jours dans le futur
  const daysRemaining = Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Vérifier si au moins une limite est presque atteinte
  const hasNearLimit = Object.values(usageStatus.usage).some(
    usage => usage.percentage >= 75 && usage.limit !== -1
  );

  // Vérifier si au moins une limite est dépassée
  const hasOverLimit = Object.values(usageStatus.usage).some(
    usage => usage.percentage >= 100 && usage.limit !== -1
  );

  return (
    <div className="space-y-6">
      {/* En-tête avec rafraîchissement */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tableau de bord d'utilisation</h2>
          <p className="text-gray-600">Surveillez votre utilisation des ressources</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Plan Info */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold">{usageStatus.plan.name}</h3>
              <p className="text-blue-100">
                Plan actuel • Période du {' '}
                {new Date(usageStatus.period.start).toLocaleDateString('fr-FR')} au {' '}
                {new Date(usageStatus.period.end).toLocaleDateString('fr-FR')}
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

      {/* Alertes de limites */}
      {hasOverLimit && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Limites atteintes</h4>
              <p className="text-red-700 text-sm">
                Vous avez atteint certaines limites de votre plan. Passez à un plan supérieur pour continuer à utiliser toutes les fonctionnalités.
              </p>
            </div>
          </div>
        </div>
      )}

      {hasNearLimit && !hasOverLimit && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">Limites approchantes</h4>
              <p className="text-yellow-700 text-sm">
                Vous approchez des limites de certaines fonctionnalités. Surveillez votre utilisation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {usageItems.map((item) => {
          const usage = usageStatus.usage[item.key];
          const isUnlimited = usage.limit === -1;
          const isNearLimit = usage.percentage >= 75 && !isUnlimited;
          const isOverLimit = usage.percentage >= 100 && !isUnlimited;

          // Couleurs basées sur le type
          const colorClasses = {
            blue: {
              bg: 'bg-blue-100',
              text: 'text-blue-600',
              border: 'border-blue-200'
            },
            purple: {
              bg: 'bg-purple-100',
              text: 'text-purple-600',
              border: 'border-purple-200'
            },
            green: {
              bg: 'bg-green-100',
              text: 'text-green-600',
              border: 'border-green-200'
            },
            pink: {
              bg: 'bg-pink-100',
              text: 'text-pink-600',
              border: 'border-pink-200'
            },
            orange: {
              bg: 'bg-orange-100',
              text: 'text-orange-600',
              border: 'border-orange-200'
            }
          };

          const colors = colorClasses[item.color as keyof typeof colorClasses];

          return (
            <div
              key={item.key}
              className={`bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg ${
                isOverLimit
                  ? 'border-red-200 bg-red-50'
                  : isNearLimit
                  ? 'border-yellow-200 bg-yellow-50'
                  : `${colors.border} hover:border-${item.color}-300`
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center`}>
                  <item.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex items-center gap-2">
                  {isOverLimit ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : usage.canUse ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : null}
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg p-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      {item.helpText}
                    </div>
                  </div>
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-900 mb-1">{item.label}</h4>
              <p className="text-sm text-gray-600 mb-4">{item.description}</p>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-gray-900">
                    {usage.used.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-sm text-gray-600">
                    / {isUnlimited ? '∞' : formatLimit(usage.limit)}
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
                      {isOverLimit ? (
                        <span className="text-red-600 font-semibold">
                          Limite atteinte
                        </span>
                      ) : isNearLimit ? (
                        <span className="text-yellow-600 font-semibold">
                          Presque plein
                        </span>
                      ) : (
                        <span className="text-green-600 font-semibold">
                          Dans la limite
                        </span>
                      )}
                    </div>
                  </>
                )}

                {isUnlimited && (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <Zap className="w-4 h-4" />
                    Utilisation illimitée
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Résumé d'utilisation</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Fonctionnalités utilisées:</span>
              <span className="font-semibold">
                {Object.values(usageStatus.usage).filter(usage => usage.used > 0).length} / {Object.values(usageStatus.usage).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Limites approchantes:</span>
              <span className="font-semibold text-yellow-600">
                {Object.values(usageStatus.usage).filter(usage => usage.percentage >= 75 && usage.limit !== -1).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Limites atteintes:</span>
              <span className="font-semibold text-red-600">
                {Object.values(usageStatus.usage).filter(usage => usage.percentage >= 100 && usage.limit !== -1).length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Période de facturation</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Début:</span>
              <span className="font-semibold">
                {new Date(usageStatus.period.start).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fin:</span>
              <span className="font-semibold">
                {new Date(usageStatus.period.end).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jours restants:</span>
              <span className="font-semibold">
                {Math.ceil((new Date(usageStatus.period.end).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recommandation</h3>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              {hasOverLimit 
                ? 'Passez à un plan supérieur pour débloquer plus de ressources.'
                : hasNearLimit
                ? 'Votre utilisation est élevée. Envisagez un plan supérieur pour continuer à croître.'
                : 'Votre utilisation est optimale. Continuez comme ça!'
              }
            </p>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm">
              Voir les plans
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade CTA */}
      {(hasNearLimit || hasOverLimit) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {hasOverLimit ? 'Limites atteintes' : 'Vous approchez de vos limites'}
              </h3>
              <p className="text-gray-700 mb-4">
                {hasOverLimit
                  ? 'Vous avez atteint certaines limites de votre plan actuel. Passez à un plan supérieur pour continuer à utiliser toutes les fonctionnalités.'
                  : 'Passez à un plan supérieur pour débloquer plus de ressources et continuer à faire grandir votre activité.'
                }
              </p>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg font-semibold transition-all">
                Voir les plans supérieurs
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}