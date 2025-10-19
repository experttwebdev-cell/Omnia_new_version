import { useState } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MapPin,
  User as UserIcon,
  Mail,
  Phone,
  Loader2,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { useCart } from '../lib/cartContext';
import { formatPrice } from '../lib/currency';
import { getEnvVar } from '../lib/supabase';

interface CheckoutFlowProps {
  onClose: () => void;
}

type CheckoutStep = 'info' | 'shipping' | 'payment';

interface CheckoutData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  shippingMethod: 'standard' | 'express';
  paymentMethod: 'card' | 'paypal';
}

export function CheckoutFlow({ onClose }: CheckoutFlowProps) {
  const { cart, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('info');
  const [loading, setLoading] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [formData, setFormData] = useState<CheckoutData>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    shippingMethod: 'standard',
    paymentMethod: 'card'
  });

  const [errors, setErrors] = useState<Partial<CheckoutData>>({});

  const shippingCosts = {
    standard: 5.99,
    express: 12.99
  };

  const subtotal = cart?.items.reduce((sum, item) => sum + item.total_price, 0) || 0;
  const discount = cart?.discount_amount || 0;
  const shipping = shippingCosts[formData.shippingMethod];
  const total = subtotal - discount + shipping;

  const validateStep = (step: CheckoutStep): boolean => {
    const newErrors: Partial<CheckoutData> = {};

    if (step === 'info') {
      if (!formData.email) newErrors.email = 'Email requis';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email invalide';
      if (!formData.firstName) newErrors.firstName = 'Prénom requis';
      if (!formData.lastName) newErrors.lastName = 'Nom requis';
      if (!formData.phone) newErrors.phone = 'Téléphone requis';
    }

    if (step === 'shipping') {
      if (!formData.address) newErrors.address = 'Adresse requise';
      if (!formData.city) newErrors.city = 'Ville requise';
      if (!formData.postalCode) newErrors.postalCode = 'Code postal requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;

    const steps: CheckoutStep[] = ['info', 'shipping', 'payment'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: CheckoutStep[] = ['info', 'shipping', 'payment'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmitOrder = async () => {
    setLoading(true);
    try {
      const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
      if (!supabaseUrl) throw new Error('Supabase URL not configured');

      const orderNum = `OM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const response = await fetch(`${supabaseUrl}/functions/v1/create-shopify-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart_id: cart?.id,
          customer: formData,
          shipping_method: formData.shippingMethod,
          payment_method: formData.paymentMethod,
          order_number: orderNum
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      setOrderNumber(orderNum);
      setOrderConfirmed(true);
      await clearCart();
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Une erreur est survenue lors de la création de la commande');
    } finally {
      setLoading(false);
    }
  };

  if (orderConfirmed) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-3">Commande confirmée !</h2>
          <p className="text-gray-600 mb-6">
            Merci pour votre commande. Vous recevrez un email de confirmation à{' '}
            <strong>{formData.email}</strong>
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Numéro de commande</p>
            <p className="text-2xl font-bold text-blue-600">{orderNumber}</p>
          </div>

          <div className="space-y-3 mb-6 text-left bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sous-total</span>
              <span className="font-semibold">{formatPrice(subtotal, cart?.currency || 'EUR')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Livraison</span>
              <span className="font-semibold">{formatPrice(shipping, cart?.currency || 'EUR')}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span className="text-blue-600">{formatPrice(total, cart?.currency || 'EUR')}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Retour au chat
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'info', label: 'Informations', icon: UserIcon },
    { id: 'shipping', label: 'Livraison', icon: MapPin },
    { id: 'payment', label: 'Paiement', icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden">
      <div className="h-full flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-bold">Finaliser ma commande</h2>
                <p className="text-sm text-blue-100">
                  {cart?.items.length || 0} article{(cart?.items.length || 0) > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = index < currentStepIndex;

                  return (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-110 shadow-lg'
                              : isCompleted
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-6 h-6" /> : <StepIcon className="w-6 h-6" />}
                        </div>
                        <span
                          className={`text-xs mt-2 font-medium ${
                            isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-2 transition-colors ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-6">
                {currentStep === 'info' && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Vos informations</h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="votre@email.com"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Prénom *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Jean"
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Nom *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Dupont"
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Téléphone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={`w-full pl-11 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                    </div>
                  </div>
                )}

                {currentStep === 'shipping' && (
                  <div className="space-y-4 animate-fade-in">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Adresse de livraison</h3>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Adresse *</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                          errors.address ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="123 Rue de la Paix"
                      />
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ville *</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            errors.city ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Paris"
                        />
                        {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Code postal *</label>
                        <input
                          type="text"
                          value={formData.postalCode}
                          onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition ${
                            errors.postalCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="75001"
                        />
                        {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Mode de livraison</label>
                      <div className="space-y-3">
                        <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shipping"
                            value="standard"
                            checked={formData.shippingMethod === 'standard'}
                            onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value as any })}
                            className="w-5 h-5 text-blue-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Livraison Standard</span>
                              <span className="font-bold text-blue-600">{formatPrice(5.99, cart?.currency || 'EUR')}</span>
                            </div>
                            <p className="text-sm text-gray-500">3-5 jours ouvrés</p>
                          </div>
                        </label>

                        <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition hover:bg-gray-50">
                          <input
                            type="radio"
                            name="shipping"
                            value="express"
                            checked={formData.shippingMethod === 'express'}
                            onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value as any })}
                            className="w-5 h-5 text-blue-600"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Livraison Express</span>
                              <span className="font-bold text-blue-600">{formatPrice(12.99, cart?.currency || 'EUR')}</span>
                            </div>
                            <p className="text-sm text-gray-500">1-2 jours ouvrés</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'payment' && (
                  <div className="space-y-6 animate-fade-in">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Paiement</h3>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900 mb-1">Paiement sécurisé</p>
                        <p className="text-sm text-blue-700">
                          Vos données sont protégées par un cryptage SSL 256-bit
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                          className="w-5 h-5 text-blue-600"
                        />
                        <CreditCard className="w-6 h-6 mx-3 text-gray-600" />
                        <span className="font-semibold">Carte bancaire</span>
                      </label>

                      <label className="flex items-center p-4 border-2 rounded-xl cursor-pointer transition hover:bg-gray-50">
                        <input
                          type="radio"
                          name="payment"
                          value="paypal"
                          checked={formData.paymentMethod === 'paypal'}
                          onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                          className="w-5 h-5 text-blue-600"
                        />
                        <div className="w-6 h-6 mx-3 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">P</span>
                        </div>
                        <span className="font-semibold">PayPal</span>
                      </label>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 space-y-3">
                      <h4 className="font-bold text-gray-900 mb-4">Récapitulatif</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sous-total</span>
                          <span className="font-semibold">{formatPrice(subtotal, cart?.currency || 'EUR')}</span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Réduction</span>
                            <span className="font-semibold">-{formatPrice(discount, cart?.currency || 'EUR')}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Livraison ({formData.shippingMethod})</span>
                          <span className="font-semibold">{formatPrice(shipping, cart?.currency || 'EUR')}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold pt-3 border-t">
                          <span>Total</span>
                          <span className="text-blue-600">{formatPrice(total, cart?.currency || 'EUR')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 shadow-xl hover:shadow-2xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Traitement en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmer et payer {formatPrice(total, cart?.currency || 'EUR')}</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {currentStep !== 'payment' && (
            <div className="border-t bg-white px-6 py-4">
              <button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
