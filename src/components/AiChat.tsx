import { useState, useEffect, useRef } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Send,
  Bot,
  User,
  Loader2,
  ShoppingCart,
  Eye,
  Sparkles,
  MessageCircle,
  Package
} from 'lucide-react';
import { formatPrice } from '../lib/currency';
import { useLanguage } from '../App';
import { OmnIAChat } from '../lib/omniaChat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: any[];
  selectedProduct?: any;
  timestamp: string;
  mode?: 'conversation' | 'product_show';
  searchFilters?: any;
}

export function AiChat() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStoreId();

    const welcomeMessage: ChatMessage = {
      role: 'assistant',
      content: 'Bonjour ! Je suis votre assistant personnel pour trouver les meubles parfaits. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchStoreId = async () => {
    try {
      const { data } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (data) {
        setStoreId(data.id);
      }
    } catch (err) {
      console.error('Error fetching store ID:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setLoading(true);

    try {
      console.log('Calling OmnIA Chat...');
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const response = await OmnIAChat(currentMessage, history, storeId || undefined);

      console.log('OmnIA Response:', response);

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.content,
        products: response.products || [],
        timestamp: new Date().toISOString(),
        mode: response.mode || 'conversation',
        searchFilters: response.searchFilters
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error sending message:', err);
      const errorText = err instanceof Error ? err.message : 'Unknown error';
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Désolé, une erreur s'est produite: ${errorText}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Bot className="w-7 h-7 text-blue-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold">OmnIA Shopping</h2>
            <p className="text-sm text-blue-100">Assistant intelligent - Toujours à votre service</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => (
          <div key={index}>
            <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div className={`max-w-[70%] ${message.role === 'user' ? 'order-2' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {message.role === 'assistant' && message.mode && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                      {message.mode === 'conversation' ? (
                        <>
                          <MessageCircle className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-semibold text-blue-600">Mode: Discussion</span>
                        </>
                      ) : (
                        <>
                          <Package className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-600">Mode: Recherche Produits</span>
                          {message.products && message.products.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                              {message.products.length} trouvé{message.products.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 px-2">
                  {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {message.selectedProduct && (
              <div className="ml-11 mt-3 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition">
                <div className="flex gap-4 p-4">
                  <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                    {message.selectedProduct.image_url ? (
                      <img
                        src={message.selectedProduct.image_url}
                        alt={message.selectedProduct.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">{message.selectedProduct.title}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{message.selectedProduct.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-blue-600">
                        {formatPrice(Number(message.selectedProduct.price), message.selectedProduct.currency || 'EUR')}
                      </span>
                      <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition shadow-md">
                        <ShoppingCart className="w-4 h-4" />
                        Ajouter au panier
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {message.products && message.products.length > 0 && (
              <div className="ml-11 mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {message.products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition group"
                  >
                    <div className="relative w-full h-40 bg-gray-100 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      {product.enrichment_status === 'enriched' && (
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
                          <Sparkles className="w-3 h-3" />
                          IA
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h5 className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2">{product.title}</h5>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(Number(product.price), product.currency || 'EUR')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setInputMessage(`Montre-moi les détails du produit ${product.id}`)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-xs font-medium"
                        >
                          <Eye className="w-3 h-3" />
                          Voir
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition text-xs font-medium">
                          <ShoppingCart className="w-3 h-3" />
                          Panier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">L'assistant réfléchit...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Décrivez ce que vous recherchez..."
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="flex items-center gap-2 mt-2">
              <MessageCircle className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">
                Exemple: "Je cherche un canapé scandinave pour mon salon"
              </p>
            </div>
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg disabled:shadow-none"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            <span className="font-medium">Envoyer</span>
          </button>
        </div>
      </div>
    </div>
  );
}
