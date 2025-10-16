import { useState } from 'react';
import {
  X,
  ShoppingCart,
  Heart,
  Share2,
  Ruler,
  Package,
  Sparkles,
  Tag,
  Star,
  ChevronLeft,
  ChevronRight,
  Palette,
  Box,
  Eye,
  Check,
  Info
} from 'lucide-react';
import { formatPrice } from '../lib/currency';

interface ProductLandingPageProps {
  product: any;
  onClose: () => void;
}

export function ProductLandingPage({ product, onClose }: ProductLandingPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  const images = product.image_url ? [product.image_url] : [];
  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)
    : 0;

  const dimensions = [];
  if (product.width) dimensions.push(`L: ${product.width}${product.width_unit || 'cm'}`);
  if (product.height) dimensions.push(`H: ${product.height}${product.height_unit || 'cm'}`);
  if (product.length) dimensions.push(`P: ${product.length}${product.length_unit || 'cm'}`);

  const handleBuyNow = () => {
    if (product.shop_name && product.handle) {
      window.open(`https://${product.shop_name}/products/${product.handle}`, '_blank');
    }
  };

  const handleShare = async () => {
    if (navigator.share && product.shop_name && product.handle) {
      try {
        await navigator.share({
          title: product.title,
          text: `Découvrez ce produit : ${product.title}`,
          url: `https://${product.shop_name}/products/${product.handle}`
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header fixe */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Retour au chat</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`p-2 rounded-lg transition ${
                isFavorite ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galerie d'images */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white rounded-2xl shadow-lg overflow-hidden group">
              {hasDiscount && (
                <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="font-bold text-lg">-{discountPercent}%</span>
                </div>
              )}
              {product.enrichment_status === 'enriched' && (
                <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-semibold">Enrichi par IA</span>
                </div>
              )}
              <img
                src={images[selectedImage] || product.image_url}
                alt={product.title}
                className="w-full h-full object-contain p-8 group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Thumbnails si plusieurs images */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            {/* En-tête produit */}
            <div>
              {product.category && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <Package className="w-4 h-4" />
                  <span>{product.category}</span>
                  {product.sub_category && (
                    <>
                      <ChevronRight className="w-3 h-3" />
                      <span>{product.sub_category}</span>
                    </>
                  )}
                </div>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{product.title}</h1>

              {/* Prix */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold text-blue-600">
                  {formatPrice(Number(product.price), product.currency || 'EUR')}
                </span>
                {hasDiscount && (
                  <span className="text-2xl text-gray-400 line-through">
                    {formatPrice(Number(product.compare_at_price), product.currency || 'EUR')}
                  </span>
                )}
              </div>

              {/* Note (simulée) */}
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8 sur 5 - 127 avis)</span>
              </div>
            </div>

            {/* Disponibilité */}
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-lg border border-green-200">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">
                En stock - {product.inventory_quantity || 'Disponible'}
              </span>
            </div>

            {/* Caractéristiques principales */}
            <div className="grid grid-cols-2 gap-4">
              {product.style && (
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Palette className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Style</p>
                    <p className="text-sm font-semibold text-gray-900">{product.style}</p>
                  </div>
                </div>
              )}
              {(product.ai_color || product.color) && (
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Eye className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Couleur</p>
                    <p className="text-sm font-semibold text-gray-900">{product.ai_color || product.color}</p>
                  </div>
                </div>
              )}
              {(product.ai_material || product.material) && (
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Box className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Matériau</p>
                    <p className="text-sm font-semibold text-gray-900">{product.ai_material || product.material}</p>
                  </div>
                </div>
              )}
              {dimensions.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <Ruler className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Dimensions</p>
                    <p className="text-sm font-semibold text-gray-900">{dimensions.join(' × ')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quantité et achat */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Quantité:</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleBuyNow}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCart className="w-6 h-6" />
                Acheter maintenant
              </button>
            </div>

            {/* Tags */}
            {product.tags && (
              <div className="flex flex-wrap gap-2">
                {product.tags.split(',').slice(0, 8).map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Description complète */}
        {(product.description || product.ai_vision_analysis) && (
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Description détaillée</h2>

            {product.description && (
              <div className="bg-white rounded-2xl p-8 shadow-md border border-gray-200">
                <div
                  className="prose prose-blue max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {product.ai_vision_analysis && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-8 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Analyse IA enrichie</h3>
                    <p className="text-sm text-gray-600">Description générée par intelligence artificielle</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.ai_vision_analysis}</p>
              </div>
            )}
          </div>
        )}

        {/* Informations additionnelles */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Livraison rapide</h3>
            <p className="text-sm text-gray-600">Expédition sous 24-48h partout en France</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Garantie qualité</h3>
            <p className="text-sm text-gray-600">Satisfait ou remboursé sous 30 jours</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Info className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Service client</h3>
            <p className="text-sm text-gray-600">Support disponible 7j/7 pour vous accompagner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
