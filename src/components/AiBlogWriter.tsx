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
        throw new Error('No store found');
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

  const handleGenerateNow = async () => {
    try {
      setGenerating(true);
      setError('');
      setSuccess('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const token = session.access_token;

      const payload = settings.mode === 'manual'
        ? {
            mode: 'manual',
            category: manualInputs.category,
            subcategory: manualInputs.subcategory || null,
            keywords: manualInputs.keywords.split(',').map(k => k.trim()).filter(Boolean),
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
      <div className="flex items-center justify-center mb-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 justify-center">
            <Sparkles className="w-7 h-7 text-purple-600" />
            AI Blog Auto Writer
          </h2>
          <p className="text-gray-600 mt-1">
            Automatic blog article generation with SEO optimization and internal linking
          </p>
        </div>
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

      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <SettingsIcon className="w-6 h-6 text-gray-700" />
          <h3 className="text-xl font-semibold text-gray-800">Generation Mode</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
              Mode
            </label>
            <div className="grid grid-cols-2 gap-6">
              <button
                onClick={() => {
                  if (onNavigateToCampaigns) {
                    onNavigateToCampaigns();
                  }
                }}
                className="p-8 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-purple-600 group-hover:text-blue-600" />
                <div className="font-semibold text-lg">Automatic</div>
                <div className="text-sm mt-2 text-gray-600">Create AI campaigns</div>
              </button>
              <button
                onClick={() => {
                  setSettings({ ...settings, mode: 'manual' });
                  setShowWizard(true);
                }}
                className="p-8 rounded-lg border-2 border-gray-200 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition group"
              >
                <FileText className="w-12 h-12 mx-auto mb-3 text-blue-600 group-hover:text-blue-700" />
                <div className="font-semibold text-lg">Manual</div>
                <div className="text-sm mt-2 text-gray-600">You choose topics</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
