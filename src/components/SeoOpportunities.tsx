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
  FileEdit,
  XCircle
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { useNotifications, NotificationSystem } from './NotificationSystem';
import { LoadingAnimation } from './LoadingAnimation';
import { useLanguage } from '../App';
import { opportunityTemplates } from '../lib/language';
import { BlogArticleModal } from './BlogArticleModal';
import { ProductDiagnostics } from './ProductDiagnostics';
import { ProgressModal } from './ProgressModal';

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
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingOutline, setGeneratingOutline] = useState<string | null>(null);
  const [creatingArticle, setCreatingArticle] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [generatingSmart, setGeneratingSmart] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showCreationProgress, setShowCreationProgress] = useState(false);
  const [creationProgress, setCreationProgress] = useState({ current: 0, total: 100, currentItem: '' });
  const [isCreationComplete, setIsCreationComplete] = useState(false);
  const [showGenerationProgress, setShowGenerationProgress] = useState(false);
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 100, currentItem: '' });
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
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
      createArticle: 'Créer l\'Article',
      noOpportunities: 'Aucune opportunité de contenu trouvée',
      noOpportunitiesFilter: 'Essayez de changer le filtre ou d\'importer plus de produits',
      noOpportunitiesAll: 'Importez plus de produits pour découvrir des idées de contenu'
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
      createArticle: 'Create Article',
      noOpportunities: 'No content opportunities found',
      noOpportunitiesFilter: 'Try changing the filter or import more products',
      noOpportunitiesAll: 'Import more products to discover content ideas'
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
      createArticle: 'Crear Artículo',
      noOpportunities: 'No se encontraron oportunidades de contenido',
      noOpportunitiesFilter: 'Intente cambiar el filtro o importar más productos',
      noOpportunitiesAll: 'Importe más productos para descubrir ideas de contenido'
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
      createArticle: 'Artikel Erstellen',
      noOpportunities: 'Keine Inhaltschancen gefunden',
      noOpportunitiesFilter: 'Versuchen Sie, den Filter zu ändern oder mehr Produkte zu importieren',
      noOpportunitiesAll: 'Importieren Sie mehr Produkte, um Content-Ideen zu entdecken'
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
      createArticle: 'Crea Articolo',
      noOpportunities: 'Nessuna opportunità di contenuto trovata',
      noOpportunitiesFilter: 'Prova a cambiare il filtro o importa più prodotti',
      noOpportunitiesAll: 'Importa più prodotti per scoprire idee di contenuto'
    }
  };
  const ui = uiText[templateLang];

  const fetchProducts = useCallback(async () => {
    const startTime = Date.now();

    try {
      console.log('🔍 [FETCH START]', new Date().toISOString(), 'Setting loading to true...');
      setLoading(true);
      setError('');

      console.log('🔍 [FETCH]', 'Fetching products from shopify_products table...');

      const { data: productsData, error: productsError } = await supabase
        .from('shopify_products')
        .select('id, title, category, sub_category, product_type, tags, status, enrichment_status, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);

      console.log('🔍 [FETCH]', 'Products query completed');

      if (productsError) {
        console.error('❌ Error fetching products:', productsError);
        throw productsError;
      }

      const productCount = (productsData || []).length;
      const elapsed = Date.now() - startTime;
      console.log(`✅ Found ${productCount} products in ${elapsed}ms`);

      if (productCount >= 1000) {
        addNotification({
          type: 'info',
          title: language === 'fr' ? 'Limite atteinte' : 'Limit Reached',
          message: language === 'fr'
            ? 'Affichage limité à 1000 produits les plus récents'
            : 'Showing the 1000 most recent products',
          duration: 5000
        });
      }

      setProducts(productsData || []);

      console.log('🔍 [OPPORTUNITIES START]', new Date().toISOString(), 'Fetching opportunities from blog_opportunities table...');

      const { data: dbOpportunities, error: oppsError } = await supabase
        .from('blog_opportunities')
        .select('*')
        .order('score', { ascending: false });

      const oppsElapsed = Date.now() - startTime;

      if (oppsError) {
        console.error('❌ Error fetching opportunities:', oppsError);
        console.log('⚠️ Continuing without opportunities data');
        setOpportunities([]);
      } else {
        console.log(`✅ Found ${(dbOpportunities || []).length} opportunities in ${oppsElapsed}ms`);

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
        } else {
          setOpportunities([]);
        }
      }

      const totalElapsed = Date.now() - startTime;
      console.log(`✅ [FETCH COMPLETE] Total time: ${totalElapsed}ms`);
    } catch (err) {
      console.error('❌ [FETCH ERROR]', err);

      let errorMessage = 'Failed to fetch products';

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = language === 'fr'
            ? 'Délai d\'attente dépassé. Veuillez réessayer.'
            : 'Request timeout. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      addNotification({
        type: 'error',
        title: language === 'fr' ? 'Erreur' : 'Error',
        message: errorMessage,
        duration: 5000
      });
      setProducts([]);
      setOpportunities([]);
    } finally {
      setLoading(false);
      const totalTime = Date.now() - startTime;
      console.log(`🏁 [FINALLY BLOCK] Loading set to false after ${totalTime}ms`);
    }
  }, [addNotification, language]);

  useEffect(() => {
    let isMounted = true;
    let safetyTimeout: NodeJS.Timeout;

    const loadData = async () => {
      if (isMounted) {
        // Safety timeout: force loading to false after 30 seconds
        safetyTimeout = setTimeout(() => {
          console.warn('⚠️ [SAFETY TIMEOUT] Forcing loading to false after 30 seconds');
          if (isMounted) {
            setLoading(false);
            setError('Timeout: La requête a pris trop de temps. Veuillez réessayer.');
          }
        }, 30000);

        await fetchProducts();

        // Clear safety timeout if fetch completes normally
        clearTimeout(safetyTimeout);
      }
    };

    loadData();

    return () => {
      isMounted = false;
      if (safetyTimeout) {
        clearTimeout(safetyTimeout);
      }
      console.log('🧹 Component unmounting, cleaning up...');
    };
  }, [fetchProducts]);

  const handleGenerateSmartOpportunities = async () => {
    if (generatingSmart) return;
    setGeneratingSmart(true);
    setShowGenerationProgress(true);
    setIsGenerationComplete(false);
    setGenerationProgress({ current: 10, total: 100, currentItem: language === 'fr' ? 'Récupération de la langue du magasin...' : 'Fetching store language...' });

    const { data: storeData } = await supabase
      .from('shopify_stores')
      .select('language')
      .limit(1)
      .maybeSingle();

    const storeLanguage = storeData?.language || language || 'fr';

    setGenerationProgress({ current: 15, total: 100, currentItem: language === 'fr' ? 'Analyse du catalogue produits...' : 'Analyzing product catalog...' });
    await generateSmartOpportunities(products, 0, storeLanguage);
    setGeneratingSmart(false);
  };

  const generateSmartOpportunities = async (products: Product[], retryCount = 0, targetLanguage?: string) => {
    const MAX_RETRIES = 2;

    if (products.length === 0) {
      console.log('⚠️ No products to generate opportunities from');
      setOpportunities([]);
      setShowGenerationProgress(false);
      addNotification({
        type: 'warning',
        title: language === 'fr' ? 'Aucun produit' : 'No Products',
        message: language === 'fr' ? 'Importez des produits pour générer des opportunités' : 'Import products to generate opportunities',
        duration: 5000
      });
      return;
    }

    const effectiveLanguage = targetLanguage || language || 'fr';

    try {
      console.log(`🚀 Starting opportunity generation with ${products.length} products in ${effectiveLanguage} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      setGenerationProgress({ current: 30, total: 100, currentItem: language === 'fr' ? 'Préparation des données produits...' : 'Preparing product data...' });

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

      console.log('📦 Products data prepared:', productsData.length);
      setGenerationProgress({ current: 50, total: 100, currentItem: language === 'fr' ? 'IA en cours d\'analyse...' : 'AI analyzing...' });

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-seo-opportunities`;
      console.log('🔗 Calling API:', apiUrl, 'with language:', effectiveLanguage);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productsData,
          language: effectiveLanguage
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      console.log('✅ API Response received');
      setGenerationProgress({ current: 70, total: 100, currentItem: language === 'fr' ? 'Sauvegarde dans la base de données...' : 'Saving to database...' });

      const result = await response.json();
      console.log('📊 Result:', result);

      if (result.opportunities && Array.isArray(result.opportunities)) {
        setGenerationProgress({ current: 85, total: 100, currentItem: language === 'fr' ? 'Finalisation des opportunités...' : 'Finalizing opportunities...' });

        const formattedOpps: Opportunity[] = result.opportunities.map((opp: any, index: number) => ({
          id: opp.id || `smart-opp-${index}`,
          type: opp.type || 'category-guide',
          title: opp.article_title || opp.title,
          description: opp.intro_excerpt || opp.meta_description || opp.description || '',
          targetKeywords: [...(opp.primary_keywords || []), ...(opp.secondary_keywords || [])],
          productCount: opp.product_count || 0,
          relatedProducts: opp.product_ids ? products.filter(p => opp.product_ids.includes(p.id)).map(p => p.title) : [],
          score: opp.score || 50,
          estimatedWordCount: opp.estimated_word_count || 2000,
          difficulty: opp.difficulty || 'medium',
          suggestedStructure: opp.structure?.h2_sections || []
        }));

        setOpportunities(formattedOpps);
        setGenerationProgress({ current: 100, total: 100, currentItem: language === 'fr' ? 'Terminé !' : 'Complete!' });
        setIsGenerationComplete(true);

        setTimeout(() => {
          setShowGenerationProgress(false);
          setIsGenerationComplete(false);
          addNotification({
            type: 'success',
            title: language === 'fr' ? 'Opportunités générées' : 'Opportunities Generated',
            message: language === 'fr'
              ? `${formattedOpps.length} opportunités SEO intelligentes créées avec succès`
              : `${formattedOpps.length} smart SEO opportunities created successfully`,
            duration: 5000
          });
        }, 1500);
      } else {
        throw new Error('Invalid response format: missing opportunities array');
      }
    } catch (error) {
      console.error('Error generating smart opportunities:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('⏱️ Request timed out');
        if (retryCount < MAX_RETRIES) {
          console.log(`🔄 Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
          setGenerationProgress({
            current: 20,
            total: 100,
            currentItem: language === 'fr'
              ? `Nouvelle tentative ${retryCount + 2}/${MAX_RETRIES + 1}...`
              : `Retrying ${retryCount + 2}/${MAX_RETRIES + 1}...`
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
          return generateSmartOpportunities(products, retryCount + 1, targetLanguage);
        }
      }

      if (retryCount < MAX_RETRIES && (!(error instanceof Error) || error.name !== 'AbortError')) {
        console.log(`🔄 Retrying after error... (${retryCount + 1}/${MAX_RETRIES})`);
        setGenerationProgress({
          current: 20,
          total: 100,
          currentItem: language === 'fr'
            ? `Nouvelle tentative ${retryCount + 2}/${MAX_RETRIES + 1}...`
            : `Retrying ${retryCount + 2}/${MAX_RETRIES + 1}...`
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        return generateSmartOpportunities(products, retryCount + 1, targetLanguage);
      }

      setShowGenerationProgress(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      addNotification({
        type: 'warning',
        title: language === 'fr' ? 'Mode basique activé' : 'Basic Mode Activated',
        message: language === 'fr'
          ? `L'IA n'est pas disponible (${errorMessage}). Génération d'opportunités basiques...`
          : `AI unavailable (${errorMessage}). Generating basic opportunities...`,
        duration: 6000
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

    opps.sort((a, b) => b.score - a.score);
    setOpportunities(opps);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateArticle = async (opportunity: Opportunity) => {
    setCreatingArticle(opportunity.id);
    setShowCreationProgress(true);
    setIsCreationComplete(false);

    try {
      setCreationProgress({
        current: 10,
        total: 100,
        currentItem: language === 'fr' ? 'Préparation de l\'article...' : 'Preparing article...'
      });

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

      setCreationProgress({
        current: 30,
        total: 100,
        currentItem: language === 'fr' ? 'IA en train de rédiger...' : 'AI writing content...'
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

      setCreationProgress({
        current: 70,
        total: 100,
        currentItem: language === 'fr' ? 'Finalisation de l\'article...' : 'Finalizing article...'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate article');
      }

      const result = await response.json();

      if (!result.success || !result.article_id) {
        throw new Error('Article generation failed');
      }

      setCreationProgress({
        current: 90,
        total: 100,
        currentItem: language === 'fr' ? 'Enregistrement...' : 'Saving...'
      });

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

      setCreationProgress({
        current: 100,
        total: 100,
        currentItem: language === 'fr' ? 'Terminé !' : 'Complete!'
      });
      setIsCreationComplete(true);

      setTimeout(() => {
        setShowCreationProgress(false);
        setIsCreationComplete(false);

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
      }, 1500);
    } catch (err) {
      console.error('Error creating article:', err);
      setShowCreationProgress(false);
      setIsCreationComplete(false);
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
      default:
        return FileText;
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
        return 'bg-pink-100 text-pink-700';
      case 'seasonal':
        return 'bg-teal-100 text-teal-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
    return labels[type] || type;
  };

  const getDifficultyColor = (difficulty: Opportunity['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
            <h2 className="text-xl font-bold text-gray-900">{ui.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {ui.subtitle}
            </p>
          </div>
          <button
            onClick={fetchProducts}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4 inline mr-2" />
            {templateLang === 'fr' ? 'Rafraîchir' : 'Refresh'}
          </button>
        </div>
        <LoadingAnimation type="opportunities" message={templateLang === 'fr' ? "Chargement des opportunités de contenu..." : "Loading content opportunities..."} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{ui.title}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {ui.subtitle}
            </p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            {templateLang === 'fr' ? 'Erreur de chargement' : 'Loading Error'}
          </h3>
          <p className="text-red-700 mb-6">{error}</p>
          <button
            onClick={fetchProducts}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition inline-flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            {templateLang === 'fr' ? 'Réessayer' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />

      <ProgressModal
        isOpen={showCreationProgress}
        title={language === 'fr' ? 'Création de l\'article en cours' : 'Creating Article'}
        current={creationProgress.current}
        total={creationProgress.total}
        currentItem={creationProgress.currentItem}
        itemType="article"
        isComplete={isCreationComplete}
        onClose={() => {
          if (isCreationComplete) {
            setShowCreationProgress(false);
            setIsCreationComplete(false);
          }
        }}
      />

      <ProgressModal
        isOpen={showGenerationProgress}
        title={language === 'fr' ? 'Génération des opportunités' : 'Generating Opportunities'}
        current={generationProgress.current}
        total={generationProgress.total}
        currentItem={generationProgress.currentItem}
        itemType="opportunity"
        isComplete={isGenerationComplete}
        onClose={() => {
          if (isGenerationComplete) {
            setShowGenerationProgress(false);
            setIsGenerationComplete(false);
          }
        }}
      />

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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition"
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

          <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-5 h-5 text-pink-600" />
              <h3 className="font-semibold text-pink-900">{ui.productSpotlights}</h3>
            </div>
            <p className="text-2xl font-bold text-pink-900">
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
                          {ui[opportunity.difficulty as keyof typeof ui]}
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

                  {opportunity.suggestedStructure && opportunity.suggestedStructure.length > 0 && (
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
            <p className="text-gray-600">{ui.noOpportunities}</p>
            <p className="text-sm text-gray-500 mt-1">
              {filterType !== 'all'
                ? ui.noOpportunitiesFilter
                : ui.noOpportunitiesAll}
            </p>
          </div>
        )}
      </div>
    </>
  );
}