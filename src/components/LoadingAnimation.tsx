import { useEffect, useState } from 'react';
import { Package, ShoppingBag, Sparkles, TrendingUp, Loader2 } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
  type?: 'spinner' | 'products' | 'content' | 'data';
  showProgress?: boolean;
  progress?: number;
}

const loadingMessages = {
  en: [
    'Loading your products...',
    'Preparing your data...',
    'Almost there...',
    'Just a moment...',
    'Getting everything ready...',
  ],
  fr: [
    'Chargement de vos produits...',
    'Préparation de vos données...',
    'Presque prêt...',
    'Un instant...',
    'Tout est presque prêt...',
  ],
  es: [
    'Cargando tus productos...',
    'Preparando tus datos...',
    'Casi listo...',
    'Un momento...',
    'Preparándolo todo...',
  ],
  de: [
    'Lade deine Produkte...',
    'Bereite deine Daten vor...',
    'Fast fertig...',
    'Einen Moment...',
    'Alles wird vorbereitet...',
  ],
};

export function LoadingAnimation({
  message,
  type = 'spinner',
  showProgress = false,
  progress = 0
}: LoadingAnimationProps) {
  const [currentMessage, setCurrentMessage] = useState(0);
  const messages = loadingMessages.en;

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentMessage((prev) => (prev + 1) % messages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [message, messages.length]);

  if (type === 'products') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-16 h-16 text-blue-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 border-4 border-blue-200 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-4 border-4 border-blue-300 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-8 border-4 border-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>

        <p className="text-lg font-semibold text-gray-800 mb-2 animate-pulse">
          {message || messages[currentMessage]}
        </p>
        <p className="text-sm text-gray-500">This may take a few moments</p>

        {showProgress && (
          <div className="w-64 mt-6">
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 text-center mt-2">{progress}%</p>
          </div>
        )}
      </div>
    );
  }

  if (type === 'content') {
    return (
      <div className="space-y-6 py-8 px-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Sparkles className="w-8 h-8 text-purple-500 animate-pulse" />
            <div className="absolute inset-0 bg-purple-400 rounded-full opacity-20 animate-ping" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" />
          </div>
        </div>

        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.2}s` }} />
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-5/6 animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.2 + 0.1}s` }} />
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-4/6 animate-shimmer bg-[length:200%_100%]" style={{ animationDelay: `${i * 0.2 + 0.2}s` }} />
          </div>
        ))}

        <p className="text-center text-sm text-gray-500 mt-8 animate-pulse">
          {message || messages[currentMessage]}
        </p>
      </div>
    );
  }

  if (type === 'data') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative mb-8">
          <TrendingUp className="w-16 h-16 text-teal-500 animate-bounce" />
          <div className="absolute -top-2 -right-2">
            <div className="w-4 h-4 bg-teal-400 rounded-full animate-ping" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>

        <p className="text-lg font-semibold text-gray-800 animate-pulse">
          {message || messages[currentMessage]}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 border-4 border-blue-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
        <ShoppingBag className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
      </div>

      <p className="text-base font-medium text-gray-700 animate-pulse">
        {message || messages[currentMessage]}
      </p>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-24 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
    </tr>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-16" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
