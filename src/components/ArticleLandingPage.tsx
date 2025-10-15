import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Calendar,
  Clock,
  Tag,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Copy,
  Check,
  ChevronRight,
  Home,
  ArrowUp
} from 'lucide-react';
import { getArticleThumbnail } from '../lib/imageUtils';

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
      setArticle(data as BlogArticle);
    } catch (err) {
      console.error('Error fetching article:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractSections = (htmlContent: string): Array<{ id: string; title: string }> => {
    const h2Regex = /<h2[^>]*id="([^"]*)"[^>]*>(.*?)<\/h2>/gi;
    const sections: Array<{ id: string; title: string }> = [];
    let match;

    while ((match = h2Regex.exec(htmlContent)) !== null) {
      sections.push({
        id: match[1],
        title: match[2].replace(/<[^>]*>/g, '')
      });
    }

    return sections;
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
            <div
              className="prose prose-lg max-w-none prose-headings:font-bold prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg prose-figcaption:text-center prose-figcaption:text-sm prose-figcaption:text-gray-600 prose-figcaption:mt-2 prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

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
