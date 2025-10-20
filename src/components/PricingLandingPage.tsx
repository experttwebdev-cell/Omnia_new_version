import { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  ShoppingBag,
  MessageCircle,
  FileText,
  BarChart3,
  Shield,
  Headphones,
  Search,
  Tag,
  Image,
  Lightbulb,
  BookOpen,
  TrendingUp,
  Package,
  Globe,
  Mail,
  Phone,
  MapPin,
  Github,
  Twitter,
  Linkedin,
  Eye,
  Target,
  Palette,
  Languages,
  ShoppingCart,
  Cpu,
  Star,
  Quote
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Plan {
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

interface PricingLandingPageProps {
  onSignUp: (planId: string) => void;
  onLogin: () => void;
}

export function PricingLandingPage({ onSignUp, onLogin }: PricingLandingPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Sparkles className="w-8 h-8" />;
      case 'professional':
        return <Zap className="w-8 h-8" />;
      case 'enterprise':
        return <Crown className="w-8 h-8" />;
      default:
        return <ShoppingBag className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return 'from-blue-600 to-cyan-600';
      case 'professional':
        return 'from-purple-600 to-pink-600';
      case 'enterprise':
        return 'from-violet-600 to-purple-600';
      default:
        return 'from-gray-600 to-gray-800';
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Illimité';
    return value.toLocaleString('fr-FR');
  };

  const allFeatures = [
    {
      icon: Sparkles,
      title: 'Enrichissement IA Avancé',
      description: 'Génération automatique de descriptions optimisées, extraction d\'attributs produits, analyse visuelle par IA',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Search,
      title: 'SEO Multi-Canal',
      description: 'Optimisation SEO automatique, génération de meta tags, détection d\'opportunités SEO, audit continu',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: MessageCircle,
      title: 'OmniaChat - Assistant IA',
      description: 'Chat intelligent pour recherche produits, recommandations personnalisées, support client automatisé',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: FileText,
      title: 'Générateur de Blog IA',
      description: 'Création automatique d\'articles optimisés SEO, campagnes de contenu, génération d\'images featured',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: ShoppingCart,
      title: 'Google Shopping Integration',
      description: 'Export automatique vers Google Shopping, optimisation des flux produits, gestion des attributs GTIN',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Image,
      title: 'Optimisation Images',
      description: 'Génération automatique d\'attributs ALT, analyse couleurs dominantes, optimisation SEO images',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Tag,
      title: 'Tags & Catégorisation IA',
      description: 'Génération automatique de tags SEO, catégorisation intelligente, taxonomie dynamique',
      gradient: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Lightbulb,
      title: 'Opportunités SEO',
      description: 'Détection automatique d\'opportunités d\'amélioration, suggestions de mots-clés, audit qualité',
      gradient: 'from-yellow-500 to-amber-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Dashboards',
      description: 'Tableaux de bord temps réel, statistiques détaillées, suivi des performances, KPIs personnalisés',
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      icon: Target,
      title: 'Campagnes Marketing IA',
      description: 'Création et gestion de campagnes automatisées, planification de contenu, suivi des résultats',
      gradient: 'from-red-500 to-pink-500',
    },
    {
      icon: Languages,
      title: 'Multi-Langue',
      description: 'Support français et anglais, traductions automatiques, localisation intelligente',
      gradient: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Cpu,
      title: 'API & Intégrations',
      description: 'API REST complète, webhooks Shopify, intégrations personnalisées, edge functions',
      gradient: 'from-gray-500 to-slate-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Sticky */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Omnia AI
              </span>
            </div>
            <button
              onClick={onLogin}
              className="px-6 py-2 rounded-lg font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span className="text-white">Se connecter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              <span>Plateforme SaaS N°1 pour E-Commerce</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6">
              Transformez Votre
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Catalogue Produits
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              Intelligence artificielle avancée pour optimiser automatiquement vos produits, générer du contenu SEO et booster vos ventes
            </p>

            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Enrichissement, SEO, Google Shopping, Chat IA, Blog automatique et bien plus...
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onSignUp('professional')}
                className="group px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
              >
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Essai Gratuit 14 Jours
                </span>
                <ArrowRight className="inline-block ml-2 w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
              >
                Découvrir les fonctionnalités
              </button>
            </div>

            <p className="text-sm text-white/70 mt-6">
              ✨ Aucune carte bancaire requise · 🚀 Installation en 2 minutes · 💯 Garantie satisfait ou remboursé
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                12+
              </div>
              <div className="text-gray-600 font-medium">Fonctionnalités IA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                99.9%
              </div>
              <div className="text-gray-600 font-medium">Uptime Garanti</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                24/7
              </div>
              <div className="text-gray-600 font-medium">Support Disponible</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                2min
              </div>
              <div className="text-gray-600 font-medium">Installation</div>
            </div>
          </div>
        </div>
      </section>

      {/* All Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une suite complète d'outils alimentés par l'IA pour transformer votre boutique en ligne
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-8 border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez ce que nos clients disent de nous
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sophie Martin',
                company: 'Déco Maison',
                role: 'Directrice E-commerce',
                avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
                rating: 5,
                text: 'Omnia AI a transformé notre boutique en ligne. Nos ventes ont augmenté de 45% en 3 mois grâce aux optimisations SEO automatiques.'
              },
              {
                name: 'Thomas Dubois',
                company: 'TechStyle',
                role: 'Fondateur',
                avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
                rating: 5,
                text: 'Le gain de temps est incroyable. Fini les descriptions produits à écrire manuellement. L\'IA génère du contenu de qualité en quelques secondes.'
              },
              {
                name: 'Marie Lefebvre',
                company: 'Mode & Style',
                role: 'Responsable Marketing',
                avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
                rating: 5,
                text: 'Le chat intelligent a révolutionné notre service client. Nos clients obtiennent des réponses instantanées 24/7.'
              },
              {
                name: 'Lucas Petit',
                company: 'Sport & Passion',
                role: 'CEO',
                avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150',
                rating: 5,
                text: 'ROI impressionnant. L\'investissement s\'est remboursé en moins d\'un mois grâce à l\'augmentation du trafic organique.'
              },
              {
                name: 'Emma Bernard',
                company: 'Beauté Naturelle',
                role: 'E-commerce Manager',
                avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
                rating: 5,
                text: 'Interface intuitive et résultats mesurables. Nous voyons l\'impact direct sur nos conversions et notre visibilité.'
              },
              {
                name: 'Pierre Moreau',
                company: 'Maison & Jardin',
                role: 'Directeur Digital',
                avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150',
                rating: 5,
                text: 'Support réactif et fonctionnalités constamment améliorées. C\'est l\'outil indispensable pour tout e-commerçant moderne.'
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-purple-600 mb-3 opacity-30" />
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm font-medium text-purple-600">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tarifs Transparents
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Choisissez le plan qui correspond à vos besoins
            </p>

            <div className="inline-flex items-center gap-4 bg-white rounded-xl p-2 shadow-lg">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  selectedBilling === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                  selectedBilling === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Annuel
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                  -20%
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
              <p className="mt-4 text-gray-600">Chargement des offres...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {plans.map((plan, index) => {
                const price = selectedBilling === 'yearly'
                  ? (Number(plan.price_monthly) * 12 * 0.8).toFixed(2)
                  : Number(plan.price_monthly).toFixed(2);
                const pricePerMonth = selectedBilling === 'yearly'
                  ? (Number(price) / 12).toFixed(2)
                  : price;

                const isPopular = index === 1;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl p-8 transition-all hover:shadow-2xl ${
                      isPopular
                        ? 'border-4 border-purple-500 shadow-2xl scale-105 -my-4'
                        : 'border-2 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      >
                        ⭐ Plus Populaire
                      </div>
                    )}

                    <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(plan.id)} rounded-2xl flex items-center justify-center mb-6 text-white`}>
                      {getPlanIcon(plan.id)}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {pricePerMonth}€
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>

                    {selectedBilling === 'yearly' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-green-700 font-medium">
                          💰 Économisez {(Number(plan.price_monthly) * 12 * 0.2).toFixed(2)}€ par an
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => onSignUp(plan.id)}
                      className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 mb-8 ${
                        isPopular
                          ? 'text-white shadow-lg hover:shadow-xl hover:scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                      style={isPopular ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
                    >
                      Démarrer l'essai gratuit
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {formatLimit(plan.max_products)}
                          </span>
                          <span className="text-gray-600"> produits</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {formatLimit(plan.max_optimizations_monthly)}
                          </span>
                          <span className="text-gray-600"> optimisations IA/mois</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {formatLimit(plan.max_articles_monthly)}
                          </span>
                          <span className="text-gray-600"> articles blog/mois</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {formatLimit(plan.max_chat_responses_monthly)}
                          </span>
                          <span className="text-gray-600"> réponses chat/mois</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                          <span className="font-semibold text-gray-900">
                            {formatLimit(plan.max_campaigns)}
                          </span>
                          <span className="text-gray-600"> campagnes</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                        {plan.features.analytics && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <BarChart3 className="w-4 h-4 text-purple-600" />
                            Analytics {plan.features.analytics}
                          </div>
                        )}
                        {plan.features.support && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Headphones className="w-4 h-4 text-purple-600" />
                            Support {plan.features.support}
                          </div>
                        )}
                        {plan.features.api && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Shield className="w-4 h-4 text-purple-600" />
                            Accès API complet
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center bg-white rounded-2xl p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'un plan personnalisé?
            </h3>
            <p className="text-gray-600 mb-6">
              Contactez-nous pour une solution sur mesure adaptée à vos besoins spécifiques
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              Contacter l'équipe commerciale
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à transformer votre e-commerce?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Rejoignez les centaines de marchands qui utilisent Omnia AI pour optimiser leurs catalogues produits
          </p>
          <button
            onClick={() => onSignUp('professional')}
            className="px-10 py-5 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all hover:scale-105"
          >
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Commencer Gratuitement
            </span>
          </button>
          <p className="text-white/80 mt-6">
            Essai gratuit 14 jours · Sans engagement · Annulation à tout moment
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Omnia AI</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Plateforme SaaS d'optimisation catalogue produits alimentée par l'intelligence artificielle.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Intégrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Carrières</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Partenaires</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Presse</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Statut</a></li>
                <li><button onClick={onLogin} className="hover:text-white transition-colors">Connexion</button></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2025 Omnia AI. Tous droits réservés.
              </p>
              <div className="flex items-center gap-6 text-sm">
                <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
                <a href="#" className="hover:text-white transition-colors">Conditions</a>
                <a href="#" className="hover:text-white transition-colors">Cookies</a>
                <a href="#" className="hover:text-white transition-colors">Mentions légales</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
