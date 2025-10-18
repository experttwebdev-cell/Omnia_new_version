import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertCircle
} from 'lucide-react';
import {
  getChatSettings,
  saveChatSettings,
  clearAllConversations,
  type ChatSettings as ChatSettingsType
} from '../lib/chatHistory';

export function ChatSettings() {
  const [settings, setSettings] = useState<ChatSettingsType>(getChatSettings());
  const [saved, setSaved] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSave = () => {
    saveChatSettings(settings);
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
    const dataStr = JSON.stringify(settings, null, 2);
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
            setSettings(imported);
            saveChatSettings(imported);
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-gray-700" />
          <h2 className="text-xl font-bold text-gray-900">Paramètres du Chat</h2>
        </div>
        <p className="text-sm text-gray-600">
          Personnalisez votre expérience de chat AI
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Gestion des données</h3>

            <div className="space-y-3">
              <button
                onClick={handleExportSettings}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Exporter les paramètres
              </button>

              <button
                onClick={handleImportSettings}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
              >
                <Upload className="w-4 h-4" />
                Importer les paramètres
              </button>

              <button
                onClick={handleClearHistory}
                disabled={clearing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                {clearing ? 'Suppression...' : 'Supprimer tout l\'historique'}
              </button>
            </div>

            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Attention</p>
                <p>La suppression de l'historique est irréversible. Exportez vos conversations importantes avant de les supprimer.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
        >
          <RefreshCw className="w-4 h-4" />
          Réinitialiser
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Save className="w-4 h-4" />
          {saved ? 'Sauvegardé !' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
