import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Search,
  RefreshCw,
  BookOpen,
  Edit,
  Trash2,
  Upload,
  CheckCircle,
  Clock,
  FileText,
  Tag,
  Calendar,
  AlertCircle,
  Eye,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Copy,
  Check,
  Plus,
  Grid,
  List
} from 'lucide-react';
import { getArticleThumbnail } from '../lib/imageUtils';
import { useNotifications, NotificationSystem } from './NotificationSystem';
import { ConfirmDialog } from './ConfirmDialog';
import { LoadingAnimation } from './LoadingAnimation';
import { BlogArticleModal } from './BlogArticleModal';
import { BlogWizard } from './BlogWizard';
import { useLanguage } from '../App';

interface BlogArticle {
  id: string;
  opportunity_id: string | null;
  title: string;
  content: string;
  excerpt: string;
  target_keywords: string[];
  related_product_ids: string[];
  shopify_blog_id: number | null;
  shopify_article_id: number | null;
  sync_status: string;
  last_synced_at: string | null;
  sync_error: string;
  author: string;
  tags: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  content_quality_score?: number;
  has_placeholders?: boolean;
  language_validated?: boolean;
  status?: string;
}

export function BlogArticles() {
  const { language, t } = useLanguage();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'sync'; articleId: string } | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [categories, setCategories] = useState<string[]>([]);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  const ui = {
    title: language === 'fr' ? 'Articles de Blog' : language === 'es' ? 'Artículos de Blog' : language === 'de' ? 'Blog-Artikel' : language === 'it' ? 'Articoli Blog' : 'Blog Articles',
    createArticle: language === 'fr' ? 'Créer un Article' : language === 'es' ? 'Crear Artículo' : language === 'de' ? 'Artikel Erstellen' : language === 'it' ? 'Crea Articolo' : 'Create Article',
    search: language === 'fr' ? 'Rechercher des articles...' : language === 'es' ? 'Buscar artículos...' : language === 'de' ? 'Artikel suchen...' : language === 'it' ? 'Cerca articoli...' : 'Search articles...',
    allStatuses: language === 'fr' ? 'Tous les statuts' : language === 'es' ? 'Todos los estados' : language === 'de' ? 'Alle Status' : language === 'it' ? 'Tutti gli stati' : 'All Statuses',
    draft: language === 'fr' ? 'Brouillon' : language === 'es' ? 'Borrador' : language === 'de' ? 'Entwurf' : language === 'it' ? 'Bozza' : 'Draft',
    synced: language === 'fr' ? 'Synchronisé' : language === 'es' ? 'Sincronizado' : language === 'de' ? 'Synchronisiert' : language === 'it' ? 'Sincronizzato' : 'Synced',
    pending: language === 'fr' ? 'En attente' : language === 'es' ? 'Pendiente' : language === 'de' ? 'Ausstehend' : language === 'it' ? 'In attesa' : 'Pending',
    failed: language === 'fr' ? 'Échec' : language === 'es' ? 'Fallido' : language === 'de' ? 'Fehlgeschlagen' : language === 'it' ? 'Fallito' : 'Failed',
    gridView: language === 'fr' ? 'Vue grille' : language === 'es' ? 'Vista de cuadrícula' : language === 'de' ? 'Rasteransicht' : language === 'it' ? 'Vista griglia' : 'Grid view',
    listView: language === 'fr' ? 'Vue liste' : language === 'es' ? 'Vista de lista' : language === 'de' ? 'Listenansicht' : language === 'it' ? 'Vista lista' : 'List view',
    view: language === 'fr' ? 'Voir' : language === 'es' ? 'Ver' : language === 'de' ? 'Ansehen' : language === 'it' ? 'Visualizza' : 'View',
    edit: language === 'fr' ? 'Modifier' : language === 'es' ? 'Editar' : language === 'de' ? 'Bearbeiten' : language === 'it' ? 'Modifica' : 'Edit',
    delete: language === 'fr' ? 'Supprimer' : language === 'es' ? 'Eliminar' : language === 'de' ? 'Löschen' : language === 'it' ? 'Elimina' : 'Delete',
    sync: language === 'fr' ? 'Synchroniser avec Shopify' : language === 'es' ? 'Sincronizar con Shopify' : language === 'de' ? 'Mit Shopify synchronisieren' : language === 'it' ? 'Sincronizza con Shopify' : 'Sync to Shopify',
    syncing: language === 'fr' ? 'Synchronisation...' : language === 'es' ? 'Sincronizando...' : language === 'de' ? 'Synchronisierung...' : language === 'it' ? 'Sincronizzazione...' : 'Syncing...'
  };

  const fetchArticles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setArticles((data || []) as BlogArticle[]);

      const { data: products } = await supabase
        .from('shopify_products')
        .select('category');

      const uniqueCategories = [...new Set(products?.map(p => p.category).filter(Boolean))].sort();
      setCategories(uniqueCategories as string[]);
    } catch (err) {
      console.error('Error fetching articles:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Load Articles',
        message: err instanceof Error ? err.message : 'An error occurred',
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const filteredArticles = articles.filter((article) => {
    const matchesSearch = !searchTerm || article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || article.sync_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSyncToShopify = async (articleId: string) => {
    setShowConfirm(false);
    setSyncing(articleId);

    try {
      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/sync-blog-to-shopify`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync article to Shopify');
      }

      addNotification({
        type: 'success',
        title: 'Article Synced',
        message: 'Article successfully published to Shopify blog',
        duration: 5000
      });

      await fetchArticles();
    } catch (err) {
      console.error('Error syncing article:', err);
      addNotification({
        type: 'error',
        title: 'Sync Failed',
        message: err instanceof Error ? err.message : 'Failed to sync article',
        duration: 5000
      });
    } finally {
      setSyncing(null);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    setShowConfirm(false);

    try {
      console.log('Deleting article:', articleId);

      const { error, data } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', articleId)
        .select();

      console.log('Delete result:', { error, data });

      if (error) {
        console.error('Delete error details:', error);
        throw error;
      }

      addNotification({
        type: 'success',
        title: 'Article Deleted',
        message: 'Article has been permanently deleted',
        duration: 3000
      });

      await fetchArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: err instanceof Error ? err.message : 'Failed to delete article',
        duration: 5000
      });
    }
  };

  const handleShare = (platform: string, articleId: string, title: string) => {
    const url = `${window.location.origin}/article/${articleId}`;
    const text = title;

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShowShareMenu(null);
    }
  };

  const handleCopyLink = (articleId: string) => {
    const url = `${window.location.origin}/article/${articleId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(articleId);
    setTimeout(() => setCopiedLink(null), 2000);
    setShowShareMenu(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" />
            Synced
          </span>
        );
      case 'syncing':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3 animate-spin" />
            Syncing
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            <FileText className="w-3 h-3" />
            Draft
          </span>
        );
    }
  };

  if (loading) {
    return <LoadingAnimation type="content" />;
  }

  return (
    <>
      <NotificationSystem notifications={notifications} onDismiss={dismissNotification} />

      <ConfirmDialog
        isOpen={showConfirm}
        title={confirmAction?.type === 'delete' ? 'Delete Article?' : 'Sync to Shopify?'}
        message={
          confirmAction?.type === 'delete'
            ? 'Are you sure you want to delete this article? This action cannot be undone.'
            : 'This will publish the article to your Shopify blog. Continue?'
        }
        confirmText={confirmAction?.type === 'delete' ? 'Delete' : 'Sync'}
        cancelText="Cancel"
        type={confirmAction?.type === 'delete' ? 'danger' : 'info'}
        onConfirm={() => {
          if (confirmAction?.type === 'delete') {
            handleDeleteArticle(confirmAction.articleId);
          } else if (confirmAction?.type === 'sync') {
            handleSyncToShopify(confirmAction.articleId);
          }
        }}
        onCancel={() => {
          setShowConfirm(false);
          setConfirmAction(null);
        }}
      />

      {selectedArticleId && (
        <BlogArticleModal
          articleId={selectedArticleId}
          onClose={() => setSelectedArticleId(null)}
          onUpdate={fetchArticles}
        />
      )}

      {showWizard && (
        <BlogWizard
          onClose={() => {
            setShowWizard(false);
            fetchArticles();
          }}
          categories={categories}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-blue-600" />
            {ui.title}
          </h2>
          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-md"
          >
            <Plus className="w-5 h-5" />
            {ui.createArticle}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={ui.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">{ui.allStatuses}</option>
              <option value="draft">{ui.draft}</option>
              <option value="synced">{ui.synced}</option>
              <option value="error">{ui.failed}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={ui.gridView}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title={ui.listView}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={fetchArticles}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Total Articles</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">{articles.length}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Drafts</h3>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {articles.filter((a) => a.sync_status === 'draft').length}
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Synced</h3>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {articles.filter((a) => a.sync_status === 'synced').length}
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Errors</h3>
            </div>
            <p className="text-2xl font-bold text-red-900">
              {articles.filter((a) => a.sync_status === 'error').length}
            </p>
          </div>
        </div>

        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredArticles.map((article) => {
            const thumbnail = getArticleThumbnail(article.content, article.category || undefined);

            if (viewMode === 'list') {
              return (
                <div key={article.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <img
                      src={thumbnail}
                      alt={article.title}
                      className="w-32 h-32 object-cover rounded flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{article.title}</h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getStatusBadge(article.sync_status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(article.created_at).toLocaleDateString()}</span>
                      </div>
                      {article.meta_description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.meta_description}</p>
                      )}
                      {article.target_keywords && article.target_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {article.target_keywords.slice(0, 5).map((keyword, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedArticleId(article.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedArticleId(article.id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'delete', articleId: article.id });
                            setShowConfirm(true);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'sync', articleId: article.id });
                            setShowConfirm(true);
                          }}
                          disabled={syncing === article.id || article.sync_status === 'synced'}
                          className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {syncing === article.id ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              Syncing...
                            </>
                          ) : article.sync_status === 'synced' ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Synced
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Sync to Shopify
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={article.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  <img
                    src={thumbnail}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {getStatusBadge(article.sync_status)}
                    {article.has_placeholders && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Incomplete
                      </span>
                    )}
                    {!article.language_validated && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Language
                      </span>
                    )}
                    {article.content_quality_score !== undefined && article.content_quality_score < 70 && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        {article.content_quality_score}%
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                    {article.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(article.created_at).toLocaleDateString()}</span>
                  </div>

                  {article.meta_description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {article.meta_description}
                    </p>
                  )}

                  {article.target_keywords && article.target_keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.target_keywords.slice(0, 3).map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {keyword}
                        </span>
                      ))}
                      {article.target_keywords.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{article.target_keywords.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-200">
                    <div className="relative">
                      <button
                        onClick={() => setShowShareMenu(showShareMenu === article.id ? null : article.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {showShareMenu === article.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowShareMenu(null)}
                          />
                          <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-20 min-w-[160px]">
                            <button
                              onClick={() => handleShare('facebook', article.id, article.title)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                            >
                              <Facebook className="w-4 h-4 text-blue-600" />
                              Facebook
                            </button>
                            <button
                              onClick={() => handleShare('twitter', article.id, article.title)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                            >
                              <Twitter className="w-4 h-4 text-blue-400" />
                              Twitter
                            </button>
                            <button
                              onClick={() => handleShare('linkedin', article.id, article.title)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                            >
                              <Linkedin className="w-4 h-4 text-blue-700" />
                              LinkedIn
                            </button>
                            <button
                              onClick={() => handleCopyLink(article.id)}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                            >
                              {copiedLink === article.id ? (
                                <>
                                  <Check className="w-4 h-4 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4 text-gray-600" />
                                  Copy link
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedArticleId(article.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedArticleId(article.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setConfirmAction({ type: 'delete', articleId: article.id });
                        setShowConfirm(true);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setConfirmAction({ type: 'sync', articleId: article.id });
                      setShowConfirm(true);
                    }}
                    disabled={syncing === article.id || article.sync_status === 'synced'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {syncing === article.id ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Syncing...
                      </>
                    ) : article.sync_status === 'synced' ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Synced to Shopify
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Sync to Shopify
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No articles found</p>
            <p className="text-sm text-gray-500 mt-1">
              Create articles from opportunities to get started
            </p>
          </div>
        )}
      </div>
    </>
  );
}
