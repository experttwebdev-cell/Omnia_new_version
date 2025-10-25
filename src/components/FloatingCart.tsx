import { useState } from 'react';
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../lib/cartContext';
import { formatPrice } from '../lib/currency';

interface FloatingCartProps {
  onClose: () => void;
  onCheckout: () => void;
}

export function FloatingCart({ onClose, onCheckout }: FloatingCartProps) {
  const { cart, updateQuantity, removeFromCart, itemCount } = useCart();
  const [removingItems, setRemovingItems] = useState<Set<string>>(new Set());

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setRemovingItems(prev => new Set(prev).add(itemId));
    try {
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setRemovingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const subtotal = cart?.items.reduce((sum, item) => sum + item.total_price, 0) || 0;
  const discount = cart?.discount_amount || 0;
  const total = subtotal - discount;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full sm:w-[480px] h-[90vh] sm:h-[95vh] sm:mr-4 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Mon Panier</h2>
              <p className="text-sm text-blue-100">
                {itemCount} article{itemCount > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Votre panier est vide</h3>
            <p className="text-gray-600 mb-6 max-w-sm">
              Découvrez nos produits et commencez votre shopping avec l'aide de notre assistant IA
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Commencer le shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 ${
                    removingItems.has(item.id) ? 'opacity-50 scale-95' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-md">
                      <img
                        src={item.product_snapshot.image_url || '/placeholder-product.jpg'}
                        alt={item.product_snapshot.title}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-tight">
                          {item.product_snapshot.title}
                        </h4>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removingItems.has(item.id)}
                          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.product_snapshot.category && (
                        <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md mb-2">
                          {item.product_snapshot.category}
                        </span>
                      )}

                      <div className="flex items-end justify-between mt-3">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Minus className="w-4 h-4 text-gray-700" />
                          </button>
                          <span className="w-8 text-center font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="p-1.5 hover:bg-white rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-700" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatPrice(item.unit_price, item.currency)} × {item.quantity}
                          </p>
                          <p className="text-lg font-bold text-blue-600">
                            {formatPrice(item.total_price, item.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm px-6 py-5 space-y-4 shadow-2xl">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Sous-total</span>
                  <span className="font-semibold">
                    {formatPrice(subtotal, cart.currency)}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Réduction {cart.discount_code && `(${cart.discount_code})`}
                    </span>
                    <span className="font-semibold">
                      -{formatPrice(discount, cart.currency)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-gray-200">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(total, cart.currency)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Frais de livraison calculés à l'étape suivante
                </p>
              </div>

              <button
                onClick={onCheckout}
                disabled={!cart || cart.items.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Passer la commande</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition-colors"
              >
                Continuer mes achats
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
