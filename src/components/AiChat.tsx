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
  Zap,
} from "lucide-react";
import { formatPrice } from "../lib/currency";
import { useLanguage } from "../App";
import { OmnIAChat } from "../lib/omniaChat";
import { ProductLandingPage } from "./ProductLandingPage";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  products?: any[];
  summary?: any;
  selectedProduct?: any;
  timestamp: string;
  mode?: "conversation" | "product_show";
  searchFilters?: any;
  sector?: string;
}

export function AiChat() {
  const {} = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [chatSettings, setChatSettings] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showProductLanding, setShowProductLanding] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionId] = useState<string>(
    () =>
      `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sectorIcons = {
    meubles: Home,
    montres: Watch,
    pret_a_porter: Shirt,
  };

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchStoreSettings = async () => {
    try {
      const { data } = await supabase
        .from("shopify_stores")
        .select(
          "id, chat_enabled, chat_welcome_message, chat_tone, chat_response_length"
        )
        .limit(1)
        .maybeSingle();

      if (data && "id" in data) {
        setChatSettings(data);
        setStoreId(data.id);
        await initializeConversation(data.id);
      }
    } catch (err) {
      console.error("Error fetching store settings:", err);
    }
  };

  const initializeConversation = async (storeId: string) => {
    try {
      const { data: conversation, error } = await supabase
        .from("chat_conversations")
        .insert({
          store_id: storeId,
          session_id: sessionId,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setConversationId(conversation.id);

      const welcomeContent =
        chatSettings?.chat_welcome_message ||
        "Bonjour ! Je suis OmnIA, votre assistant shopping intelligent. Je peux vous aider à trouver des meubles, montres ou vêtements. Que recherchez-vous aujourd'hui ?";

      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: welcomeContent,
        timestamp: new Date().toISOString(),
        sector: "meubles",
      };

      await supabase.from("chat_messages").insert({
        conversation_id: conversation.id,
        role: "assistant",
        content: welcomeContent,
        mode: "conversation",
        sector: "meubles",
      });

      setMessages([welcomeMessage]);
    } catch (err) {
      console.error("Error initializing conversation:", err);
    }
  };

  const saveMessage = async (message: ChatMessage) => {
    if (!conversationId) return;
    try {
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: message.role,
        content: message.content,
        products: message.products || [],
        summary: message.summary || null,
        mode: message.mode || "conversation",
        search_filters: message.searchFilters || null,
        sector: message.sector || null,
      });
    } catch (err) {
      console.error("Error saving message:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    await saveMessage(userMessage);

    const currentMessage = inputMessage;
    setInputMessage("");
    setLoading(true);

    try {
      const history = messages
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const settings = chatSettings
        ? {
            chat_tone: chatSettings.chat_tone,
            chat_response_length: chatSettings.chat_response_length,
          }
        : undefined;

      const response = await OmnIAChat(
        currentMessage,
        history,
        storeId || undefined,
        settings
      );

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.content,
        products: response.products || [],
        summary: response.summary || null,
        timestamp: new Date().toISOString(),
        mode: response.mode || "conversation",
        searchFilters: response.searchFilters,
        sector: response.sector,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);
    } catch (err) {
      console.error("Error sending message:", err);
      const errorText =
        err instanceof Error ? err.message : "Erreur inconnue.";
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: `Désolé, une erreur s'est produite : ${errorText}`,
        timestamp: new Date().toISOString(),
        sector: "meubles",
      };
      setMessages((prev) => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const SectorIcon = ({ sector }: { sector: string }) => {
    const IconComponent = sectorIcons[sector] || Home;
    return <IconComponent className="w-4 h-4" />;
  };

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
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
            <p className="text-sm text-blue-100">
              Assistant intelligent multi-secteurs
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message, index) => {
          const SectorIconComponent = message.sector
            ? sectorIcons[message.sector]
            : null;
          return (
            <div key={index}>
              <div
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[70%] ${
                    message.role === "user" ? "order-2" : ""
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 shadow-md ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                        : "bg-white text-gray-800 border border-gray-200"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                        {message.mode === "conversation" ? (
                          <>
                            <MessageCircle className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600">
                              Discussion
                            </span>
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600">
                              Recherche Produits
                            </span>
                            {SectorIconComponent && (
                              <div className="flex items-center gap-1 ml-2 px-2 py-1 bg-white border rounded-full">
                                <SectorIconComponent />
                                <span className="text-xs font-medium">
                                  {message.sector === "meubles"
                                    ? "Meubles"
                                    : message.sector === "montres"
                                    ? "Montres"
                                    : "Mode"}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {message.products && message.products.length > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                            {message.products.length} trouvé
                            {message.products.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {message.summary && (
                    <div className="ml-2 mt-3 flex flex-wrap items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200 rounded-lg px-4 py-2 text-sm text-gray-800 shadow-sm">
                      <span className="font-semibold text-blue-700">
                        📊 Résumé :
                      </span>
                      {message.summary.categories?.length > 0 && (
                        <span>
                          🪑 {message.summary.categories.join(", ")}
                        </span>
                      )}
                      {message.summary.styles?.length > 0 && (
                        <span>
                          🎨 {message.summary.styles.join(", ")}
                        </span>
                      )}
                      {message.summary.materials?.length > 0 && (
                        <span>
                          🧱 {message.summary.materials.join(", ")}
                        </span>
                      )}
                      {message.summary.colors?.length > 0 && (
                        <span>
                          🎨 {message.summary.colors.join(", ")}
                        </span>
                      )}
                      {message.summary.hasPromo && (
                        <span className="text-green-700 font-medium">
                          💸 Promo dispo
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {new Date(message.timestamp).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center shadow-md">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {message.products && message.products.length > 0 && (
                <div className="ml-11 mt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {message.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={() => {
                          setSelectedProduct(product);
                          setShowProductLanding(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-gray-600">
                  L'assistant réfléchit...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-105 disabled:transform-none"
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

      {showProductLanding && selectedProduct && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <ProductLandingPage
            product={selectedProduct}
            onClose={() => setShowProductLanding(false)}
          />
        </div>
      )}
    </div>
  );
}

// Product Card
function ProductCard({ product, onViewDetails }: any) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition group">
      <div
        className="relative w-full h-40 bg-gray-100 overflow-hidden cursor-pointer"
        onClick={onViewDetails}
      >
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
        {product.enrichment_status === "enriched" && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-purple-600 text-white rounded-full text-xs font-medium">
            <Sparkles className="w-3 h-3" />
            IA
          </div>
        )}
      </div>
      <div className="p-3">
        <h5
          className="font-semibold text-gray-900 mb-2 text-sm line-clamp-2 cursor-pointer"
          onClick={onViewDetails}
        >
          {product.title}
        </h5>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-blue-600">
            {formatPrice(Number(product.price), product.currency || "EUR")}
          </span>
          {product.compare_at_price &&
            Number(product.compare_at_price) > Number(product.price) && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(
                  Number(product.compare_at_price),
                  product.currency || "EUR"
                )}
              </span>
            )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewDetails}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-xs font-medium"
          >
            <Eye className="w-3 h-3" /> Voir
          </button>
          <button
            onClick={() => {
              if (product.shop_name && product.handle) {
                window.open(
                  `https://${product.shop_name}/products/${product.handle}`,
                  "_blank"
                );
              }
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition text-xs font-medium"
          >
            <ShoppingCart className="w-3 h-3" /> Acheter
          </button>
        </div>
      </div>
    </div>
  );
}
