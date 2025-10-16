import { useState } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Sparkles,
  Upload,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Tag as TagIcon,
  Palette,
  Layers,
  Ruler,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface ProductSeoTabProps {
  product: Product;
  onProductUpdate: () => void;
}

export function ProductSeoTab({ product, onProductUpdate }: ProductSeoTabProps) {
  const [enriching, setEnriching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [enrichError, setEnrichError] = useState('');
  const [syncError, setSyncError] = useState('');
  const [enrichSuccess, setEnrichSuccess] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  const handleEnrich = async (retryCount = 0) => {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 120000);

    try {
      setEnriching(true);
      setEnrichError('');
      setEnrichSuccess('');

      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount} for product: ${product.title}`);
      } else {
        console.log(`Starting enrichment for product: ${product.title}`);
      }
      const startTime = Date.now();

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/enrich-product-with-ai`;
      const headers = {
        'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId: product.id }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`Enrichment completed in ${duration} seconds`);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enrich product');
      }

      setEnrichSuccess(`Product enriched successfully with AI in ${duration} seconds!`);
      onProductUpdate();
    } catch (err) {
      clearTimeout(timeoutId);
      console.error('Enrichment error:', err);

      if (err instanceof Error && err.name === 'AbortError') {
        if (retryCount === 0) {
          setEnrichError('Request timeout. Retrying in 2 seconds...');
          setTimeout(() => handleEnrich(1), 2000);
          return;
        }
        setEnrichError('Enrichment timeout after retry - the request took longer than 120 seconds. This may be due to slow AI API responses. Please try again or contact support if the issue persists.');
      } else if ((err instanceof Error && err.message.includes('fetch')) || err instanceof TypeError) {
        if (retryCount === 0) {
          setEnrichError('Network error. Retrying in 2 seconds...');
          setTimeout(() => handleEnrich(1), 2000);
          return;
        }
        setEnrichError('Network error after retry. Please check your connection and try again.');
      } else {
        setEnrichError(err instanceof Error ? err.message : 'Failed to enrich product');
      }
      setEnriching(false);
    } finally {
      if (retryCount > 0) {
        setEnriching(false);
      }
    }
  };

  const handleSyncToShopify = async () => {
    try {
      setSyncing(true);
      setSyncError('');
      setSyncSuccess('');

      const apiUrl = `${getEnvVar('VITE_SUPABASE_URL')}/functions/v1/sync-seo-to-shopify`;
      const headers = {
        'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync to Shopify');
      }

      setSyncSuccess('SEO data synced to Shopify successfully!');
      onProductUpdate();
    } catch (err) {
      console.error('Sync error:', err);
      setSyncError(err instanceof Error ? err.message : 'Failed to sync to Shopify');
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = () => {
    if (product.enrichment_status === 'enriched') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Enriched
        </div>
      );
    } else if (product.enrichment_status === 'pending') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Pending
        </div>
      );
    } else if (product.enrichment_status === 'failed') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-800 rounded-full text-sm font-medium">
          <XCircle className="w-4 h-4" />
          Failed
        </div>
      );
    }
    return null;
  };

  const getSyncStatusBadge = () => {
    if (product.seo_synced_to_shopify) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium">
          <CheckCircle className="w-4 h-4" />
          Synchronized
        </div>
      );
    } else if (product.enrichment_status === 'enriched') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
          <Clock className="w-4 h-4" />
          Needs Sync
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
        <Clock className="w-4 h-4" />
        Not Synced
      </div>
    );
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const seoTitleLength = product.seo_title?.length || 0;
  const seoDescLength = product.seo_description?.length || 0;

  const getTitleLengthColor = () => {
    if (seoTitleLength >= 60 && seoTitleLength <= 70) return 'text-green-600';
    if (seoTitleLength >= 50 && seoTitleLength <= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDescLengthColor = () => {
    if (seoDescLength >= 150 && seoDescLength <= 160) return 'text-green-600';
    if (seoDescLength >= 120 && seoDescLength <= 180) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {enrichSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{enrichSuccess}</p>
        </div>
      )}

      {enrichError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{enrichError}</p>
        </div>
      )}

      {syncSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-green-800">{syncSuccess}</p>
        </div>
      )}

      {syncError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{syncError}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">AI Enrichment Status</h3>
            {getStatusBadge()}
          </div>
          <button
            onClick={handleEnrich}
            disabled={enriching}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
          >
            {enriching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enriching...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {product.enrichment_status === 'enriched' ? 'Re-enrich' : 'Enrich'} with AI
              </>
            )}
          </button>
        </div>

        {product.enrichment_status === 'enriched' && product.ai_confidence_score > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Confidence Score</span>
              <span className="text-sm font-bold text-gray-900">{product.ai_confidence_score}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${getConfidenceColor(product.ai_confidence_score)} transition-all duration-500`}
                style={{ width: `${product.ai_confidence_score}%` }}
              />
            </div>
          </div>
        )}

        {product.last_enriched_at && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            Last enriched: {new Date(product.last_enriched_at).toLocaleString()}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">SEO Preview</h3>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
          {product.handle ? (
            <div className="text-blue-600 text-xs mb-1">
              https://yourstore.myshopify.com/products/{product.handle}
            </div>
          ) : (
            <div className="text-gray-400 text-xs mb-1 italic">
              Product URL preview (handle not available)
            </div>
          )}
          <div className="text-lg font-semibold text-blue-800 mb-1 hover:underline cursor-pointer">
            {product.seo_title || product.title}
          </div>
          <div className="text-sm text-gray-700 line-clamp-2">
            {product.seo_description || product.description?.replace(/<[^>]*>/g, '').substring(0, 160)}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">SEO Title</label>
              <span className={`text-xs font-medium ${getTitleLengthColor()}`}>
                {seoTitleLength} characters (optimal: 60-70)
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-gray-900">{product.seo_title || 'Not set'}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">SEO Description</label>
              <span className={`text-xs font-medium ${getDescLengthColor()}`}>
                {seoDescLength} characters (optimal: 150-160)
              </span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-gray-900">{product.seo_description || 'Not set'}</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              {product.tags ? (
                <div className="flex flex-wrap gap-2">
                  {product.tags.split(',').map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tags</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {product.enrichment_status === 'enriched' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">AI Analysis</h3>

          {product.ai_vision_analysis && (
            <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 mb-2">Visual Synthesis</h4>
              <p className="text-purple-800">{product.ai_vision_analysis}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {product.ai_color && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-5 h-5 text-gray-700" />
                  <h4 className="text-sm font-semibold text-gray-900">Color Detected</h4>
                </div>
                <p className="text-gray-800 font-medium">{product.ai_color}</p>
              </div>
            )}

            {product.ai_material && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-5 h-5 text-gray-700" />
                  <h4 className="text-sm font-semibold text-gray-900">Material Detected</h4>
                </div>
                <p className="text-gray-800 font-medium">{product.ai_material}</p>
              </div>
            )}

            {(product.length || product.width || product.height) && (
              <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler className="w-5 h-5 text-gray-700" />
                  <h4 className="text-sm font-semibold text-gray-900">Dimensions Detected</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {product.length && (
                    <div>
                      <p className="text-xs text-gray-600">Length</p>
                      <p className="text-gray-900 font-medium">
                        {product.length} {product.length_unit}
                      </p>
                    </div>
                  )}
                  {product.width && (
                    <div>
                      <p className="text-xs text-gray-600">Width</p>
                      <p className="text-gray-900 font-medium">
                        {product.width} {product.width_unit}
                      </p>
                    </div>
                  )}
                  {product.height && (
                    <div>
                      <p className="text-xs text-gray-600">Height</p>
                      <p className="text-gray-900 font-medium">
                        {product.height} {product.height_unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-gray-900">Shopify Synchronization</h3>
            {getSyncStatusBadge()}
          </div>
        </div>

        {product.last_seo_sync_at && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <Calendar className="w-4 h-4" />
            Last synced: {new Date(product.last_seo_sync_at).toLocaleString()}
          </div>
        )}

        {product.seo_sync_error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 mb-1">Sync Error</p>
              <p className="text-sm text-red-700">{product.seo_sync_error}</p>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Clicking "Push to Shopify" will update the SEO title, SEO description, and tags
            directly in your Shopify store. This action will overwrite the existing values.
          </p>
        </div>

        <button
          onClick={handleSyncToShopify}
          disabled={syncing || product.enrichment_status !== 'enriched'}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition text-lg"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Syncing to Shopify...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Push to Shopify
            </>
          )}
        </button>

        {product.enrichment_status !== 'enriched' && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Product must be enriched before syncing to Shopify
          </p>
        )}
      </div>
    </div>
  );
}
