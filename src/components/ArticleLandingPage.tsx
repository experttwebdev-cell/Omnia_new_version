import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  Calendar,
  Clock,
  Tag,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Copy,
  Check,
  ChevronRight,
  Home,
  ArrowUp,
  AlertCircle
} from 'lucide-react';
import { getArticleThumbnail } from '../lib/imageUtils';
import { validateHeadingHierarchy } from '../lib/headingValidator';

interface ArticleLandingPageProps {
  articleId: string;
}

interface BlogArticle {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  meta_description: string | null;
  target_keywords: string[];
  category: string | null;
  subcategory: string | null;
  author: string | null;
  created_at: string;
  word_count: number | null;
  product_links?: Array<{
    product_id: string;
    title: string;
    handle: string;
    image_url: string;
    price: number;
    category: string;
    sub_category?: string;
    ai_color?: string;
    ai_material?: string;
    ai_vision_analysis?: string;
    dimensions_text?: string;
    dimensions_source?: string;
    smart_length?: number;
    smart_length_unit?: string;
    smart_width?: number;
    smart_width_unit?: string;
    smart_height?: number;
    smart_height_unit?: string;
    smart_depth?: number;
    smart_depth_unit?: string;
    smart_diameter?: number;
    smart_diameter_unit?: string;
    smart_weight?: number;
    smart_weight_unit?: string;
    characteristics?: string;
    functionality?: string;
    google_product_category?: string;
    google_brand?: string;
  }>;
}

export function ArticleLandingPage({ articleId }: ArticleLandingPageProps) {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);

      const sections = document.querySelectorAll('h2[id]');
      const scrollPosition = window.scrollY + 200;

      sections.forEach((section) => {
        const element = section as HTMLElement;
        const top = element.offsetTop;
        const height = element.offsetHeight;

        if (scrollPosition >= top && scrollPosition < top + height) {
          setActiveSection(element.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', articleId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const articleData = data as BlogArticle;

        if (articleData.product_links && Array.isArray(articleData.product_links) && articleData.product_links.length > 0) {
          const productIds = articleData.product_links.map((p: any) => p.product_id).filter(Boolean);

          if (productIds.length > 0) {
            console.log('Fetching enriched product data for', productIds.length, 'products');
            const { data, error: productsError } = await supabase
              .from('shopify_products')
              .select('id, shopify_id, title, handle, image_url, price, category, sub_category, ai_color, ai_material, ai_vision_analysis, dimensions_text, dimensions_source, smart_length, smart_length_unit, smart_width, smart_width_unit, smart_height, smart_height_unit, smart_depth, smart_depth_unit, smart_diameter, smart_diameter_unit, smart_weight, smart_weight_unit, characteristics, functionality, google_product_category, google_brand, vendor, enrichment_status')
              .in('id', productIds);

            const productsData = data as Array<{
              id: string;
              shopify_id: number;
              title: string;
              handle: string | null;
              image_url: string | null;
              price: number | null;
              category: string | null;
              sub_category: string | null;
              ai_color: string | null;
              ai_material: string | null;
              ai_vision_analysis: string | null;
              dimensions_text: string | null;
              dimensions_source: string | null;
              smart_length: number | null;
              smart_length_unit: string | null;
              smart_width: number | null;
              smart_width_unit: string | null;
              smart_height: number | null;
              smart_height_unit: string | null;
              smart_depth: number | null;
              smart_depth_unit: string | null;
              smart_diameter: number | null;
              smart_diameter_unit: string | null;
              smart_weight: number | null;
              smart_weight_unit: string | null;
              characteristics: string | null;
              functionality: string | null;
              google_product_category: string | null;
              google_brand: string | null;
              vendor: string | null;
              enrichment_status: string | null;
            }> | null;

            if (productsError) {
              console.error('Error fetching product data:', productsError);
            }

            if (!productsError && productsData) {
              console.log('✅ Product data fetched:', productsData.length, 'products');
              productsData.forEach(p => {
                console.log(`📦 Product: ${p.title}`);
                console.log(`   Enrichment Status: ${p.enrichment_status === 'enriched' ? '✅ Enriched' : '⏳ Not Enriched'}`);
                console.log(`   🎨 Color: ${p.ai_color || 'N/A'}`);
                console.log(`   🧱 Material: ${p.ai_material || 'N/A'}`);
                console.log(`   📏 Dimensions: ${p.dimensions_text || 'N/A'}`);
                console.log(`   ✨ Characteristics: ${p.characteristics || 'N/A'}`);
                console.log(`   🏷️ Google Category: ${p.google_product_category || 'N/A'}`);
                console.log(`   🏢 Brand: ${p.google_brand || p.vendor || 'N/A'}`);
              });

              articleData.product_links = productsData.map(p => ({
                product_id: p.id,
                title: p.title,
                handle: p.handle || '',
                image_url: p.image_url || '',
                price: p.price || 0,
                category: p.category || '',
                sub_category: p.sub_category || '',
                ai_color: p.ai_color || '',
                ai_material: p.ai_material || '',
                ai_vision_analysis: p.ai_vision_analysis || '',
                dimensions_text: p.dimensions_text || '',
                dimensions_source: p.dimensions_source || '',
                smart_length: p.smart_length || undefined,
                smart_length_unit: p.smart_length_unit || 'cm',
                smart_width: p.smart_width || undefined,
                smart_width_unit: p.smart_width_unit || 'cm',
                smart_height: p.smart_height || undefined,
                smart_height_unit: p.smart_height_unit || 'cm',
                smart_depth: p.smart_depth || undefined,
                smart_depth_unit: p.smart_depth_unit || 'cm',
                smart_diameter: p.smart_diameter || undefined,
                smart_diameter_unit: p.smart_diameter_unit || 'cm',
                smart_weight: p.smart_weight || undefined,
                smart_weight_unit: p.smart_weight_unit || 'kg',
                characteristics: p.characteristics || '',
                functionality: p.functionality || '',
                google_product_category: p.google_product_category || '',
                google_brand: p.google_brand || p.vendor || ''
              }));
            }
          }
        }

        setArticle(articleData);
      }
    } catch (err) {
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractSections = (htmlContent: string): Array<{ id: string; title: string }> => {
    if (!htmlContent) return [];

    const h2Regex = /<h2[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h2>/gi;
    const sections: Array<{ id: string; title: string }> = [];
    let match;
    let sectionIndex = 0;

    while ((match = h2Regex.exec(htmlContent)) !== null) {
      const id = match[1] || `section-${sectionIndex++}`;
      const title = match[2].replace(/<[^>]*>/g, '').trim();
      if (title) {
        sections.push({ id, title });
      }
    }

    return sections;
  };

  const enrichArticleContent = (htmlContent: string): string => {
    if (!article?.product_links || article.product_links.length === 0) {
      console.log('⚠️ No product links to enrich');
      return htmlContent;
    }

    console.log(`🔧 Starting enrichment for ${article.product_links.length} products`);
    let enrichedContent = htmlContent;
    let enrichmentCount = 0;

    article.product_links.forEach((product, index) => {
      try {
        console.log(`\n📦 Processing product ${index + 1}/${article.product_links!.length}: ${product.title}`);
        console.log(`   Available data:`, {
          ai_color: product.ai_color || 'N/A',
          ai_material: product.ai_material || 'N/A',
          dimensions_text: product.dimensions_text || 'N/A',
          characteristics: product.characteristics || 'N/A',
          functionality: product.functionality || 'N/A',
          google_category: product.google_product_category || 'N/A',
          google_brand: product.google_brand || 'N/A'
        });

        const escapedTitle = product.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const productCardRegex = new RegExp(
          `<div[^>]*class="[^"]*product-card[^"]*"[^>]*>[\\s\\S]*?${escapedTitle}[\\s\\S]*?<\\/div>(?:\\s*<\\/div>)*`,
          'gi'
        );

        const existingCard = enrichedContent.match(productCardRegex);

        if (existingCard && existingCard[0]) {
          console.log(`   ✅ Product card found in HTML`);
          let enrichedCard = existingCard[0];
          let hasEnrichments = false;

          const enrichmentData = [];

          const physicalProperties = [];
          const visualProperties = [];
          const functionalProperties = [];
          const metaInfo = [];

          if (product.smart_length || product.smart_width || product.smart_height || product.smart_depth || product.smart_diameter) {
            const dimensionParts = [];
            if (product.smart_length) {
              dimensionParts.push(`<div class="flex items-center gap-1"><span class="font-semibold text-gray-700">L:</span> <span class="text-gray-900">${product.smart_length} ${product.smart_length_unit}</span></div>`);
            }
            if (product.smart_width) {
              dimensionParts.push(`<div class="flex items-center gap-1"><span class="font-semibold text-gray-700">l:</span> <span class="text-gray-900">${product.smart_width} ${product.smart_width_unit}</span></div>`);
            }
            if (product.smart_height) {
              dimensionParts.push(`<div class="flex items-center gap-1"><span class="font-semibold text-gray-700">H:</span> <span class="text-gray-900">${product.smart_height} ${product.smart_height_unit}</span></div>`);
            }
            if (product.smart_depth) {
              dimensionParts.push(`<div class="flex items-center gap-1"><span class="font-semibold text-gray-700">P:</span> <span class="text-gray-900">${product.smart_depth} ${product.smart_depth_unit}</span></div>`);
            }
            if (product.smart_diameter) {
              dimensionParts.push(`<div class="flex items-center gap-1"><span class="font-semibold text-gray-700">Ø:</span> <span class="text-gray-900">${product.smart_diameter} ${product.smart_diameter_unit}</span></div>`);
            }

            physicalProperties.push(`<div class="mb-3"><div class="font-semibold text-blue-700 mb-2 flex items-center gap-2"><span>📏</span> Dimensions Intelligentes</div><div class="grid grid-cols-2 gap-2 text-sm">${dimensionParts.join('')}</div></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added smart dimensions`);
          } else if (product.dimensions_text) {
            physicalProperties.push(`<div class="text-sm text-gray-700 mb-2 flex items-center gap-2"><strong class="text-blue-600">📏 Dimensions:</strong> <span>${product.dimensions_text}</span></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added dimensions text: ${product.dimensions_text}`);
          }

          if (product.smart_weight) {
            physicalProperties.push(`<div class="text-sm text-gray-700 mb-2 flex items-center gap-2"><strong class="text-blue-600">⚖️ Poids:</strong> <span>${product.smart_weight} ${product.smart_weight_unit}</span></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added weight: ${product.smart_weight} ${product.smart_weight_unit}`);
          }

          if (product.ai_material) {
            physicalProperties.push(`<div class="text-sm text-gray-700 mb-2 flex items-center gap-2"><strong class="text-blue-600">🧱 Matériau:</strong> <span>${product.ai_material}</span></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added material: ${product.ai_material}`);
          }

          if (product.ai_color) {
            visualProperties.push(`<div class="text-sm text-gray-700 mb-2 flex items-center gap-2"><strong class="text-blue-600">🎨 Couleur:</strong> <span>${product.ai_color}</span></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added color: ${product.ai_color}`);
          }

          if (product.ai_vision_analysis) {
            visualProperties.push(`<div class="text-sm text-gray-700 mb-3"><div class="font-semibold text-blue-700 mb-1 flex items-center gap-2"><span>👁️</span> Analyse AI Vision (OpenAI)</div><div class="text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-200 italic">${product.ai_vision_analysis}</div></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added AI vision analysis`);
          }

          if (product.functionality) {
            functionalProperties.push(`<div class="text-sm text-gray-700 mb-2 flex items-center gap-2"><strong class="text-blue-600">⚙️ Fonctionnalité:</strong> <span>${product.functionality}</span></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added functionality: ${product.functionality}`);
          }

          if (product.characteristics) {
            functionalProperties.push(`<div class="text-sm text-gray-700 mb-2"><strong class="text-blue-600">✨ Caractéristiques:</strong> <span class="ml-1">${product.characteristics}</span></div>`);
            hasEnrichments = true;
            console.log(`   ✅ Added characteristics`);
          }

          if (product.google_brand) {
            metaInfo.push(`<div class="text-xs text-gray-500 mb-1"><strong>🏢 Marque:</strong> ${product.google_brand}</div>`);
            console.log(`   ✅ Added brand: ${product.google_brand}`);
          }

          if (product.google_product_category) {
            metaInfo.push(`<div class="text-xs text-gray-500 mb-1"><strong>🏷️ Catégorie:</strong> ${product.google_product_category}</div>`);
            console.log(`   ✅ Added category: ${product.google_product_category}`);
          }

          if (physicalProperties.length > 0) {
            enrichmentData.push(`<div class="mb-3 pb-3 border-b border-blue-200"><div class="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Propriétés Physiques</div>${physicalProperties.join('')}</div>`);
          }

          if (visualProperties.length > 0) {
            enrichmentData.push(`<div class="mb-3 pb-3 border-b border-blue-200"><div class="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Propriétés Visuelles</div>${visualProperties.join('')}</div>`);
          }

          if (functionalProperties.length > 0) {
            enrichmentData.push(`<div class="mb-3 pb-3 border-b border-blue-200"><div class="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">Caractéristiques Fonctionnelles</div>${functionalProperties.join('')}</div>`);
          }

          if (metaInfo.length > 0) {
            enrichmentData.push(`<div class="mb-2">${metaInfo.join('')}</div>`);
          }

          if (hasEnrichments && enrichmentData.length > 0) {
            const enrichmentBlock = `<div class="mt-4 pt-4 border-t-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg shadow-sm">${enrichmentData.join('')}</div>`;

            const closingDivMatches = enrichedCard.match(/<\/div>/g);
            if (closingDivMatches && closingDivMatches.length >= 2) {
              const lastTwoClosing = enrichedCard.lastIndexOf('</div></div>');
              if (lastTwoClosing !== -1) {
                enrichedCard = enrichedCard.substring(0, lastTwoClosing) + enrichmentBlock + '</div></div>';
              } else {
                const lastClosing = enrichedCard.lastIndexOf('</div>');
                enrichedCard = enrichedCard.substring(0, lastClosing) + enrichmentBlock + '</div>';
              }
            }

            enrichedContent = enrichedContent.replace(existingCard[0], enrichedCard);
            enrichmentCount++;
            console.log(`   ✅ SUCCESSFULLY ENRICHED product ${index + 1}: ${enrichmentData.length} fields added`);
          } else {
            console.log(`   ⚠️ No enrichment data available for product ${index + 1}`);
          }
        } else {
          console.warn(`   ❌ Product card not found in HTML content for: ${product.title}`);
        }
      } catch (error) {
        console.error(`   ❌ Error enriching product ${index + 1}:`, error, product);
      }
    });

    console.log(`\n🎉 Enrichment complete: ${enrichmentCount}/${article.product_links.length} products enriched with AI data`);
    return enrichedContent;
  };

  const getReadingTime = (wordCount: number | null): string => {
    if (!wordCount) return '5 min';
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min`;
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = article?.title || '';

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Article not found</p>
        </div>
      </div>
    );
  }

  const featuredImage = getArticleThumbnail(article.content, article.category || undefined);
  const sections = extractSections(article.content);
  const readingTime = getReadingTime(article.word_count);

  const enrichedContent = useMemo(() => {
    return enrichArticleContent(article.content);
  }, [article.content, article.product_links]);

  const hasIncompleteContent = useMemo(() => {
    if (!article.content) return true;
    return article.content.includes('[Content for') || article.content.length < 200;
  }, [article.content]);

  const headingValidation = useMemo(() => {
    return validateHeadingHierarchy(article.content);
  }, [article.content]);

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="w-4 h-4" />
              <ChevronRight className="w-4 h-4" />
              <span>{article.category || 'Blog'}</span>
              {article.subcategory && (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span>{article.subcategory}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleShare('facebook')}
                className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition"
                title="Share on Facebook"
              >
                <Facebook className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="p-2 text-gray-600 hover:text-blue-400 rounded-lg hover:bg-gray-100 transition"
                title="Share on Twitter"
              >
                <Twitter className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-2 text-gray-600 hover:text-blue-700 rounded-lg hover:bg-gray-100 transition"
                title="Share on LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </button>
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition"
                title="Copy link"
              >
                {copiedLink ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative w-full h-[500px] bg-gray-900 overflow-hidden">
        <img
          src={featuredImage}
          alt={article.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg sm:text-xl text-gray-200 max-w-3xl mx-auto">
                {article.excerpt}
              </p>
            )}
            <div className="flex items-center justify-center gap-6 mt-8 text-gray-300 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{readingTime} de lecture</span>
              </div>
              {article.author && (
                <div className="flex items-center gap-2">
                  <span>Par {article.author}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 self-start">
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Table des matières</h3>
              <nav className="space-y-2">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      activeSection === section.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-xs mr-2">{index + 1}.</span>
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>

            {article.target_keywords && article.target_keywords.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Mots-clés
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.target_keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Partager cet article</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleShare('facebook')}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-blue-50 transition border border-gray-200"
                >
                  <Facebook className="w-5 h-5 text-blue-600" />
                  Facebook
                </button>
                <button
                  onClick={() => handleShare('twitter')}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-blue-50 transition border border-gray-200"
                >
                  <Twitter className="w-5 h-5 text-blue-400" />
                  Twitter
                </button>
                <button
                  onClick={() => handleShare('linkedin')}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-blue-50 transition border border-gray-200"
                >
                  <Linkedin className="w-5 h-5 text-blue-700" />
                  LinkedIn
                </button>
                <button
                  onClick={() => handleShare('email')}
                  className="w-full flex items-center gap-3 px-4 py-2 bg-white rounded-lg text-gray-700 hover:bg-blue-50 transition border border-gray-200"
                >
                  <Mail className="w-5 h-5 text-gray-600" />
                  Email
                </button>
              </div>
            </div>
          </aside>

          <article className="lg:col-span-9">
            {hasIncompleteContent && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-orange-900 mb-1">
                      Contenu incomplet détecté
                    </h4>
                    <p className="text-sm text-orange-800">
                      Cet article contient du contenu placeholder. Le contenu complet sera généré automatiquement lors de la prochaine génération.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {headingValidation.score < 70 && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-1">
                      Attention: Structure des titres à améliorer
                    </h4>
                    <p className="text-sm text-yellow-800">
                      Score SEO de la hiérarchie des titres: {headingValidation.score}/100
                    </p>
                    {headingValidation.errors.length > 0 && (
                      <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside">
                        {headingValidation.errors.slice(0, 3).map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            <style>{`
              /* Product Card Styles */
              .product-card {
                margin: 2rem 0;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }

              .product-card:hover {
                transform: translateY(-4px);
              }

              .product-image {
                background: linear-gradient(135deg, #f5f7fa 0%, #e3e8ef 100%);
              }

              .product-title {
                color: #1a202c;
                min-height: 3.5rem;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }

              .product-price {
                font-size: 1.5rem;
                font-weight: 700;
                color: #2563eb;
              }

              .product-description {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }

              .product-cta {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
                padding: 0.75rem 1rem;
                background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                color: white;
                font-weight: 500;
                border-radius: 0.5rem;
                transition: all 0.2s ease;
                text-decoration: none;
              }

              .product-cta:hover {
                background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
                box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                transform: translateY(-2px);
              }

              /* Product Gallery Grid */
              #produits-recommandes + * {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                gap: 1.5rem;
                margin: 2rem 0;
              }

              /* Inline Product Links */
              .inline-product-link {
                color: #2563eb;
                font-weight: 500;
                text-decoration: none;
                border-bottom: 1px solid transparent;
                transition: all 0.2s ease;
              }

              .inline-product-link:hover {
                color: #1d4ed8;
                border-bottom-color: #2563eb;
              }

              /* FAQ Items */
              .faq-item {
                margin: 1.5rem 0;
                padding: 1.5rem;
                background: #f9fafb;
                border-left: 4px solid #2563eb;
                border-radius: 0.5rem;
              }

              .faq-item h3 {
                margin: 0 0 1rem 0 !important;
                color: #1a202c;
                font-size: 1.25rem !important;
              }

              .faq-item p {
                margin: 0;
              }

              /* Table of Contents Styling */
              .table-of-contents {
                background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
                border: 2px solid #bae6fd;
                border-radius: 1rem;
                padding: 1.5rem;
                margin: 2rem 0;
              }

              .table-of-contents ul {
                list-style: none;
                padding: 0;
                margin: 0;
              }

              .table-of-contents li {
                margin: 0.5rem 0;
              }

              .table-of-contents a {
                color: #0369a1;
                font-weight: 500;
                text-decoration: none;
                transition: color 0.2s ease;
              }

              .table-of-contents a:hover {
                color: #075985;
                text-decoration: underline;
              }

              /* Tags Styling */
              .tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin: 2rem 0;
              }

              .tag {
                display: inline-block;
                padding: 0.375rem 0.75rem;
                background: #eff6ff;
                color: #1e40af;
                font-size: 0.875rem;
                font-weight: 500;
                border-radius: 9999px;
                border: 1px solid #bfdbfe;
              }
            `}</style>

            {enrichedContent && enrichedContent.trim() ? (
              <div
                className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:mb-6 prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-gray-600 prose-figcaption:mt-2 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal"
                dangerouslySetInnerHTML={{ __html: enrichedContent }}
              />
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Aucun contenu disponible</p>
                <p className="text-sm text-gray-500 mt-1">
                  Le contenu de cet article n'a pas encore été généré
                </p>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {article.target_keywords?.slice(0, 5).map((keyword, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
                <button
                  onClick={scrollToTop}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <ArrowUp className="w-4 h-4" />
                  Haut de page
                </button>
              </div>
            </div>
          </article>
        </div>
      </div>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition z-50"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
