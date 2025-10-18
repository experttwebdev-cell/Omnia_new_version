import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  Code,
  Copy,
  Check,
  MessageCircle,
  Search as SearchIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  getChatSettings,
  saveChatSettings,
  clearAllConversations,
  type ChatSettings as ChatSettingsType
} from '../lib/chatHistory';

interface StoreSettings {
  chat_enabled: boolean;
  chat_welcome_message: string;
  chat_tone: string;
  chat_response_length: string;
}

export function ChatSettings() {
  const [settings, setSettings] = useState<ChatSettingsType>(getChatSettings());
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    chat_enabled: true,
    chat_welcome_message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    chat_tone: 'amical',
    chat_response_length: 'equilibre'
  });
  const [storeId, setStoreId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [copiedChat, setCopiedChat] = useState(false);
  const [copiedSearch, setCopiedSearch] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    try {
      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id, chat_enabled, chat_welcome_message, chat_tone, chat_response_length')
        .limit(1);

      if (stores && stores.length > 0) {
        setStoreId(stores[0].id);
        setStoreSettings({
          chat_enabled: stores[0].chat_enabled ?? true,
          chat_welcome_message: stores[0].chat_welcome_message ?? 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
          chat_tone: stores[0].chat_tone ?? 'amical',
          chat_response_length: stores[0].chat_response_length ?? 'equilibre'
        });
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    saveChatSettings(settings);

    if (storeId) {
      try {
        await supabase
          .from('shopify_stores')
          .update(storeSettings)
          .eq('id', storeId);
      } catch (error) {
        console.error('Error saving store settings:', error);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    const defaultSettings: ChatSettingsType = {
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 4000,
      language: 'fr',
      autoSave: true,
      showTimestamps: false,
      theme: 'auto'
    };
    setSettings(defaultSettings);

    setStoreSettings({
      chat_enabled: true,
      chat_welcome_message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
      chat_tone: 'amical',
      chat_response_length: 'equilibre'
    });
  };

  const handleClearHistory = async () => {
    if (confirm('⚠️ Supprimer TOUT l\'historique des conversations ? Cette action est irréversible.')) {
      setClearing(true);
      await clearAllConversations();
      setClearing(false);
      alert('Historique supprimé avec succès');
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify({ ...settings, ...storeSettings }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string);
            if (imported.model) setSettings(imported);
            if (imported.chat_enabled !== undefined) {
              const { chat_enabled, chat_welcome_message, chat_tone, chat_response_length } = imported;
              setStoreSettings({ chat_enabled, chat_welcome_message, chat_tone, chat_response_length });
            }
            alert('Paramètres importés avec succès');
          } catch (error) {
            alert('Erreur lors de l\'importation des paramètres');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const getChatEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<!-- OmnIA Chat Widget -->
<script>
  (function() {
    const iframe = document.createElement('iframe');
    iframe.src = '${baseUrl}/embed/chat';
    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:400px;height:600px;border:none;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);z-index:9999;';
    document.body.appendChild(iframe);
  })();
</script>`;
  };

  const getSearchEmbedCode = () => {
    const baseUrl = window.location.origin;
    return `<!-- OmnIA Product Search Widget -->
<div id="omnia-search-widget"></div>
<script>
  (function() {
    const container = document.getElementById('omnia-search-widget');
    if (container) {
      const iframe = document.createElement('iframe');
      iframe.src = '${baseUrl}/embed/search';
      iframe.style.cssText = 'width:100%;height:80px;border:none;';
      container.appendChild(iframe);
    }
  })();
</script>`;
  };

  const copyToClipboard = async (text: string, type: 'chat' | 'search') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'chat') {
        setCopiedChat(true);
        setTimeout(() => setCopiedChat(false), 2000);
      } else {
        setCopiedSearch(true);
        setTimeout(() => setCopiedSearch(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Paramètres du Chat IA</h2>
        </div>
        <p className="text-sm text-gray-600">
          Personnalisez le comportement et le style de votre assistant conversationnel
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Paramètres d'Interface Utilisateur */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface du Chat</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Activer le chat IA</p>
                  <p className="text-xs text-gray-500">Afficher le widget de chat sur votre site</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeSettings.chat_enabled}
                    onChange={(e) => setStoreSettings({ ...storeSettings, chat_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message d'accueil
                </label>
                <input
                  type="text"
                  value={storeSettings.chat_welcome_message}
                  onChange={(e) => setStoreSettings({ ...storeSettings, chat_welcome_message: e.target.value })}
                  placeholder="Bonjour ! ça va ?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Premier message affiché aux visiteurs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ton de conversation
                </label>
                <select
                  value={storeSettings.chat_tone}
                  onChange={(e) => setStoreSettings({ ...storeSettings, chat_tone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="amical">Amical</option>
                  <option value="professionnel">Professionnel</option>
                  <option value="decontracte">Décontracté</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {storeSettings.chat_tone === 'amical' && 'Ton chaleureux et accessible, équilibré'}
                  {storeSettings.chat_tone === 'professionnel' && 'Formel et respectueux, adapté au B2B'}
                  {storeSettings.chat_tone === 'decontracte' && 'Informel et décontracté, proche des clients'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur des réponses
                </label>
                <select
                  value={storeSettings.chat_response_length}
                  onChange={(e) => setStoreSettings({ ...storeSettings, chat_response_length: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="court">Court (10-20 mots)</option>
                  <option value="equilibre">Équilibré (20-40 mots)</option>
                  <option value="detaille">Détaillé (40-80 mots)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {storeSettings.chat_response_length === 'court' && 'Réponses courtes et concises'}
                  {storeSettings.chat_response_length === 'equilibre' && 'Réponses équilibrées avec contexte'}
                  {storeSettings.chat_response_length === 'detaille' && 'Réponses détaillées et complètes'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Codes d'intégration Shopify */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Intégration Shopify</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copiez ces codes pour intégrer les widgets sur votre boutique Shopify
            </p>

            <div className="space-y-4">
              {/* Code Chat Widget */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    Widget Chat IA
                  </label>
                </div>
                <div className="relative">
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                    <code>{getChatEmbedCode()}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(getChatEmbedCode(), 'chat')}
                    className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title="Copier le code"
                  >
                    {copiedChat ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  À ajouter dans le fichier <code className="bg-gray-100 px-1 rounded">theme.liquid</code> avant la balise <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code>
                </p>
              </div>

              {/* Code Search Widget */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <SearchIcon className="w-4 h-4 text-blue-600" />
                  <label className="block text-sm font-medium text-gray-700">
                    Widget Recherche Produits
                  </label>
                </div>
                <div className="relative">
                  <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs overflow-x-auto">
                    <code>{getSearchEmbedCode()}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(getSearchEmbedCode(), 'search')}
                    className="absolute top-2 right-2 p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    title="Copier le code"
                  >
                    {copiedSearch ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  À ajouter dans le fichier <code className="bg-gray-100 px-1 rounded">header.liquid</code> ou <code className="bg-gray-100 px-1 rounded">theme.liquid</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Paramètres Techniques */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modèle AI</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modèle
                </label>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="deepseek-chat">DeepSeek Chat (Recommandé)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4">GPT-4</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  DeepSeek offre le meilleur rapport qualité/prix
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Température: {settings.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Plus précis</span>
                  <span>Plus créatif</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tokens maximum
                </label>
                <input
                  type="number"
                  min="1000"
                  max="8000"
                  step="500"
                  value={settings.maxTokens}
                  onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Longueur maximale des réponses
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Préférences</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Langue
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thème
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="auto">Automatique</option>
                  <option value="light">Clair</option>
                  <option value="dark">Sombre</option>
                </select>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Sauvegarde automatique</p>
                  <p className="text-xs text-gray-500">Sauvegarder les conversations automatiquement</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Afficher les horodatages</p>
                  <p className="text-xs text-gray-500">Afficher l'heure des messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showTimestamps}
                    onChange={(e) => setSettings({ ...settings, showTimestamps: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleExportSettings}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
                <button
                  onClick={handleImportSettings}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser
              </button>

              <button
                onClick={handleClearHistory}
                disabled={clearing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Suppression...' : 'Supprimer l\'historique'}
              </button>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Attention</p>
                  <p>La suppression de l'historique est définitive et ne peut pas être annulée.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleSave}
          disabled={saved}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              Enregistré !
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Enregistrer les paramètres
            </>
          )}
        </button>
      </div>
    </div>
  );
}
