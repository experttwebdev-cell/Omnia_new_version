import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { EmailVerification } from './components/EmailVerification';
import { supabase } from './lib/supabase';
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
  TrendingUp,
  Target,
  Languages,
  ShoppingCart,
  Cpu,
  Star,
  Clock,
  Users,
  Database,
  Server,
  RefreshCw,
  Play,
  Rocket,
  ChevronDown,
  ChevronUp,
  CreditCard,
  LogOut
} from 'lucide-react';

// Mock data for plans
const mockPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 49,
    price_yearly: 470,
    max_products: 500,
    max_optimizations_monthly: 1000,
    max_articles_monthly: 10,
    max_campaigns: 3,
    max_chat_responses_monthly: 500,
    features: {
      analytics: 'Basique',
      support: 'Email',
      api: false,
      backup: false,
      support_chat: true,
      support_phone: false,
      dedicated_manager: false,
      custom_training: false,
      sla: false,
      data_export: false,
      full_api: false
    },
    stripe_price_id: 'price_starter',
    description: 'Parfait pour les petites boutiques qui débutent avec l\'IA',
    popular: false,
    best_value: false,
    recommended: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price_monthly: 99,
    price_yearly: 950,
    max_products: 5000,
    max_optimizations_monthly: 10000,
    max_articles_monthly: 50,
    max_campaigns: 10,
    max_chat_responses_monthly: 5000,
    features: {
      analytics: 'Avancé',
      support: 'Prioritaire',
      api: true,
      backup: true,
      support_chat: true,
      support_phone: true,
      dedicated_manager: false,
      custom_training: true,
      sla: true,
      data_export: true,
      full_api: true
    },
    stripe_price_id: 'price_professional',
    description: 'Idéal pour les e-commerces en croissance avec un volume important',
    popular: true,
    best_value: true,
    recommended: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 299,
    price_yearly: 2870,
    max_products: -1,
    max_optimizations_monthly: -1,
    max_articles_monthly: -1,
    max_campaigns: -1,
    max_chat_responses_monthly: -1,
    features: {
      analytics: 'Entreprise',
      support: 'Dédié 24/7',
      api: true,
      backup: true,
      support_chat: true,
      support_phone: true,
      dedicated_manager: true,
      custom_training: true,
      sla: true,
      data_export: true,
      full_api: true
    },
    stripe_price_id: 'price_enterprise',
    description: 'Solution complète pour les grandes entreprises et marketplaces',
    popular: false,
    best_value: false,
    recommended: true
  }
];

interface Plan {
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
  description?: string;
  popular?: boolean;
  best_value?: boolean;
  recommended?: boolean;
}

interface PricingLandingPageProps {
  onSignUp: (planId: string) => void;
  onLogin: () => void;
  onManageSubscription?: () => void;
}

// Enhanced Pricing Landing Page Component
export function PricingLandingPage({ onSignUp, onLogin, onManageSubscription }: PricingLandingPageProps) {
  const { user, subscription, loading: authLoading } = useAuth();
  const [activeFeatureTab, setActiveFeatureTab] = useState('all');
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user && !authLoading) {
      console.log('✅ User already authenticated, redirecting to dashboard');
      window.location.href = '/dashboard';
    }
  }, [user, authLoading]);

  // Enhanced features with categories
  const featureCategories = [
    {
      id: 'all',
      name: 'Toutes les fonctionnalités',
      icon: Sparkles,
      count: 16
    },
    {
      id: 'ai',
      name: 'Intelligence Artificielle',
      icon: Cpu,
      count: 4
    },
    {
      id: 'seo',
      name: 'SEO & Marketing',
      icon: TrendingUp,
      count: 6
    },
    {
      id: 'content',
      name: 'Contenu & Blog',
      icon: FileText,
      count: 3
    },
    {
      id: 'support',
      name: 'Support & Sécurité',
      icon: Shield,
      count: 3
    }
  ];

  const allFeatures = [
    {
      icon: Sparkles,
      title: 'Enrichissement IA Avancé',
      description: 'Génération automatique de descriptions optimisées, extraction d\'attributs produits, analyse visuelle par IA',
      gradient: 'from-blue-500 to-cyan-500',
      category: 'ai',
      plans: ['starter', 'professional', 'enterprise'],
      highlight: true
    },
    {
      icon: Search,
      title: 'SEO Multi-Canal',
      description: 'Optimisation SEO automatique, génération de meta tags, détection d\'opportunités SEO, audit continu',
      gradient: 'from-purple-500 to-pink-500',
      category: 'seo',
      plans: ['starter', 'professional', 'enterprise'],
      highlight: true
    },
    {
      icon: MessageCircle,
      title: 'OmniaChat - Assistant IA',
      description: 'Chat intelligent pour recherche produits, recommandations personnalisées, support client automatisé',
      gradient: 'from-green-500 to-emerald-500',
      category: 'ai',
      plans: ['professional', 'enterprise'],
      highlight: true
    },
    {
      icon: FileText,
      title: 'Générateur de Blog IA',
      description: 'Création automatique d\'articles optimisés SEO, campagnes de contenu, génération d\'images featured',
      gradient: 'from-orange-500 to-red-500',
      category: 'content',
      plans: ['professional', 'enterprise']
    },
    {
      icon: ShoppingCart,
      title: 'Google Shopping Integration',
      description: 'Export automatique vers Google Shopping, optimisation des flux produits, gestion des attributs GTIN',
      gradient: 'from-pink-500 to-rose-500',
      category: 'seo',
      plans: ['professional', 'enterprise']
    },
    {
      icon: Image,
      title: 'Optimisation Images',
      description: 'Génération automatique d\'attributs ALT, analyse couleurs dominantes, optimisation SEO images',
      gradient: 'from-violet-500 to-purple-500',
      category: 'seo',
      plans: ['starter', 'professional', 'enterprise']
    },
    {
      icon: Tag,
      title: 'Tags & Catégorisation IA',
      description: 'Génération automatique de tags SEO, catégorisation intelligente, taxonomie dynamique',
      gradient: 'from-indigo-500 to-blue-500',
      category: 'ai',
      plans: ['starter', 'professional', 'enterprise']
    },
    {
      icon: Lightbulb,
      title: 'Opportunités SEO',
      description: 'Détection automatique d\'opportunités d\'amélioration, suggestions de mots-clés, audit qualité',
      gradient: 'from-yellow-500 to-amber-500',
      category: 'seo',
      plans: ['professional', 'enterprise']
    },
    {
      icon: BarChart3,
      title: 'Analytics & Dashboards',
      description: 'Tableaux de bord temps réel, statistiques détaillées, suivi des performances, KPIs personnalisés',
      gradient: 'from-teal-500 to-cyan-500',
      category: 'seo',
      plans: ['professional', 'enterprise']
    },
    {
      icon: Target,
      title: 'Campagnes Marketing IA',
      description: 'Création et gestion de campagnes automatisées, planification de contenu, suivi des résultats',
      gradient: 'from-red-500 to-pink-500',
      category: 'seo',
      plans: ['enterprise']
    },
    {
      icon: Languages,
      title: 'Multi-Langue',
      description: 'Support français et anglais, traductions automatiques, localisation intelligente',
      gradient: 'from-blue-500 to-indigo-500',
      category: 'content',
      plans: ['professional', 'enterprise']
    },
    {
      icon: Cpu,
      title: 'API & Intégrations',
      description: 'API REST complète, webhooks Shopify, intégrations personnalisées, edge functions',
      gradient: 'from-gray-500 to-slate-500',
      category: 'support',
      plans: ['professional', 'enterprise']
    },
    {
      icon: Database,
      title: 'Sauvegarde Automatique',
      description: 'Sauvegarde quotidienne des données, restauration instantanée, historique des modifications',
      gradient: 'from-green-500 to-teal-500',
      category: 'support',
      plans: ['professional', 'enterprise']
    },
    {
      icon: Shield,
      title: 'Sécurité Avancée',
      description: 'Chiffrement SSL, conformité RGPD, authentification 2FA, audits de sécurité réguliers',
      gradient: 'from-blue-500 to-indigo-500',
      category: 'support',
      plans: ['enterprise']
    },
    {
      icon: Headphones,
      title: 'Support Prioritaire',
      description: 'Support dédié 24/7, temps de réponse garanti, manager de compte dédié',
      gradient: 'from-purple-500 to-pink-500',
      category: 'support',
      plans: ['enterprise']
    },
    {
      icon: Users,
      title: 'Équipe Illimitée',
      description: 'Nombre illimité d\'utilisateurs, gestion des rôles, permissions granulaires',
      gradient: 'from-orange-500 to-red-500',
      category: 'support',
      plans: ['enterprise']
    }
  ];

  const filteredFeatures = showAllFeatures 
    ? allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab)
    : allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab).slice(0, 6);

  // Enhanced Header with User Menu
  const UserMenu = () => {
    const [isOpen, setIsOpen] = useState(false);

    if (!user) {
      return (
        <div className="flex items-center gap-4">
          <button
            onClick={onLogin}
            className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200"
          >
            Connexion
          </button>
          <button
            onClick={() => onSignUp('professional')}
            className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
          >
            <span className="text-white">Essai Gratuit</span>
          </button>
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-all duration-200"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">{user.email}</div>
            <div className="text-xs text-gray-500">
              {subscription?.plan?.name ? `${subscription.plan.name} • ` : 'Free Trial • '}
              <span className={`${
                subscription?.status === 'active' ? 'text-green-600' : 'text-orange-600'
              }`}>
                {subscription?.status === 'active' ? 'Actif' : 'Essai'}
              </span>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">{user.email}</div>
              <div className="text-xs text-gray-500 mt-1">
                {subscription?.plan?.name ? `Plan ${subscription.plan.name}` : 'Essai gratuit'}
              </div>
            </div>
            
            <button
              onClick={() => {
                onManageSubscription?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <CreditCard className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Gérer l'abonnement</span>
            </button>

            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Tableau de bord</span>
            </button>

            <div className="border-t border-gray-100 mt-2 pt-2">
              <button 
                onClick={() => {
                  supabase.auth.signOut();
                  window.location.href = '/';
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-red-600"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header with Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Omnia AI
              </span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                Fonctionnalités
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                Tarifs
              </a>
              <a href="#comparison" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                Comparaison
              </a>
              <a href="#faq" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                FAQ
              </a>
            </nav>

            <UserMenu />
          </div>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/3 w-24 h-24 bg-white/8 rounded-full blur-xl animate-pulse delay-150"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 border border-white/30">
              <Sparkles className="w-4 h-4" />
              <span>Plateforme SaaS N°1 pour E-Commerce</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Transformez Votre
              <br />
              <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                Catalogue Produits
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto leading-relaxed">
              Intelligence artificielle avancée pour optimiser automatiquement vos produits, générer du contenu SEO et booster vos ventes
            </p>

            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Enrichissement IA, SEO, Google Shopping, Chat intelligent, Blog automatique et bien plus...
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              {!user ? (
                <>
                  <button
                    onClick={() => onSignUp('professional')}
                    className="group px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
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
                    className="group px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Voir la démo
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => window.location.href = '/dashboard'}
                    className="group px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
                  >
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Accéder au Dashboard
                    </span>
                    <ArrowRight className="inline-block ml-2 w-5 h-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    onClick={onManageSubscription}
                    className="group px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    Gérer l'abonnement
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Aucune carte bancaire requise</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Installation en 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Garantie satisfait ou remboursé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '12+', label: 'Fonctionnalités IA', icon: Sparkles, suffix: '' },
              { number: '99.9', label: 'Uptime Garanti', icon: Server, suffix: '%' },
              { number: '24/7', label: 'Support Disponible', icon: Headphones, suffix: '' },
              { number: '2', label: 'Installation', icon: Clock, suffix: 'min' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}{stat.suffix}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Une Suite Complète d'Outils IA
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez comment notre intelligence artificielle transforme votre gestion de catalogue produits
            </p>
          </div>

          {/* Feature Categories Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {featureCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFeatureTab(category.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeFeatureTab === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.name}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activeFeatureTab === category.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-2 ${
                    feature.highlight 
                      ? 'border-purple-300 shadow-lg hover:shadow-xl' 
                      : 'border-gray-200 hover:border-purple-200 hover:shadow-lg'
                  }`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {feature.highlight && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
                      <Star className="w-3 h-3 fill-purple-600" />
                      Populaire
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-4">{feature.description}</p>
                  
                  {/* Plan Availability */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Disponible sur :</span>
                      <div className="flex gap-1">
                        {feature.plans.map(plan => (
                          <span
                            key={plan}
                            className={`px-2 py-1 rounded font-medium ${
                              plan === 'starter' ? 'bg-blue-100 text-blue-800' :
                              plan === 'professional' ? 'bg-purple-100 text-purple-800' :
                              'bg-violet-100 text-violet-800'
                            }`}
                          >
                            {plan}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show More/Less Button */}
          {!showAllFeatures && filteredFeatures.length >= 6 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllFeatures(true)}
                className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                Voir toutes les fonctionnalités
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}

          {showAllFeatures && (
            <div className="text-center">
              <button
                onClick={() => setShowAllFeatures(false)}
                className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                Voir moins de fonctionnalités
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Prêt à Transformer Votre E-Commerce ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Rejoignez des centaines de boutiques qui optimisent leurs catalogues avec l'IA
          </p>
          {!user ? (
            <button
              onClick={() => onSignUp('professional')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105"
            >
              Commencer Gratuitement
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-2xl hover:scale-105"
            >
              Accéder au Dashboard
              <ArrowRight className="inline-block ml-2 w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold">Omnia AI</span>
            </div>
            <p className="text-gray-400 mb-4">
              Optimisez votre catalogue produits avec l'intelligence artificielle
            </p>
            <p className="text-gray-500 text-sm">
              © 2025 Omnia AI. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Enhanced Subscription Management Component
function SubscriptionManagementPage({ onBack }: { onBack: () => void }) {
  const { user, subscription, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      window.location.href = '/';
    }
  }, [user, loading]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connectez-vous pour gérer votre abonnement</h2>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      // Implementation for canceling subscription
      console.log('Canceling subscription');
      setShowCancelConfirm(false);
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000);
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <div className="p-2 rounded-xl shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <ShoppingBag className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Omnia AI
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Aller au Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion de l'abonnement</h1>
          <p className="text-gray-600">Gérez votre plan, votre facturation et vos paramètres de compte</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', name: 'Vue d\'ensemble', icon: BarChart3 },
              { id: 'billing', name: 'Facturation', icon: CreditCard },
              { id: 'usage', name: 'Utilisation', icon: TrendingUp },
              { id: 'settings', name: 'Paramètres', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Current Plan Overview */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Plan {subscription?.plan?.name || 'Essai'}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {subscription && subscription.current_period_end ? (
                          <>
                            Prochain paiement: {formatDate(subscription.current_period_end)} • 
                            <span className={`ml-2 ${
                              subscription.status === 'active' ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              {subscription.status === 'active' ? 'Actif' : 'En attente'}
                            </span>
                          </>
                        ) : (
                          'Essai gratuit - 14 jours restants'
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {subscription?.amount ? `${subscription.amount}€` : '0€'}
                      </div>
                      <div className="text-gray-600">
                        {subscription?.billing_cycle === 'yearly' ? 'par an' : 'par mois'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setActiveTab('billing')}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left"
                  >
                    <CreditCard className="w-8 h-8 text-purple-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Méthode de paiement</h4>
                    <p className="text-sm text-gray-600">Mettre à jour votre carte bancaire</p>
                  </button>

                  <button
                    onClick={() => window.location.href = '/'}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 transition-colors text-left"
                  >
                    <RefreshCw className="w-8 h-8 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Changer de plan</h4>
                    <p className="text-sm text-gray-600">Adapter votre abonnement à vos besoins</p>
                  </button>

                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="p-4 bg-white border border-gray-200 rounded-xl hover:border-red-300 transition-colors text-left"
                  >
                    <LogOut className="w-8 h-8 text-red-600 mb-2" />
                    <h4 className="font-semibold text-gray-900 mb-1">Résilier</h4>
                    <p className="text-sm text-gray-600">Annuler votre abonnement</p>
                  </button>
                </div>
              </div>
            )}

            {/* Rest of the subscription management tabs */}
            {/* ... */}

          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmer la résiliation</h3>
              <p className="text-gray-600 mb-6">
                Êtes-vous sûr de vouloir résilier votre abonnement? 
                Vous pourrez toujours réactiver votre compte plus tard.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCancelSubscription}
                  disabled={processing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {processing ? 'Résiliation...' : 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const [currentView, setCurrentView] = useState<'landing' | 'signup' | 'login' | 'verify-email' | 'subscription'>('landing');
  const [selectedPlan, setSelectedPlan] = useState<string>('professional');

  // Check if URL contains verify-email route
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('/verify-email')) {
      setCurrentView('verify-email');
    }
  }, []);

  const handleSignUp = (planId: string) => {
    console.log('Sign up clicked with plan:', planId);
    setSelectedPlan(planId);
    setCurrentView('signup');
  };

  const handleLogin = () => {
    console.log('Login clicked');
    setCurrentView('login');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  const handleManageSubscription = () => {
    setCurrentView('subscription');
  };

  const handleVerificationSuccess = () => {
    // After successful verification, redirect to dashboard
    window.location.href = '/dashboard';
  };

  const handleSignupSuccess = () => {
    console.log('Signup successful, redirecting to dashboard');
    window.location.href = '/dashboard';
  };

  const handleLoginSuccess = () => {
    console.log('Login successful, redirecting to dashboard');
    window.location.href = '/dashboard';
  };

  if (currentView === 'verify-email') {
    return (
      <EmailVerification
        onSuccess={handleVerificationSuccess}
        onBack={handleBackToLanding}
      />
    );
  }

  if (currentView === 'subscription') {
    return <SubscriptionManagementPage onBack={handleBackToLanding} />;
  }

  if (currentView === 'landing') {
    return (
      <PricingLandingPage 
        onSignUp={handleSignUp} 
        onLogin={handleLogin}
        onManageSubscription={handleManageSubscription}
      />
    );
  }

  if (currentView === 'signup') {
    return (
      <SignUpPage
        planId={selectedPlan}
        onLogin={handleLogin}
        onBack={handleBackToLanding}
        onSignupSuccess={handleSignupSuccess}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <LoginPage
        onSignUp={() => handleSignUp('professional')}
        onBack={handleBackToLanding}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <PricingLandingPage 
      onSignUp={handleSignUp} 
      onLogin={handleLogin}
      onManageSubscription={handleManageSubscription}
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 