import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Sparkles,
  Calendar,
  Clock,
  Save,
  FileText,
  Tag as TagIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wand2,
  BookOpen,
  TrendingUp,
  Target,
  Zap,
  RotateCcw
} from 'lucide-react';
import { LoadingAnimation } from './LoadingAnimation';
import { BlogWizard } from './BlogWizard';

interface BlogSettings {
  mode: 'manual' | 'automatic';
  frequency: 'daily' | 'twice-weekly' | 'weekly' | 'bi-weekly' | 'monthly';
  schedule_hour: number;
  schedule_day?: number;
  word_count_min: number;
  word_count_max: number;
  output_format: 'markdown' | 'html';
  language: string;
  auto_publish: boolean;
  internal_linking: boolean;
  max_internal_links: number;
}

interface BlogStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  last_generated: string | null;
  next_schedule: string | null;
}

interface AiBlogWriterProps {
  onNavigateToCampaigns?: () => void;
}

export function AiBlogWriter({ onNavigateToCampaigns }: AiBlogWriterProps = {}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [stats, setStats] = useState<BlogStats>({
    total_articles: 0,
    published_articles: 0,
    draft_articles: 0,
    last_generated: null,
    next_schedule: null
  });
  const [settings, setSettings] = useState<BlogSettings>({
    mode: 'automatic',
    frequency: 'daily',
    schedule_hour: 9,
    word_count_min: 700,
    word_count_max: 900,
    output_format: 'html',
    language: 'fr',
    auto_publish: false,
    internal_linking: true,
    max_internal_links: 5
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch products for categories
      const { data: products, error: productsError } = await supabase
        .from('shopify_products')
        .select('category')
        .not('category', 'is', null);

      if (productsError) {
        throw productsError;
      }

      if (!products || products.length === 0) {
        setError('Aucun produit trouvé dans votre catalogue. Veuillez importer des produits depuis Shopify via "Paramètres" > "Import Shopify".');
      }

      const uniqueCategories = [...new Set(products?.map((p: any) => p.category).filter(Boolean))].sort();
      setCategories(uniqueCategories as string[]);

      // Fetch store settings
      const { data: storeSettings } = await supabase
        .from('shopify_stores')
        .select('*')
        .limit(1)
        .single();

      if (storeSettings && 'blog_auto_settings' in storeSettings && storeSettings.blog_auto_settings) {
        setSettings(storeSettings.blog_auto_settings as BlogSettings);
      }

      // Fetch blog statistics
      await fetchBlogStats();
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Échec du chargement des données. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogStats = async () => {
    try {
      const { data: articles, error } = await supabase
        .from('blog_articles')
        .select('id, published, created_at, sync_status') as { data: any[] | null, error: any };

      if (error) throw error;

      const total_articles = articles?.length || 0;
      const published_articles = articles?.filter((a: any) => a.published || a.sync_status === 'synced').length || 0;
      const draft_articles = total_articles - published_articles;

      // Get latest article date
      const last_generated = articles && articles.length > 0 
        ? new Date(Math.max(...articles.map((a: any) => new Date(a.created_at).getTime()))).toISOString()
        : null;

      setStats({
        total_articles,
        published_articles,
        draft_articles,
        last_generated,
        next_schedule: calculateNextSchedule()
      });
    } catch (err) {
      console.error('Error fetching blog stats:', err);
    }
  };

  const calculateNextSchedule = () => {
    const now = new Date();
    const next = new Date(now);
    
    switch (settings.frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'twice-weekly':
        next.setDate(next.getDate() + 3); // Every 3-4 days
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'bi-weekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
    }
    
    next.setHours(settings.schedule_hour, 0, 0, 0);
    return next.toISOString();
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('No store found');
      }

      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({
          blog_auto_settings: settings as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', (stores[0] as any).id);

      if (updateError) throw updateError;

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Update next schedule
      setStats(prev => ({
        ...prev,
        next_schedule: calculateNextSchedule()
      }));
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      // Check if products exist first
      const { data: productCheck, error: productCheckError } = await supabase
        .from('shopify_products')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (productCheckError) {
        throw productCheckError;
      }

      if (!productCheck) {
        throw new Error('Aucun produit trouvé dans votre catalogue. Veuillez d\'abord importer des produits depuis Shopify en utilisant la section "Paramètres" > "Import Shopify".');
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié. Veuillez vous connecter.');
      }

      // Use default settings for quick generation
      const payload = {
        mode: 'automatic',
        language: settings.language,
        word_count_min: 800,
        word_count_max: 1200,
        output_format: 'html',
        internal_linking: true,
        max_internal_links: 3
      };

      const response = await fetch(
        `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-blog-article`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec de la génération de l\'article de blog');
      }

      const result = await response.json();
      setSuccess(`Article de blog "${result.article?.title || 'Sans titre'}" généré avec succès!`);

      // Refresh stats
      await fetchBlogStats();

      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error generating blog:', err);
      setError(err instanceof Error ? err.message : 'Échec de la génération de l\'article de blog');
    } finally {
      setGenerating(false);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily', description: '1 article per day', icon: '📅' },
    { value: 'twice-weekly', label: 'Twice Weekly', description: '2 articles per week', icon: '📆' },
    { value: 'weekly', label: 'Weekly', description: '1 article per week', icon: '🗓️' },
    { value: 'bi-weekly', label: 'Bi-weekly', description: '1 article every 2 weeks', icon: '📋' },
    { value: 'monthly', label: 'Monthly', description: '1 article per month', icon: '📊' }
  ];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Blog Writer</h2>
            <p className="text-sm text-gray-600 mt-1">
              Génération automatique d'articles avec IA
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-violet-50 via-fuchsia-50 to-purple-50 rounded-xl shadow-sm border border-violet-100 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-violet-400 rounded-full animate-pulse" style={{animationDuration: '3s'}}></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 bg-fuchsia-400 rounded-full animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-purple-400 rounded-full animate-pulse" style={{animationDuration: '5s', animationDelay: '0.5s'}}></div>
          </div>
          <div className="relative z-10">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-400 to-fuchsia-400 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 border-4 border-violet-100 rounded-full"></div>
              <div className="absolute inset-2 border-4 border-t-violet-500 border-r-fuchsia-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <Sparkles className="w-10 h-10 text-violet-600 animate-pulse" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-fuchsia-400 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chargement de l'IA...
            </h3>
            <p className="text-gray-600 text-sm">
              Initialisation du système de génération
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-fuchsia-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">AI Blog Writer</h2>
            <p className="text-gray-600 mt-1">
              Automatic blog article generation with SEO optimization
            </p>
          </div>
        </div>
        
        <button
          onClick={fetchInitialData}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
          title="Refresh data"
        >
          <RotateCcw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
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
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-800 font-medium">Success</p>
            <p className="text-sm text-green-700 mt-1">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="text-green-600 hover:text-green-800"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      )}

      {/* Wizard Modal */}
      {showWizard && (
        <BlogWizard
          onClose={() => {
            setShowWizard(false);
            fetchInitialData();
          }}
          categories={categories}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Articles</p>
              <p className="text-3xl font-bold mt-1">{stats.total_articles}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Published</p>
              <p className="text-3xl font-bold mt-1">{stats.published_articles}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Drafts</p>
              <p className="text-3xl font-bold mt-1">{stats.draft_articles}</p>
            </div>
            <FileText className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Last Generated</p>
              <p className="text-lg font-bold mt-1">{formatDate(stats.last_generated)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generation Modes */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Generation Mode</h3>
              <p className="text-gray-600 mt-1">Choose how you want to create content</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Automatic Mode */}
            <div 
              className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                settings.mode === 'automatic' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
              onClick={onNavigateToCampaigns}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 text-lg">Automatic Campaigns</h4>
                    {settings.mode === 'automatic' && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">
                    Set up AI-powered campaigns that automatically generate and publish content based on your schedule
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Scheduled publishing
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      Smart topic selection
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Manual Mode */}
            <div 
              className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
                settings.mode === 'manual' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 bg-white hover:border-purple-300'
              }`}
              onClick={() => {
                setSettings({ ...settings, mode: 'manual' });
                setShowWizard(true);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800 text-lg">Manual Creation</h4>
                    {settings.mode === 'manual' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">
                    Create individual blog articles with full control over topics, products, and keywords
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <TagIcon className="w-4 h-4" />
                      Custom keywords
                    </span>
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      Product integration
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800 mb-1">Quick Generate</h4>
                <p className="text-sm text-gray-600">Create an article with default settings</p>
              </div>
              <button
                onClick={handleQuickGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition shadow-md"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                {generating ? 'Generating...' : 'Quick Generate'}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-gray-100 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-800">Settings & Schedule</h3>
              <p className="text-gray-600 mt-1">Configure automatic generation settings</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Frequency Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Generation Frequency
              </label>
              <div className="grid grid-cols-1 gap-3">
                {frequencyOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${
                      settings.frequency === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.value}
                      checked={settings.frequency === option.value}
                      onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{option.icon}</span>
                        <span className="font-medium text-gray-800">{option.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Schedule Time
              </label>
              <select
                value={settings.schedule_hour}
                onChange={(e) => setSettings({ ...settings, schedule_hour: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            {/* Next Schedule Info */}
            {stats.next_schedule && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Next Scheduled Generation</p>
                    <p className="text-sm text-blue-700">{formatDate(stats.next_schedule)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 transition shadow-md"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}