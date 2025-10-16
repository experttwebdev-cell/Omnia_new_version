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
  Image as ImageIcon,
  Link,
  Layers,
  Package,
  Upload
} from 'lucide-react';

interface WizardStep {
  id: number;
  title: string;
  icon: typeof FileText;
  description: string;
}

const steps: WizardStep[] = [
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
  const [currentStep, setCurrentStep] = useState(1);
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

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    keywords: '',
    wordCountMin: 700,
    wordCountMax: 900,
    language: 'fr',
    autoPublish: false,
    autoSync: false,
    shopifyBlogId: '',
    internalLinking: true,
    maxInternalLinks: 5,
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
        const { data, error } = await supabase
          .from('shopify_products')
          .select('*')
          .order('title')
          .limit(100);

        if (error) throw error;
        setProducts((data as Product[]) || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
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

  // Filtrer les produits par catégorie
  const filteredProducts = products.filter(product => {
    const matchesCategory = !formData.category || product.category === formData.category;
    const matchesSearch = !searchTerm || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sélection automatique des produits basée sur le count
  useEffect(() => {
    if (formData.category && filteredProducts.length > 0) {
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
  }, [formData.category, formData.productCount, filteredProducts]);

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Étape 1: Génération de l'article
      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-blog-article`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'manual',
          category: formData.category,
          subcategory: formData.subcategory || null,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
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
        throw new Error(errorData.error || 'Failed to generate article');
      }

      const result = await response.json();
      
      // Étape 2: Synchronisation automatique avec Shopify si demandée
      if (formData.autoSync && result.articleId) {
        try {
          const syncUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/sync-blog-to-shopify`;
          const syncResponse = await fetch(syncUrl, {
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

          if (!syncResponse.ok) {
            console.warn('Auto-sync to Shopify failed, but article was created');
          }
        } catch (syncError) {
          console.warn('Auto-sync to Shopify failed:', syncError);
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error('Error generating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate article');
    } finally {
      setGenerating(false);
    }
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        // Retirer le produit et sa règle de netlinking
        setNetlinkingRules(prevRules => 
          prevRules.filter(rule => !(rule.type === 'product' && rule.target === product.id))
        );
        return prev.filter(p => p.id !== product.id);
      } else {
        // Ajouter le produit et créer une règle de netlinking
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
        return netlinkingRules.length > 0;
      case 4:
        return formData.keywords !== '';
      case 5:
        return formData.wordCountMin > 0 && formData.wordCountMax > formData.wordCountMin;
      case 6:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create Blog Article</h2>
                <p className="text-sm text-gray-600">AI-powered blog generation with automatic product selection</p>
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
            <div className="mb-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
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
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Blog Topic</h3>
                <div className="grid grid-cols-2 gap-4">
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
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800">Product Selection</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Products to Feature
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
                        {selectedProducts.length} product(s) selected automatically from {formData.category} category
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">Auto-Selection</h4>
                      <p className="text-sm text-green-800">
                        Products are automatically selected based on your category choice. 
                        The AI will naturally integrate these products into the article content.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Search & Manual Selection</h4>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    
                    {loadingProducts ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {filteredProducts.slice(0, 10).map(product => (
                          <div
                            key={product.id}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                              selectedProducts.some(p => p.id === product.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => toggleProductSelection(product)}
                          >
                            <img
                              src={product.image_url || '/placeholder-product.jpg'}
                              alt={product.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{product.title}</p>
                              <p className="text-sm text-gray-600">{product.category}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">${product.price}</p>
                              <p className="text-xs text-gray-500">{product.vendor}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {selectedProducts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-800 mb-3">Selected Products ({selectedProducts.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedProducts.map(product => (
                        <div key={product.id} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                          <img
                            src={product.image_url || '/placeholder-product.jpg'}
                            alt={product.title}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{product.title}</p>
                            <p className="text-sm text-gray-600">${product.price}</p>
                          </div>
                          <button
                            onClick={() => toggleProductSelection(product)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
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
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
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

            {currentStep === 4 && (
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

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-semibold text-yellow-900 mb-2">Keyword Strategy</h4>
                  <p className="text-sm text-yellow-800">
                    Primary keywords will be used in headings and early content.
                    Secondary keywords will be naturally integrated throughout the article.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 5 && (
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

            {currentStep === 6 && (
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
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || generating}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || generating}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canProceed() || generating || success}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
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
                  {formData.autoSync ? 'Generate & Publish' : 'Generate Article'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}