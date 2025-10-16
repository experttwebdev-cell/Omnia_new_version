import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, RefreshCw, Globe, Activity, MessageSquare } from 'lucide-react';
import { Language } from '../lib/translations';
import { LoadingAnimation } from './LoadingAnimation';
import { useLanguage } from '../App';
import { ConnectionDiagnostics } from './ConnectionDiagnostics';

interface SettingsData {
  enrichment_mode: 'manual' | 'auto';
  enrichment_frequency: 'on_import' | 'daily' | 'weekly' | 'manual';
  chat_welcome_message: string;
  chat_tone: 'professional' | 'friendly' | 'enthusiastic' | 'casual';
  chat_response_length: 'concise' | 'balanced' | 'detailed';
  chat_enabled: boolean;
}

export function Settings() {
  const { language, setLanguage, t } = useLanguage();
  const [settings, setSettings] = useState<SettingsData>({
    enrichment_mode: 'manual',
    enrichment_frequency: 'manual',
    chat_welcome_message: 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
    chat_tone: 'friendly',
    chat_response_length: 'balanced',
    chat_enabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('enrichment_mode, enrichment_frequency, chat_welcome_message, chat_tone, chat_response_length, chat_enabled')
        .limit(1)
        .maybeSingle();

      if (stores) {
        setSettings({
          enrichment_mode: stores.enrichment_mode as 'manual' | 'auto',
          enrichment_frequency: stores.enrichment_frequency as 'on_import' | 'daily' | 'weekly' | 'manual',
          chat_welcome_message: stores.chat_welcome_message || 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?',
          chat_tone: (stores.chat_tone as any) || 'friendly',
          chat_response_length: (stores.chat_response_length as any) || 'balanced',
          chat_enabled: stores.chat_enabled !== false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1);

      if (stores && stores.length > 0) {
        const { error } = await supabase
          .from('shopify_stores')
          .update({
            enrichment_mode: settings.enrichment_mode,
            enrichment_frequency: settings.enrichment_frequency,
            chat_welcome_message: settings.chat_welcome_message,
            chat_tone: settings.chat_tone,
            chat_response_length: settings.chat_response_length,
            chat_enabled: settings.chat_enabled
          })
          .eq('id', stores[0].id);

        if (error) throw error;

        setMessage(t.settings.settingsSaved);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(t.settings.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingAnimation type="settings" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-800">{t.settings.title}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">{t.settings.language}</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Select your preferred language for the application interface
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.settings.selectLanguage}
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="fr">🇫🇷 Français</option>
            <option value="en">🇬🇧 English</option>
            <option value="es">🇪🇸 Español</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="it">🇮🇹 Italiano</option>
            <option value="pt">🇵🇹 Português</option>
            <option value="nl">🇳🇱 Nederlands</option>
            <option value="ru">🇷🇺 Русский</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ja">🇯🇵 日本語</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t.settings.enrichmentSettings}
        </h2>
        <p className="text-gray-600 mb-6">
          Configure automatic product enrichment
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.settings.enrichmentMode}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="enrichment_mode"
                  value="manual"
                  checked={settings.enrichment_mode === 'manual'}
                  onChange={(e) => setSettings({ ...settings, enrichment_mode: e.target.value as 'manual' | 'auto' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{t.settings.manual}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="enrichment_mode"
                  value="auto"
                  checked={settings.enrichment_mode === 'auto'}
                  onChange={(e) => setSettings({ ...settings, enrichment_mode: e.target.value as 'manual' | 'auto' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-gray-700">{t.settings.automatic}</span>
              </label>
            </div>
          </div>

          {settings.enrichment_mode === 'auto' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.settings.frequency}
              </label>
              <select
                value={settings.enrichment_frequency}
                onChange={(e) => setSettings({ ...settings, enrichment_frequency: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="manual">{t.settings.manual}</option>
                <option value="on_import">{t.settings.onImport}</option>
                <option value="daily">{t.settings.daily}</option>
                <option value="weekly">{t.settings.weekly}</option>
              </select>
              <p className="text-sm text-gray-500 mt-2">
                {settings.enrichment_frequency === 'on_import' && 'Products will be enriched automatically upon import'}
                {settings.enrichment_frequency === 'daily' && 'New products will be enriched once per day'}
                {settings.enrichment_frequency === 'weekly' && 'New products will be enriched once per week'}
                {settings.enrichment_frequency === 'manual' && 'You will need to manually enrich products'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Paramètres du Chat IA</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Personnalisez le comportement et le style de votre assistant conversationnel
        </p>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input
                type="checkbox"
                checked={settings.chat_enabled}
                onChange={(e) => setSettings({ ...settings, chat_enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Activer le chat IA</span>
            </label>
          </div>

          {settings.chat_enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message d'accueil
                </label>
                <textarea
                  value={settings.chat_welcome_message}
                  onChange={(e) => setSettings({ ...settings, chat_welcome_message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Bonjour ! Comment puis-je vous aider aujourd'hui ?"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Premier message affiché aux visiteurs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ton de conversation
                </label>
                <select
                  value={settings.chat_tone}
                  onChange={(e) => setSettings({ ...settings, chat_tone: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="professional">Professionnel</option>
                  <option value="friendly">Amical</option>
                  <option value="enthusiastic">Enthousiaste</option>
                  <option value="casual">Décontracté</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.chat_tone === 'professional' && 'Ton formel et expert, adapté aux ventes B2B'}
                  {settings.chat_tone === 'friendly' && 'Ton chaleureux et accessible, équilibré'}
                  {settings.chat_tone === 'enthusiastic' && 'Ton dynamique et engageant, très expressif'}
                  {settings.chat_tone === 'casual' && 'Ton décontracté et proche, style conversationnel'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longueur des réponses
                </label>
                <select
                  value={settings.chat_response_length}
                  onChange={(e) => setSettings({ ...settings, chat_response_length: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="concise">Concis (10-20 mots)</option>
                  <option value="balanced">Équilibré (20-40 mots)</option>
                  <option value="detailed">Détaillé (40-80 mots)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {settings.chat_response_length === 'concise' && 'Réponses courtes et directes, idéal pour mobile'}
                  {settings.chat_response_length === 'balanced' && 'Réponses équilibrées avec contexte'}
                  {settings.chat_response_length === 'detailed' && 'Réponses complètes et descriptives'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {t.settings.saving}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t.settings.saveSettings}
            </>
          )}
        </button>

        {message && (
          <span className={`text-sm ${message.includes('succès') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-800">Database Connection</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Test your Supabase database connection and diagnose any configuration issues.
        </p>
        <button
          onClick={() => setShowDiagnostics(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          <Activity className="w-4 h-4" />
          Run Connection Diagnostics
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {t.settings.aboutEnrichment}
        </h2>
        <div className="space-y-3 text-gray-600">
          <p>
            L'enrichissement automatique utilise l'intelligence artificielle pour analyser vos produits et générer automatiquement:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Des titres SEO optimisés</li>
            <li>Des descriptions méta pertinentes</li>
            <li>Des textes alternatifs pour les images</li>
            <li>Des tags et catégories appropriées</li>
            <li>Des analyses de couleur et de matériel</li>
          </ul>
          <p className="mt-4">
            Lorsque le mode automatique est activé, le système enrichira les produits selon la fréquence que vous avez choisie.
          </p>
        </div>
      </div>

      {showDiagnostics && (
        <ConnectionDiagnostics onClose={() => setShowDiagnostics(false)} />
      )}
    </div>
  );
}
