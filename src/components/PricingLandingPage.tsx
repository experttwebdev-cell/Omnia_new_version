import { useState, useEffect } from 'react';
import {
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  Play,
  Brain,
  Orbit,
  Atom,
  Cpu,
  CircuitBoard,
  TrendingUp,
  Package,
  FileText,
  MessageCircle,
  Target,
  Star,
  Quote,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Headphones
} from 'lucide-react';

// Mock data for plans - UPDATED WITH NEW PRICING AND FEATURES
const mockPlans = [
  {
    id: 'starter',
    name: 'Starter Lite',
    price_monthly: 14.99,
    price_yearly: 149,
    max_products: 100,
    max_optimizations_monthly: 500,
    max_articles_monthly: 2,
    max_campaigns: 2,
    max_chat_responses_monthly: 300,
    features: {
      analytics: 'Basique',
      support: 'Email',
      api: false,
      backup: 'Quotidien',
      support_chat: false,
      support_phone: false,
      dedicated_manager: false,
      custom_training: false,
      sla: '99%',
      data_export: false,
      full_api: false,
      included_tokens: '15K',
      extra_tokens_price: '0.08€/1K',
      google_shopping: 'Non inclus',
      seo_audit: 'Mensuel basique',
      features_included: ['Optimisation SEO IA', 'Assistant Chat Basique', 'Analytics Essentials']
    },
    stripe_price_id: 'price_starter',
    description: 'Parfait pour débuter avec l\'IA',
    popular: false,
    best_value: false,
    recommended: false,
    usage_based: false,
    roi_estimate: '2-3x ROI',
    extra_features: '+3 fonctionnalités essentielles'
  },
  {
    id: 'professional',
    name: 'Professional AI',
    price_monthly: 89,
    price_yearly: 890,
    max_products: 2500,
    max_optimizations_monthly: 7500,
    max_articles_monthly: 8,
    max_campaigns: 5,
    max_chat_responses_monthly: 8000,
    features: {
      analytics: 'Avancé',
      support: 'Email & Chat',
      api: true,
      backup: 'Quotidien',
      support_chat: true,
      support_phone: false,
      dedicated_manager: false,
      custom_training: true,
      sla: '99.5%',
      data_export: true,
      full_api: true,
      included_tokens: '300K',
      extra_tokens_price: '0.06€/1K',
      google_shopping: 'Export basique',
      seo_audit: 'Hebdomadaire',
      features_included: ['Optimisation SEO IA', 'Assistant Chat Avancé', 'Google Shopping', 'Analytics Prédictifs', 'Campagnes Automatisées']
    },
    stripe_price_id: 'price_professional',
    description: 'Solution complète pour professionnels',
    popular: true,
    best_value: true,
    recommended: false,
    usage_based: false,
    roi_estimate: '4-5x ROI',
    extra_features: '+5 fonctionnalités avancées'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Commerce+',
    price_monthly: 249,
    price_yearly: 2490,
    max_products: -1,
    max_optimizations_monthly: -1,
    max_articles_monthly: -1,
    max_campaigns: -1,
    max_chat_responses_monthly: -1,
    features: {
      analytics: 'Enterprise',
      support: 'Dédié 24/7',
      api: true,
      backup: 'Temps réel',
      support_chat: true,
      support_phone: true,
      dedicated_manager: true,
      custom_training: true,
      sla: '99.9%',
      data_export: true,
      full_api: true,
      included_tokens: '1.5M',
      extra_tokens_price: '0.04€/1K',
      google_shopping: 'Export illimité + optimisation IA',
      seo_audit: 'Quotidien',
      features_included: ['Toutes les fonctionnalités', 'Support Prioritaire', 'Formation Personnalisée', 'API Complète', 'Analytics Avancés']
    },
    stripe_price_id: 'price_enterprise',
    description: 'Entreprise avec tout illimité',
    popular: false,
    best_value: false,
    recommended: true,
    usage_based: false,
    roi_estimate: '6-8x ROI',
    extra_features: '+6 fonctionnalités enterprise'
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
  usage_based?: boolean;
  roi_estimate?: string;
  extra_features?: string;
}

interface PricingLandingPageProps {
  onSignUp?: (planId: string) => void;
  onLogin?: () => void;
  onManageSubscription?: () => void;
}

export function PricingLandingPage({ onSignUp, onLogin, onManageSubscription }: PricingLandingPageProps = {}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFeatureTab, setActiveFeatureTab] = useState('all');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const handleLogin = () => {
    onLogin?.();
  };

  const handleSignUp = (planId: string = 'professional') => {
    onSignUp?.(planId);
  };

  useEffect(() => {
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
        return <Atom className="w-8 h-8" />;
      case 'professional':
        return <Brain className="w-8 h-8" />;
      case 'enterprise':
        return <Orbit className="w-8 h-8" />;
      default:
        return <Cpu className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'starter':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          light: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          text: 'text-blue-600',
          bg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
          glow: 'shadow-lg shadow-blue-500/25'
        };
      case 'professional':
        return {
          gradient: 'from-blue-600 to-indigo-600',
          light: 'from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          text: 'text-blue-600',
          bg: 'bg-gradient-to-r from-blue-600 to-indigo-600',
          glow: 'shadow-lg shadow-blue-500/25'
        };
      case 'enterprise':
        return {
          gradient: 'from-indigo-600 to-blue-700',
          light: 'from-indigo-50 to-blue-50',
          border: 'border-indigo-200',
          text: 'text-indigo-600',
          bg: 'bg-gradient-to-r from-indigo-600 to-blue-700',
          glow: 'shadow-lg shadow-indigo-500/25'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-700',
          light: 'from-gray-50 to-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-600',
          bg: 'bg-gradient-to-r from-gray-500 to-gray-700',
          glow: 'shadow-lg shadow-gray-500/25'
        };
    }
  };

  const formatLimit = (value: number) => {
    if (value === -1) return 'Illimité';
    if (value === 0) return 'Non inclus';
    return value.toLocaleString('fr-FR');
  };

  const featureCategories = [
    {
      id: 'all',
      name: 'Toutes les solutions',
      icon: CircuitBoard,
      count: 8
    },
    {
      id: 'optimisation',
      name: 'Optimisation IA',
      icon: Sparkles,
      count: 3
    },
    {
      id: 'marketing',
      name: 'Marketing Automatisé',
      icon: TrendingUp,
      count: 3
    },
    {
      id: 'support',
      name: 'Support Client',
      icon: Headphones,
      count: 2
    }
  ];

  const allFeatures = [
    {
      icon: Brain,
      title: 'Cerveau IA Omni-Connecté',
      description: 'Réseau neuronal avancé qui analyse et optimise simultanément tous les aspects de votre e-commerce',
      gradient: 'from-blue-500 to-cyan-500',
      category: 'optimisation',
      plans: ['starter', 'professional', 'enterprise'],
      highlight: true,
      benefit: '+45% de trafic organique'
    },
    {
      icon: Orbit,
      title: 'Orbit Marketing Intelligence',
      description: 'Système orbital qui synchronise automatiquement tous vos canaux marketing en temps réel',
      gradient: 'from-blue-500 to-indigo-500',
      category: 'marketing',
      plans: ['professional', 'enterprise'],
      highlight: true,
      benefit: '-65% de charge marketing'
    },
    {
      icon: Atom,
      title: 'Noyau Atomique de Données',
      description: 'Traitement quantique des données client pour une personnalisation infinie',
      gradient: 'from-cyan-500 to-blue-500',
      category: 'optimisation',
      plans: ['professional', 'enterprise'],
      highlight: false,
      benefit: 'Personnalisation 99% précise'
    },
    {
      icon: Cpu,
      title: 'Processeur Prédictif Quantique',
      description: 'Anticipez les tendances du marché 6 mois à l\'avance avec notre IA quantique',
      gradient: 'from-indigo-500 to-blue-600',
      category: 'optimisation',
      plans: ['enterprise'],
      highlight: true,
      benefit: 'Décisions 3x plus rapides'
    },
    {
      icon: CircuitBoard,
      title: 'Réseau Neural Commerce',
      description: 'Connectivité totale entre vos produits, clients et marchés en temps réel',
      gradient: 'from-blue-500 to-indigo-600',
      category: 'support',
      plans: ['starter', 'professional', 'enterprise'],
      benefit: 'Connectivité 100% temps réel'
    },
    {
      icon: Zap,
      title: 'Énergie Marketing Automatisée',
      description: 'Campagnes auto-générées qui s\'adaptent dynamiquement au comportement client',
      gradient: 'from-cyan-500 to-blue-600',
      category: 'marketing',
      plans: ['professional', 'enterprise'],
      benefit: 'Conversion +28%'
    }
  ];

  const filteredFeatures = showAllFeatures 
    ? allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab)
    : allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab).slice(0, 6);

  const testimonials = [
    {
      name: 'Marie Dubois',
      company: 'Mode & Style Paris',
      role: 'Directrice E-commerce',
      rating: 5,
      text: 'L\'IA Omnia a complètement transformé notre approche. C\'est comme avoir une équipe de 50 experts IA 24/7.',
      metric: 'ROI 4x en 60 jours'
    },
    {
      name: 'Thomas Martin',
      company: 'TechImport',
      role: 'Fondateur',
      rating: 5,
      text: 'La solution la plus avancée que j\'ai vue. L\'IA prédictive a anticipé des tendances que personne n\'avait vues.',
      metric: 'Chiffre 5x en 1 an'
    },
    {
      name: 'Sophie Lambert',
      company: 'Beauté Nature',
      role: 'Responsable Marketing',
      rating: 5,
      text: 'Le cerveau IA Omnia synchronise parfaitement tous nos canaux. Plus besoin de 5 outils différents.',
      metric: 'Satisfaction client 98%'
    }
  ];

  const faqs = [
    {
      question: "En quoi Omnia AI est-elle différente des autres solutions ?",
      answer: "Omnia AI utilise une architecture neuronale unique qui connecte simultanément tous les aspects de votre e-commerce, créant un écosystème intelligent et auto-optimisé plutôt que des outils séparés."
    },
    {
      question: "L'IA peut-elle vraiment tout gérer ?",
      answer: "Notre système Omnia fonctionne comme un cerveau digital central qui orchestre l'ensemble de votre e-commerce, de l'optimisation produit au marketing prédictif, en passant par le service client automatisé."
    },
    {
      question: "Quelle est la courbe d'apprentissage ?",
      answer: "Grâce à notre interface neuronale intuitive, vous verrez des résultats dès les premières heures. Le système apprend et s'adapte continuellement à votre business."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/25">
                  <Brain className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Omnia AI
                </span>
                <div className="text-xs text-gray-500 -mt-1 font-medium">Complete Neural Commerce</div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                Solutions
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                Tarifs
              </a>
              <a href="#faq" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                Connexion
              </button>
              <button
                onClick={() => handleSignUp('professional')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all duration-200"
              >
                Essai Gratuit 14j
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-800">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span>IA Neuronale Nouvelle Génération</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              L'Intelligence qui
              <br />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                Connecte Tout
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed">
              Le premier cerveau digital unifié pour e-commerce. 
              Une IA qui pense, apprend et agit sur l'ensemble de votre business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => handleSignUp('professional')}
                className="group px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Activer le Cerveau IA
                </span>
                <ArrowRight className="inline-block ml-2 w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="group px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center gap-2">
                <Play className="w-5 h-5" />
                Voir la démo neuronale
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Cerveau IA unifié</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Apprentissage continu</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Réseau neuronal sécurisé</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              L'IA qui Pense en Réseau
            </h2>
            <p className="text-xl text-gray-600">
              Des connexions intelligentes, des résultats exponentiels
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '360°', label: 'Couverture complète business', icon: Orbit },
              { number: '0.2s', label: 'Temps de réaction IA', icon: Zap },
              { number: '∞', label: 'Connexions simultanées', icon: Brain },
              { number: '99.9%', label: 'Précision prédictive', icon: Target }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
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
              Architecture Neuronale Complète
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Un réseau intelligent qui connecte chaque aspect de votre e-commerce
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {featureCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFeatureTab(category.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeFeatureTab === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white rounded-2xl p-6 border-2 border-gray-200 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-4">{feature.description}</p>
                  
                  {feature.benefit && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 mb-3">
                      <TrendingUp className="w-3 h-3" />
                      {feature.benefit}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Accès au Réseau Neural
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Choisissez votre niveau de connexion à l'IA Omnia
            </p>

            <div className="inline-flex items-center gap-4 bg-white rounded-xl p-2 shadow-lg mb-12 border border-gray-200">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  selectedBilling === 'monthly'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  selectedBilling === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Annuel
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                  -17%
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Initialisation du réseau neural...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {plans.map((plan) => {
                const price = selectedBilling === 'yearly' ? plan.price_yearly : plan.price_monthly;
                const monthlyPrice = selectedBilling === 'yearly' ? (plan.price_yearly / 12).toFixed(2) : plan.price_monthly;
                const colors = getPlanColor(plan.id);
                const isPopular = plan.popular;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl p-8 transition-all duration-500 ${
                      isPopular
                        ? 'border-4 border-blue-200 shadow-2xl scale-105 z-10'
                        : 'border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-cyan-500">
                        🚀 POPULAIRE
                      </div>
                    )}

                    <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg`}>
                      {getPlanIcon(plan.id)}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                        {selectedBilling === 'yearly' ? `${monthlyPrice}€` : `${price}€`}
                      </span>
                      <span className="text-gray-600">/mois</span>
                      {selectedBilling === 'yearly' && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          {plan.price_monthly}€
                        </span>
                      )}
                    </div>

                    {selectedBilling === 'yearly' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-700 font-medium text-center">
                          💰 Économisez {((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}€ par an
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleSignUp(plan.id)}
                      className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 mb-8 ${
                        isPopular
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-transparent hover:border-blue-300'
                      }`}
                    >
                      {isPopular ? 'Sélectionné' : 'Choisir'}
                    </button>

                    <div className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Package className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              Jusqu'à {formatLimit(plan.max_products)} produits
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <Zap className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_optimizations_monthly)} optimisations SEO/mois
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <FileText className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_articles_monthly)} article de blog/mois
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="text-sm font-semibold text-gray-900 mb-3">
                          {plan.extra_features}
                        </div>
                        <div className="space-y-2">
                          {plan.features.features_included.map((feature: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                              <Check className="w-4 h-4 text-green-500" />
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ils Nous Font Confiance
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm font-medium text-blue-600">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-blue-900 to-cyan-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à Connecter Votre Business ?
          </h2>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
            Rejoignez le réseau neural Omnia AI et donnez à votre e-commerce une intelligence qui pense, apprend et agit en temps réel.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => handleSignUp('professional')}
              className="px-10 py-5 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300"
            >
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Activer l'IA Omnia
              </span>
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2024 Omnia AI. Neural Commerce Intelligence.
          </p>
        </div>
      </footer>
    </div>
  );
}