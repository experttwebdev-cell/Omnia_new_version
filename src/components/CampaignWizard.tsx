import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../App';
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
  Loader2,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  topic_niche: string;
  target_audience: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  schedule_time: string;
  schedule_day: number;
  start_date: string;
  end_date: string | null;
  word_count_min: number;
  word_count_max: number;
  writing_style: 'professional' | 'casual' | 'technical' | 'conversational';
  tone: 'formal' | 'informal' | 'friendly' | 'authoritative';
  keywords: string[];
  content_structure: string;
  internal_linking_enabled: boolean;
  max_internal_links: number;
  image_integration_enabled: boolean;
  product_links_enabled: boolean;
  seo_optimization_enabled: boolean;
  auto_publish: boolean;
  language: string;
}

interface CampaignWizardProps {
  campaign?: Campaign;
  onClose: () => void;
}

interface CampaignData {
  name: string;
  description: string;
  topic_niche: string;
  target_audience: string;
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  schedule_time: string;
  schedule_day: number;
  start_date: string;
  end_date: string;
  word_count_min: number;
  word_count_max: number;
  writing_style: 'professional' | 'casual' | 'technical' | 'conversational';
  tone: 'formal' | 'informal' | 'friendly' | 'authoritative';
  keywords: string[];
  content_structure: string;
  internal_linking_enabled: boolean;
  max_internal_links: number;
  image_integration_enabled: boolean;
  product_links_enabled: boolean;
  seo_optimization_enabled: boolean;
  auto_publish: boolean;
  language: string;
}

interface ValidationErrors {
  [key: string]: string;
}

export function CampaignWizard({ campaign, onClose }: CampaignWizardProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [keywordInput, setKeywordInput] = useState('');
  const isEditMode = !!campaign;
  const [campaignData, setCampaignData] = useState<CampaignData>({
    name: campaign?.name || '',
    description: campaign?.description || '',
    topic_niche: campaign?.topic_niche || '',
    target_audience: campaign?.target_audience || '',
    frequency: campaign?.frequency || 'weekly',
    schedule_time: campaign?.schedule_time || '09:00',
    schedule_day: campaign?.schedule_day || 1,
    start_date: campaign?.start_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    end_date: campaign?.end_date?.split('T')[0] || '',
    word_count_min: campaign?.word_count_min || 1500,
    word_count_max: campaign?.word_count_max || 2000,
    writing_style: campaign?.writing_style || 'professional',
    tone: campaign?.tone || 'formal',
    keywords: campaign?.keywords || [],
    content_structure: campaign?.content_structure || '',
    internal_linking_enabled: campaign?.internal_linking_enabled ?? true,
    max_internal_links: campaign?.max_internal_links || 5,
    image_integration_enabled: campaign?.image_integration_enabled ?? true,
    product_links_enabled: campaign?.product_links_enabled ?? true,
    seo_optimization_enabled: campaign?.seo_optimization_enabled ?? true,
    auto_publish: campaign?.auto_publish || false,
    language: campaign?.language || 'fr'
  });

  const totalSteps = 4;

  const validateStep = (stepNumber: number): boolean => {
    const errors: ValidationErrors = {};

    if (stepNumber === 1) {
      if (!campaignData.name.trim()) {
        errors.name = t.campaigns.validation.nameRequired;
      }
      if (!campaignData.topic_niche.trim()) {
        errors.topic_niche = t.campaigns.validation.topicRequired;
      }
      if (!campaignData.start_date) {
        errors.start_date = t.campaigns.validation.startDateRequired;
      }
    }

    if (stepNumber === 3) {
      if (campaignData.word_count_min < 300) {
        errors.word_count_min = t.campaigns.validation.minWordCount;
      }
      if (campaignData.word_count_max < campaignData.word_count_min) {
        errors.word_count_max = t.campaigns.validation.maxWordCount;
      }
      if (campaignData.keywords.length === 0) {
        errors.keywords = t.campaigns.validation.keywordsRequired;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < totalSteps) {
        setStep(step + 1);
        setValidationErrors({});
      }
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
      setValidationErrors({});
    }
  };

  const addKeyword = () => {
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && !campaignData.keywords.includes(trimmedKeyword)) {
      setCampaignData({
        ...campaignData,
        keywords: [...campaignData.keywords, trimmedKeyword]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setCampaignData({
      ...campaignData,
      keywords: campaignData.keywords.filter(k => k !== keyword)
    });
  };

  const handleKeywordInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  const calculateNextExecution = (startDate: string, frequency: string, scheduleTime: string, scheduleDay: number): string => {
    const [hours, minutes] = scheduleTime.split(':').map(Number);
    const start = new Date(startDate);
    start.setHours(hours, minutes, 0, 0);

    switch (frequency) {
      case 'weekly':
        while (start.getDay() !== scheduleDay) {
          start.setDate(start.getDate() + 1);
        }
        break;
      case 'bi-weekly':
        while (start.getDay() !== scheduleDay) {
          start.setDate(start.getDate() + 1);
        }
        break;
      case 'monthly':
        start.setDate(scheduleDay);
        break;
    }

    return start.toISOString();
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      if (!validateStep(1) || !validateStep(3)) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (isEditMode && campaign) {
        const nextExecution = calculateNextExecution(
          campaignData.start_date,
          campaignData.frequency,
          campaignData.schedule_time,
          campaignData.schedule_day
        );

        const { error: updateError } = await supabase
          .from('blog_campaigns')
          .update({
            name: campaignData.name,
            description: campaignData.description,
            topic_niche: campaignData.topic_niche,
            target_audience: campaignData.target_audience,
            frequency: campaignData.frequency,
            start_date: campaignData.start_date,
            end_date: campaignData.end_date || null,
            word_count_min: campaignData.word_count_min,
            word_count_max: campaignData.word_count_max,
            writing_style: campaignData.writing_style,
            tone: campaignData.tone,
            keywords: campaignData.keywords,
            content_structure: campaignData.content_structure,
            internal_linking_enabled: campaignData.internal_linking_enabled,
            max_internal_links: campaignData.max_internal_links,
            image_integration_enabled: campaignData.image_integration_enabled,
            product_links_enabled: campaignData.product_links_enabled,
            seo_optimization_enabled: campaignData.seo_optimization_enabled,
            auto_publish: campaignData.auto_publish,
            language: campaignData.language,
            next_execution: nextExecution
          })
          .eq('id', campaign.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw new Error(`Failed to update campaign: ${updateError.message}`);
        }
      } else {
        const { data: stores } = await supabase
          .from('shopify_stores')
          .select('id')
          .limit(1);

        if (!stores || stores.length === 0) {
          throw new Error('No store found. Please configure your store first.');
        }

        const nextExecution = calculateNextExecution(
          campaignData.start_date,
          campaignData.frequency,
          campaignData.schedule_time,
          campaignData.schedule_day
        );

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
            keywords: campaignData.keywords,
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

        if (insertError) {
          console.error('Insert error:', insertError);
          throw new Error(`Failed to create campaign: ${insertError.message}`);
        }
      }

      onClose();
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err instanceof Error ? err.message : 'Failed to save campaign. Please try again.');
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
        <h3 className="text-xl font-semibold text-gray-800">{t.campaigns.campaignConfig}</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.campaignName} <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={campaignData.name}
          onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
          placeholder="e.g., Spring Furniture Collection 2025"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
            validationErrors.name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {validationErrors.name && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.name}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.description}
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
          {t.campaigns.topicNiche} <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={campaignData.topic_niche}
          onChange={(e) => setCampaignData({ ...campaignData, topic_niche: e.target.value })}
          placeholder="e.g., Modern Furniture Design, Home Decor Tips"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
            validationErrors.topic_niche ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {validationErrors.topic_niche && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.topic_niche}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.targetAudience}
        </label>
        <input
          type="text"
          value={campaignData.target_audience}
          onChange={(e) => setCampaignData({ ...campaignData, target_audience: e.target.value })}
          placeholder="e.g., Homeowners aged 25-45 interested in modern design"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.blog.frequency} <span className="text-red-600">*</span>
          </label>
          <select
            value={campaignData.frequency}
            onChange={(e) => setCampaignData({ ...campaignData, frequency: e.target.value as any })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="daily">{t.campaigns.frequency.daily}</option>
            <option value="weekly">{t.campaigns.frequency.weekly}</option>
            <option value="bi-weekly">{t.campaigns.frequency.biWeekly}</option>
            <option value="monthly">{t.campaigns.frequency.monthly}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.blog.scheduleTime} <span className="text-red-600">*</span>
          </label>
          <input
            type="time"
            value={campaignData.schedule_time}
            onChange={(e) => setCampaignData({ ...campaignData, schedule_time: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {(campaignData.frequency === 'weekly' || campaignData.frequency === 'bi-weekly') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.blog.dayOfWeek} <span className="text-red-600">*</span>
          </label>
          <select
            value={campaignData.schedule_day}
            onChange={(e) => setCampaignData({ ...campaignData, schedule_day: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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

      {campaignData.frequency === 'monthly' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.blog.dayOfMonth} <span className="text-red-600">*</span>
          </label>
          <select
            value={campaignData.schedule_day}
            onChange={(e) => setCampaignData({ ...campaignData, schedule_day: parseInt(e.target.value) })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.campaigns.startDate} <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            value={campaignData.start_date}
            onChange={(e) => setCampaignData({ ...campaignData, start_date: e.target.value })}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              validationErrors.start_date ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.start_date && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.start_date}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.campaigns.endDate}
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
        <h3 className="text-xl font-semibold text-gray-800">{t.campaigns.contentEnhancement}</h3>
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
        <h3 className="text-xl font-semibold text-gray-800">{t.campaigns.articleParams}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.campaigns.minWordCount} <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            value={campaignData.word_count_min}
            onChange={(e) => setCampaignData({ ...campaignData, word_count_min: parseInt(e.target.value) })}
            min="300"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              validationErrors.word_count_min ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.word_count_min && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.word_count_min}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.campaigns.maxWordCount} <span className="text-red-600">*</span>
          </label>
          <input
            type="number"
            value={campaignData.word_count_max}
            onChange={(e) => setCampaignData({ ...campaignData, word_count_max: parseInt(e.target.value) })}
            min="300"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              validationErrors.word_count_max ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {validationErrors.word_count_max && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              {validationErrors.word_count_max}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.writingStyle} <span className="text-red-600">*</span>
        </label>
        <select
          value={campaignData.writing_style}
          onChange={(e) => setCampaignData({ ...campaignData, writing_style: e.target.value as any })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="professional">{t.campaigns.writingStyles.professional}</option>
          <option value="casual">{t.campaigns.writingStyles.casual}</option>
          <option value="technical">{t.campaigns.writingStyles.technical}</option>
          <option value="conversational">{t.campaigns.writingStyles.conversational}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.tone} <span className="text-red-600">*</span>
        </label>
        <select
          value={campaignData.tone}
          onChange={(e) => setCampaignData({ ...campaignData, tone: e.target.value as any })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="formal">{t.campaigns.tones.formal}</option>
          <option value="informal">{t.campaigns.tones.informal}</option>
          <option value="friendly">{t.campaigns.tones.friendly}</option>
          <option value="authoritative">{t.campaigns.tones.authoritative}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.targetKeywords} <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={handleKeywordInputKeyPress}
            placeholder="Add a keyword and press Enter"
            className={`flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              validationErrors.keywords ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <button
            onClick={addKeyword}
            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg transition flex items-center gap-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            {t.campaigns.addKeyword}
          </button>
        </div>
        {validationErrors.keywords && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {validationErrors.keywords}
          </p>
        )}
        {campaignData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {campaignData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {keyword}
                <button
                  onClick={() => removeKeyword(keyword)}
                  className="hover:bg-blue-200 rounded-full p-0.5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.campaigns.contentStructure}
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
          {t.campaigns.language} <span className="text-red-600">*</span>
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
        <h3 className="text-xl font-semibold text-gray-800">{t.campaigns.reviewLaunch}</h3>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700 mb-2">{t.campaigns.campaignDetails}</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> {campaignData.name}</p>
            <p><span className="font-medium">Topic:</span> {campaignData.topic_niche}</p>
            <p><span className="font-medium">Frequency:</span> {campaignData.frequency} at {campaignData.schedule_time}</p>
            <p><span className="font-medium">Start Date:</span> {campaignData.start_date}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">{t.campaigns.contentSettings}</h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Word Count:</span> {campaignData.word_count_min} - {campaignData.word_count_max}</p>
            <p><span className="font-medium">Style:</span> {campaignData.writing_style}</p>
            <p><span className="font-medium">Tone:</span> {campaignData.tone}</p>
            <p><span className="font-medium">Keywords:</span> {campaignData.keywords.join(', ')}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-700 mb-2">{t.campaigns.enhancementFeatures}</h4>
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
          <strong>{t.campaigns.readyToLaunch}</strong> Your campaign will start generating content on {campaignData.start_date} at {campaignData.schedule_time}.
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
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? 'Edit Campaign' : t.campaigns.createCampaign}
            </h2>
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
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
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
            {t.common.previous}
          </button>

          <div className="text-sm text-gray-600">
            Step {step} of {totalSteps}
          </div>

          {step < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-lg transition shadow-lg"
            >
              {t.common.next}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t.campaigns.creating}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {t.campaigns.launchCampaign}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
