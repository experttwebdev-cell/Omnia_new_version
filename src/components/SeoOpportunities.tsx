import { useState, useEffect, useCallback } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  RefreshCw,
  Lightbulb,
  TrendingUp,
  FileText,
  Tag,
  Package,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Target,
  BookOpen,
  Filter,
  FileEdit
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useNotifications, NotificationSystem } from './NotificationSystem';
import { LoadingAnimation } from './LoadingAnimation';
import { useLanguage } from '../App';
import { opportunityTemplates } from '../lib/language';
import { BlogArticleModal } from './BlogArticleModal';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface Opportunity {
  id: string;
  type: 'category-guide' | 'comparison' | 'how-to' | 'product-spotlight' | 'seasonal';
  title: string;
  description: string;
  targetKeywords: string[];
  productCount: number;
  relatedProducts: string[];
  score: number;
  estimatedWordCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedStructure?: string[];
}

export function SeoOpportunities() {
  const { language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingOutline, setGeneratingOutline] = useState<string | null>(null);
  const [creatingArticle, setCreatingArticle] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [generatingSmart, setGeneratingSmart] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const { notifications, addNotification, dismissNotification } = useNotifications();

  const supportedLangs: ('fr' | 'en')[] = ['fr', 'en'];
  const templateLang = supportedLangs.includes(language as 'fr' | 'en') ? (language as 'fr' | 'en') : 'en';
  const templates = opportunityTemplates[templateLang];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0 && opportunities.length === 0) {
      handleGenerateSmartOpportunities();
    }
  }, [loading, products.length]);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data: productsData, error: productsError } = await supabase
        .from('shopify_products')
        .select('*');

      if (productsError) throw productsError;

      setProducts(productsData || []);

      const { data: dbOpportunities, error: oppsError } = await supabase
        .from('blog_opportunities')
        .select('*')
        .order('seo_opportunity_score', { ascending: false });

      if (oppsError) {
        console.error('Error fetching opportunities:', oppsError);
      }

      if (dbOpportunities && dbOpportunities.length > 0) {
        const formattedOpps: Opportunity[] = dbOpportunities.map((opp: any) => ({
          id: opp.id,
          type: opp.type || 'category-guide',
          title: opp.article_title,
          description: opp.intro_excerpt || opp.meta_description,
          targetKeywords: [...(opp.primary_keywords || []), ...(opp.secondary_keywords || [])],
          productCount: opp.product_count || 0,
          relatedProducts: opp.product_ids ? (productsData || []).filter(p => opp.product_ids.includes(p.id)).map(p => p.title) : [],
          score: opp.seo_opportunity_score || 50,
          estimatedWordCount: opp.estimated_word_count || 2000,
          difficulty: opp.difficulty || 'medium',
          suggestedStructure: opp.structure?.h2_sections || []
        }));
        setOpportunities(formattedOpps);
      } else if ((productsData || []).length > 0) {
        generateBasicOpportunities(productsData || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      addNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch products',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSmartOpportunities = async () => {
    if (generatingSmart) return;
    setGeneratingSmart(true);
    await generateSmartOpportunities(products);
    setGeneratingSmart(false);
  };

  const generateSmartOpportunities = async (products: Product[]) => {
    if (products.length === 0) {
      setOpportunities([]);
      return;
    }

    try {
      const productsData = products.map(p => ({
        id: p.id,
        title: p.title,
        category: p.category || '',
        sub_category: p.sub_category || '',
        product_type: p.product_type || '',
        tags: p.tags || '',
        seo_title: p.seo_title || '',
        seo_description: p.seo_description || '',
        ai_color: p.ai_color,
        ai_material: p.ai_material,
      }));

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-seo-opportunities`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsData,
          language: language
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate opportunities');
      }

      const result = await response.json();

      if (result.opportunities && Array.isArray(result.opportunities)) {
        const formattedOpps: Opportunity[] = result.opportunities.map((opp: any, index: number) => ({
          id: `smart-opp-${index}`,
          type: opp.type || 'category-guide',
          title: opp.article_title,
          description: opp.intro_excerpt || opp.meta_description,
          targetKeywords: [...(opp.primary_keywords || []), ...(opp.secondary_keywords || [])],
          productCount: opp.product_count || 0,
          relatedProducts: opp.product_ids ? products.filter(p => opp.product_ids.includes(p.id)).map(p => p.title) : [],
          score: opp.seo_opportunity_score || 50,
          estimatedWordCount: opp.estimated_word_count || 2000,
          difficulty: opp.difficulty || 'medium',
          suggestedStructure: opp.structure?.h2_sections || []
        }));

        setOpportunities(formattedOpps);

        addNotification({
          type: 'success',
          title: 'Opportunités générées',
          message: `${formattedOpps.length} opportunités SEO intelligentes créées avec succès`,
          duration: 5000
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error generating smart opportunities:', error);
      addNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Impossible de générer les opportunités. Utilisation du mode basique...',
        duration: 5000
      });
      generateBasicOpportunities(products);
    }
  };

  const generateBasicOpportunities = (products: Product[]) => {
    const opps: Opportunity[] = [];

    const categoryMap = new Map<string, Product[]>();
    const subCategoryMap = new Map<string, Product[]>();

    products.forEach((product) => {
      if (product.category) {
        if (!categoryMap.has(product.category)) {
          categoryMap.set(product.category, []);
        }
        categoryMap.get(product.category)!.push(product);
      }

      if (product.sub_category) {
        const key = `${product.category}:${product.sub_category}`;
        if (!subCategoryMap.has(key)) {
          subCategoryMap.set(key, []);
        }
        subCategoryMap.get(key)!.push(product);
      }
    });

    categoryMap.forEach((categoryProducts, category) => {
      if (categoryProducts.length >= 3) {
        const avgPrice = categoryProducts.reduce((sum, p) => sum + p.price, 0) / categoryProducts.length;

        const extractedKeywords = [...new Set(
          categoryProducts.slice(0, 15).flatMap(p => {
            const words = p.title.toLowerCase().split(/\s+/);
            return words.filter(w => w.length > 3 && !['the', 'and', 'with', 'for', 'dans', 'avec', 'pour', 'this', 'that'].includes(w));
          })
        )].slice(0, 8);

        opps.push({
          id: `cat-guide-${category}`,
          type: 'category-guide',
          title: templates.categoryGuide.title(category),
          description: templates.categoryGuide.description(category, categoryProducts.length),
          targetKeywords: [...templates.categoryGuide.keywords(category), ...extractedKeywords],
          productCount: categoryProducts.length,
          relatedProducts: categoryProducts.map((p) => p.title).slice(0, 10),
          score: Math.min(100, categoryProducts.length * 12),
          estimatedWordCount: 2000 + (categoryProducts.length * 100),
          difficulty: categoryProducts.length > 10 ? 'hard' : categoryProducts.length > 5 ? 'medium' : 'easy',
          suggestedStructure: templates.categoryGuide.structure(category)
        });

        if (categoryProducts.length >= 5) {
          opps.push({
            id: `cat-comp-${category}`,
            type: 'comparison',
            title: templates.comparison.title(category, categoryProducts.length),
            description: templates.comparison.description(category),
            targetKeywords: [...templates.comparison.keywords(category), ...extractedKeywords.slice(0, 5)],
            productCount: categoryProducts.length,
            relatedProducts: categoryProducts.map((p) => p.title).slice(0, 10),
            score: Math.min(95, categoryProducts.length * 10),
            estimatedWordCount: 1500 + (categoryProducts.length * 80),
            difficulty: 'medium',
            suggestedStructure: templates.comparison.structure
          });
        }
      }
    });

    subCategoryMap.forEach((subCatProducts, key) => {
      const [category, subCategory] = key.split(':');
      if (subCatProducts.length >= 3) {
        const extractedKeywords = [...new Set(
          subCatProducts.slice(0, 10).flatMap(p => {
            const words = p.title.toLowerCase().split(/\s+/);
            return words.filter(w => w.length > 3 && !['the', 'and', 'with', 'for', 'dans', 'avec', 'pour'].includes(w));
          })
        )].slice(0, 6);

        opps.push({
          id: `subcat-${key}`,
          type: 'category-guide',
          title: templates.subcategory.title(subCategory, category),
          description: templates.subcategory.description(subCategory, category, subCatProducts.length),
          targetKeywords: [...templates.subcategory.keywords(subCategory, category), ...extractedKeywords],
          productCount: subCatProducts.length,
          relatedProducts: subCatProducts.map((p) => p.title),
          score: Math.min(90, subCatProducts.length * 11),
          estimatedWordCount: 1500 + (subCatProducts.length * 90),
          difficulty: 'easy',
          suggestedStructure: [
            `${language === 'fr' ? 'Ce qui rend' : 'What Makes'} ${subCategory} ${language === 'fr' ? 'spécial' : 'Special'}`,
            language === 'fr' ? 'Aperçu des caractéristiques' : 'Product Features Overview',
            language === 'fr' ? 'Meilleurs choix' : 'Top Picks',
            language === 'fr' ? 'Conseils d\'achat' : 'Buying Tips'
          ]
        });
      }
    });

    const colorMap = new Map<string, Product[]>();
    products.forEach((product) => {
      if (product.ai_color && product.category) {
        const key = `${product.category}:${product.ai_color}`;
        if (!colorMap.has(key)) {
          colorMap.set(key, []);
        }
        colorMap.get(key)!.push(product);
      }
    });

    colorMap.forEach((colorProducts, key) => {
      const [category, color] = key.split(':');
      if (colorProducts.length >= 3) {
        const extractedKeywords = [...new Set(
          colorProducts.flatMap(p => {
            const words = p.title.toLowerCase().split(/\s+/);
            return words.filter(w => w.length > 3 && !['the', 'and', 'with', 'for'].includes(w));
          })
        )].slice(0, 5);

        opps.push({
          id: `color-${key}`,
          type: 'product-spotlight',
          title: templates.color.title(color, category),
          description: templates.color.description(color, category),
          targetKeywords: [...templates.color.keywords(color, category), ...extractedKeywords],
          productCount: colorProducts.length,
          relatedProducts: colorProducts.map((p) => p.title),
          score: Math.min(85, colorProducts.length * 9),
          estimatedWordCount: 1000 + (colorProducts.length * 70),
          difficulty: 'easy',
          suggestedStructure: [
            `${language === 'fr' ? 'Pourquoi choisir' : 'Why Choose'} ${color}`,
            language === 'fr' ? 'Produits en vedette' : 'Featured Products',
            language === 'fr' ? 'Conseils de style' : 'Styling Tips',
            language === 'fr' ? 'Découvrir la collection' : 'Shop the Collection'
          ]
        });
      }
    });

    const materialMap = new Map<string, Product[]>();
    products.forEach((product) => {
      if (product.ai_material && product.category) {
        const key = `${product.category}:${product.ai_material}`;
        if (!materialMap.has(key)) {
          materialMap.set(key, []);
        }
        materialMap.get(key)!.push(product);
      }
    });

    materialMap.forEach((materialProducts, key) => {
      const [category, material] = key.split(':');
      if (materialProducts.length >= 3) {
        const extractedKeywords = [...new Set(
          materialProducts.flatMap(p => {
            const words = p.title.toLowerCase().split(/\s+/);
            return words.filter(w => w.length > 3 && !['the', 'and', 'with', 'for', 'dans', 'avec', 'pour'].includes(w));
          })
        )].slice(0, 5);

        opps.push({
          id: `material-${key}`,
          type: 'how-to',
          title: templates.material.title(material, category),
          description: templates.material.description(material, category),
          targetKeywords: [...templates.material.keywords(material, category), ...extractedKeywords],
          productCount: materialProducts.length,
          relatedProducts: materialProducts.map((p) => p.title),
          score: Math.min(88, materialProducts.length * 10),
          estimatedWordCount: 1200 + (materialProducts.length * 60),
          difficulty: 'medium',
          suggestedStructure: [
            `${language === 'fr' ? 'Qu\'est-ce que' : 'What is'} ${material}?`,
            language === 'fr' ? 'Avantages et inconvénients' : 'Advantages & Disadvantages',
            language === 'fr' ? 'Entretien et maintenance' : 'Care & Maintenance',
            language === 'fr' ? 'Produits recommandés' : 'Recommended Products',
            'FAQs'
          ]
        });
      }
    });


    const priceRanges = [
      { min: 0, max: 50, label: language === 'fr' ? 'Économique' : 'Budget-Friendly' },
      { min: 50, max: 150, label: language === 'fr' ? 'Milieu de gamme' : 'Mid-Range' },
      { min: 150, max: Infinity, label: language === 'fr' ? 'Premium' : 'Premium' }
    ];

    priceRanges.forEach(range => {
      const rangeProducts = products.filter(p => p.price >= range.min && p.price < range.max);
      const categoryGroups = new Map<string, Product[]>();

      rangeProducts.forEach(p => {
        if (p.category) {
          if (!categoryGroups.has(p.category)) {
            categoryGroups.set(p.category, []);
          }
          categoryGroups.get(p.category)!.push(p);
        }
      });

      categoryGroups.forEach((products, category) => {
        if (products.length >= 5) {
          const currencySymbol = language === 'fr' ? '€' : '$';
          opps.push({
            id: `price-${range.label}-${category}`,
            type: 'comparison',
            title: templates.priceRange.title(range.label, category, range.max),
            description: templates.priceRange.description(range.label, category),
            targetKeywords: templates.priceRange.keywords(category, range.label, range.max),
            productCount: products.length,
            relatedProducts: products.map((p) => p.title).slice(0, 8),
            score: Math.min(87, products.length * 8),
            estimatedWordCount: 1300 + (products.length * 70),
            difficulty: 'easy',
            suggestedStructure: [
              language === 'fr' ? 'Rapport qualité-prix' : 'Value for Money',
              language === 'fr' ? 'Meilleurs choix par prix' : 'Top Picks by Price',
              language === 'fr' ? 'À quoi s\'attendre' : 'What to Expect',
              language === 'fr' ? 'Conseils d\'achat' : 'Shopping Tips'
            ]
          });
        }
      });
    });

    opps.sort((a, b) => b.score - a.score);
    setOpportunities(opps);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateOutline = async (opportunity: Opportunity) => {
    setGeneratingOutline(opportunity.id);

    try {
      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-seo-opportunities`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          opportunity: {
            title: opportunity.title,
            description: opportunity.description,
            keywords: opportunity.targetKeywords,
            productTitles: opportunity.relatedProducts.slice(0, 10)
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const outline = result.outline || 'Outline generated successfully';
        addNotification({
          type: 'success',
          title: 'Outline Generated',
          message: outline.substring(0, 100) + '...',
          duration: 5000
        });
      } else {
        throw new Error('Failed to generate outline');
      }
    } catch (err) {
      console.error('Error generating outline:', err);
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: 'Failed to generate outline. Please try again.',
        duration: 5000
      });
    } finally {
      setGeneratingOutline(null);
    }
  };

  const handleCreateArticle = async (opportunity: Opportunity) => {
    setCreatingArticle(opportunity.id);

    try {
      const relatedProductIds = products
        .filter(p => opportunity.relatedProducts.includes(p.title))
        .map(p => p.id);

      const productLanguage = products[0]?.product_type || 'en';

      const { data: opportunityData, error: oppError } = await supabase
        .from('blog_opportunities')
        .insert({
          title: opportunity.title,
          description: opportunity.description,
          type: opportunity.type,
          target_keywords: opportunity.targetKeywords,
          related_product_ids: relatedProductIds,
          product_language: productLanguage,
          category: products[0]?.category || '',
          sub_category: products[0]?.sub_category || '',
          score: opportunity.score,
          estimated_word_count: opportunity.estimatedWordCount,
          difficulty: opportunity.difficulty,
          status: 'approved'
        })
        .select()
        .single();

      if (oppError) throw oppError;

      const articleContent = `<h1>${opportunity.title}</h1>\n<p>${opportunity.description}</p>\n\n${opportunity.suggestedStructure?.map((section, idx) => `<h2>${idx + 1}. ${section}</h2>\n<p>[Content for ${section}]</p>`).join('\n') || ''}`;

      const { error: articleError } = await supabase
        .from('blog_articles')
        .insert({
          opportunity_id: opportunityData.id,
          title: opportunity.title,
          content: articleContent,
          excerpt: opportunity.description.substring(0, 200),
          target_keywords: opportunity.targetKeywords,
          related_product_ids: relatedProductIds,
          category: products[0]?.category || '',
          subcategory: products[0]?.sub_category || '',
          language: 'en',
          word_count: articleContent.split(/\s+/).length,
          format: 'html',
          product_links: [],
          status: 'draft',
          sync_status: 'draft',
          author: 'AI Generated',
          tags: opportunity.targetKeywords.slice(0, 3).join(', '),
          meta_description: opportunity.description.substring(0, 160)
        });

      if (articleError) throw articleError;

      const { data: createdArticle } = await supabase
        .from('blog_articles')
        .select('id')
        .eq('opportunity_id', opportunityData.id)
        .single();

      addNotification({
        type: 'success',
        title: 'Article Created',
        message: 'Draft article created successfully. Opening preview...',
        duration: 3000
      });

      setTimeout(() => {
        if (createdArticle) {
          setSelectedArticleId(createdArticle.id);
        }
      }, 500);
    } catch (err) {
      console.error('Error creating article:', err);
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: err instanceof Error ? err.message : 'Failed to create article',
        duration: 5000
      });
    } finally {
      setCreatingArticle(null);
    }
  };

  const getTypeIcon = (type: Opportunity['type']) => {
    switch (type) {
      case 'category-guide':
        return BookOpen;
      case 'comparison':
        return Target;
      case 'how-to':
        return FileText;
      case 'product-spotlight':
        return Package;
      case 'seasonal':
        return TrendingUp;
    }
  };

  const getTypeColor = (type: Opportunity['type']) => {
    switch (type) {
      case 'category-guide':
        return 'bg-blue-100 text-blue-700';
      case 'comparison':
        return 'bg-green-100 text-green-700';
      case 'how-to':
        return 'bg-orange-100 text-orange-700';
      case 'product-spotlight':
        return 'bg-purple-100 text-purple-700';
      case 'seasonal':
        return 'bg-teal-100 text-teal-700';
    }
  };

  const getTypeLabel = (type: Opportunity['type']) => {
    switch (type) {
      case 'category-guide':
        return 'Category Guide';
      case 'comparison':
        return 'Comparison';
      case 'how-to':
        return 'How-To Guide';
      case 'product-spotlight':
        return 'Product Spotlight';
      case 'seasonal':
        return 'Seasonal';
    }
  };

  const getDifficultyColor = (difficulty: Opportunity['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
    }
  };

  const filteredOpportunities = filterType === 'all'
    ? opportunities
    : opportunities.filter(o => o.type === filterType);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Blog Content Opportunities</h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered content ideas based on your product catalog
            </p>
          </div>
        </div>
        <LoadingAnimation type="content" message="Generating content opportunities..." />
      </div>
    );
  }

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />
      {selectedArticleId && (
        <BlogArticleModal
          articleId={selectedArticleId}
          onClose={() => setSelectedArticleId(null)}
          onUpdate={fetchProducts}
        />
      )}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blog Content Opportunities</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered content ideas based on your product catalog
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateSmartOpportunities}
            disabled={generatingSmart || products.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
          >
            {generatingSmart ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Smart Opportunities
              </>
            )}
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="category-guide">Category Guides</option>
            <option value="comparison">Comparisons</option>
            <option value="how-to">How-To Guides</option>
            <option value="product-spotlight">Product Spotlights</option>
          </select>
          <button
            onClick={fetchProducts}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Category Guides</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {opportunities.filter((o) => o.type === 'category-guide').length}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Comparisons</h3>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {opportunities.filter((o) => o.type === 'comparison').length}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">How-To Guides</h3>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {opportunities.filter((o) => o.type === 'how-to').length}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Spotlights</h3>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {opportunities.filter((o) => o.type === 'product-spotlight').length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOpportunities.map((opportunity) => {
          const Icon = getTypeIcon(opportunity.type);
          const colorClass = getTypeColor(opportunity.type);
          const difficultyClass = getDifficultyColor(opportunity.difficulty);

          return (
            <div key={opportunity.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">{opportunity.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                        {getTypeLabel(opportunity.type)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyClass}`}>
                        {opportunity.difficulty}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        Score: {opportunity.score}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{opportunity.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {opportunity.productCount} products
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        ~{opportunity.estimatedWordCount.toLocaleString()} words
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(opportunity.title, opportunity.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Copy title"
                  >
                    {copiedId === opportunity.id ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => handleCreateArticle(opportunity)}
                    disabled={creatingArticle === opportunity.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
                  >
                    {creatingArticle === opportunity.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FileEdit className="w-4 h-4" />
                        Create Article
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Target Keywords
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.targetKeywords.map((keyword, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {opportunity.suggestedStructure && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Suggested Structure
                    </h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {opportunity.suggestedStructure.map((section, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          {section}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredOpportunities.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No content opportunities found</p>
          <p className="text-sm text-gray-500 mt-1">
            {filterType !== 'all'
              ? 'Try changing the filter or import more products'
              : 'Import more products to discover content ideas'}
          </p>
        </div>
      )}
      </div>
    </>
  );
}
