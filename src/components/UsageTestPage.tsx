import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Activity,
  Package,
  Sparkles,
  FileText,
  MessageCircle,
  ShoppingBag,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp
} from 'lucide-react';

interface UsageData {
  seller_id: string;
  products_count: number;
  ai_enrichments_used: number;
  ai_enrichments_limit: number;
  blog_articles_used: number;
  blog_articles_limit: number;
  chat_messages_used: number;
  chat_messages_limit: number;
  google_shopping_syncs: number;
  google_shopping_syncs_limit: number;
  seo_optimizations_used: number;
  seo_optimizations_limit: number;
  period_start: string;
  period_end: string;
  last_reset_at: string;
}

interface PlanData {
  name: string;
  products_limit: number;
  ai_enrichments_limit: number;
  blog_articles_limit: number;
  chat_messages_limit: number;
  google_shopping_syncs_limit: number;
  seo_optimizations_limit: number;
}

export function UsageTestPage() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  useEffect(() => {
    loadUsageData();
  }, []);

  const loadUsageData = async () => {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get usage data
      const { data: usageData, error: usageError } = await supabase
        .from('subscription_usage')
        .select('*')
        .eq('seller_id', user.id)
        .single();

      if (usageError) throw usageError;
      setUsage(usageData);

      // Get plan limits
      const { data: sellerData } = await supabase
        .from('sellers')
        .select('subscription_plan_id')
        .eq('id', user.id)
        .single();

      if (sellerData) {
        const { data: planData } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('id', sellerData.subscription_plan_id)
          .single();

        setPlan(planData);
      }
    } catch (error) {
      console.error('Error loading usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLimit = async (resource: string) => {
    try {
      setTesting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Call the check_usage_limit function
      const { data, error } = await supabase.rpc('check_usage_limit', {
        p_seller_id: user.id,
        p_resource: resource
      });

      if (error) throw error;

      setTestResults(prev => [...prev, {
        resource,
        result: data,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error testing limit:', error);
      setTestResults(prev => [...prev, {
        resource,
        result: { error: error.message },
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setTesting(false);
    }
  };

  const simulateUsage = async (resource: string, amount: number) => {
    try {
      setTesting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let updateField = '';
      switch (resource) {
        case 'ai_enrichment':
          updateField = 'ai_enrichments_used';
          break;
        case 'blog_article':
          updateField = 'blog_articles_used';
          break;
        case 'chat_message':
          updateField = 'chat_messages_used';
          break;
        case 'google_shopping':
          updateField = 'google_shopping_syncs';
          break;
        case 'seo_optimization':
          updateField = 'seo_optimizations_used';
          break;
      }

      if (updateField) {
        const { error } = await supabase
          .from('subscription_usage')
          .update({
            [updateField]: supabase.sql`${updateField} + ${amount}`,
            updated_at: new Date().toISOString()
          })
          .eq('seller_id', user.id);

        if (error) throw error;
        await loadUsageData();
        setTestResults(prev => [...prev, {
          resource,
          result: { success: true, message: `Added ${amount} to ${updateField}` },
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error simulating usage:', error);
    } finally {
      setTesting(false);
    }
  };

  const resetUsage = async () => {
    try {
      setTesting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('subscription_usage')
        .update({
          ai_enrichments_used: 0,
          blog_articles_used: 0,
          chat_messages_used: 0,
          google_shopping_syncs: 0,
          seo_optimizations_used: 0,
          last_reset_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('seller_id', user.id);

      if (error) throw error;
      await loadUsageData();
      setTestResults([]);
    } catch (error) {
      console.error('Error resetting usage:', error);
    } finally {
      setTesting(false);
    }
  };

  const getPercentage = (used: number, limit: number) => {
    if (limit === -1) return 0; // unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const getStatusColor = (used: number, limit: number) => {
    if (limit === -1) return 'text-green-600';
    const percent = (used / limit) * 100;
    if (percent >= 90) return 'text-red-600';
    if (percent >= 75) return 'text-orange-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Test de Consommation</h1>
        <button
          onClick={loadUsageData}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      {/* Plan Info */}
      {plan && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Actuel: {plan.name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Produits</div>
              <div className="font-bold text-gray-900">
                {plan.products_limit === -1 ? 'Illimité' : plan.products_limit}
              </div>
            </div>
            <div>
              <div className="text-gray-600">AI Enrichissements</div>
              <div className="font-bold text-gray-900">
                {plan.ai_enrichments_limit === -1 ? 'Illimité' : plan.ai_enrichments_limit}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Articles Blog</div>
              <div className="font-bold text-gray-900">
                {plan.blog_articles_limit === -1 ? 'Illimité' : plan.blog_articles_limit}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Messages Chat</div>
              <div className="font-bold text-gray-900">
                {plan.chat_messages_limit === -1 ? 'Illimité' : plan.chat_messages_limit}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Google Shopping</div>
              <div className="font-bold text-gray-900">
                {plan.google_shopping_syncs_limit === -1 ? 'Illimité' : plan.google_shopping_syncs_limit}
              </div>
            </div>
            <div>
              <div className="text-gray-600">SEO Optimizations</div>
              <div className="font-bold text-gray-900">
                {plan.seo_optimizations_limit === -1 ? 'Illimité' : plan.seo_optimizations_limit}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Usage */}
      {usage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <UsageCard
            icon={Package}
            title="Produits"
            used={usage.products_count}
            limit={plan?.products_limit || 100}
            color="blue"
          />
          <UsageCard
            icon={Sparkles}
            title="AI Enrichissements"
            used={usage.ai_enrichments_used}
            limit={usage.ai_enrichments_limit}
            color="purple"
          />
          <UsageCard
            icon={FileText}
            title="Articles Blog"
            used={usage.blog_articles_used}
            limit={usage.blog_articles_limit}
            color="green"
          />
          <UsageCard
            icon={MessageCircle}
            title="Messages Chat"
            used={usage.chat_messages_used}
            limit={usage.chat_messages_limit}
            color="orange"
          />
          <UsageCard
            icon={ShoppingBag}
            title="Google Shopping"
            used={usage.google_shopping_syncs}
            limit={usage.google_shopping_syncs_limit}
            color="red"
          />
          <UsageCard
            icon={Search}
            title="SEO Optimizations"
            used={usage.seo_optimizations_used}
            limit={usage.seo_optimizations_limit}
            color="indigo"
          />
        </div>
      )}

      {/* Test Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Contrôles de Test</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TestButton
            label="Test AI Enrichment"
            onClick={() => testLimit('ai_enrichment')}
            onSimulate={() => simulateUsage('ai_enrichment', 1)}
            disabled={testing}
          />
          <TestButton
            label="Test Blog Article"
            onClick={() => testLimit('blog_article')}
            onSimulate={() => simulateUsage('blog_article', 1)}
            disabled={testing}
          />
          <TestButton
            label="Test Chat Message"
            onClick={() => testLimit('chat_message')}
            onSimulate={() => simulateUsage('chat_message', 10)}
            disabled={testing}
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={resetUsage}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4" />
            Réinitialiser Usage
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Résultats des Tests</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                {result.result.allowed === true ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : result.result.allowed === false ? (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{result.resource}</div>
                  <div className="text-sm text-gray-600">
                    {JSON.stringify(result.result, null, 2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsageCard({ icon: Icon, title, used, limit, color }: any) {
  const percentage = limit === -1 ? 0 : Math.min((used / limit) * 100, 100);
  const isUnlimited = limit === -1;
  const isWarning = percentage >= 75 && percentage < 90;
  const isDanger = percentage >= 90;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <Icon className={`w-6 h-6 text-${color}-600`} />
        <span className={`text-sm font-medium ${
          isDanger ? 'text-red-600' :
          isWarning ? 'text-orange-600' :
          'text-green-600'
        }`}>
          {isUnlimited ? 'Illimité' : `${percentage.toFixed(0)}%`}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold text-gray-900">{used}</span>
        <span className="text-sm text-gray-500">
          / {isUnlimited ? '∞' : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isDanger ? 'bg-red-600' :
              isWarning ? 'bg-orange-600' :
              'bg-green-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TestButton({ label, onClick, onSimulate, disabled }: any) {
  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {label}
      </button>
      <button
        onClick={onSimulate}
        disabled={disabled}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm"
      >
        Simuler +1
      </button>
    </div>
  );
}
