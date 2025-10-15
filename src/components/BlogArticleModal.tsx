import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  X,
  Save,
  Eye,
  Edit3,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

interface BlogArticle {
  id: string;
  opportunity_id: string | null;
  product_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  status: string | null;
  synced_to_shopify: boolean | null;
  shopify_blog_id: string | null;
  shopify_article_id: string | null;
  last_sync_at: string | null;
  sync_error: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface BlogArticleModalProps {
  articleId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export function BlogArticleModal({ articleId, onClose, onUpdate }: BlogArticleModalProps) {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mode, setMode] = useState<'preview' | 'edit'>('preview');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    meta_title: '',
    meta_description: '',
    keywords: [] as string[],
  });

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('id', articleId)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Article not found');

      setArticle(data as BlogArticle);
      setFormData({
        title: data.title || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || '',
        keywords: data.keywords || [],
      });
    } catch (err) {
      console.error('Error fetching article:', err);
      setMessage({ type: 'error', text: 'Failed to load article' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from('blog_articles')
        .update({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          meta_title: formData.meta_title,
          meta_description: formData.meta_description,
          keywords: formData.keywords,
          updated_at: new Date().toISOString(),
        })
        .eq('id', articleId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Article saved successfully!' });
      setMode('preview');
      fetchArticle();
      onUpdate();

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving article:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save article' });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncToShopify = async () => {
    try {
      setSyncing(true);
      setMessage(null);

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/sync-blog-to-shopify`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articleId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to sync to Shopify');
      }

      setMessage({ type: 'success', text: 'Successfully synced to Shopify!' });
      fetchArticle();
      onUpdate();

      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error syncing to Shopify:', err);
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to sync to Shopify' });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!article) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'preview' ? 'Article Preview' : 'Edit Article'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {article.synced_to_shopify
                ? `Synced on ${new Date(article.last_sync_at!).toLocaleString()}`
                : 'Not yet synced to Shopify'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {message && (
          <div className={`mx-6 mt-4 flex items-start gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'preview' ? (
            <div className="prose max-w-none">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>

              {article.excerpt && (
                <div className="bg-gray-50 border-l-4 border-blue-500 p-4 mb-6">
                  <p className="text-gray-700 italic">{article.excerpt}</p>
                </div>
              )}

              {article.keywords && article.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />

              {(article.meta_title || article.meta_description) && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">SEO Metadata</h3>
                  {article.meta_title && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700">Meta Title:</p>
                      <p className="text-gray-600">{article.meta_title}</p>
                    </div>
                  )}
                  {article.meta_description && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Meta Description:</p>
                      <p className="text-gray-600">{article.meta_description}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={formData.meta_title}
                    onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta Description
                  </label>
                  <input
                    type="text"
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.keywords.join(', ')}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value.split(',').map(k => k.trim()) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode(mode === 'preview' ? 'edit' : 'preview')}
              disabled={saving || syncing}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {mode === 'preview' ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Preview
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {mode === 'edit' && (
              <button
                onClick={handleSave}
                disabled={saving || syncing || !formData.title || !formData.content}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleSyncToShopify}
              disabled={saving || syncing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 transition"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {article.synced_to_shopify ? 'Re-sync to Shopify' : 'Sync to Shopify'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
