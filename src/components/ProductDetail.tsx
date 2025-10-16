import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
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
  const [activeTab, setActiveTab] = useState<'details' | 'variants' | 'images' | 'seo' | 'google'>('details');

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="relative bg-gray-50 rounded-xl overflow-hidden aspect-square mb-3">
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-300" />
                </div>
              )}
              {hasMultipleImages && (
                <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2.5 py-1 rounded-full text-xs font-medium">
                  {selectedImageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
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

          <div className="lg:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {product.category && (
                  <span className="text-sm text-gray-600">{product.category}</span>
                )}
                {product.sub_category && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{product.sub_category}</span>
                  </>
                )}
                <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-medium ${
                  product.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {product.status}
                </span>
                {totalInventory <= 10 && totalInventory > 0 && (
                  <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                    Low Stock
                  </span>
                )}
                {totalInventory === 0 && (
                  <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(avgPrice, product.currency || 'EUR')}
                </span>
                {variants.length > 1 && (
                  <span className="text-xs text-gray-500">avg. price</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{totalInventory}</div>
                <div className="text-xs text-gray-600">Stock</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{variants.length || 1}</div>
                <div className="text-xs text-gray-600">Variants</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{images.length}</div>
                <div className="text-xs text-gray-600">Images</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {product.product_type?.substring(0, 3) || 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Type</div>
              </div>
            </div>

            {product.ai_vision_analysis && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <h4 className="text-sm font-semibold text-blue-900">AI Vision Analysis</h4>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {product.ai_vision_analysis}
                </p>
              </div>
            )}

            {(product.style || product.room) && (
              <div className="grid grid-cols-2 gap-3">
                {product.style && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <div className="text-xs text-purple-600 font-medium mb-1">Style</div>
                    <div className="text-sm font-semibold text-purple-900">{product.style}</div>
                  </div>
                )}
                {product.room && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-xs text-green-600 font-medium mb-1">Room</div>
                    <div className="text-sm font-semibold text-green-900">{product.room}</div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between group py-1.5">
                <div className="flex items-center gap-3">
                  <Hash className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Shopify ID</div>
                    <div className="text-sm font-medium text-gray-900">{product.shopify_id}</div>
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

              {product.vendor && (
                <div className="flex items-center gap-3 py-1.5">
                  <StoreIcon className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Vendor</div>
                    <div className="text-sm font-medium text-gray-900">{product.vendor}</div>
                  </div>
                </div>
              )}

              {product.product_type && (
                <div className="flex items-center gap-3 py-1.5">
                  <Box className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Product Type</div>
                    <div className="text-sm font-medium text-gray-900">{product.product_type}</div>
                  </div>
                </div>
              )}
            </div>

            {product.tags && (
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.split(',').slice(0, 8).map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {tag.trim()}
                    </span>
                  ))}
                  {product.tags.split(',').length > 8 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      +{product.tags.split(',').length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200 mb-6">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2.5 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                activeTab === 'details'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('variants')}
              className={`px-4 py-2.5 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                activeTab === 'variants'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Variants ({variants.length})
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-4 py-2.5 font-medium text-sm transition border-b-2 whitespace-nowrap ${
                activeTab === 'images'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Images ({images.length})
            </button>
            <button
              onClick={() => setActiveTab('seo')}
              className={`px-6 py-3 font-medium text-sm transition border-b-2 flex items-center gap-2 ${
                activeTab === 'seo'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              SEO
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`px-6 py-3 font-medium text-sm transition border-b-2 flex items-center gap-2 ${
                activeTab === 'google'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Google Shopping
            </button>
          </div>
        </div>

        {activeTab === 'details' && (
          <div className="animate-fadeIn">
            {product.description && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Description</h3>
                <div
                  className="prose prose-sm max-w-none text-gray-700 [&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_td]:px-3 [&_td]:py-2 [&_td]:border [&_td]:border-gray-200 [&_th]:px-3 [&_th]:py-2 [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h4]:text-base [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}
          </div>
        )}

        {activeTab === 'variants' && variants.length > 0 && (
          <div className="animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
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

        {activeTab === 'variants' && variants.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200 animate-fadeIn">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No variants found for this product</p>
            <p className="text-sm text-gray-500 mt-2">
              This product may be imported from an older version or has no variants
            </p>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Product Images ({images.length})
            </h3>
            {images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={image.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="aspect-square bg-gray-50 relative">
                      <img
                        src={image.src}
                        alt={image.alt_text || `Product image ${index + 1}`}
                        className="w-full h-full object-contain p-4"
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                        #{index + 1}
                      </div>
                    </div>
                    {image.alt_text && (
                      <div className="p-3 border-t border-gray-200">
                        <p className="text-sm text-gray-700">{image.alt_text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No images available</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="animate-fadeIn">
            <ProductSeoTab product={product} onProductUpdate={fetchProductDetails} />
          </div>
        )}

        {activeTab === 'google' && (
          <div className="animate-fadeIn">
            <ProductGoogleShoppingTab product={product} onProductUpdate={fetchProductDetails} />
          </div>
        )}
      </div>
    </div>
  );
}
