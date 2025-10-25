import { useState } from 'react';
import {
  ShoppingCart,
  Heart,
  Eye,
  Sparkles,
  Tag,
  Check,
  Loader2
} from 'lucide-react';
import { formatPrice } from '../lib/currency';
import { useCart } from '../lib/cartContext';
import { ProductLandingPage } from './ProductLandingPage';

interface OmniaProductCardProps {
  product: any;
}

export function OmniaProductCard({ product }: OmniaProductCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart } = useCart();

  const hasDiscount = product.compare_at_price &&
    Number(product.compare_at_price) > Number(product.price);

  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isAdding || isAdded) return;

    setIsAdding(true);
    try {
      await addToCart(product, 1);
      setIsAdded(true);

      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="group relative bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-2 border border-white/20"
      >
        <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          {hasDiscount && (
            <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
              <Tag className="w-3.5 h-3.5" />
              <span className="text-xs font-bold">-{discountPercent}%</span>
            </div>
          )}

          {product.enrichment_status === 'enriched' && (
            <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-semibold">IA</span>
            </div>
          )}

          <button
            onClick={handleToggleFavorite}
            className={`absolute top-3 right-14 z-10 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
              isFavorite
                ? 'bg-red-500 text-white scale-110'
                : 'bg-white/80 text-gray-600 hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          <img
            src={product.image_url || '/placeholder-product.jpg'}
            alt={product.title}
            className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(true);
              }}
              className="flex-1 bg-white/95 backdrop-blur-sm text-gray-800 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-white transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
            >
              <Eye className="w-4 h-4" />
              Voir détails
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {product.category && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg font-medium">
                {product.category}
              </span>
              {product.sub_category && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                  {product.sub_category}
                </span>
              )}
            </div>
          )}

          <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
            {product.title}
          </h3>

          {(product.ai_color || product.ai_material || product.ai_style) && (
            <div className="flex flex-wrap gap-1.5">
              {product.ai_color && (
                <span className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-md flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-purple-400" />
                  {product.ai_color}
                </span>
              )}
              {product.ai_material && (
                <span className="text-xs bg-amber-50 text-amber-600 px-2 py-1 rounded-md">
                  {product.ai_material}
                </span>
              )}
              {product.ai_style && (
                <span className="text-xs bg-cyan-50 text-cyan-600 px-2 py-1 rounded-md">
                  {product.ai_style}
                </span>
              )}
            </div>
          )}

          <div className="flex items-end justify-between pt-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${hasDiscount ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatPrice(Number(product.price), product.currency || 'EUR')}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-gray-400 line-through">
                    {formatPrice(Number(product.compare_at_price), product.currency || 'EUR')}
                  </span>
                )}
              </div>
              {product.inventory_quantity !== undefined && (
                <p className={`text-xs mt-1 ${
                  product.inventory_quantity < 5
                    ? 'text-red-600 font-semibold'
                    : 'text-green-600'
                }`}>
                  {product.inventory_quantity < 5
                    ? `Plus que ${product.inventory_quantity} en stock !`
                    : 'En stock'}
                </p>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isAdding || isAdded}
              className={`relative p-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg ${
                isAdded
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
              } disabled:opacity-50`}
            >
              {isAdding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isAdded ? (
                <Check className="w-5 h-5" />
              ) : (
                <ShoppingCart className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-blue-500/50 transition-all duration-300 pointer-events-none" />
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <ProductLandingPage
            product={product}
            onClose={() => setShowDetails(false)}
          />
        </div>
      )}
    </>
  );
}
