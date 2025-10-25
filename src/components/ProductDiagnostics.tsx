import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Database, Image, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DiagnosticsResult {
  total_products: number;
  products_with_images: number;
  products_without_images: number;
  sample_products: Array<{
    id: string;
    title: string;
    image_url: string;
    category: string;
  }>;
  available_categories: string[];
  message: string;
}

export function ProductDiagnostics() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DiagnosticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Total products
      const { count: totalCount } = await supabase
        .from('shopify_products')
        .select('*', { count: 'exact', head: true });

      // Products with images
      const { count: withImageCount, data: withImages } = await supabase
        .from('shopify_products')
        .select('id, title, image_url, category', { count: 'exact' })
        .not('image_url', 'is', null)
        .limit(10);

      // Products without images
      const { count: withoutImageCount } = await supabase
        .from('shopify_products')
        .select('*', { count: 'exact', head: true })
        .is('image_url', null);

      // Categories
      const { data: categories } = await supabase
        .from('shopify_products')
        .select('category')
        .not('category', 'is', null)
        .limit(100);

      const uniqueCategories = [...new Set(categories?.map(p => p.category).filter(Boolean))];

      setResult({
        total_products: totalCount || 0,
        products_with_images: withImageCount || 0,
        products_without_images: withoutImageCount || 0,
        sample_products: withImages || [],
        available_categories: uniqueCategories.slice(0, 20),
        message: (withImageCount || 0) === 0
          ? "⚠️ Aucun produit n'a d'image. Importez vos produits depuis Shopify."
          : `✅ ${withImageCount} produits disponibles avec images`
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Diagnostic Produits</h2>
        </div>
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Analyse...' : 'Rafraîchir'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Erreur</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Status Message */}
          <div className={`p-4 rounded-lg border flex items-start gap-3 ${
            result.products_with_images > 0
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            {result.products_with_images > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className={`font-medium ${
                result.products_with_images > 0 ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {result.message}
              </h3>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-600 mb-1">Total Produits</div>
              <div className="text-2xl font-bold text-gray-900">{result.total_products}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-600 mb-1 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Avec Images
              </div>
              <div className="text-2xl font-bold text-green-900">{result.products_with_images}</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="text-sm text-red-600 mb-1">Sans Images</div>
              <div className="text-2xl font-bold text-red-900">{result.products_without_images}</div>
            </div>
          </div>

          {/* Available Categories */}
          {result.available_categories.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Catégories Disponibles ({result.available_categories.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.available_categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Sample Products */}
          {result.sample_products && result.sample_products.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Exemples de Produits (10 premiers)
              </h3>
              <div className="space-y-2">
                {result.sample_products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {product.title}
                      </div>
                      {product.category && (
                        <div className="text-xs text-gray-500">{product.category}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Products Warning */}
          {result.total_products === 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">
                Aucun produit dans le catalogue
              </h3>
              <p className="text-sm text-yellow-700 mb-3">
                Importez vos produits depuis Shopify pour pouvoir générer des articles de blog.
              </p>
              <a
                href="#import"
                className="inline-flex items-center text-sm font-medium text-yellow-900 hover:text-yellow-700"
              >
                Aller à l'import Shopify →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
