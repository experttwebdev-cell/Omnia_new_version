import { useState } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  FileText,
  Tag,
  Settings as SettingsIcon,
  Eye,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface WizardStep {
  id: number;
  title: string;
  icon: typeof FileText;
  description: string;
}

const steps: WizardStep[] = [
  { id: 1, title: 'Topic Selection', icon: FileText, description: 'Choose your blog topic' },
  { id: 2, title: 'Keywords', icon: Tag, description: 'Define target keywords' },
  { id: 3, title: 'Settings', icon: SettingsIcon, description: 'Configure article settings' },
  { id: 4, title: 'Preview', icon: Eye, description: 'Review and generate' },
];

interface BlogWizardProps {
  onClose: () => void;
  categories: string[];
}

export function BlogWizard({ onClose, categories }: BlogWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    keywords: '',
    wordCountMin: 700,
    wordCountMax: 900,
    language: 'fr',
    autoPublish: false,
    internalLinking: true,
    maxInternalLinks: 5,
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setProgress(0);

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/generate-blog-article`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'manual',
          category: formData.category,
          subcategory: formData.subcategory || null,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
          word_count_min: formData.wordCountMin,
          word_count_max: formData.wordCountMax,
          language: formData.language,
          output_format: 'html',
          internal_linking: formData.internalLinking,
          max_internal_links: formData.maxInternalLinks,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate article');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error generating article:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate article');
    } finally {
      setGenerating(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.category !== '';
      case 2:
        return formData.keywords !== '';
      case 3:
        return formData.wordCountMin > 0 && formData.wordCountMax > formData.wordCountMin;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Create Blog Article</h2>
                <p className="text-sm text-gray-600">AI-powered blog generation wizard</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={generating}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white scale-110 shadow-lg'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <step.icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-4 transition-all duration-300 ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg animate-pulse">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">Article generated successfully!</p>
            </div>
          )}

          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Blog Topic</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategory <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="e.g., Round Tables, Modern Chairs"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Define Keywords</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Keywords *
                  </label>
                  <textarea
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="Enter keywords separated by commas (e.g., modern furniture, home decor, interior design)"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Keywords: {formData.keywords.split(',').filter(k => k.trim()).length}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Configure Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Word Count
                    </label>
                    <input
                      type="number"
                      value={formData.wordCountMin}
                      onChange={(e) => setFormData({ ...formData, wordCountMin: parseInt(e.target.value) })}
                      min="300"
                      max="2000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Word Count
                    </label>
                    <input
                      type="number"
                      value={formData.wordCountMax}
                      onChange={(e) => setFormData({ ...formData, wordCountMax: parseInt(e.target.value) })}
                      min="300"
                      max="2000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.internalLinking}
                      onChange={(e) => setFormData({ ...formData, internalLinking: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable internal linking</span>
                  </label>
                  {formData.internalLinking && (
                    <div className="ml-8">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Internal Links
                      </label>
                      <input
                        type="number"
                        value={formData.maxInternalLinks}
                        onChange={(e) => setFormData({ ...formData, maxInternalLinks: parseInt(e.target.value) })}
                        min="1"
                        max="10"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4 animate-fadeIn">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Review & Generate</h3>
                {!generating && !success && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="text-gray-900">{formData.category}</span>
                    </div>
                    {formData.subcategory && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Subcategory:</span>
                        <span className="text-gray-900">{formData.subcategory}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Keywords:</span>
                      <span className="text-gray-900">{formData.keywords.split(',').length} keywords</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Word Count:</span>
                      <span className="text-gray-900">{formData.wordCountMin} - {formData.wordCountMax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Language:</span>
                      <span className="text-gray-900">{formData.language === 'fr' ? 'Français' : 'English'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Internal Linking:</span>
                      <span className="text-gray-900">{formData.internalLinking ? `Yes (max ${formData.maxInternalLinks})` : 'No'}</span>
                    </div>
                  </div>
                )}

                {generating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                      <div className="text-center">
                        <p className="text-lg font-semibold text-gray-800 mb-2">Generating your article...</p>
                        <p className="text-sm text-gray-600">AI is creating high-quality content</p>
                      </div>
                      <div className="w-full max-w-md">
                        <div className="bg-gray-200 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-600 h-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1 || generating}
            className="flex items-center gap-2 px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          {currentStep < steps.length ? (
            <button
              onClick={handleNext}
              disabled={!canProceed() || generating}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!canProceed() || generating || success}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Done!
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Article
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
