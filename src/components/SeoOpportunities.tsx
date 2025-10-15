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
import { ProductDiagnostics } from './ProductDiagnostics';

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

  const supportedLangs: ('fr' | 'en' | 'es' | 'de' | 'it')[] = ['fr', 'en', 'es', 'de', 'it'];
  const templateLang = supportedLangs.includes(language as 'fr' | 'en' | 'es' | 'de' | 'it') ? (language as 'fr' | 'en' | 'es' | 'de' | 'it') : 'fr';
  const templates = opportunityTemplates[templateLang];

  const uiText = {
    fr: {
      title: 'Opportunités de Contenu Blog',
      subtitle: 'Idées de contenu basées sur votre catalogue produits',
      generating: 'Génération...',
      generateButton: 'Générer des Opportunités',
      allTypes: 'Tous les Types',
      categoryGuides: 'Guides Catégorie',
      comparisons: 'Comparaisons',
      howToGuides: 'Guides Pratiques',
      productSpotlights: 'Produits Vedettes',
      categoryGuide: 'Guide Catégorie',
      comparison: 'Comparaison',
      howTo: 'Guide Pratique',
      spotlight: 'Produit Vedette',
      easy: 'facile',
      medium: 'moyen',
      hard: 'difficile',
      products: 'produits',
      words: 'mots',
      score: 'Score',
      targetKeywords: 'Mots-clés Cibles',
      suggestedStructure: 'Structure Suggérée',
      createArticle: 'Créer l\'Article'
    },
    en: {
      title: 'Blog Content Opportunities',
      subtitle: 'AI-powered content ideas based on your product catalog',
      generating: 'Generating...',
      generateButton: 'Generate Smart Opportunities',
      allTypes: 'All Types',
      categoryGuides: 'Category Guides',
      comparisons: 'Comparisons',
      howToGuides: 'How-To Guides',
      productSpotlights: 'Product Spotlights',
      categoryGuide: 'Category Guide',
      comparison: 'Comparison',
      howTo: 'How-To Guide',
      spotlight: 'Spotlight',
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
      products: 'products',
      words: 'words',
      score: 'Score',
      targetKeywords: 'Target Keywords',
      suggestedStructure: 'Suggested Structure',
      createArticle: 'Create Article'
    },
    es: {
      title: 'Oportunidades de Contenido Blog',
      subtitle: 'Ideas de contenido impulsadas por IA basadas en su catálogo de productos',
      generating: 'Generando...',
      generateButton: 'Generar Oportunidades Inteligentes',
      allTypes: 'Todos los Tipos',
      categoryGuides: 'Guías de Categoría',
      comparisons: 'Comparaciones',
      howToGuides: 'Guías Prácticas',
      productSpotlights: 'Productos Destacados',
      categoryGuide: 'Guía de Categoría',
      comparison: 'Comparación',
      howTo: 'Guía Práctica',
      spotlight: 'Destacado',
      easy: 'fácil',
      medium: 'medio',
      hard: 'difícil',
      products: 'productos',
      words: 'palabras',
      score: 'Puntuación',
      targetKeywords: 'Palabras Clave Objetivo',
      suggestedStructure: 'Estructura Sugerida',
      createArticle: 'Crear Artículo'
    },
    de: {
      title: 'Blog-Inhalts-Chancen',
      subtitle: 'KI-gestützte Content-Ideen basierend auf Ihrem Produktkatalog',
      generating: 'Wird generiert...',
      generateButton: 'Intelligente Chancen Generieren',
      allTypes: 'Alle Typen',
      categoryGuides: 'Kategorie-Ratgeber',
      comparisons: 'Vergleiche',
      howToGuides: 'Anleitungen',
      productSpotlights: 'Produkt-Highlights',
      categoryGuide: 'Kategorie-Ratgeber',
      comparison: 'Vergleich',
      howTo: 'Anleitung',
      spotlight: 'Highlight',
      easy: 'einfach',
      medium: 'mittel',
      hard: 'schwer',
      products: 'Produkte',
      words: 'Wörter',
      score: 'Bewertung',
      targetKeywords: 'Ziel-Keywords',
      suggestedStructure: 'Vorgeschlagene Struktur',
      createArticle: 'Artikel Erstellen'
    },
    it: {
      title: 'Opportunità di Contenuto Blog',
      subtitle: 'Idee di contenuto basate su IA dal tuo catalogo prodotti',
      generating: 'Generazione...',
      generateButton: 'Genera Opportunità Intelligenti',
      allTypes: 'Tutti i Tipi',
      categoryGuides: 'Guide per Categoria',
      comparisons: 'Confronti',
      howToGuides: 'Guide Pratiche',
      productSpotlights: 'Prodotti in Evidenza',
      categoryGuide: 'Guida per Categoria',
      comparison: 'Confronto',
      howTo: 'Guida Pratica',
      spotlight: 'In Evidenza',
      easy: 'facile',
      medium: 'medio',
      hard: 'difficile',
      products: 'prodotti',
      words: 'parole',
      score: 'Punteggio',
      targetKeywords: 'Parole Chiave Target',
      suggestedStructure: 'Struttura Suggerita',
      createArticle: 'Crea Articolo'
    }
  };
  const ui = uiText[templateLang];

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
        .select('*')
        .limit(1000);

      if (productsError) throw productsError;

      setProducts(productsData || []);

      const { data: dbOpportunities, error: oppsError } = await supabase
        .from('blog_opportunities')
        .select('*')
        .order('score', { ascending: false });

      if (oppsError) {
        console.error('Error fetching opportunities:', oppsError);
      }

      if (dbOpportunities && dbOpportunities.length > 0) {
        const formattedOpps: Opportunity[] = dbOpportunities.map((opp: any) => ({
          id: opp.id,
          type: opp.type || 'category-guide',
          title: opp.title,
          description: opp.description || '',
          targetKeywords: Array.isArray(opp.target_keywords) ? opp.target_keywords : [],
          productCount: Array.isArray(opp.related_product_ids) ? opp.related_product_ids.length : 0,
          relatedProducts: opp.related_product_ids ? (productsData || []).filter(p => opp.related_product_ids.includes(p.id)).map(p => p.title) : [],
          score: opp.score || 50,
          estimatedWordCount: opp.estimated_word_count || 2000,
          difficulty: opp.difficulty || 'medium',
          suggestedStructure: []
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
          score: opp.score || 50,
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

      const { data: storeData } = await supabase
        .from('shopify_stores')
        .select('language')
        .limit(1)
        .maybeSingle();

      const targetLanguage = storeData?.language || language || 'fr';
      const category = products.find(p => opportunity.relatedProducts.includes(p.title))?.category || '';

      addNotification({
        type: 'info',
        title: language === 'fr' ? 'Génération en cours' : 'Generating',
        message: language === 'fr'
          ? 'L\'IA génère un article complet avec du contenu de qualité...'
          : 'AI is generating a complete article with quality content...',
        duration: 10000
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
          category: category,
          keywords: opportunity.targetKeywords,
          language: targetLanguage,
          word_count_min: opportunity.estimatedWordCount || 2000,
          word_count_max: (opportunity.estimatedWordCount || 2000) + 500,
          output_format: 'html',
          internal_linking: true,
          max_internal_links: Math.min(opportunity.productCount, 5)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate article');
      }

      const result = await response.json();

      if (!result.success || !result.article_id) {
        throw new Error('Article generation failed');
      }

      const { data: opportunityData, error: oppError } = await supabase
        .from('blog_opportunities')
        .insert({
          title: opportunity.title,
          description: opportunity.description,
          type: opportunity.type,
          target_keywords: opportunity.targetKeywords,
          related_product_ids: relatedProductIds,
          product_language: targetLanguage,
          category: category,
          score: opportunity.score,
          estimated_word_count: opportunity.estimatedWordCount,
          difficulty: opportunity.difficulty,
          status: 'approved'
        })
        .select()
        .maybeSingle();

      if (opportunityData) {
        await supabase
          .from('blog_articles')
          .update({ opportunity_id: opportunityData.id })
          .eq('id', result.article_id);
      }

      if (result.validation_warnings && result.validation_warnings.length > 0) {
        addNotification({
          type: 'warning',
          title: language === 'fr' ? 'Article créé avec avertissements' : 'Article created with warnings',
          message: language === 'fr'
            ? `L'article a été créé mais contient ${result.validation_warnings.length} avertissement(s) de qualité.`
            : `Article created but contains ${result.validation_warnings.length} quality warning(s).`,
          duration: 5000
        });
      } else {
        addNotification({
          type: 'success',
          title: language === 'fr' ? 'Article créé' : 'Article Created',
          message: language === 'fr'
            ? `Article de ${result.word_count} mots généré avec succès (Score: ${result.content_quality_score}/100)`
            : `${result.word_count}-word article generated successfully (Score: ${result.content_quality_score}/100)`,
          duration: 5000
        });
      }

      setTimeout(() => {
        setSelectedArticleId(result.article_id);
      }, 500);
    } catch (err) {
      console.error('Error creating article:', err);
      addNotification({
        type: 'error',
        title: language === 'fr' ? 'Échec de la création' : 'Creation Failed',
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
    const labels = {
      'category-guide': ui.categoryGuide,
      'comparison': ui.comparison,
      'how-to': ui.howTo,
      'product-spotlight': ui.spotlight,
      'seasonal': templateLang === 'fr' ? 'Saisonnier' : templateLang === 'es' ? 'Temporal' : templateLang === 'de' ? 'Saisonal' : templateLang === 'it' ? 'Stagionale' : 'Seasonal'
    };
    return labels[type];
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
        {/* Product Diagnostics - Show if no products */}
        {products.length === 0 && <ProductDiagnostics />}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{ui.title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {ui.subtitle}
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
                {ui.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {ui.generateButton}
              </>
            )}
          </button>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">{ui.allTypes}</option>
            <option value="category-guide">{ui.categoryGuides}</option>
            <option value="comparison">{ui.comparisons}</option>
            <option value="how-to">{ui.howToGuides}</option>
            <option value="product-spotlight">{ui.productSpotlights}</option>
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
            <h3 className="font-semibold text-blue-900">{ui.categoryGuides}</h3>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {opportunities.filter((o) => o.type === 'category-guide').length}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">{ui.comparisons}</h3>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {opportunities.filter((o) => o.type === 'comparison').length}
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-orange-900">{ui.howToGuides}</h3>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {opportunities.filter((o) => o.type === 'how-to').length}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">{ui.productSpotlights}</h3>
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
                        {ui[opportunity.difficulty]}
                      </span>
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                        <TrendingUp className="w-3 h-3" />
                        {ui.score}: {opportunity.score}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{opportunity.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-600 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {opportunity.productCount} {ui.products}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        ~{opportunity.estimatedWordCount.toLocaleString()} {ui.words}
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
                        {templateLang === 'fr' ? 'Création...' : templateLang === 'es' ? 'Creando...' : templateLang === 'de' ? 'Wird erstellt...' : templateLang === 'it' ? 'Creazione...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <FileEdit className="w-4 h-4" />
                        {ui.createArticle}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    {ui.targetKeywords}
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
                      {ui.suggestedStructure}
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
