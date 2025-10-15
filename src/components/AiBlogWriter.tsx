import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Sparkles,
  Calendar,
  Clock,
  Save,
  Play,
  Pause,
  FileText,
  Tag as TagIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wand2
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

export function AiBlogWriter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showWizard, setShowWizard] = useState(false);
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
  const [manualInputs, setManualInputs] = useState({
    category: '',
    subcategory: '',
    keywords: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const { data: products } = await supabase
        .from('shopify_products')
        .select('category');

      const uniqueCategories = [...new Set(products?.map(p => p.category).filter(Boolean))].sort();
      setCategories(uniqueCategories as string[]);

      const { data: storeSettings } = await supabase
        .from('shopify_stores')
        .select('*')
        .limit(1)
        .single();

      if (storeSettings?.blog_auto_settings) {
        setSettings(storeSettings.blog_auto_settings);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
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
        throw new Error('No store found. Please connect a Shopify store first.');
      }

      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ blog_auto_settings: settings })
        .eq('id', stores[0].id);

      if (updateError) throw updateError;

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateBlog = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || getEnvVar('VITE_SUPABASE_ANON_KEY');

      const payload = settings.mode === 'manual'
        ? {
            mode: 'manual',
            category: manualInputs.category,
            subcategory: manualInputs.subcategory,
            keywords: manualInputs.keywords.split(',').map(k => k.trim()),
            language: settings.language,
            word_count_min: settings.word_count_min,
            word_count_max: settings.word_count_max,
            output_format: settings.output_format,
            internal_linking: settings.internal_linking,
            max_internal_links: settings.max_internal_links
          }
        : {
            mode: 'automatic',
            language: settings.language,
            word_count_min: settings.word_count_min,
            word_count_max: settings.word_count_max,
            output_format: settings.output_format,
            internal_linking: settings.internal_linking,
            max_internal_links: settings.max_internal_links
          };

      const response = await fetch(
        `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-blog-article`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate blog article');
      }

      const result = await response.json();
      setSuccess(`Blog article "${result.title}" generated successfully!`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error generating blog:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate blog article');
    } finally {
      setGenerating(false);
    }
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily (1 article per day)', icon: '📅' },
    { value: 'twice-weekly', label: 'Twice Weekly (2 articles per week)', icon: '📆' },
    { value: 'weekly', label: 'Weekly (1 article per week)', icon: '🗓️' },
    { value: 'bi-weekly', label: 'Bi-weekly (1 article every 2 weeks)', icon: '📋' },
    { value: 'monthly', label: 'Monthly (1 article per month)', icon: '📊' }
  ];

  if (loading) {
    return <LoadingAnimation type="content" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-purple-600" />
            AI Blog Auto Writer
          </h2>
          <p className="text-gray-600 mt-1">
            Automatic blog article generation with SEO optimization and internal linking
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shadow-md"
        >
          <Wand2 className="w-5 h-5" />
          Create with Wizard
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {showWizard && (
        <BlogWizard
          onClose={() => {
            setShowWizard(false);
            fetchInitialData();
          }}
          categories={categories}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <SettingsIcon className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">Generation Mode</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSettings({ ...settings, mode: 'automatic' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    settings.mode === 'automatic'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Sparkles className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Automatic</div>
                  <div className="text-xs mt-1">AI chooses topics</div>
                </button>
                <button
                  onClick={() => setSettings({ ...settings, mode: 'manual' })}
                  className={`p-4 rounded-lg border-2 transition ${
                    settings.mode === 'manual'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-semibold">Manual</div>
                  <div className="text-xs mt-1">You choose topics</div>
                </button>
              </div>
            </div>

            {settings.mode === 'manual' && (
              <div className="space-y-3 pt-3 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={manualInputs.category}
                    onChange={(e) => setManualInputs({ ...manualInputs, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory (optional)
                  </label>
                  <input
                    type="text"
                    value={manualInputs.subcategory}
                    onChange={(e) => setManualInputs({ ...manualInputs, subcategory: e.target.value })}
                    placeholder="e.g., Tables rondes"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={manualInputs.keywords}
                    onChange={(e) => setManualInputs({ ...manualInputs, keywords: e.target.value })}
                    placeholder="e.g., table design, mobilier moderne"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">Scheduling</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                value={settings.frequency}
                onChange={(e) => setSettings({ ...settings, frequency: e.target.value as BlogSettings['frequency'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {frequencyOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule Time
              </label>
              <select
                value={settings.schedule_hour}
                onChange={(e) => setSettings({ ...settings, schedule_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, '0')}:00
                  </option>
                ))}
              </select>
            </div>

            {(settings.frequency === 'weekly' || settings.frequency === 'bi-weekly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={settings.schedule_day || 1}
                  onChange={(e) => setSettings({ ...settings, schedule_day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value={1}>Monday</option>
                  <option value={2}>Tuesday</option>
                  <option value={3}>Wednesday</option>
                  <option value={4}>Thursday</option>
                  <option value={5}>Friday</option>
                  <option value={6}>Saturday</option>
                  <option value={0}>Sunday</option>
                </select>
              </div>
            )}

            {settings.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Day of Month
                </label>
                <select
                  value={settings.schedule_day || 1}
                  onChange={(e) => setSettings({ ...settings, schedule_day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {Array.from({ length: 28 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">Content Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Word Count Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    value={settings.word_count_min}
                    onChange={(e) => setSettings({ ...settings, word_count_min: parseInt(e.target.value) })}
                    placeholder="Min"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Minimum</span>
                </div>
                <div>
                  <input
                    type="number"
                    value={settings.word_count_max}
                    onChange={(e) => setSettings({ ...settings, word_count_max: parseInt(e.target.value) })}
                    placeholder="Max"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="text-xs text-gray-500 mt-1 block">Maximum</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Format
              </label>
              <select
                value={settings.output_format}
                onChange={(e) => setSettings({ ...settings, output_format: e.target.value as 'markdown' | 'html' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="html">HTML</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Language
              </label>
              <select
                value={settings.language}
                onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-800">Internal Linking</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">Enable Internal Linking</div>
                <div className="text-sm text-gray-600">Add links to related products</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, internal_linking: !settings.internal_linking })}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.internal_linking ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${
                    settings.internal_linking ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.internal_linking && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Internal Links per Article
                </label>
                <input
                  type="number"
                  value={settings.max_internal_links}
                  onChange={(e) => setSettings({ ...settings, max_internal_links: parseInt(e.target.value) })}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">Auto-publish to Shopify</div>
                <div className="text-sm text-gray-600">Automatically publish generated articles</div>
              </div>
              <button
                onClick={() => setSettings({ ...settings, auto_publish: !settings.auto_publish })}
                className={`relative w-12 h-6 rounded-full transition ${
                  settings.auto_publish ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition transform ${
                    settings.auto_publish ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {settings.mode === 'manual' && (
          <button
            onClick={() => setShowWizard(true)}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium rounded-lg transition shadow-lg"
          >
            <Wand2 className="w-5 h-5" />
            Open Article Wizard
          </button>
        )}

        <button
          onClick={handleGenerateBlog}
          disabled={generating || (settings.mode === 'manual' && !manualInputs.category)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {generating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Quick Generate
            </>
          )}
        </button>

        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {showWizard && (
        <BlogWizard
          onClose={() => setShowWizard(false)}
          categories={categories}
        />
      )}
    </div>
  );
}
