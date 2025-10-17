import { useState, useEffect, useRef } from "react";
import { Send, Bot, Loader2, Package, MessageCircle, Sparkles } from "lucide-react";
import { OmnIAChat } from "../lib/omniaChat";

export function AiChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => scrollToBottom(), [messages]);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;
    const msg = { role: "user", content: inputMessage, timestamp: new Date().toISOString() };
    setMessages((m) => [...m, msg]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await OmnIAChat(inputMessage);
      const ai = {
        role: "assistant",
        content: response.response,
        products: response.products,
        summary: response.summary,
        intent: response.intent,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, ai]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Erreur technique. Réessayez.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: any) => e.key === "Enter" && handleSendMessage();

  return (
    <div className="h-[80vh] flex flex-col bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} mb-3`}>
            <div
              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                m.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
              }`}
            >
              {m.role === "assistant" && (
                <div className="text-xs mb-1 flex items-center gap-2 text-gray-500">
                  {m.intent === "conversation" && <MessageCircle className="w-3 h-3" />}
                  {m.intent === "product_chat" && <Sparkles className="w-3 h-3" />}
                  {m.intent === "product_show" && <Package className="w-3 h-3" />}
                  <span>
                    {m.intent === "conversation"
                      ? "Discussion"
                      : m.intent === "product_chat"
                      ? "Précision du besoin"
                      : "Résultats produits"}
                  </span>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 items-center text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> OmnIA réfléchit...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-200 flex gap-2">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Écrivez votre message..."
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:ring focus:ring-blue-300 outline-none"
        />
        <button
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
