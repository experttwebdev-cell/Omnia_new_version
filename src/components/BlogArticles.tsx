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
  AlertCircle
} from 'lucide-react';
import { useNotifications, NotificationSystem } from './NotificationSystem';
import { ConfirmDialog } from './ConfirmDialog';
import { LoadingAnimation } from './LoadingAnimation';
import { BlogArticleModal } from './BlogArticleModal';

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
}

export function BlogArticles() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'sync'; articleId: string } | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);

  const { notifications, addNotification, dismissNotification } = useNotifications();

  const fetchArticles = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setArticles((data || []) as BlogArticle[]);
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
      const { error } = await supabase
        .from('blog_articles')
        .delete()
        .eq('id', articleId);

      if (error) throw error;

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

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 w-full sm:w-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
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
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="synced">Synced</option>
              <option value="error">Error</option>
            </select>
          </div>
          <button
            onClick={fetchArticles}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
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

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Keywords</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <BookOpen className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 truncate">{article.title}</div>
                          {article.excerpt && (
                            <div className="text-xs text-gray-500 truncate">{article.excerpt}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(article.sync_status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(article.target_keywords || []).slice(0, 2).map((keyword, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {keyword}
                          </span>
                        ))}
                        {(article.target_keywords || []).length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                            +{article.target_keywords.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">
                          {new Date(article.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setConfirmAction({ type: 'sync', articleId: article.id });
                            setShowConfirm(true);
                          }}
                          disabled={syncing === article.id || article.sync_status === 'synced'}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Sync to Shopify"
                        >
                          <Upload className="w-4 h-4" />
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
