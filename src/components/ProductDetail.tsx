import { useEffect, useState } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Package,
  RefreshCw,
  X,
  ExternalLink,
  Tag,
  Box,
  Hash,
  Store as StoreIcon,
  Barcode,
  Weight,
  Copy,
  Check,
  ShoppingCart,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { ProductSeoTab } from './ProductSeoTab';
import { ProductGoogleShoppingTab } from './ProductGoogleShoppingTab';
import { formatPrice } from '../lib/currency';

type Product = Database['public']['Tables']['shopify_products']['Row'];
type ProductVariant = Database['public']['Tables']['product_variants']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductDetailProps {
  productId: string;
  onClose: () => void;
}

export function ProductDetail({ productId, onClose }: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentStep, setEnrichmentStep] = useState('');

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const [productResult, variantsResult, imagesResult] = await Promise.all([
        supabase
          .from('shopify_products')
          .select('*')
          .eq('id', productId)
          .maybeSingle(),
        supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('title', { ascending: true }),
        supabase
          .from('product_images')
          .select('*')
          .eq('product_id', productId)
          .order('position', { ascending: true })
      ]);

      if (productResult.error) throw productResult.error;
      if (variantsResult.error) throw variantsResult.error;
      if (imagesResult.error) throw imagesResult.error;

      setProduct(productResult.data);
      setVariants(variantsResult.data || []);
      setImages(imagesResult.data || []);
    } catch (err) {
      console.error('Error fetching product details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch product details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductDetails();
  }, [productId]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleEnrichProduct = async () => {
    if (isEnriching) return;

    setIsEnriching(true);
    setEnrichmentStep('Analyzing product information...');

    try {
      const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
      const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing');
      }

      setEnrichmentStep('Processing with DeepSeek AI...');

      const response = await fetch(`${supabaseUrl}/functions/v1/enrich-product-with-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId: product!.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Enrichment failed');
      }

      setEnrichmentStep('Analyzing images with OpenAI Vision...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setEnrichmentStep('Finalizing enrichment...');
      const data = await response.json();

      if (data.success) {
        await fetchProductDetails();
        setEnrichmentStep('');
      }
    } catch (err) {
      console.error('Enrichment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enrich product');
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsEnriching(false);
      setEnrichmentStep('');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4 text-lg">{error || 'Product not found'}</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const totalInventory = variants.length > 0
    ? variants.reduce((sum, v) => sum + v.inventory_quantity, 0)
    : product.inventory_quantity;

  const displayImage = images.length > 0 ? images[selectedImageIndex].src : product.image_url;
  const hasMultipleImages = images.length > 1;

  const avgPrice = variants.length > 0
    ? variants.reduce((sum, v) => sum + Number(v.price), 0) / variants.length
    : Number(product.price);

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {isEnriching && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto">
                  <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping"></div>
                  <div className="absolute inset-0 border-4 border-t-blue-600 border-r-purple-600 rounded-full animate-spin"></div>
                  <Sparkles className="w-20 h-20 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI Enrichment in Progress</h3>
              <p className="text-sm text-gray-600 mb-4">{enrichmentStep}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">Product Details</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleEnrichProduct}
                disabled={isEnriching}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition ${
                  isEnriching
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${isEnriching ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isEnriching ? 'Enriching...' : 'Enrich with AI'}</span>
              </button>
              <a
                href={`https://${product.shop_name}.myshopify.com/products/${product.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">View in Store</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="relative bg-gray-50 rounded-xl overflow-hidden aspect-square mb-4">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.title}
                  className="w-full h-full object-contain p-6"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-32 h-32 text-gray-300" />
                </div>
              )}
              {hasMultipleImages && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedImageIndex === index
                        ? 'border-blue-600 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt_text || `${product.title} - Image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              {product.vendor && (
                <p className="text-sm text-gray-500 mb-2">{product.vendor}</p>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {product.title}
              </h1>

              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  {formatPrice(avgPrice, product.currency || 'EUR')}
                </span>
                {variants.length > 1 && (
                  <span className="text-sm text-gray-500">average price</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                  product.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status}
                </span>
                {totalInventory <= 10 && totalInventory > 0 && (
                  <span className="px-3 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    Low Stock: {totalInventory} items
                  </span>
                )}
                {totalInventory === 0 && (
                  <span className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    Out of Stock
                  </span>
                )}
                {totalInventory > 10 && (
                  <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    In Stock: {totalInventory} items
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className={`rounded-lg p-4 ${product.ai_vision_analysis ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 border border-gray-200'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className={`w-5 h-5 flex-shrink-0 mt-0.5 ${product.ai_vision_analysis ? 'text-blue-600' : 'text-gray-400'}`} />
                  <h4 className={`text-base font-semibold ${product.ai_vision_analysis ? 'text-blue-900' : 'text-gray-500'}`}>AI Vision Analysis</h4>
                </div>
                <p className={`text-sm leading-relaxed ${product.ai_vision_analysis ? 'text-blue-800' : 'text-gray-400 italic'}`}>
                  {product.ai_vision_analysis || 'Not yet enriched. Click "Enrich with AI" to generate AI vision analysis.'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-lg p-4 ${product.style ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className={`text-sm font-medium mb-1 ${product.style ? 'text-indigo-600' : 'text-gray-500'}`}>Style</div>
                  <div className={`text-base font-semibold ${product.style ? 'text-indigo-900' : 'text-gray-400 italic'}`}>
                    {product.style || 'Not defined'}
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${product.room ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
                  <div className={`text-sm font-medium mb-1 ${product.room ? 'text-emerald-600' : 'text-gray-500'}`}>Room</div>
                  <div className={`text-base font-semibold ${product.room ? 'text-emerald-900' : 'text-gray-400 italic'}`}>
                    {product.room || 'Not defined'}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
              <div className="space-y-3">
                {product.product_type && (
                  <div className="flex items-center gap-3">
                    <Box className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Product Type</div>
                      <div className="text-base font-medium text-gray-900">{product.product_type}</div>
                    </div>
                  </div>
                )}
                {product.category && (
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Category</div>
                      <div className="text-base font-medium text-gray-900">
                        {product.category}{product.sub_category && ` / ${product.sub_category}`}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Shopify ID</div>
                      <div className="text-base font-medium text-gray-900">{product.shopify_id}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(product.shopify_id.toString(), 'shopify_id')}
                    className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Copy ID"
                  >
                    {copiedField === 'shopify_id' ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {product.tags && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.tags.split(',').map((tag, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {variants.length > 0 && (
          <div className="border-t border-gray-200 pt-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Product Variants ({variants.length})
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-left font-semibold text-gray-700">Variant</th>
                      <th className="px-4 py-4 text-left font-semibold text-gray-700">SKU</th>
                      <th className="px-4 py-4 text-left font-semibold text-gray-700">Price</th>
                      <th className="px-4 py-4 text-left font-semibold text-gray-700">Stock</th>
                      <th className="px-4 py-4 text-left font-semibold text-gray-700">Weight</th>
                      <th className="px-4 py-4 text-left font-semibold text-gray-700">Barcode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {variants.map((variant) => (
                      <tr key={variant.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            {variant.image_url ? (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                <img
                                  src={variant.image_url}
                                  alt={variant.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : displayImage ? (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                <img
                                  src={displayImage}
                                  alt={variant.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Package className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">{variant.title}</div>
                              {(variant.option1 || variant.option2 || variant.option3) && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {[variant.option1, variant.option2, variant.option3]
                                    .filter(Boolean)
                                    .join(' / ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-2">
                              <Barcode className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700 font-mono text-xs">{variant.sku || '-'}</span>
                            </div>
                            {variant.sku && (
                              <button
                                onClick={() => handleCopy(variant.sku, `sku_${variant.id}`)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 rounded transition"
                                title="Copy SKU"
                              >
                                {copiedField === `sku_${variant.id}` ? (
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-gray-500" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-gray-900">
                            {formatPrice(Number(variant.price), variant.currency || product.currency || 'EUR')}
                          </div>
                          {variant.compare_at_price && (
                            <div className="text-xs text-gray-500 line-through">
                              {formatPrice(Number(variant.compare_at_price), variant.currency || product.currency || 'EUR')}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              variant.inventory_quantity > 10 ? 'bg-green-500' :
                              variant.inventory_quantity > 0 ? 'bg-orange-500' : 'bg-red-500'
                            }`} />
                            <span className="font-medium text-gray-900">{variant.inventory_quantity}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {variant.weight ? (
                            <div className="flex items-center gap-2">
                              <Weight className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {variant.weight} {variant.weight_unit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-gray-700 font-mono text-xs">{variant.barcode || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 pt-8 mb-12">
          <ProductSeoTab product={product} onProductUpdate={fetchProductDetails} />
        </div>

        <div className="border-t border-gray-200 pt-8">
          <ProductGoogleShoppingTab product={product} onProductUpdate={fetchProductDetails} />
        </div>
      </div>
    </div>
  );
}
