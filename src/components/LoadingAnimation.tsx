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
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-12 text-center border border-blue-100">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-t-blue-500 border-r-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Package className="w-12 h-12 text-blue-600 animate-pulse" />
              <Sparkles className="w-5 h-5 text-cyan-500 absolute -top-1 -right-1 animate-ping" />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          {message || messages[currentMessage]}
        </h3>
        <p className="text-base text-gray-600 mb-6">Récupération des données en cours...</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-300"></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-lg shadow-cyan-300" style={{animationDelay: '0.15s'}}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce shadow-lg shadow-blue-400" style={{animationDelay: '0.3s'}}></div>
        </div>
        {showProgress && (
          <div className="w-64 mt-8 mx-auto">
            <div className="bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 h-full transition-all duration-300 ease-out rounded-full shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm font-semibold text-blue-600 text-center mt-3">{progress}%</p>
          </div>
        )}
        <div className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>Connexion sécurisée établie</span>
        </div>
      </div>
    );
  }

  if (type === 'content') {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-12 text-center border border-blue-100">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-t-blue-500 border-r-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <Sparkles className="w-12 h-12 text-blue-600 animate-pulse" />
              <Loader2 className="w-5 h-5 text-cyan-500 absolute -top-1 -right-1 animate-spin" />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          {message || messages[currentMessage]}
        </h3>
        <p className="text-base text-gray-600 mb-6">Génération du contenu en cours...</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-300"></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-lg shadow-cyan-300" style={{animationDelay: '0.15s'}}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce shadow-lg shadow-blue-400" style={{animationDelay: '0.3s'}}></div>
        </div>
        <div className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>Connexion sécurisée établie</span>
        </div>
      </div>
    );
  }

  if (type === 'data') {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-12 text-center border border-blue-100">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-t-blue-500 border-r-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <TrendingUp className="w-12 h-12 text-blue-600 animate-pulse" />
              <Sparkles className="w-5 h-5 text-cyan-500 absolute -top-1 -right-1 animate-ping" />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
          {message || messages[currentMessage]}
        </h3>
        <p className="text-base text-gray-600 mb-6">Analyse des données en cours...</p>
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-300"></div>
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-lg shadow-cyan-300" style={{animationDelay: '0.15s'}}></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce shadow-lg shadow-blue-400" style={{animationDelay: '0.3s'}}></div>
        </div>
        <div className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>Connexion sécurisée établie</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-12 text-center border border-blue-100">
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
        <div className="absolute inset-2 border-4 border-t-blue-500 border-r-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <ShoppingBag className="w-12 h-12 text-blue-600 animate-pulse" />
            <Sparkles className="w-5 h-5 text-cyan-500 absolute -top-1 -right-1 animate-ping" />
          </div>
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
        {message || messages[currentMessage]}
      </h3>
      <p className="text-base text-gray-600 mb-6">Veuillez patienter...</p>
      <div className="flex items-center justify-center gap-2">
        <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce shadow-lg shadow-blue-300"></div>
        <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce shadow-lg shadow-cyan-300" style={{animationDelay: '0.15s'}}></div>
        <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce shadow-lg shadow-blue-400" style={{animationDelay: '0.3s'}}></div>
      </div>
      <div className="mt-6 text-xs text-gray-500 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
        <span>Connexion sécurisée établie</span>
      </div>
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
