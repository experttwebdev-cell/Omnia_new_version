import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Send,
  Bot,
  User,
  Loader2,
  ShoppingCart,
  Sparkles,
  ArrowLeft,
  Menu
} from "lucide-react";
import { OmnIAChat } from "../lib/omniaChat";
import { useCart } from "../lib/cartContext";
import { OmniaProductCard } from "./OmniaProductCard";
import { FloatingCart } from "./FloatingCart";
import { CheckoutFlow } from "./CheckoutFlow";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: any[];
  timestamp: string;
  intent?: "simple_chat" | "product_chat" | "product_show";
}

export function OmniaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { itemCount } = useCart();

  useEffect(() => {
    const loadStore = async () => {
      try {
        const { data } = await supabase
          .from("shopify_stores")
          .select("id")
          .limit(1)
          .maybeSingle();

        if (data?.id) setStoreId(data.id);
      } catch (error) {
        console.error("Error loading store:", error);
      }
    };

    loadStore();

    setMessages([
      {
        role: "assistant",
        content: "Bienvenue sur OmniaChat ! Je suis votre assistant shopping personnel propulsé par l'IA. Je peux vous aider à découvrir nos produits, vous conseiller et même gérer votre panier. Que recherchez-vous aujourd'hui ?",
        timestamp: new Date().toISOString(),
        intent: "simple_chat"
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage("");
    setLoading(true);

    try {
      const response = await OmnIAChat(currentMessage, [], storeId || undefined);

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.content,
        products: response.products || [],
        timestamp: new Date().toISOString(),
        intent: response.intent || "simple_chat"
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("Chat Error:", err);
      const errorMessage = {
        role: "assistant" as const,
        content: "Désolé, une erreur est survenue. Puis-je vous aider autrement ?",
        timestamp: new Date().toISOString(),
        intent: "simple_chat" as const
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptMCA0djJoMnYtMmgtMnptMC00aDJ2LTJoLTJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="relative z-10 h-full flex flex-col">
        <header className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-pink-600/90 backdrop-blur-xl border-b border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => window.history.back()}
                  className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition"
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>

                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-white to-blue-100 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
                    <Bot className="w-7 h-7 text-blue-600" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse" />
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                    OmniaChat
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
                  </h1>
                  <p className="text-sm text-blue-100 hidden sm:block">
                    Assistant Shopping IA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCart(true)}
                  className="relative p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110 backdrop-blur-sm group"
                >
                  <ShoppingCart className="w-6 h-6 text-white group-hover:text-yellow-300 transition" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg animate-bounce">
                      {itemCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl ring-4 ring-blue-500/20">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                )}

                <div className={`flex-1 max-w-[85%] ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                  <div
                    className={`rounded-2xl px-5 py-4 shadow-xl backdrop-blur-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white ml-auto"
                        : "bg-white/95 text-gray-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-2 ${
                      msg.role === "user" ? "text-blue-200" : "text-gray-400"
                    }`}>
                      {new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-4 w-full">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {msg.products.map((product) => (
                          <OmniaProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center shadow-xl ring-4 ring-gray-500/20">
                    <User className="w-6 h-6 text-white" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 items-center text-white text-sm bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3 w-fit animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>L'assistant réfléchit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Décrivez ce que vous cherchez..."
                  disabled={loading}
                  className="w-full bg-white/90 backdrop-blur-sm border-2 border-white/20 rounded-2xl px-5 py-4 pr-12 focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 outline-none disabled:opacity-50 transition-all placeholder-gray-500 text-gray-900 shadow-xl"
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
                </div>
              </div>
              <button
                onClick={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-2xl shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transform"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
                <span className="hidden sm:inline font-semibold">Envoyer</span>
              </button>
            </div>
            <p className="text-xs text-center text-white/60 mt-3">
              Exemples: "Montre-moi des tables modernes", "Je cherche une chaise confortable"
            </p>
          </div>
        </footer>
      </div>

      {showCart && <FloatingCart onClose={() => setShowCart(false)} onCheckout={() => {
        setShowCart(false);
        setShowCheckout(true);
      }} />}

      {showCheckout && <CheckoutFlow onClose={() => setShowCheckout(false)} />}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
