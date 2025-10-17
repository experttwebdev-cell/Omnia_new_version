import { useState, useEffect } from 'react';
import { Bot, DollarSign, Zap, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getEnvVar } from '../lib/supabase';

interface ProviderStatus {
  name: string;
  model: string;
  configured: boolean;
  costPerMillion: { input: number; output: number };
  priority: number;
  description: string;
}

export function AiProviderConfig() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, any>>({});

  useEffect(() => {
    checkProviders();
  }, []);

  const checkProviders = () => {
    const openaiKey = getEnvVar('VITE_OPENAI_API_KEY');
    const deepseekKey = getEnvVar('DEEPSEEK_API_KEY') || getEnvVar('VITE_DEEPSEEK_API_KEY');

    const providerList: ProviderStatus[] = [
      {
        name: 'DeepSeek',
        model: 'deepseek-chat',
        configured: !!deepseekKey,
        costPerMillion: { input: 0.014, output: 0.028 },
        priority: 1,
        description: 'Most cost-effective (95% cheaper than GPT-4o-mini)',
      },
      {
        name: 'OpenAI GPT-3.5-turbo',
        model: 'gpt-3.5-turbo',
        configured: !!openaiKey,
        costPerMillion: { input: 0.050, output: 0.150 },
        priority: 2,
        description: 'Reliable fallback (73% cheaper than GPT-4o-mini)',
      },
      {
        name: 'OpenAI GPT-4o-mini',
        model: 'gpt-4o-mini',
        configured: !!openaiKey,
        costPerMillion: { input: 0.150, output: 0.600 },
        priority: 3,
        description: 'Last resort fallback',
      },
    ];

    setProviders(providerList);
  };

  const testProvider = async (providerName: string) => {
    setTesting(true);
    setTestResults((prev) => ({ ...prev, [providerName]: { testing: true } }));

    try {
      // Test through edge function which will use the provider
      const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
      const anonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'test',
          storeId: null,
        }),
      });

      const data = await response.json();

      setTestResults((prev) => ({
        ...prev,
        [providerName]: {
          success: response.ok,
          error: response.ok ? null : data.error,
        },
      }));
    } catch (error) {
      setTestResults((prev) => ({
        ...prev,
        [providerName]: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }));
    } finally {
      setTesting(false);
    }
  };

  const calculateMonthlyCost = (provider: ProviderStatus, messagesPerDay: number) => {
    const avgTokensPerMessage = 500;
    const inputTokens = avgTokensPerMessage * 0.5;
    const outputTokens = avgTokensPerMessage * 0.5;

    const costPerMessage =
      (inputTokens * provider.costPerMillion.input) / 1_000_000 +
      (outputTokens * provider.costPerMillion.output) / 1_000_000;

    return costPerMessage * messagesPerDay * 30;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Provider Configuration</h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Automatic Fallback System</h4>
              <p className="text-sm text-blue-700">
                The system automatically tries providers in order of cost-effectiveness. If one provider fails
                (quota exceeded, API error), it seamlessly switches to the next available provider.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => {
            const result = testResults[provider.name];
            return (
              <div
                key={provider.name}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        provider.configured ? 'bg-green-100' : 'bg-gray-100'
                      }`}
                    >
                      {provider.configured ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{provider.name}</h4>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Priority {provider.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => testProvider(provider.name)}
                    disabled={!provider.configured || testing}
                    className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Test
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Model</p>
                    <p className="text-sm font-mono text-gray-900">{provider.model}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        provider.configured ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {provider.configured ? '✓ Configured' : '✗ Not configured'}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="text-xs font-medium text-gray-700">Cost Comparison</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Input</p>
                      <p className="font-medium text-gray-900">
                        ${provider.costPerMillion.input}/M tokens
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Output</p>
                      <p className="font-medium text-gray-900">
                        ${provider.costPerMillion.output}/M tokens
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">~100 msgs/day</p>
                      <p className="font-medium text-gray-900">
                        ${calculateMonthlyCost(provider, 100).toFixed(2)}/mo
                      </p>
                    </div>
                  </div>
                </div>

                {result && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-sm ${
                      result.testing
                        ? 'bg-gray-50 text-gray-600'
                        : result.success
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {result.testing ? (
                      '⏳ Testing...'
                    ) : result.success ? (
                      '✓ Test successful!'
                    ) : (
                      <>
                        ✗ Test failed: {result.error}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1 text-sm text-yellow-800">
              <p className="font-medium mb-1">Cost Savings Tip</p>
              <p>
                Configure DeepSeek to save up to 95% on AI costs compared to GPT-4o-mini. Get your free API key at{' '}
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-yellow-900"
                >
                  platform.deepseek.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">Monthly Cost Estimator</h4>
        <div className="space-y-3">
          {[10, 50, 100, 500, 1000].map((messagesPerDay) => {
            const deepseek = providers.find((p) => p.name === 'DeepSeek');
            const gpt35 = providers.find((p) => p.name === 'OpenAI GPT-3.5-turbo');
            const gpt4o = providers.find((p) => p.name === 'OpenAI GPT-4o-mini');

            return (
              <div key={messagesPerDay} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{messagesPerDay} messages/day</span>
                <div className="flex items-center gap-4 text-sm">
                  {deepseek && (
                    <span className="text-green-600 font-medium">
                      DeepSeek: ${calculateMonthlyCost(deepseek, messagesPerDay).toFixed(2)}
                    </span>
                  )}
                  {gpt35 && (
                    <span className="text-blue-600">
                      GPT-3.5: ${calculateMonthlyCost(gpt35, messagesPerDay).toFixed(2)}
                    </span>
                  )}
                  {gpt4o && (
                    <span className="text-gray-500">
                      GPT-4o: ${calculateMonthlyCost(gpt4o, messagesPerDay).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
