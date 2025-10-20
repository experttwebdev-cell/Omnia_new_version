import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Package,
  Target,
  Languages,
  ShoppingCart,
  Cpu,
  Star,
  Quote,
  Clock,
  Users,
  Database,
  Server,
  HelpCircle,
  Play,
  Award,
  Rocket,
  ChevronDown,
  ChevronUp,
  CreditCard,
  BarChart,
  Bot,
  Cloud,
  Workflow,
  Gem,
  Cube,
  Brain,
  Orbit,
  Atom,
  CircuitBoard,
  CpuIcon
} from 'lucide-react';

// Mock data for plans - UPDATED WITH NEW PRICING AND FEATURES
const mockPlans = [
  {
    id: 'starter',
    name: 'Starter Lite',
    price_monthly: 9.99,
    max_products: 100,
    max_optimizations_monthly: 300,
    max_articles_monthly: 1,
    max_campaigns: 1,
    max_chat_responses_monthly: 200,
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
      included_tokens: '10K',
      extra_tokens_price: '0.10€/1K',
      google_shopping: 'Non inclus',
      seo_audit: 'Mensuel basique',
      features_included: ['Optimisation SEO IA', 'Assistant Chat Basique']
    },
    stripe_price_id: 'price_starter',
    description: 'Parfait pour débuter avec l\'IA',
    popular: false,
    best_value: false,
    recommended: false,
    usage_based: false,
    roi_estimate: '1.5-2x ROI',
    extra_features: '+2 fonctionnalités essentielles'
  },
  {
    id: 'professional',
    name: 'Professional AI',
    price_monthly: 79,
    max_products: 2000,
    max_optimizations_monthly: 5000,
    max_articles_monthly: 5,
    max_campaigns: 3,
    max_chat_responses_monthly: 5000,
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
      included_tokens: '200K',
      extra_tokens_price: '0.07€/1K',
      google_shopping: 'Export basique',
      seo_audit: 'Hebdomadaire',
      features_included: ['Optimisation SEO IA', 'Assistant Chat Avancé', 'Google Shopping', 'Analytics Prédictifs']
    },
    stripe_price_id: 'price_professional',
    description: 'Solution complète pour professionnels',
    popular: true,
    best_value: true,
    recommended: false,
    usage_based: false,
    roi_estimate: '3-4x ROI',
    extra_features: '+4 fonctionnalités avancées'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Commerce+',
    price_monthly: 199,
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
      included_tokens: '1M',
      extra_tokens_price: '0.05€/1K',
      google_shopping: 'Export illimité + optimisation IA',
      seo_audit: 'Quotidien',
      features_included: ['Toutes les fonctionnalités', 'Support Prioritaire', 'Formation Personnalisée', 'API Complète']
    },
    stripe_price_id: 'price_enterprise',
    description: 'Entreprise avec tout illimité',
    popular: false,
    best_value: false,
    recommended: true,
    usage_based: false,
    roi_estimate: '5-8x ROI',
    extra_features: '+6 fonctionnalités enterprise'
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
  usage_based?: boolean;
  roi_estimate?: string;
  extra_features?: string;
}

export function PricingLandingPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [activeFeatureTab, setActiveFeatureTab] = useState('all');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  // Fonctions de navigation
  const handleLogin = () => {
    console.log('Navigation vers login');
    navigate('/login');
  };

  const handleSignUp = (planId: string = 'professional') => {
    console.log('Navigation vers signup avec plan:', planId);
    navigate(`/signup/${planId}`);
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
          gradient: 'from-cyan-500 to-blue-500',
          light: 'from-cyan-50 to-blue-50',
          border: 'border-cyan-200',
          text: 'text-cyan-600',
          bg: 'bg-gradient-to-r from-cyan-500 to-blue-500',
          glow: 'shadow-lg shadow-cyan-500/25'
        };
      case 'professional':
        return {
          gradient: 'from-purple-500 to-pink-500',
          light: 'from-purple-50 to-pink-50',
          border: 'border-purple-200',
          text: 'text-purple-600',
          bg: 'bg-gradient-to-r from-purple-500 to-pink-500',
          glow: 'shadow-lg shadow-purple-500/25'
        };
      case 'enterprise':
        return {
          gradient: 'from-orange-500 to-red-500',
          light: 'from-orange-50 to-red-50',
          border: 'border-orange-200',
          text: 'text-orange-600',
          bg: 'bg-gradient-to-r from-orange-500 to-red-500',
          glow: 'shadow-lg shadow-orange-500/25'
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

  // Features data
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
      gradient: 'from-purple-500 to-pink-500',
      category: 'optimisation',
      plans: ['starter', 'professional', 'enterprise'],
      highlight: true,
      benefit: '+45% de trafic organique'
    },
    {
      icon: Orbit,
      title: 'Orbit Marketing Intelligence',
      description: 'Système orbital qui synchronise automatiquement tous vos canaux marketing en temps réel',
      gradient: 'from-blue-500 to-cyan-500',
      category: 'marketing',
      plans: ['professional', 'enterprise'],
      highlight: true,
      benefit: '-65% de charge marketing'
    },
    {
      icon: Atom,
      title: 'Noyau Atomique de Données',
      description: 'Traitement quantique des données client pour une personnalisation infinie',
      gradient: 'from-green-500 to-emerald-500',
      category: 'optimisation',
      plans: ['professional', 'enterprise'],
      highlight: false,
      benefit: 'Personnalisation 99% précise'
    },
    {
      icon: Cpu,
      title: 'Processeur Prédictif Quantique',
      description: 'Anticipez les tendances du marché 6 mois à l\'avance avec notre IA quantique',
      gradient: 'from-orange-500 to-red-500',
      category: 'optimisation',
      plans: ['enterprise'],
      highlight: true,
      benefit: 'Décisions 3x plus rapides'
    },
    {
      icon: CircuitBoard,
      title: 'Réseau Neural Commerce',
      description: 'Connectivité totale entre vos produits, clients et marchés en temps réel',
      gradient: 'from-indigo-500 to-purple-500',
      category: 'support',
      plans: ['starter', 'professional', 'enterprise'],
      benefit: 'Connectivité 100% temps réel'
    },
    {
      icon: Zap,
      title: 'Énergie Marketing Automatisée',
      description: 'Campagnes auto-générées qui s\'adaptent dynamiquement au comportement client',
      gradient: 'from-yellow-500 to-amber-500',
      category: 'marketing',
      plans: ['professional', 'enterprise'],
      benefit: 'Conversion +28%'
    }
  ];

  const filteredFeatures = showAllFeatures 
    ? allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab)
    : allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab).slice(0, 6);

  // Testimonials
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
      {/* Header avec logo futuriste Omnia AI */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Nouveau logo futuriste Omnia AI */}
              <div className="relative group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/25 transform group-hover:rotate-180 transition-transform duration-700">
                  <div className="relative">
                    <Brain className="w-6 h-6 text-white filter drop-shadow-lg" />
                    <div className="absolute -inset-1 bg-cyan-400 rounded-full blur-sm opacity-50 animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-2xl blur-md opacity-30 -z-10 group-hover:opacity-50 transition-opacity duration-300"></div>
                {/* Effet d'orbite */}
                <div className="absolute -inset-3 border-2 border-purple-400/30 rounded-3xl animate-spin-slow -z-20"></div>
              </div>
              <div>
                <span className="text-2xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  Omnia AI
                </span>
                <div className="text-xs text-gray-500 -mt-1 font-medium">Complete Neural Commerce</div>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                Solutions
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                Tarifs
              </a>
              <a href="#faq" className="text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <button
                onClick={handleLogin}
                className="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium transition-colors duration-200"
              >
                Connexion
              </button>
              <button
                onClick={() => handleSignUp('professional')}
                className="px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600"
              >
                <span className="text-white">Essai Gratuit 14j</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section Futuriste */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        {/* Effets de fond futuristes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)
            `,
            backgroundSize: '50% 50%, 60% 60%, 70% 70%'
          }} />
        </div>

        {/* Particules animées */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-cyan-400 rounded-full blur-sm animate-float"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-purple-400 rounded-full blur-sm animate-float delay-75"></div>
        <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-blue-400 rounded-full blur-sm animate-float delay-150"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span>IA Neuronale Nouvelle Génération</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              L'Intelligence qui
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Connecte Tout
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-4 max-w-3xl mx-auto leading-relaxed">
              Le premier cerveau digital unifié pour e-commerce. 
              Une IA qui pense, apprend et agit sur l'ensemble de votre business.
            </p>

            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Omnia signifie "tout" en latin. Notre IA fait exactement cela.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => handleSignUp('professional')}
                className="group px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Activer le Cerveau IA
                </span>
                <ArrowRight className="inline-block ml-2 w-5 h-5 text-gray-600 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300 flex items-center gap-2"
              >
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

      {/* Stats Section Futuriste */}
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
              { number: '360°', label: 'Couverture complète business', icon: Orbit, suffix: '' },
              { number: '0.2s', label: 'Temps de réaction IA', icon: Zap, suffix: '' },
              { number: '∞', label: 'Connexions simultanées', icon: Brain, suffix: '' },
              { number: '99.9%', label: 'Précision prédictive', icon: Target, suffix: '' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg hover:shadow-xl">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent mb-2">
                  {stat.number}{stat.suffix}
                </div>
                <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section Futuriste */}
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

          {/* Feature Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {featureCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveFeatureTab(category.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    activeFeatureTab === category.id
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg transform scale-105'
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
                      ? 'border-cyan-300 shadow-lg hover:shadow-xl' 
                      : 'border-gray-200 hover:border-purple-200 hover:shadow-lg'
                  }`}
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {feature.highlight && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-medium rounded-full mb-2">
                      <Zap className="w-3 h-3 fill-cyan-600" />
                      Cœur Neural
                    </div>
                  )}
                  
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed text-sm mb-4">{feature.description}</p>
                  
                  {feature.benefit && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-green-600 mb-3">
                      <TrendingUp className="w-3 h-3" />
                      {feature.benefit}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Niveau neural :</span>
                    <div className="flex gap-1">
                      {feature.plans.map(plan => (
                        <span
                          key={plan}
                          className={`px-2 py-1 rounded font-medium ${
                            plan === 'starter' ? 'bg-cyan-100 text-cyan-800' :
                            plan === 'professional' ? 'bg-purple-100 text-purple-800' :
                            'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {plan}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {!showAllFeatures && filteredFeatures.length >= 6 && (
            <div className="text-center">
              <button
                onClick={() => setShowAllFeatures(true)}
                className="px-6 py-3 bg-white border-2 border-purple-200 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all duration-300 flex items-center gap-2 mx-auto"
              >
                Explorer tout le réseau neural
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Section Futuriste */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Accès au Réseau Neural
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choisissez votre niveau de connexion à l'IA Omnia
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-white rounded-xl p-2 shadow-lg mb-12 border border-gray-200">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  selectedBilling === 'monthly'
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  selectedBilling === 'yearly'
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-lg transform scale-105'
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Initialisation du réseau neural...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {plans.map((plan) => {
                const price = selectedBilling === 'yearly'
                  ? (Number(plan.price_monthly) * 12 * 0.83).toFixed(2)
                  : Number(plan.price_monthly).toFixed(2);
                const pricePerMonth = selectedBilling === 'yearly'
                  ? (Number(price) / 12).toFixed(2)
                  : price;

                const colors = getPlanColor(plan.id);
                const isPopular = plan.popular;
                const isRecommended = plan.recommended;

                return (
                  <div
                    key={plan.id}
                    className={`relative bg-white rounded-3xl p-8 transition-all duration-500 ${
                      isPopular
                        ? `border-4 ${colors.border} shadow-2xl scale-105 z-10 ${colors.glow}`
                        : 'border-2 border-gray-200 hover:border-purple-300 hover:shadow-xl'
                    } ${hoveredPlan === plan.id ? 'transform scale-105 shadow-2xl' : ''}`}
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                  >
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-purple-600 to-cyan-500">
                        🚀 POPULAIRE
                      </div>
                    )}

                    {isRecommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-orange-500 to-red-500">
                        ⭐ SÉLECTIONNÉ
                      </div>
                    )}

                    <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${colors.glow}`}>
                      {getPlanIcon(plan.id)}
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{plan.description}</p>
                    
                    {plan.roi_estimate && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-700 font-medium">
                            📈 {plan.roi_estimate}
                          </p>
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-cyan-500 bg-clip-text text-transparent">
                        {pricePerMonth}€
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>

                    {selectedBilling === 'yearly' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-700 font-medium text-center">
                          💰 Économisez {((Number(plan.price_monthly) * 12) - Number(price)).toFixed(2)}€ par an
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleSignUp(plan.id)}
                      className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 mb-8 ${
                        isPopular || isRecommended
                          ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-transparent hover:border-purple-300'
                      }`}
                      style={isPopular || isRecommended ? { background: `linear-gradient(135deg, ${plan.id === 'professional' ? '#8B5CF6, #06B6D4' : plan.id === 'enterprise' ? '#F59E0B, #EF4444' : '#06B6D4, #3B82F6'})` } : {}}
                    >
                      {isPopular || isRecommended ? 'Sélectionné' : 'Choisir'}
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="space-y-4">
                      {/* Core Limits */}
                      <div className="grid gap-3">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Package className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              Jusqu'à {formatLimit(plan.max_products)} produits
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_optimizations_monthly)} optimisations SEO/mois
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <FileText className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_articles_monthly)} article de blog/mois
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <MessageCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_chat_responses_monthly)} réponses chat/mois
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Extra Features */}
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

          {/* Custom Plan CTA */}
          <div className="text-center mt-12 bg-gradient-to-r from-purple-50 to-cyan-50 rounded-2xl p-8 border-2 border-purple-200 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'un réseau neural sur mesure?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Volume important, intégrations spécifiques, fonctionnalités exclusives ? 
              Notre équipe construit le cerveau IA parfait pour votre business.
            </p>
            <button 
              onClick={() => handleSignUp('enterprise')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Solution Neural Sur Mesure
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ils Nous Font Confiance
            </h2>
            <p className="text-xl text-gray-600">
              Des e-commerces qui grandissent avec nous
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-purple-600 mb-3 opacity-30" />
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm font-medium text-purple-600">{testimonial.company}</div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-sm font-semibold text-green-800 text-center">
                    {testimonial.metric}
                  </div>
                </div>
              </div>
            ))}
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
              Tout sur notre intelligence Omnia
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

      {/* CTA Final Futuriste */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.4) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)
            `,
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Brain className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à Connecter Votre Business ?
          </h2>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Rejoignez le réseau neural Omnia AI et donnez à votre e-commerce 
            une intelligence qui pense, apprend et agit en temps réel.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => handleSignUp('professional')}
              className="px-10 py-5 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Activer l'IA Omnia
              </span>
            </button>
            
            <button
              onClick={() => {
                document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
            >
              Voir les niveaux d'accès
            </button>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>14 jours d'essai du réseau neural</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Architecture sécurisée de niveau enterprise</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Intégration en 5 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Omnia AI</span>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                L'intelligence qui connecte tout. 
                Réseau neural complet pour e-commerce nouvelle génération.
              </p>
              <div className="flex items-center gap-3">
                {['Twitter', 'LinkedIn', 'GitHub'].map((platform, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                  >
                    <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
                  </a>
                ))}
              </div>
            </div>

            {[
              {
                title: 'Réseau Neural',
                links: ['Architecture IA', 'Modules Intelligents', 'API Neurale', 'Intégrations', 'Documentation']
              },
              {
                title: 'Entreprise',
                links: ['À propos', 'Blog', 'Carrières', 'Partenaires', 'Contact']
              },
              {
                title: 'Support',
                links: ['Centre d\'aide', 'Contact', 'Statut', 'RGPD', 'Mentions légales']
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
                © 2024 Omnia AI. Neural Commerce Intelligence.
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