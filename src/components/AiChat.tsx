import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Send,
  Bot,
  User,
  Loader2,
  ShoppingCart,
  Eye,
  Sparkles,
  MessageCircle,
  Package,
  Home,
  Watch,
  Shirt,
} from "lucide-react";
import { formatPrice } from "../lib/currency";
import { OmnIAChat } from "../lib/omniaChat";
import { ProductLandingPage } from "./ProductLandingPage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: any[];
  summary?: any;
  timestamp: string;
  mode?: "conversation" | "product_show";
  sector?: string;
}

// ✅ Ajouter les types manquants
type SectorType = "meubles" | "montres" | "pret_a_porter";

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductLanding, setShowProductLanding] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ Corriger le typage des icônes
  const sectorIcons: Record<SectorType, any> = {
    meubles: Home,
    montres: Watch,
    pret_a_porter: Shirt,
  };

  // ✅ Améliorer le chargement du store
  useEffect(() => {
    const loadStoreSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("shopify_stores")
          .select("id")
          .limit(1)
          .maybeSingle();
        
        if (error) throw error;
        
        if (data?.id) {
          setStoreId(data.id);
          setMessages([
            {
              role: "assistant",
              content: "Bonjour 👋 Je suis OmnIA, votre assistant shopping. Que puis-je vous aider à trouver aujourd'hui ?",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (error) {
        console.error("Erreur chargement store:", error);
      }
    };

    loadStoreSettings();
  }, []);

  // ✅ Améliorer le scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: "smooth",
      block: "nearest"
    });
  }, [messages]);

  // ✅ Améliorer l'envoi des messages avec gestion d'erreur
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
      // ✅ Ajouter le callback pour le streaming
      let streamedContent = "";
      
      const response = await OmnIAChat(
        currentMessage, 
        [], 
        storeId || undefined,
        (chunk) => {
          streamedContent += chunk;
          // Mettre à jour le dernier message en temps réel
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg?.role === "assistant") {
              lastMsg.content = streamedContent;
            }
            return newMessages;
          });
        }
      );

      // Si pas de streaming, utiliser la réponse normale
      if (!streamedContent) {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: response.response || response.content || "J'analyse votre demande...",
          products: response.products || [],
          summary: response.summary || null,
          timestamp: new Date().toISOString(),
          mode: response.intent === "product_show" ? "product_show" : "conversation",
          sector: response.sector as SectorType || "meubles",
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Désolé, une erreur technique est survenue. Pouvez-vous reformuler votre question ?",
          timestamp: new Date().toISOString(),
        },
      ]);
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

  // ✅ Ajouter une fonction pour réinitialiser la conversation
  const handleResetChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Bonjour 👋 Je suis OmnIA, votre assistant shopping. Que puis-je vous aider à trouver aujourd'hui ?",
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* HEADER avec bouton reset */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md">
                <Bot className="w-7 h-7 text-blue-600" />
              </div>
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full" />
            </div>
            <div>
              <h2 className="text-xl font-bold">OmnIA Shopping</h2>
              <p className="text-sm text-blue-100">Assistant IA intelligent</p>
            </div>
          </div>
          <button
            onClick={handleResetChat}
            className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition"
          >
            Nouvelle discussion
          </button>
        </div>
      </div>

      {/* MESSAGES - Améliorations d'affichage */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => {
          const SectorIcon = msg.sector ? sectorIcons[msg.sector as SectorType] : null;
          return (
            <div key={i}>
              <div
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[75%] ${
                    msg.role === "user" ? "order-2" : ""
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 shadow ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                        {msg.mode === "product_show" ? (
                          <>
                            <Package className="w-3 h-3 text-purple-500" />
                            <span>Résultats produits</span>
                            {SectorIcon && <SectorIcon className="w-3 h-3 ml-1" />}
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-3 h-3 text-blue-500" />
                            <span>Discussion</span>
                          </>
                        )}
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {msg.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {msg.products && msg.products.length > 0 && (
                <div className="ml-12 mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {msg.products.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onViewDetails={() => {
                        setSelectedProduct(p);
                        setShowProductLanding(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 items-center text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            L'assistant réfléchit...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT - Améliorations UX */}
      <div className="border-t bg-white px-6 py-4">
        <div className="flex gap-3 items-end">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Décrivez ce que vous cherchez (ex: canapé bleu en promotion)..."
            disabled={loading}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 transition"
            autoFocus
          />
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            <span className="hidden sm:inline">Envoyer</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Exemples: "table basse bois", "montre élégante", "robe été promotion"
        </p>
      </div>

      {/* MODAL PRODUIT */}
      {showProductLanding && selectedProduct && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <ProductLandingPage
            product={selectedProduct}
            onClose={() => {
              setShowProductLanding(false);
              setSelectedProduct(null);
            }}
          />
        </div>
      )}
    </div>
  );
}

// ✅ Product Card améliorée
function ProductCard({ product, onViewDetails }: any) {
  const hasPromo = product.compare_at_price && 
                  Number(product.compare_at_price) > Number(product.price);

  return (
    <div
      onClick={onViewDetails}
      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md cursor-pointer transition-all duration-300 hover:scale-[1.02] group"
    >
      <div className="relative w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden rounded-t-xl">
        <img
          src={product.image_url || "/placeholder-product.jpg"}
          alt={product.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
          }}
        />
        {hasPromo && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            -{Math.round(100 - (Number(product.price) / Number(product.compare_at_price)) * 100)}%
          </div>
        )}
      </div>
      <div className="p-3">
        <h5 className="font-semibold text-sm text-gray-800 line-clamp-2 mb-2">
          {product.title}
        </h5>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(Number(product.price), product.currency || "EUR")}
          </span>
          {hasPromo && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(Number(product.compare_at_price), product.currency || "EUR")}
            </span>
          )}
        </div>
        <button className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition">
          Voir détails
        </button>
      </div>
    </div>
  );
}