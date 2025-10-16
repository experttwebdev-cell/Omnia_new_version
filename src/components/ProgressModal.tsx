import { CheckCircle, Loader2, Package, Image as ImageIcon, Clock, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ProgressModalProps {
  isOpen: boolean;
  title: string;
  current: number;
  total: number;
  currentItem?: string;
  currentItemImage?: string;
  itemType?: 'product' | 'image' | 'item';
  isComplete?: boolean;
  onClose?: () => void;
}

export function ProgressModal({
  isOpen,
  title,
  current,
  total,
  currentItem,
  currentItemImage,
  itemType = 'item',
  isComplete = false,
  onClose,
}: ProgressModalProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && !isComplete) {
      if (!startTime) {
        setStartTime(Date.now());
      }

      const interval = setInterval(() => {
        if (startTime) {
          setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setStartTime(null);
      setElapsedTime(0);
    }
  }, [isOpen, isComplete, startTime]);

  if (!isOpen) return null;

  const progress = total > 0 ? (current / total) * 100 : 0;
  const showWarning = elapsedTime > 45 && !isComplete;

  const getIcon = () => {
    if (isComplete) {
      return <CheckCircle className="w-16 h-16 text-green-600" />;
    }
    switch (itemType) {
      case 'product':
        return <Package className="w-16 h-16 text-blue-600 animate-pulse" />;
      case 'image':
        return <ImageIcon className="w-16 h-16 text-blue-600 animate-pulse" />;
      default:
        return <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6">{getIcon()}</div>

          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {isComplete ? 'Processing Complete!' : title}
          </h3>

          {!isComplete && (
            <>
              <div className="w-full mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-blue-600">
                    {current} / {total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 h-full transition-all duration-300 ease-out relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer" />
                  </div>
                </div>
                <div className="text-center mt-2 text-2xl font-bold text-blue-600 animate-pulse">
                  {Math.round(progress)}%
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-4 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Elapsed time: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {showWarning && (
                <div className="w-full p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Processing is taking longer than usual</p>
                    <p className="text-xs">This may be due to slow AI API responses. The system will timeout after 2 minutes if needed.</p>
                  </div>
                </div>
              )}

              {currentItem && (
                <div className="w-full p-4 bg-purple-50 rounded-lg border border-purple-200 animate-pulse">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 className="w-4 h-4 text-purple-600 animate-spin" />
                    <p className="text-sm text-purple-700 font-medium">Traitement en cours</p>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-1 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {currentItemImage ? (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-white border border-purple-200">
                        <img
                          src={currentItemImage}
                          alt={currentItem}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-purple-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 line-clamp-2 text-sm">{currentItem}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isComplete && (
            <>
              <p className="text-gray-600 mb-6">
                Successfully processed {total} {itemType}
                {total !== 1 ? 's' : ''}
              </p>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Close
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
