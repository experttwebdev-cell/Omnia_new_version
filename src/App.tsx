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
  Quote,
  Clock,
  Users,
  Cloud,
  Lock,
  RefreshCw,
  Download,
  Upload,
  Database,
  Server,
  HelpCircle,
  Play,
  Award,
  Rocket,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Mock data for plans
const mockPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 49,
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
}

export function PricingLandingPage({ onSignUp, onLogin }: PricingLandingPageProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFeatureTab, setActiveFeatureTab] = useState('all');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  useEffect(() => {
    // Simulate loading plans
    setLoading(true);
    const timer = setTimeout(() => {
      setPlans(mockPlans);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Rocket className="w-8 h-8" />;
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
        return {
          gradient: 'from-blue-500 to-cyan-500',
          light: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          text: 'text-blue-600'
        };
      case 'professional':
        return {
          gradient: 'from-purple-500 to-pink-500',
          light: 'from-purple-50 to-pink-50',
          border: 'border-purple-200',
          text: 'text-purple-600'
        };
      case 'enterprise':
        return {
          gradient: 'from-violet-600 to-purple-600',
          light: 'from-violet-50 to-purple-50',
          border: 'border-violet-200',
          text: 'text-violet-600'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-700',
          light: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-600'
        };
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Illimité';
    if (value === 0) return 'Non inclus';
    return value.toLocaleString('fr-FR');
  };

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

  // Plan comparison data
  const planComparison = [
    { feature: 'Produits maximum', key: 'max_products', tooltip: 'Nombre maximum de produits dans votre catalogue' },
    { feature: 'Optimisations IA/mois', key: 'max_optimizations_monthly', tooltip: 'Nombre d\'optimisations IA par mois' },
    { feature: 'Articles blog/mois', key: 'max_articles_monthly', tooltip: 'Nombre d\'articles de blog générés par mois' },
    { feature: 'Réponses chat/mois', key: 'max_chat_responses_monthly', tooltip: 'Nombre de réponses du chat IA par mois' },
    { feature: 'Campagnes marketing', key: 'max_campaigns', tooltip: 'Nombre de campagnes marketing simultanées' },
    { feature: 'Support par chat 24/7', key: 'support_chat', tooltip: 'Support client disponible 24h/24 et 7j/7' },
    { feature: 'Support téléphonique', key: 'support_phone', tooltip: 'Support téléphonique prioritaire' },
    { feature: 'Manager dédié', key: 'dedicated_manager', tooltip: 'Account manager dédié à votre entreprise' },
    { feature: 'Formation personnalisée', key: 'custom_training', tooltip: 'Sessions de formation adaptées à vos besoins' },
    { feature: 'SLA 99.9%', key: 'sla', tooltip: 'Garantie de disponibilité du service' },
    { feature: 'Export de données', key: 'data_export', tooltip: 'Export complet de vos données' },
    { feature: 'API complète', key: 'full_api', tooltip: 'Accès à l\'API complète de la plateforme' }
  ];

  const faqs = [
    {
      question: "Comment fonctionne l'essai gratuit de 14 jours ?",
      answer: "L'essai gratuit vous donne accès à toutes les fonctionnalités du plan choisi pendant 14 jours. Aucune carte bancaire n'est requise pour commencer. Vous pouvez annuler à tout moment pendant la période d'essai."
    },
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer: "Oui, vous pouvez passer à un plan supérieur à tout moment. Le changement vers un plan inférieur est possible à la fin de votre cycle de facturation actuel."
    },
    {
      question: "Quelles plateformes e-commerce sont compatibles ?",
      answer: "Omnia AI s'intègre avec Shopify, WooCommerce, PrestaShop, Magento et toutes les plateformes compatibles avec notre API REST. Nous proposons également des connecteurs personnalisés pour les besoins spécifiques."
    },
    {
      question: "Comment fonctionne l'optimisation IA des produits ?",
      answer: "Notre IA analyse vos produits existants, les descriptions, images et métadonnées. Elle génère automatiquement des descriptions optimisées, des balises SEO, des attributs manquants et suggère des améliorations basées sur les meilleures pratiques."
    },
    {
      question: "Quel est le temps d'intégration moyen ?",
      answer: "La plupart de nos clients sont opérationnels en moins de 30 minutes. L'installation se fait en 3 étapes simples : connexion à votre boutique, configuration des préférences et lancement de l'optimisation automatique."
    }
  ];

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

      {/* Enhanced Stats Section */}
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

      {/* Enhanced Features Section with Tabs */}
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
                Réduire
                <ChevronUp className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Des Tarifs Adaptés à Votre Croissance
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins. Tous les plans incluent notre essai gratuit de 14 jours.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-white rounded-xl p-2 shadow-lg mb-12 border border-gray-200">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  selectedBilling === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Facturation mensuelle
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  selectedBilling === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Facturation annuelle
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                  Économisez 20%
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Chargement des offres...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {plans.map((plan, index) => {
                const price = selectedBilling === 'yearly'
                  ? (Number(plan.price_monthly) * 12 * 0.8).toFixed(2)
                  : Number(plan.price_monthly).toFixed(2);
                const pricePerMonth = selectedBilling === 'yearly'
                  ? (Number(price) / 12).toFixed(2)
                  : price;

                const colors = getPlanColor(plan.id);
                const isPopular = plan.popular;
                const isBestValue = plan.best_value;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl p-8 transition-all duration-500 ${
                      isPopular
                        ? `border-4 ${colors.border} shadow-2xl scale-105 z-10`
                        : 'border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl'
                    } ${hoveredPlan === plan.id ? 'transform scale-105 shadow-2xl' : ''}`}
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                  >
                    {isBestValue && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      >
                        ⭐ Meilleur rapport qualité-prix
                      </div>
                    )}

                    {plan.recommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-violet-600 to-purple-600">
                        🏆 Recommandé
                      </div>
                    )}

                    <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg`}>
                      {getPlanIcon(plan.id)}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{plan.description}</p>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {pricePerMonth}€
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>

                    {selectedBilling === 'yearly' && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-700 font-medium">
                            💰 Économisez {(Number(plan.price_monthly) * 12 * 0.2).toFixed(2)}€ par an
                          </p>
                          <Award className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => onSignUp(plan.id)}
                      className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 mb-8 ${
                        isPopular
                          ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-transparent hover:border-purple-300'
                      }`}
                      style={isPopular ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
                    >
                      <Rocket className="w-5 h-5" />
                      Démarrer l'essai gratuit
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="space-y-4">
                      {/* Core Limits */}
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Package className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_products)}
                            </span>
                            <span className="text-gray-600"> produits maximum</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_optimizations_monthly)}
                            </span>
                            <span className="text-gray-600"> optimisations IA/mois</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <FileText className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_articles_monthly)}
                            </span>
                            <span className="text-gray-600"> articles blog/mois</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <MessageCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_chat_responses_monthly)}
                            </span>
                            <span className="text-gray-600"> réponses chat/mois</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Target className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_campaigns)}
                            </span>
                            <span className="text-gray-600"> campagnes marketing</span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Features */}
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
                        {plan.features.backup && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Database className="w-4 h-4 text-purple-600" />
                            Sauvegarde automatique
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Plan Comparison Table */}
          <div id="comparison" className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Comparaison détaillée des plans
              </h3>
              <p className="text-gray-600">Tout ce que vous devez savoir pour faire le bon choix</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 font-semibold text-gray-900 pl-4">Fonctionnalités</th>
                    {plans.map(plan => (
                      <th key={plan.id} className="text-center py-4 font-semibold text-gray-900">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planComparison.map((row, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 group">
                      <td className="py-4 font-medium text-gray-700 pl-4">
                        <div className="flex items-center gap-2">
                          {row.feature}
                          <div className="relative group">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs rounded-lg p-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                              {row.tooltip}
                            </div>
                          </div>
                        </div>
                      </td>
                      {plans.map(plan => {
                        let value = plan[row.key as keyof Plan];
                        if (value === undefined) {
                          value = plan.features[row.key];
                        }
                        
                        return (
                          <td key={plan.id} className="text-center py-4">
                            {typeof value === 'number' ? (
                              <span className="font-semibold text-gray-900">{formatLimit(value)}</span>
                            ) : value ? (
                              <div className="flex justify-center">
                                <Check className="w-5 h-5 text-green-500" />
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Plan CTA */}
          <div className="text-center mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'un plan personnalisé?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Nos solutions sur mesure s'adaptent à vos besoins spécifiques. Volume important, fonctionnalités exclusives, intégrations personnalisées, SLA avancé...
            </p>
            <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
              Contacter l'équipe commerciale
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Questions Fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur Omnia AI
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                >
                  <span className="font-semibold text-gray-900 text-lg">{faq.question}</span>
                  {activeFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {activeFAQ === index && (
                  <div className="px-6 py-4 bg-white border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 3px 3px, white 2px, transparent 0)',
            backgroundSize: '30px 30px'
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à booster votre e-commerce?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Rejoignez les centaines de marchands qui utilisent Omnia AI pour optimiser leurs catalogues produits et augmenter leurs ventes de manière significative
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => onSignUp('professional')}
              className="px-10 py-5 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Commencer Gratuitement
              </span>
            </button>
            
            <button
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Voir tous les plans
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Essai gratuit 14 jours</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Annulation à tout moment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Omnia AI</span>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Plateforme SaaS d'optimisation catalogue produits alimentée par l'intelligence artificielle pour booster votre e-commerce.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { icon: Twitter, href: '#' },
                  { icon: Linkedin, href: '#' },
                  { icon: Github, href: '#' }
                ].map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Produit',
                links: ['Fonctionnalités', 'Tarifs', 'Documentation', 'API', 'Intégrations', 'Statut']
              },
              {
                title: 'Entreprise',
                links: ['À propos', 'Blog', 'Carrières', 'Partenaires', 'Presse', 'Contact']
              },
              {
                title: 'Support',
                links: ['Centre d\'aide', 'Contact', 'Statut', 'Connexion', 'RGPD', 'Mentions légales']
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2 text-sm">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="hover:text-white transition-colors duration-200">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400">
                © 2025 Omnia AI. Tous droits réservés.
              </p>
              <div className="flex items-center gap-6 text-sm">
                {['Confidentialité', 'Conditions', 'Cookies', 'Mentions légales'].map((item, index) => (
                  <a key={index} href="#" className="hover:text-white transition-colors duration-200">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}