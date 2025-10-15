import { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Calendar,
  Users,
  Target,
  Settings,
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface CampaignWizardProps {
  onClose: () => void;
}

interface CampaignData {
  name: string;
  description: string;
  topic_niche: string;
  target_audience: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  start_date: string;
  end_date: string;
  word_count_min: number;
  word_count_max: number;
  writing_style: 'professional' | 'casual' | 'technical' | 'conversational';
  tone: 'formal' | 'informal' | 'friendly' | 'authoritative';
  keywords: string;
  content_structure: string;
  internal_linking_enabled: boolean;
  max_internal_links: number;
  image_integration_enabled: boolean;
  product_links_enabled: boolean;
  seo_optimization_enabled: boolean;
  auto_publish: boolean;
  language: string;
}

export function CampaignWizard({ onClose }: CampaignWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: '',
    description: '',
    topic_niche: '',
    target_audience: '',
    frequency: 'weekly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    word_count_min: 700,
    word_count_max: 900,
    writing_style: 'professional',
    tone: 'formal',
    keywords: '',
    content_structure: '',
    internal_linking_enabled: true,
    max_internal_links: 5,
    image_integration_enabled: true,
    product_links_enabled: true,
    seo_optimization_enabled: true,
    auto_publish: false,
    language: 'fr'
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const calculateNextExecution = (startDate: string, frequency: string): string => {
    const start = new Date(startDate);
    return start.toISOString();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1);

      if (!stores || stores.length === 0) {
        throw new Error('No store found');
      }

      const keywordsArray = campaignData.keywords
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const nextExecution = calculateNextExecution(campaignData.start_date, campaignData.frequency);

      const { error: insertError } = await supabase
        .from('blog_campaigns')
        .insert({
          store_id: stores[0].id,
          name: campaignData.name,
          description: campaignData.description,
          status: 'active',
          topic_niche: campaignData.topic_niche,
          target_audience: campaignData.target_audience,
          frequency: campaignData.frequency,
          start_date: campaignData.start_date,
          end_date: campaignData.end_date || null,
          word_count_min: campaignData.word_count_min,
          word_count_max: campaignData.word_count_max,
          writing_style: campaignData.writing_style,
          tone: campaignData.tone,
          keywords: keywordsArray,
          content_structure: campaignData.content_structure,
          internal_linking_enabled: campaignData.internal_linking_enabled,
          max_internal_links: campaignData.max_internal_links,
          image_integration_enabled: campaignData.image_integration_enabled,
          product_links_enabled: campaignData.product_links_enabled,
          seo_optimization_enabled: campaignData.seo_optimization_enabled,
          auto_publish: campaignData.auto_publish,
          language: campaignData.language,
          next_execution: nextExecution
        });

      if (insertError) throw insertError;

      onClose();
    } catch (err) {
      console.error('Error creating campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((s) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              s === step
                ? 'bg-blue-600 text-white'
                : s < step
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            {s < step ? <CheckCircle className="w-6 h-6" /> : s}
          </div>
          {s < 4 && (
            <div
              className={`w-16 h-1 mx-2 ${
                s < step ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Campaign Configuration</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Campaign Name *
        </label>
        <input
          type="text"
          value={campaignData.name}
          onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
          placeholder="e.g., Spring Furniture Collection 2025"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={campaignData.description}
          onChange={(e) => setCampaignData({ ...campaignData, description: e.target.value })}
          placeholder="Brief description of your campaign goals and content strategy"
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Topic/Niche *
        </label>
        <input
          type="text"
          value={campaignData.topic_niche}
          onChange={(e) => setCampaignData({ ...campaignData, topic_niche: e.target.value })}
          placeholder="e.g., Modern Furniture Design, Home Decor Tips"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience
        </label>
        <input
          type="text"
          value={campaignData.target_audience}
          onChange={(e) => setCampaignData({ ...campaignData, target_audience: e.target.value })}
          placeholder="e.g., Homeowners aged 25-45 interested in modern design"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frequency *
          </label>
          <select
            value={campaignData.frequency}
            onChange={(e) => setCampaignData({ ...campaignData, frequency: e.target.value as any })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Date *
          </label>
          <input
            type="date"
            value={campaignData.start_date}
            onChange={(e) => setCampaignData({ ...campaignData, start_date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Date (Optional)
          </label>
          <input
            type="date"
            value={campaignData.end_date}
            onChange={(e) => setCampaignData({ ...campaignData, end_date: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Content Enhancement</h3>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={campaignData.internal_linking_enabled}
                onChange={(e) => setCampaignData({ ...campaignData, internal_linking_enabled: e.target.checked })}
                className="w-5 h-5 text-blue-600"
              />
              <span className="font-medium text-gray-800">Internal Linking</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            Automatically detect and insert relevant internal links to other blog posts and products
          </p>
          {campaignData.internal_linking_enabled && (
            <div className="mt-3 ml-7">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Internal Links per Article
              </label>
              <input
                type="number"
                value={campaignData.max_internal_links}
                onChange={(e) => setCampaignData({ ...campaignData, max_internal_links: parseInt(e.target.value) })}
                min="1"
                max="10"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={campaignData.image_integration_enabled}
              onChange={(e) => setCampaignData({ ...campaignData, image_integration_enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600"
            />
            <span className="font-medium text-gray-800">Image Integration</span>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            Automatically source and insert relevant images throughout the article
          </p>
        </div>

        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={campaignData.product_links_enabled}
              onChange={(e) => setCampaignData({ ...campaignData, product_links_enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600"
            />
            <span className="font-medium text-gray-800">Product Link Insertion</span>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            Automatically include relevant product links within articles to drive sales
          </p>
        </div>

        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={campaignData.seo_optimization_enabled}
              onChange={(e) => setCampaignData({ ...campaignData, seo_optimization_enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600"
            />
            <span className="font-medium text-gray-800">SEO Optimization</span>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            Apply SEO best practices including meta descriptions, headings, and keyword optimization
          </p>
        </div>

        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={campaignData.auto_publish}
              onChange={(e) => setCampaignData({ ...campaignData, auto_publish: e.target.checked })}
              className="w-5 h-5 text-green-600"
            />
            <span className="font-medium text-gray-800">Auto-Publish to Shopify</span>
          </div>
          <p className="text-sm text-gray-600 ml-7">
            Automatically publish generated articles to your Shopify store
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-semibold text-gray-800">Article Generation Parameters</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Word Count *
          </label>
          <input
            type="number"
            value={campaignData.word_count_min}
            onChange={(e) => setCampaignData({ ...campaignData, word_count_min: parseInt(e.target.value) })}
            min="300"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Word Count *
          </label>
          <input
            type="number"
            value={campaignData.word_count_max}
            onChange={(e) => setCampaignData({ ...campaignData, word_count_max: parseInt(e.target.value) })}
            min="300"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Writing Style *
        </label>
        <select
          value={campaignData.writing_style}
          onChange={(e) => setCampaignData({ ...campaignData, writing_style: e.target.value as any })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="technical">Technical</option>
          <option value="conversational">Conversational</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tone *
        </label>
        <select
          value={campaignData.tone}
          onChange={(e) => setCampaignData({ ...campaignData, tone: e.target.value as any })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="formal">Formal</option>
          <option value="informal">Informal</option>
          <option value="friendly">Friendly</option>
          <option value="authoritative">Authoritative</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target Keywords (comma-separated) *
        </label>
        <input
          type="text"
          value={campaignData.keywords}
          onChange={(e) => setCampaignData({ ...campaignData, keywords: e.target.value })}
          placeholder="e.g., modern furniture, home decor, interior design"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content Structure Preferences
        </label>
        <textarea
          value={campaignData.content_structure}
          onChange={(e) => setCampaignData({ ...campaignData, content_structure: e.target.value })}
          placeholder="e.g., Introduction, Main Benefits (3 sections), How-to Guide, Conclusion with CTA"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Language *
        </label>
        <select
          value={campaignData.language}
          onChange={(e) => setCampaignData({ ...campaignData, language: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="w-6 h-6 text-green-600" />
        <h3 className="text-xl font-semibold text-gray-800">Review & Launch</h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Campaign Details</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {campaignData.name}</p>
            <p><span className="font-medium">Topic:</span> {campaignData.topic_niche}</p>
            <p><span className="font-medium">Frequency:</span> {campaignData.frequency}</p>
            <p><span className="font-medium">Start Date:</span> {campaignData.start_date}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Content Settings</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Word Count:</span> {campaignData.word_count_min} - {campaignData.word_count_max}</p>
            <p><span className="font-medium">Style:</span> {campaignData.writing_style}</p>
            <p><span className="font-medium">Tone:</span> {campaignData.tone}</p>
            <p><span className="font-medium">Keywords:</span> {campaignData.keywords}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">Enhancement Features</h4>
          <div className="space-y-1 text-sm">
            <p>✓ Internal Linking: {campaignData.internal_linking_enabled ? 'Enabled' : 'Disabled'}</p>
            <p>✓ Image Integration: {campaignData.image_integration_enabled ? 'Enabled' : 'Disabled'}</p>
            <p>✓ Product Links: {campaignData.product_links_enabled ? 'Enabled' : 'Disabled'}</p>
            <p>✓ SEO Optimization: {campaignData.seo_optimization_enabled ? 'Enabled' : 'Disabled'}</p>
            <p>✓ Auto-Publish: {campaignData.auto_publish ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Ready to launch!</strong> Your campaign will start generating content on {campaignData.start_date}.
          The first article will be created automatically based on your settings.
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Create AI Campaign</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {renderStepIndicator()}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Step {step} of {totalSteps}
          </div>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Launch Campaign
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
