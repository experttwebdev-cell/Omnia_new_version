import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
  Tag,
  Settings as SettingsIcon,
  Eye,
  CheckCircle,
  Loader2,
  AlertCircle,
  Search,
  Link,
  Layers,
  Package,
  Upload,
  Zap,
  User,
  X
} from 'lucide-react';

interface WizardStep {
  id: number;
  title: string;
  icon: typeof FileText;
  description: string;
}

const quickSteps: WizardStep[] = [
  { id: 1, title: 'Topic', icon: FileText, description: 'Choose topic' },
  { id: 2, title: 'Products', icon: Package, description: 'Select products' },
  { id: 3, title: 'Keywords', icon: Tag, description: 'Add keywords' },
  { id: 4, title: 'Generate', icon: Sparkles, description: 'Create article' },
];

const advancedSteps: WizardStep[] = [
  { id: 1, title: 'Topic Selection', icon: FileText, description: 'Choose your blog topic' },
  { id: 2, title: 'Products', icon: Package, description: 'Select related products' },
  { id: 3, title: 'Netlinking', icon: Layers, description: 'Configure internal linking' },
  { id: 4, title: 'Keywords', icon: Tag, description: 'Define target keywords' },
  { id: 5, title: 'Settings', icon: SettingsIcon, description: 'Configure settings' },
  { id: 6, title: 'Preview', icon: Eye, description: 'Review and generate' },
];

interface BlogWizardProps {
  onClose: () => void;
  categories: string[];
}

interface Product {
  id: string;
  title: string;
  description: string;
  product_type: string;
  category: string;
  sub_category: string;
  image_url: string;
  price: number;
  handle: string;
  vendor: string;
  tags: string;
  shopify_id: string;
}

interface NetlinkingRule {
  type: 'category' | 'product' | 'manual';
  target: string;
  anchorText: string;
  position: 'early' | 'middle' | 'late';
  priority: number;
}

export function BlogWizard({ onClose, categories }: BlogWizardProps) {
  const [mode, setMode] = useState<'quick' | 'advanced'>('quick');
  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [netlinkingRules, setNetlinkingRules] = useState<NetlinkingRule[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [shopifyBlogs, setShopifyBlogs] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [totalProductCount, setTotalProductCount] = useState(0);
  const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});

  const steps = mode === 'quick' ? quickSteps : advancedSteps;

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    keywords: '',
    wordCountMin: mode === 'quick' ? 800 : 700,
    wordCountMax: mode === 'quick' ? 1200 : 900,
    language: 'fr',
    autoPublish: false,
    autoSync: false,
    shopifyBlogId: '',
    internalLinking: mode === 'quick' ? true : false,
    maxInternalLinks: 3,
    imageStrategy: 'auto' as 'auto' | 'manual' | 'mixed',
    netlinkingDepth: 'comprehensive' as 'basic' | 'comprehensive' | 'aggressive',
    contentStructure: 'pyramidal' as 'pyramidal' | 'listicle' | 'tutorial',
    productCount: 3,
  });

  // Charger les produits depuis Shopify
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        console.log('🔄 Fetching products from shopify_products...');

        // First, get total count
        const { count } = await supabase
          .from('shopify_products')
          .select('*', { count: 'exact', head: true });

        setTotalProductCount(count || 0);
        console.log('📊 Total products in database:', count);

        const { data, error } = await supabase
          .from('shopify_products')
          .select('*')
          .order('title')
          .limit(200);

        if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
        }

        console.log('✅ Products loaded:', data?.length || 0);
        
        if (data && data.length > 0) {
          // Transformer les données pour utiliser les champs category et sub_category
          const transformedProducts: Product[] = data.map(product => ({
            id: product.id,
            title: product.title || 'Sans titre',
            description: product.description || '',
            product_type: product.product_type || '',
            category: product.category || '', // Utiliser le champ category
            sub_category: product.sub_category || '', // Utiliser le champ sub_category
            image_url: product.image_url || '/placeholder-product.jpg',
            price: product.price ? parseFloat(product.price) : 0,
            handle: product.handle || '',
            vendor: product.vendor || '',
            tags: product.tags || '',
            shopify_id: product.shopify_id || ''
          }));

          setProducts(transformedProducts);
          console.log('🎯 Transformed products count:', transformedProducts.length);
          console.log('🏷️ Categories found:', [...new Set(transformedProducts.map(p => p.category).filter(Boolean))]);

          // Calculate products per category
          const counts: Record<string, number> = {};
          transformedProducts.forEach(p => {
            if (p.category) {
              counts[p.category] = (counts[p.category] || 0) + 1;
            }
          });
          setCategoryProductCounts(counts);
          console.log('📈 Products per category:', counts);
        } else {
          console.log('📭 No products found in database');
          setProducts([]);
          setError('Aucun produit trouvé dans votre catalogue. Veuillez d\'abord importer des produits depuis Shopify via "Paramètres" > "Import Shopify".');
        }
      } catch (err) {
        console.error('💥 Error fetching products:', err);
        setError('Failed to load products from database');
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Charger les blogs Shopify disponibles
  useEffect(() => {
    const fetchShopifyBlogs = async () => {
      try {
        const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/get-shopify-blogs`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          },
        });

        if (response.ok) {
          const blogs = await response.json();
          setShopifyBlogs(blogs);
        }
      } catch (err) {
        console.error('Error fetching Shopify blogs:', err);
      }
    };

    fetchShopifyBlogs();
  }, []);

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesCategory = !formData.category || 
      product.category?.toLowerCase().includes(formData.category.toLowerCase()) ||
      product.sub_category?.toLowerCase().includes(formData.category.toLowerCase());
    
    const matchesSearch = !searchTerm || 
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sub_category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Sélection automatique des produits basée sur le count
  useEffect(() => {
    if (formData.category && filteredProducts.length > 0 && currentStep >= 2) {
      const autoSelected = filteredProducts.slice(0, formData.productCount);
      setSelectedProducts(autoSelected);
      
      // Générer automatiquement les règles de netlinking
      const autoRules: NetlinkingRule[] = autoSelected.map((product, index) => ({
        type: 'product',
        target: product.id,
        anchorText: product.title,
        position: index === 0 ? 'early' : index === 1 ? 'middle' : 'late',
        priority: index + 1
      }));

      // Ajouter une règle pour la catégorie principale
      if (formData.category) {
        autoRules.push({
          type: 'category',
          target: formData.category,
          anchorText: `Découvrez notre collection ${formData.category}`,
          position: 'middle',
          priority: autoSelected.length + 1
        });
      }

      setNetlinkingRules(autoRules);
    }
  }, [formData.category, formData.productCount, filteredProducts, currentStep]);

  // Gestion des keywords en tags
  const addKeyword = () => {
    const newKeyword = keywordInput.trim();
    if (newKeyword && !keywords.includes(newKeyword)) {
      setKeywords([...keywords, newKeyword]);
      setKeywordInput('');
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      setCurrentStep(0); // Retour à la sélection du mode
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setProgress(0);

      // Pre-flight validation: Check if products exist
      if (products.length === 0) {
        throw new Error('Aucun produit trouvé dans votre catalogue. Veuillez d\'abord importer des produits depuis Shopify en utilisant la section "Paramètres".');
      }

      // Validate that we have at least some data to work with
      if (!formData.category && keywords.length === 0 && formData.keywords.trim() === '') {
        throw new Error('Veuillez fournir au moins une catégorie ou des mots-clés pour générer l\'article.');
      }

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Utiliser les keywords des tags
      const finalKeywords = keywords.length > 0 ? keywords : formData.keywords.split(',').map(k => k.trim()).filter(Boolean);

      // Ensure we have at least one keyword
      if (finalKeywords.length === 0 && formData.category) {
        finalKeywords.push(formData.category);
      }

      console.log('🚀 Generating article with:', {
        category: formData.category,
        keywords: finalKeywords,
        selectedProducts: selectedProducts.length,
        totalProducts: products.length
      });

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-blog-article`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'manual',
          category: formData.category || 'Produits',
          subcategory: formData.subcategory || null,
          keywords: finalKeywords,
          word_count_min: formData.wordCountMin,
          word_count_max: formData.wordCountMax,
          language: formData.language,
          output_format: 'html',
          internal_linking: formData.internalLinking,
          max_internal_links: formData.maxInternalLinks,
          netlinking_rules: netlinkingRules,
          selected_products: selectedProducts.map(p => p.id),
          image_strategy: formData.imageStrategy,
          netlinking_depth: formData.netlinkingDepth,
          content_structure: formData.contentStructure,
          product_count: formData.productCount,
          auto_sync: formData.autoSync,
          shopify_blog_id: formData.shopifyBlogId || null,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to generate article';

        // Provide more helpful error messages
        if (errorMessage.includes('Aucun produit trouvé')) {
          throw new Error('Aucun produit trouvé dans votre catalogue. Veuillez importer des produits depuis Shopify via "Paramètres" > "Import Shopify".');
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Article generated successfully:', result.articleId);

      if (formData.autoSync && result.articleId) {
        console.log('🔄 Auto-syncing to Shopify...');
        try {
          const syncUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/sync-blog-to-shopify`;
          await fetch(syncUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              articleId: result.articleId,
              shopifyBlogId: formData.shopifyBlogId
            }),
          });
          console.log('✅ Article synced to Shopify');
        } catch (syncError) {
          console.warn('⚠️ Auto-sync to Shopify failed:', syncError);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('❌ Error generating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate article');
    } finally {
      setGenerating(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        setNetlinkingRules(prevRules => 
          prevRules.filter(rule => !(rule.type === 'product' && rule.target === product.id))
        );
        return prev.filter(p => p.id !== product.id);
      } else {
        const newRule: NetlinkingRule = {
          type: 'product',
          target: product.id,
          anchorText: product.title,
          position: 'middle',
          priority: prev.length + 1
        };
        setNetlinkingRules(prev => [...prev, newRule]);
        return [...prev, product];
      }
    });
  };

  const addNetlinkingRule = () => {
    const newRule: NetlinkingRule = {
      type: 'manual',
      target: '',
      anchorText: '',
      position: 'middle',
      priority: netlinkingRules.length + 1
    };
    setNetlinkingRules([...netlinkingRules, newRule]);
  };

  const updateNetlinkingRule = (index: number, field: keyof NetlinkingRule, value: string) => {
    const updatedRules = [...netlinkingRules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    setNetlinkingRules(updatedRules);
  };

  const removeNetlinkingRule = (index: number) => {
    setNetlinkingRules(netlinkingRules.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.category !== '';
      case 2:
        return selectedProducts.length > 0;
      case 3:
        return mode === 'quick' ? keywords.length > 0 : netlinkingRules.length > 0;
      case 4:
        return mode === 'quick' ? true : formData.keywords !== '';
      case 5:
        return formData.wordCountMin > 0 && formData.wordCountMax > formData.wordCountMin;
      case 6:
        return true;
      default:
        return false;
    }
  };

  // Obtenir les catégories uniques depuis les produits
  const productCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // Écran de sélection du mode
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full">
          <div className="p-8 text-center">
            <Sparkles className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Create Blog Article</h2>
            <p className="text-gray-600 mb-4">Choose your creation mode</p>

            {/* Product availability indicator */}
            {loadingProducts ? (
              <div className="flex items-center justify-center gap-2 mb-6 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking product availability...</span>
              </div>
            ) : totalProductCount === 0 ? (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-red-800 mb-1">No Products Found</p>
                    <p className="text-sm text-red-700 mb-2">
                      You need to import products from Shopify before creating blog articles.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        setTimeout(() => {
                          const settingsLink = document.querySelector('a[href="#settings"]');
                          if (settingsLink) (settingsLink as HTMLElement).click();
                        }, 100);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm hover:from-red-600 hover:to-rose-700 font-medium shadow-md"
                    >
                      Go to Settings to Import Products
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-sm text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span><strong>{totalProductCount}</strong> products available in {Object.keys(categoryProductCounts).length} categories</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 mb-8">
              <button
                onClick={() => {
                  if (totalProductCount > 0) {
                    setMode('quick');
                    setCurrentStep(1);
                  }
                }}
                disabled={totalProductCount === 0}
                className={`p-6 border-2 border-blue-200 rounded-xl transition-all text-left group ${
                  totalProductCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : 'hover:border-blue-500 hover:shadow-lg bg-gradient-to-br from-white to-blue-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-8 h-8 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-gray-800">Quick Mode</h3>
                    <p className="text-sm text-gray-600">For beginners</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 4 simple steps</li>
                  <li>• Automatic optimization</li>
                  <li>• Recommended settings</li>
                  <li>• Fast and easy</li>
                </ul>
              </button>

              <button
                onClick={() => {
                  if (totalProductCount > 0) {
                    setMode('advanced');
                    setCurrentStep(1);
                  }
                }}
                disabled={totalProductCount === 0}
                className={`p-6 border-2 border-purple-200 rounded-xl transition-all text-left group ${
                  totalProductCount === 0
                    ? 'opacity-50 cursor-not-allowed bg-gray-50'
                    : 'hover:border-purple-500 hover:shadow-lg bg-gradient-to-br from-white to-purple-50'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <User className="w-8 h-8 text-purple-600" />
                  <div>
                    <h3 className="font-bold text-gray-800">Advanced Mode</h3>
                    <p className="text-sm text-gray-600">For experts</p>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 6 detailed steps</li>
                  <li>• Full customization</li>
                  <li>• Advanced SEO options</li>
                  <li>• Complete control</li>
                </ul>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create Blog Article</h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mode === 'quick' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {mode === 'quick' ? 'Quick Mode' : 'Advanced Mode'}
                  </span>
                  <span>•</span>
                  <span>AI-powered blog generation</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={generating}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white scale-110 shadow-lg'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className={`text-xs font-medium ${currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-800 mb-1">Error</p>
                <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
                {error.includes('Paramètres') && (
                  <button
                    onClick={() => {
                      onClose();
                      setTimeout(() => {
                        const settingsLink = document.querySelector('a[href="#settings"]');
                        if (settingsLink) (settingsLink as HTMLElement).click();
                      }, 100);
                    }}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg text-sm hover:from-red-600 hover:to-rose-700 transition shadow-md"
                  >
                    Go to Settings to Import Products
                  </button>
                )}
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-800 font-semibold">Article generated successfully!</p>
                {formData.autoSync && (
                  <p className="text-sm text-green-700 mt-1">
                    Article is being synchronized with Shopify...
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="min-h-[400px]">
            {/* Étape 1: Sélection du sujet */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {mode === 'quick' ? 'Choose Your Topic' : 'Select Blog Topic'}
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      <option value="">Select a category</option>
                      {productCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {cat} ({products.filter(p => p.category === cat).length})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {products.filter(p => p.category === formData.category).length} products in this category
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subcategory <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.subcategory}
                      onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                      placeholder="e.g., Round Tables, Modern Chairs"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    />
                  </div>
                </div>

                {mode === 'advanced' && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Content Structure</h4>
                    <select
                      value={formData.contentStructure}
                      onChange={(e) => setFormData({ ...formData, contentStructure: e.target.value as any })}
                      className="w-full px-3 py-2 border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="pyramidal">Pyramidal Structure (Recommended)</option>
                      <option value="listicle">Listicle Format</option>
                      <option value="tutorial">Step-by-Step Tutorial</option>
                    </select>
                    <p className="text-sm text-blue-700 mt-2">
                      {formData.contentStructure === 'pyramidal' && 'Starts broad, gets specific - ideal for SEO'}
                      {formData.contentStructure === 'listicle' && 'Numbered list format - great for readability'}
                      {formData.contentStructure === 'tutorial' && 'Step-by-step guide - perfect for how-to articles'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Étape 2: Sélection des produits */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800">
                  {mode === 'quick' ? 'Select Products to Feature' : 'Product Selection'}
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quick Selection by Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value, productCount: 3 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="">All Categories</option>
                        {productCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat} ({products.filter(p => p.category === cat).length})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Products
                      </label>
                      <select
                        value={formData.productCount}
                        onChange={(e) => setFormData({ ...formData, productCount: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value={1}>1 Product</option>
                        <option value={2}>2 Products</option>
                        <option value={3}>3 Products</option>
                        <option value={5}>5 Products</option>
                        <option value={7}>7 Products</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedProducts.length} product(s) selected
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        // Sélection automatique basée sur la catégorie
                        const categoryProducts = filteredProducts.slice(0, formData.productCount);
                        setSelectedProducts(categoryProducts);
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-md"
                    >
                      Auto-Select {formData.productCount} Products
                    </button>
                  </div>

                  {/* Recherche et sélection manuelle */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Search & Manual Selection
                    </h4>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by product name, category, tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    {loadingProducts ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        <span className="ml-2 text-gray-600">Loading products...</span>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No products found in your catalog</p>
                        <p className="text-sm mt-1">Please import products from Shopify first</p>
                        <button
                          onClick={() => window.open('/settings', '_blank')}
                          className="mt-3 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm hover:from-blue-600 hover:to-purple-700 shadow-md"
                        >
                          Go to Shopify Settings
                        </button>
                      </div>
                    ) : filteredProducts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No products match your search</p>
                        <p className="text-sm mt-1">Try different keywords or category</p>
                      </div>
                    ) : (
                      <>
                        <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
                          {filteredProducts.slice(0, 20).map(product => (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                                selectedProducts.some(p => p.id === product.id)
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                              onClick={() => toggleProductSelection(product)}
                            >
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                {product.image_url && product.image_url !== '/placeholder-product.jpg' ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.title}
                                    className="w-12 h-12 object-cover rounded"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                                    }}
                                  />
                                ) : (
                                  <Package className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{product.title}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  {product.category && (
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{product.category}</span>
                                  )}
                                  {product.sub_category && (
                                    <span className="bg-gray-100 px-2 py-1 rounded text-xs">{product.sub_category}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">${product.price}</p>
                                <p className="text-xs text-gray-500">{product.vendor}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        {filteredProducts.length > 20 && (
                          <div className="text-center py-2 text-sm text-gray-500 border-t">
                            +{filteredProducts.length - 20} more products - refine your search to see more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Produits sélectionnés */}
                {selectedProducts.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Selected Products ({selectedProducts.length})</h4>
                      <button
                        onClick={() => setSelectedProducts([])}
                        className="text-sm text-red-600 hover:text-red-800 transition"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {selectedProducts.map(product => (
                        <div key={product.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                            {product.image_url && product.image_url !== '/placeholder-product.jpg' ? (
                              <img
                                src={product.image_url}
                                alt={product.title}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <Package className="w-8 h-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.title}</p>
                            <p className="text-sm text-gray-600">${product.price}</p>
                            {product.category && (
                              <p className="text-xs text-gray-500 truncate">{product.category}</p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleProductSelection(product)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            title="Remove product"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Étape 3: Différente selon le mode */}
            {currentStep === 3 && mode === 'quick' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800">Add Keywords</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Keywords *
                    </label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter a keyword and press Enter"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                      <button
                        onClick={addKeyword}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition shadow-md"
                      >
                        Add
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border border-gray-200 rounded-lg bg-gray-50">
                      {keywords.length === 0 ? (
                        <p className="text-gray-500 text-sm">No keywords added yet</p>
                      ) : (
                        keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                          >
                            {keyword}
                            <button
                              onClick={() => removeKeyword(keyword)}
                              className="text-blue-600 hover:text-blue-800 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {keywords.length} keyword(s) added • Click on a keyword to remove it
                    </p>
                  </div>

                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Keyword Tips</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Use specific, relevant keywords for your topic</li>
                      <li>• Include both short and long-tail keywords</li>
                      <li>• Think about what your customers would search for</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && mode === 'advanced' && (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-800">Netlinking Strategy</h3>
                  <button
                    onClick={addNetlinkingRule}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
                  >
                    <Link className="w-4 h-4" />
                    Add Manual Link
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Netlinking Depth
                    </label>
                    <select
                      value={formData.netlinkingDepth}
                      onChange={(e) => setFormData({ ...formData, netlinkingDepth: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="basic">Basic (2-3 links)</option>
                      <option value="comprehensive">Comprehensive (4-6 links)</option>
                      <option value="aggressive">Aggressive (7-10 links)</option>
                    </select>
                  </div>

                  {netlinkingRules.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg">
                      <h4 className="font-semibold text-gray-800 p-4 border-b">
                        Link Rules ({netlinkingRules.length})
                      </h4>
                      <div className="max-h-60 overflow-y-auto">
                        {netlinkingRules.map((rule, index) => (
                          <div key={index} className="p-4 border-b last:border-b-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Anchor Text</label>
                                  <input
                                    type="text"
                                    value={rule.anchorText}
                                    onChange={(e) => updateNetlinkingRule(index, 'anchorText', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600">Position</label>
                                  <select
                                    value={rule.position}
                                    onChange={(e) => updateNetlinkingRule(index, 'position', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="early">Early</option>
                                    <option value="middle">Middle</option>
                                    <option value="late">Late</option>
                                  </select>
                                </div>
                              </div>
                              <button
                                onClick={() => removeNetlinkingRule(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Type: {rule.type} • Priority: {rule.priority}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Les étapes restantes pour le mode avancé */}
            {currentStep === 4 && mode === 'advanced' && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Define Keywords</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Keywords *
                  </label>
                  <textarea
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="Enter keywords separated by commas (e.g., modern furniture, home decor, interior design)"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Keywords: {formData.keywords.split(',').filter(k => k.trim()).length}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 5 && mode === 'advanced' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configure Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Word Count
                      </label>
                      <input
                        type="number"
                        value={formData.wordCountMin}
                        onChange={(e) => setFormData({ ...formData, wordCountMin: parseInt(e.target.value) })}
                        min="300"
                        max="2000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Word Count
                      </label>
                      <input
                        type="number"
                        value={formData.wordCountMax}
                        onChange={(e) => setFormData({ ...formData, wordCountMax: parseInt(e.target.value) })}
                        min="300"
                        max="2000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>

                    {/* Shopify Sync Settings */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-semibold text-gray-800 mb-3">Shopify Sync</h4>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.autoSync}
                            onChange={(e) => setFormData({ ...formData, autoSync: e.target.checked })}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 flex items-center gap-2">
                            <Upload className="w-4 h-4" />
                            Auto-sync to Shopify after generation
                          </span>
                        </label>

                        {formData.autoSync && (
                          <div className="ml-8 space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Shopify Blog
                              </label>
                              <select
                                value={formData.shopifyBlogId}
                                onChange={(e) => setFormData({ ...formData, shopifyBlogId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                              >
                                <option value="">Select a Shopify blog</option>
                                {shopifyBlogs.map(blog => (
                                  <option key={blog.id} value={blog.id}>
                                    {blog.title}
                                  </option>
                                ))}
                              </select>
                              {shopifyBlogs.length === 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  No Shopify blogs found. Make sure your store is connected.
                                </p>
                              )}
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                Article will be automatically published to your selected Shopify blog immediately after generation.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Strategy
                      </label>
                      <select
                        value={formData.imageStrategy}
                        onChange={(e) => setFormData({ ...formData, imageStrategy: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="auto">Auto-generate Images</option>
                        <option value="mixed">Use Product Images + AI</option>
                        <option value="manual">Manual Image Selection</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={formData.internalLinking}
                          onChange={(e) => setFormData({ ...formData, internalLinking: e.target.checked })}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Enable internal linking</span>
                      </label>
                      {formData.internalLinking && (
                        <div className="ml-8">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Internal Links
                          </label>
                          <input
                            type="number"
                            value={formData.maxInternalLinks}
                            onChange={(e) => setFormData({ ...formData, maxInternalLinks: parseInt(e.target.value) })}
                            min="1"
                            max="10"
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Image Sources</h4>
                      <p className="text-sm text-blue-800">
                        {formData.imageStrategy === 'auto' && 'AI will generate relevant images based on content'}
                        {formData.imageStrategy === 'mixed' && 'Will use selected product images + AI-generated images'}
                        {formData.imageStrategy === 'manual' && 'You will need to manually add images after generation'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && mode === 'quick' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Ready to Generate!</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
                      <h4 className="font-semibold text-gray-800 mb-3">Article Summary</h4>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Category:</span>
                        <span className="text-gray-900">{formData.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Products:</span>
                        <span className="text-gray-900">{selectedProducts.length} selected</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Keywords:</span>
                        <span className="text-gray-900">{keywords.length} added</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Word Count:</span>
                        <span className="text-gray-900">800-1200 words</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Language:</span>
                        <span className="text-gray-900">
                          {formData.language === 'fr' ? 'Français' : 
                           formData.language === 'en' ? 'English' :
                           formData.language === 'es' ? 'Español' : 'Deutsch'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Automatic Optimization</h4>
                      <p className="text-sm text-green-800">
                        Your article will be automatically optimized for SEO with:
                      </p>
                      <ul className="text-sm text-green-800 mt-2 space-y-1">
                        <li>• Natural product integration</li>
                        <li>• SEO-friendly structure</li>
                        <li>• Internal linking</li>
                        <li>• Mobile optimization</li>
                      </ul>
                    </div>

                    {generating && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                          <div className="text-center">
                            <p className="text-lg font-semibold text-gray-800 mb-2">Generating your article...</p>
                            <p className="text-sm text-gray-600">AI is creating high-quality content</p>
                          </div>
                          <div className="w-full max-w-md">
                            <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 6 && mode === 'advanced' && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Review & Generate</h3>
                
                {!generating && !success && (
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
                        <h4 className="font-semibold text-gray-800 mb-3">Article Details</h4>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Category:</span>
                          <span className="text-gray-900">{formData.category}</span>
                        </div>
                        {formData.subcategory && (
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-700">Subcategory:</span>
                            <span className="text-gray-900">{formData.subcategory}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Keywords:</span>
                          <span className="text-gray-900">{formData.keywords.split(',').length} keywords</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Word Count:</span>
                          <span className="text-gray-900">{formData.wordCountMin} - {formData.wordCountMax}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Language:</span>
                          <span className="text-gray-900">
                            {formData.language === 'fr' ? 'Français' : 
                             formData.language === 'en' ? 'English' :
                             formData.language === 'es' ? 'Español' : 'Deutsch'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Structure:</span>
                          <span className="text-gray-900 capitalize">{formData.contentStructure}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
                        <h4 className="font-semibold text-gray-800 mb-3">Products & Linking</h4>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Products:</span>
                          <span className="text-gray-900">{selectedProducts.length} selected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Netlinking:</span>
                          <span className="text-gray-900 capitalize">{formData.netlinkingDepth}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Link Rules:</span>
                          <span className="text-gray-900">{netlinkingRules.length} rules</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Image Strategy:</span>
                          <span className="text-gray-900 capitalize">{formData.imageStrategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-gray-700">Internal Links:</span>
                          <span className="text-gray-900">{formData.internalLinking ? `Yes (max ${formData.maxInternalLinks})` : 'No'}</span>
                        </div>
                        {formData.autoSync && (
                          <>
                            <div className="flex justify-between">
                              <span className="font-medium text-gray-700">Shopify Sync:</span>
                              <span className="text-gray-900">Auto-publish</span>
                            </div>
                            {formData.shopifyBlogId && (
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Target Blog:</span>
                                <span className="text-gray-900">
                                  {shopifyBlogs.find(b => b.id === formData.shopifyBlogId)?.title || 'Unknown'}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className={`p-4 rounded-lg border ${
                        formData.autoSync 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${
                          formData.autoSync ? 'text-green-900' : 'text-blue-900'
                        }`}>
                          {formData.autoSync ? 'Ready to Generate & Publish' : 'Ready to Generate'}
                        </h4>
                        <p className={`text-sm ${
                          formData.autoSync ? 'text-green-800' : 'text-blue-800'
                        }`}>
                          {formData.autoSync 
                            ? 'The AI will create a comprehensive blog article and automatically publish it to your Shopify store.'
                            : 'The AI will create a comprehensive blog article featuring your selected products with natural integration and SEO optimization.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {generating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-2">Generating your article...</p>
                        <p className="text-sm text-gray-600">
                          {formData.autoSync 
                            ? 'AI is creating high-quality content and will automatically publish to Shopify'
                            : 'AI is creating high-quality content with product integration'
                          }
                        </p>
                      </div>
                      <div className="w-full max-w-md">
                        <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1 || generating}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {mode === 'quick' && currentStep === 1 && (
              <button
                onClick={() => setCurrentStep(0)}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 transition text-sm"
              >
                Change Mode
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length} • {mode === 'quick' ? 'Quick' : 'Advanced'} Mode
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || generating}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-md"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canProceed() || generating || success}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-md"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Done!
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {mode === 'quick' ? 'Generate Article' : 'Generate & Publish'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}