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
  Workflow
} from 'lucide-react';

// Mock data for plans
const mockPlans = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    price_monthly: 49,
    max_products: 1000,
    max_optimizations_monthly: 2000,
    max_articles_monthly: 15,
    max_campaigns: 5,
    max_chat_responses_monthly: 1000,
    features: {
      analytics: 'Basique',
      support: 'Email & Chat',
      api: false,
      backup: 'Quotidien',
      support_chat: true,
      support_phone: false,
      dedicated_manager: false,
      custom_training: false,
      sla: '99.5%',
      data_export: true,
      full_api: false,
      included_tokens: '100K',
      extra_tokens_price: '0.08€/1K',
      google_shopping: 'Export basique',
      seo_audit: 'Mensuel'
    },
    stripe_price_id: 'price_essentiel',
    description: 'Solution complète pour démarrer avec l\'IA',
    popular: false,
    best_value: false,
    recommended: false,
    usage_based: false,
    roi_estimate: '2-3x ROI'
  },
  {
    id: 'performance',
    name: 'Performance',
    price_monthly: 149,
    max_products: 10000,
    max_optimizations_monthly: 10000,
    max_articles_monthly: 50,
    max_campaigns: 15,
    max_chat_responses_monthly: 5000,
    features: {
      analytics: 'Avancé',
      support: 'Prioritaire',
      api: true,
      backup: 'Quotidien',
      support_chat: true,
      support_phone: true,
      dedicated_manager: false,
      custom_training: true,
      sla: '99.9%',
      data_export: true,
      full_api: true,
      included_tokens: '500K',
      extra_tokens_price: '0.06€/1K',
      google_shopping: 'Export avancé + optimisation',
      seo_audit: 'Hebdomadaire'
    },
    stripe_price_id: 'price_performance',
    description: 'Plateforme tout-en-1 pour maximiser votre croissance',
    popular: true,
    best_value: true,
    recommended: false,
    usage_based: false,
    roi_estimate: '3-5x ROI'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 399,
    max_products: -1,
    max_optimizations_monthly: 50000,
    max_articles_monthly: 200,
    max_campaigns: 50,
    max_chat_responses_monthly: 25000,
    features: {
      analytics: 'Enterprise',
      support: 'Dédié 24/7',
      api: true,
      backup: 'Temps réel',
      support_chat: true,
      support_phone: true,
      dedicated_manager: true,
      custom_training: true,
      sla: '99.95%',
      data_export: true,
      full_api: true,
      included_tokens: '2M',
      extra_tokens_price: '0.04€/1K',
      google_shopping: 'Export illimité + optimisation IA',
      seo_audit: 'Quotidien'
    },
    stripe_price_id: 'price_enterprise',
    description: 'Solution enterprise complète pour les leaders',
    popular: false,
    best_value: false,
    recommended: true,
    usage_based: false,
    roi_estimate: '5-10x ROI'
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

  // Fonctions de navigation - VÉRIFIÉES
  const handleLogin = () => {
    console.log('Navigation vers login');
    navigate('/login');
  };

  const handleSignUp = (planId: string = 'performance') => {
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
      case 'essentiel':
        return <Rocket className="w-8 h-8" />;
      case 'performance':
        return <Zap className="w-8 h-8" />;
      case 'enterprise':
        return <Crown className="w-8 h-8" />;
      default:
        return <ShoppingBag className="w-8 h-8" />;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'essentiel':
        return {
          gradient: 'from-blue-500 to-cyan-500',
          light: 'from-blue-50 to-cyan-50',
          border: 'border-blue-200',
          text: 'text-blue-600'
        };
      case 'performance':
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

  // Features data - Orienté solution complète
  const featureCategories = [
    {
      id: 'all',
      name: 'Toutes les solutions',
      icon: Workflow,
      count: 8
    },
    {
      id: 'optimisation',
      name: 'Optimisation Produits',
      icon: Sparkles,
      count: 3
    },
    {
      id: 'marketing',
      name: 'Marketing & Ventes',
      icon: TrendingUp,
      count: 3
    },
    {
      id: 'automation',
      name: 'Automatisation IA',
      icon: Bot,
      count: 2
    }
  ];

  const allFeatures = [
    {
      icon: Sparkles,
      title: 'Enrichissement IA Intelligent - Tout-en-un',
      description: 'Solution complète : descriptions optimisées, attributs extraits, analyse d\'images et optimisation automatique',
      gradient: 'from-blue-500 to-cyan-500',
      category: 'optimisation',
      plans: ['essentiel', 'performance', 'enterprise'],
      highlight: true,
      benefit: 'Solution complète : +45% de conversion'
    },
    {
      icon: Search,
      title: 'SEO Automatique Multi-Canal - Intégré',
      description: 'Plateforme unifiée : optimisation Google, meta tags intelligents, audit SEO et tracking en temps réel',
      gradient: 'from-purple-500 to-pink-500',
      category: 'marketing',
      plans: ['essentiel', 'performance', 'enterprise'],
      highlight: true,
      benefit: 'Solution intégrée : +60% de trafic'
    },
    {
      icon: ShoppingCart,
      title: 'Google Shopping IA - Automatisé',
      description: 'Solution tout-en-1 : export automatique, optimisation des flux, gestion intelligente des campagnes',
      gradient: 'from-orange-500 to-red-500',
      category: 'marketing',
      plans: ['performance', 'enterprise'],
      highlight: true,
      benefit: 'Plateforme unifiée : +35% de ROI'
    },
    {
      icon: MessageCircle,
      title: 'Assistant Vente IA - Complet',
      description: 'Solution intégrée : chat intelligent, recommandations personnalisées, support automatisé et analytics',
      gradient: 'from-green-500 to-emerald-500',
      category: 'automation',
      plans: ['performance', 'enterprise'],
      highlight: true,
      benefit: 'Solution complète : +28% de conversion'
    },
    {
      icon: FileText,
      title: 'Générateur de Contenu Stratégique - Intégré',
      description: 'Plateforme tout-en-1 : création automatique d\'articles SEO, campagnes de contenu et optimisation',
      gradient: 'from-yellow-500 to-amber-500',
      category: 'marketing',
      plans: ['essentiel', 'performance', 'enterprise'],
      benefit: 'Solution unifiée : +3x plus de contenu'
    },
    {
      icon: BarChart,
      title: 'Analytics Prédictifs - Complet',
      description: 'Solution intégrée : tableaux de bord intelligents, insights actionnables et recommandations IA',
      gradient: 'from-teal-500 to-cyan-500',
      category: 'optimisation',
      plans: ['performance', 'enterprise'],
      benefit: 'Plateforme complète : décisions data-driven'
    },
    {
      icon: Target,
      title: 'Campagnes Marketing Automatisées - Tout-en-un',
      description: 'Solution unifiée : lancement et optimisation automatique des campagnes cross-canal',
      gradient: 'from-red-500 to-pink-500',
      category: 'automation',
      plans: ['performance', 'enterprise'],
      benefit: 'Solution intégrée : -70% de temps'
    },
    {
      icon: Tag,
      title: 'Catégorisation & Tags IA - Automatique',
      description: 'Plateforme complète : organisation automatique du catalogue avec taxonomie intelligente',
      gradient: 'from-indigo-500 to-blue-500',
      category: 'optimisation',
      plans: ['essentiel', 'performance', 'enterprise'],
      benefit: 'Solution tout-en-1 : navigation +40% efficace'
    }
  ];

  const filteredFeatures = showAllFeatures 
    ? allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab)
    : allFeatures.filter(feature => activeFeatureTab === 'all' || feature.category === activeFeatureTab).slice(0, 6);

  // Testimonials - Orienté solution complète
  const testimonials = [
    {
      name: 'Marie Dubois',
      company: 'Mode & Style Paris',
      role: 'Directrice E-commerce',
      rating: 5,
      text: 'La plateforme tout-en-1 OmnIA a remplacé 5 outils différents. Solution complète qui a boosté nos ventes de 40%.',
      metric: 'Solution complète : +40% de ventes'
    },
    {
      name: 'Thomas Martin',
      company: 'TechImport',
      role: 'Fondateur',
      rating: 5,
      text: 'Enfin une solution intégrée qui gère tout : SEO, Google Shopping, contenu IA. Plus besoin de jongler entre les outils.',
      metric: 'Plateforme unifiée : -60% de coûts'
    },
    {
      name: 'Sophie Lambert',
      company: 'Beauté Nature',
      role: 'Responsable Marketing',
      rating: 5,
      text: 'Solution tout-en-1 exceptionnelle. Tout est automatisé et intégré : de l\'optimisation produit au marketing.',
      metric: 'Solution intégrée : +35% ROI'
    }
  ];

  const faqs = [
    {
      question: "OmnIA est-elle vraiment une solution tout-en-1 ?",
      answer: "Absolument. OmnIA intègre l'optimisation produit IA, le SEO automatique, Google Shopping, la génération de contenu, l'analytics et le chat intelligent dans une seule plateforme unifiée. Plus besoin de multiples outils."
    },
    {
      question: "Comment la solution complète améliore-t-elle mon ROI ?",
      answer: "En unifiant toutes les fonctionnalités, vous éliminez les coûts de multiples abonnements, réduisez le temps de formation et bénéficiez d'une intégration parfaite entre tous les modules. Nos clients voient un ROI 2x à 10x supérieur."
    },
    {
      question: "Puis-je migrer depuis mes outils actuels ?",
      answer: "Oui, notre plateforme tout-en-1 intègre des connecteurs pour importer vos données depuis tous les outils e-commerce courants. Notre équipe vous accompagne dans la migration complète."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-gray-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  OmnIA
                </span>
                <div className="text-xs text-gray-500 -mt-1">Solution E-commerce Tout-en-1</div>
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
                onClick={() => handleSignUp('performance')}
                className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r from-blue-600 to-purple-600"
              >
                <span className="text-white">Essai Gratuit 14j</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Discours solution complète */}
      <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-white/5 rounded-full blur-lg animate-pulse delay-75"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-8 border border-white/20">
              <Sparkles className="w-4 h-4" />
              <span>Solution Tout-en-1 N°1 pour E-Commerce</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              La Plateforme Complète
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Tout-en-1 IA
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-200 mb-4 max-w-3xl mx-auto leading-relaxed">
              Une seule plateforme qui unifie l'optimisation produit IA, le SEO automatique, 
              Google Shopping, le contenu généré et l'analytics prédictif
            </p>

            <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
              Solution intégrée complète : arrêtez de jongler entre 5 outils. Tout dans une seule plateforme unifiée.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={() => handleSignUp('performance')}
                className="group px-8 py-4 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Essai Gratuit 14 Jours
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
                Voir la démo
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Solution complète tout-en-1</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Intégration en 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Plateforme unifiée</span>
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
              La Solution Complète Qui Transforme
            </h2>
            <p className="text-xl text-gray-600">
              Une plateforme unifiée, des résultats exceptionnels
            </p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: '1', label: 'Plateforme Tout-en-1', icon: Workflow, suffix: '' },
              { number: '8', label: 'Modules Intégrés', icon: Bot, suffix: '+' },
              { number: '40%', label: 'Croissance Moyenne', icon: TrendingUp, suffix: '' },
              { number: '5', label: 'Outils Remplacés', icon: Check, suffix: '' }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}{stat.suffix}
                </div>
                <div className="text-gray-600 font-medium text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Discours solution intégrée */}
      <section id="features" className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              La Plateforme Tout-en-1 Complète
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              8 modules intégrés dans une seule solution unifiée pour votre e-commerce
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
                      Solution intégrée
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
                    <span>Module intégré dans :</span>
                    <div className="flex gap-1">
                      {feature.plans.map(plan => (
                        <span
                          key={plan}
                          className={`px-2 py-1 rounded font-medium ${
                            plan === 'essentiel' ? 'bg-blue-100 text-blue-800' :
                            plan === 'performance' ? 'bg-purple-100 text-purple-800' :
                            'bg-violet-100 text-violet-800'
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
                Découvrir tous les modules
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ils Ont Adopté La Solution Complète
            </h2>
            <p className="text-xl text-gray-600">
              Des e-commerces qui ont unifié leur stack avec OmnIA
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
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Une Solution Complète à Prix Unique
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Choisissez votre formule tout-en-1. Tous les plans incluent la plateforme complète.
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
                Mensuel
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                  selectedBilling === 'yearly'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Annuel
                <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                  Économisez 20%
                </span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">Chargement des solutions...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {plans.map((plan) => {
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
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
                        ⭐ Solution Optimale
                      </div>
                    )}

                    {plan.recommended && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold text-white shadow-lg bg-gradient-to-r from-violet-600 to-purple-600">
                        🏆 Solution Enterprise
                      </div>
                    )}

                    <div className={`w-16 h-16 bg-gradient-to-br ${colors.gradient} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg`}>
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
                      <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {pricePerMonth}€
                      </span>
                      <span className="text-gray-600">/mois</span>
                    </div>

                    {selectedBilling === 'yearly' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-700 font-medium text-center">
                          💰 Économisez {(Number(plan.price_monthly) * 12 * 0.2).toFixed(2)}€ par an
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => handleSignUp(plan.id)}
                      className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 mb-8 ${
                        isPopular
                          ? 'text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border-2 border-transparent hover:border-purple-300'
                      }`}
                      style={isPopular ? { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' } : {}}
                    >
                      <Rocket className="w-5 h-5" />
                      Essayer la solution complète
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
                            <span className="text-gray-600"> produits</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <Zap className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_optimizations_monthly)}
                            </span>
                            <span className="text-gray-600"> optimisations/mois</span>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <FileText className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <span className="font-semibold text-gray-900">
                              {formatLimit(plan.max_articles_monthly)}
                            </span>
                            <span className="text-gray-600"> articles/mois</span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Features */}
                      <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <ShoppingCart className="w-4 h-4 text-purple-600" />
                          Google Shopping {plan.features.google_shopping}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Search className="w-4 h-4 text-purple-600" />
                          Audit SEO {plan.features.seo_audit}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Database className="w-4 h-4 text-purple-600" />
                          {plan.features.included_tokens} tokens IA
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom Plan CTA */}
          <div className="text-center mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border-2 border-blue-200 shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Besoin d'une solution sur mesure?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Volume important, intégrations spécifiques, fonctionnalités exclusives ? 
              Notre équipe construit la solution tout-en-1 parfaite pour votre business.
            </p>
            <button 
              onClick={() => handleSignUp('enterprise')}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Solution Enterprise Sur Mesure
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
              Tout sur notre solution tout-en-1
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

      {/* CTA Final */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
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
            Prêt à Tout Unifier ?
          </h2>
          <p className="text-xl text-gray-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Rejoignez les e-commerces qui utilisent la solution tout-en-1 OmnIA 
            pour booster leurs ventes de 40% à 65% en 3 mois
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={() => handleSignUp('performance')}
              className="px-10 py-5 bg-white rounded-xl font-bold text-lg shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
            >
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Essayer la Solution Complète
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
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Solution complète - 14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Plateforme tout-en-1</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Modules intégrés</span>
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
                <div className="p-2 rounded-lg shadow-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">OmnIA</span>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Solution e-commerce tout-en-1 alimentée par l'intelligence artificielle.
                Plateforme complète unifiée.
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
                title: 'Solution',
                links: ['Fonctionnalités', 'Tarifs', 'Documentation', 'API', 'Intégrations', 'Statut']
              },
              {
                title: 'Entreprise',
                links: ['À propos', 'Blog', 'Carrières', 'Partenaires', 'Presse', 'Contact']
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
                © 2024 OmnIA. Solution Tout-en-1 E-commerce.
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