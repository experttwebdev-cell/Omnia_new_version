import { useState, useEffect } from 'react';
import { supabase, getEnvVar } from '../lib/supabase';
import {
  Store as StoreIcon,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Download,
  Settings,
  Clock,
  ChevronDown,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import type { Database } from '../lib/database.types';
import { ShopifyConnectionGuide } from './ShopifyConnectionGuide';
import { ConfirmDialog } from './ConfirmDialog';

type ShopifyStore = Database['public']['Tables']['shopify_stores']['Row'];

interface StoreManagerProps {
  onImportStart?: (storeId: string, storeName: string) => void;
}

export function StoreManager({ onImportStart }: StoreManagerProps) {
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    apiToken: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [importingStoreId, setImportingStoreId] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState<{ store: string; message: string; percent: number } | null>(null);
  const [editingSyncStoreId, setEditingSyncStoreId] = useState<string | null>(null);
  const [editingEnrichmentStoreId, setEditingEnrichmentStoreId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [syncSettings, setSyncSettings] = useState({
    sync_mode: 'manual' as 'manual' | 'auto',
    sync_frequency: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    sync_hour: 0,
    sync_day: 0,
    sync_date: 1
  });
  const [enrichmentSettings, setEnrichmentSettings] = useState({
    enrichment_mode: 'manual' as 'manual' | 'auto',
    enrichment_frequency: 'manual' as 'on_import' | 'daily' | 'weekly' | 'manual',
    auto_enrich_new_products: false,
    auto_sync_seo_to_shopify: false
  });

  const fetchStores = async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('shopify_stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setStores(data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      let cleanStoreName = formData.storeName.trim();

      cleanStoreName = cleanStoreName.replace(/^https?:\/\//, '');
      cleanStoreName = cleanStoreName.replace('.myshopify.com', '');
      cleanStoreName = cleanStoreName.replace(/\/$/, '');

      if (!cleanStoreName) {
        throw new Error('Please enter a valid store name');
      }

      if (!/^[a-zA-Z0-9-]+$/.test(cleanStoreName)) {
        throw new Error('Store name can only contain letters, numbers, and hyphens');
      }

      const storeUrl = `https://${cleanStoreName}.myshopify.com`;

      const { error: insertError } = await supabase
        .from('shopify_stores')
        .insert({
          store_name: cleanStoreName,
          store_url: storeUrl,
          api_token: formData.apiToken.trim(),
          is_active: true
        });

      if (insertError) throw insertError;

      setFormData({ storeName: '', apiToken: '' });
      setShowAddForm(false);
      await fetchStores();
    } catch (err) {
      console.error('Error adding store:', err);
      setError(err instanceof Error ? err.message : 'Failed to add store');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Store',
      message: 'Are you sure you want to delete this store connection?',
      type: 'danger',
      onConfirm: () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        executeDeleteStore(storeId);
      },
    });
  };

  const executeDeleteStore = async (storeId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('shopify_stores')
        .delete()
        .eq('id', storeId);

      if (deleteError) throw deleteError;

      await fetchStores();
    } catch (err) {
      console.error('Error deleting store:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete store');
    }
  };

  const handleToggleActive = async (storeId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update({ is_active: !currentStatus })
        .eq('id', storeId);

      if (updateError) throw updateError;

      await fetchStores();
    } catch (err) {
      console.error('Error updating store:', err);
      setError(err instanceof Error ? err.message : 'Failed to update store');
    }
  };

  const handleOpenSyncSettings = (store: ShopifyStore) => {
    setEditingSyncStoreId(store.id);
    setSyncSettings({
      sync_mode: (store.sync_mode as 'manual' | 'auto') || 'manual',
      sync_frequency: (store.sync_frequency as 'hourly' | 'daily' | 'weekly' | 'monthly') || 'daily',
      sync_hour: store.sync_hour || 0,
      sync_day: store.sync_day || 0,
      sync_date: store.sync_date || 1
    });
  };

  const handleOpenEnrichmentSettings = (store: ShopifyStore) => {
    setEditingEnrichmentStoreId(store.id);
    setEnrichmentSettings({
      enrichment_mode: (store.enrichment_mode as 'manual' | 'auto') || 'manual',
      enrichment_frequency: (store.enrichment_frequency as 'on_import' | 'daily' | 'weekly' | 'manual') || 'manual',
      auto_enrich_new_products: store.auto_enrich_new_products || false,
      auto_sync_seo_to_shopify: store.auto_sync_seo_to_shopify || false
    });
  };

  const handleSaveEnrichmentSettings = async (storeId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update(enrichmentSettings)
        .eq('id', storeId);

      if (updateError) throw updateError;

      setEditingEnrichmentStoreId(null);
      await fetchStores();
    } catch (err) {
      console.error('Error updating enrichment settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update enrichment settings');
    }
  };

  const handleSaveSyncSettings = async (storeId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('shopify_stores')
        .update(syncSettings)
        .eq('id', storeId);

      if (updateError) throw updateError;

      setEditingSyncStoreId(null);
      await fetchStores();
    } catch (err) {
      console.error('Error updating sync settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to update sync settings');
    }
  };

  const handleImportProducts = async (store: ShopifyStore) => {
    setImportingStoreId(store.id);
    setError('');
    setImportProgress({
      store: store.store_name,
      message: 'Connecting to Shopify...',
      percent: 0
    });

    try {
      const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
      const apiUrl = `${supabaseUrl}/functions/v1/import-shopify-products`;

      setImportProgress({
        store: store.store_name,
        message: 'Fetching products from Shopify...',
        percent: 20
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getEnvVar('VITE_SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          shopName: store.store_name,
          apiToken: store.api_token,
          storeId: store.id
        }),
      });

      setImportProgress({
        store: store.store_name,
        message: 'Processing products...',
        percent: 60
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setImportProgress({
        store: store.store_name,
        message: 'Finalizing import...',
        percent: 90
      });

      await supabase
        .from('shopify_stores')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', store.id);

      setImportProgress({
        store: store.store_name,
        message: 'Import completed successfully!',
        percent: 100
      });

      setTimeout(() => {
        setImportProgress(null);
      }, 2000);

      await fetchStores();

      if (onImportStart) {
        onImportStart(store.id, store.store_name);
      }
    } catch (err) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to import products');
      setImportProgress(null);
    } finally {
      setImportingStoreId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg p-12 text-center border border-blue-100">
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute inset-2 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-t-blue-500 border-r-cyan-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <StoreIcon className="w-12 h-12 text-blue-600 animate-pulse" />
              <Sparkles className="w-5 h-5 text-cyan-500 absolute -top-1 -right-1 animate-ping" />
            </div>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">Chargement des magasins</h3>
        <p className="text-base text-gray-600 mb-6">Récupération des données en cours...</p>
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
    <>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
      <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Store Connections</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
          >
            <HelpCircle className="w-5 h-5" />
            Connection Guide
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium rounded-lg transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add Store
          </button>
        </div>
      </div>

      {showGuide && (
        <div className="mb-6">
          <ShopifyConnectionGuide />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {importProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-blue-900">Importing from {importProgress.store}</h3>
              <p className="text-sm text-blue-700 mt-1">{importProgress.message}</p>
            </div>
            <span className="text-2xl font-bold text-blue-900">{importProgress.percent}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${importProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Add New Store</h2>
          <form onSubmit={handleAddStore} className="space-y-4">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="mystore or mystore.myshopify.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                disabled={submitting}
              />
            </div>

            <div>
              <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-1">
                API Access Token
              </label>
              <input
                type="password"
                id="apiToken"
                value={formData.apiToken}
                onChange={(e) => setFormData({ ...formData, apiToken: e.target.value })}
                placeholder="shpat_xxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                required
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Adding...' : 'Add Store'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ storeName: '', apiToken: '' });
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {stores.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <StoreIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1 font-medium">No stores connected</p>
            <p className="text-sm text-gray-500">Add your first Shopify store to get started</p>
          </div>
        ) : (
          stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`p-3 rounded-lg ${store.is_active ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <StoreIcon className={`w-6 h-6 ${store.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{store.store_name}</h3>
                      {store.is_active ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                          <XCircle className="w-3 h-3" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{store.store_url}</p>
                    {store.last_sync_at && (
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(store.last_sync_at).toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        store.sync_mode === 'auto'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {store.sync_mode === 'auto' ? `Auto (${store.sync_frequency})` : 'Manual'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSyncSettings(store)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title="Sync settings"
                  >
                    <Settings className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleOpenEnrichmentSettings(store)}
                    className="p-2 hover:bg-purple-50 rounded-lg transition"
                    title="AI Enrichment settings"
                  >
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </button>
                  <button
                    onClick={() => handleImportProducts(store)}
                    disabled={!store.is_active || importingStoreId === store.id}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Import products from this store"
                  >
                    {importingStoreId === store.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Import
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleActive(store.id, store.is_active)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                    title={store.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {store.is_active ? (
                      <XCircle className="w-5 h-5 text-gray-600" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Delete store"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>

              {editingSyncStoreId === store.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-800">Sync Settings</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sync Mode</label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSyncSettings({ ...syncSettings, sync_mode: 'manual' })}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                            syncSettings.sync_mode === 'manual'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Manual
                        </button>
                        <button
                          onClick={() => setSyncSettings({ ...syncSettings, sync_mode: 'auto' })}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                            syncSettings.sync_mode === 'auto'
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          Automatic
                        </button>
                      </div>
                    </div>

                    {syncSettings.sync_mode === 'auto' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                          <select
                            value={syncSettings.sync_frequency}
                            onChange={(e) => setSyncSettings({ ...syncSettings, sync_frequency: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            <option value="hourly">Every Hour</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>

                        {syncSettings.sync_frequency === 'daily' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Time of Day</label>
                            <select
                              value={syncSettings.sync_hour}
                              onChange={(e) => setSyncSettings({ ...syncSettings, sync_hour: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}:00
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {syncSettings.sync_frequency === 'weekly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                            <select
                              value={syncSettings.sync_day}
                              onChange={(e) => setSyncSettings({ ...syncSettings, sync_day: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              <option value="0">Sunday</option>
                              <option value="1">Monday</option>
                              <option value="2">Tuesday</option>
                              <option value="3">Wednesday</option>
                              <option value="4">Thursday</option>
                              <option value="5">Friday</option>
                              <option value="6">Saturday</option>
                            </select>
                          </div>
                        )}

                        {syncSettings.sync_frequency === 'monthly' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Day of Month</label>
                            <select
                              value={syncSettings.sync_date}
                              onChange={(e) => setSyncSettings({ ...syncSettings, sync_date: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                              {Array.from({ length: 31 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleSaveSyncSettings(store.id)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium py-2 px-4 rounded-lg transition shadow-lg"
                      >
                        Save Settings
                      </button>
                      <button
                        onClick={() => setEditingSyncStoreId(null)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {editingEnrichmentStoreId === store.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-800">AI Enrichment Settings</h4>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enrichment Mode</label>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setEnrichmentSettings({ ...enrichmentSettings, enrichment_mode: 'manual' })}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                              enrichmentSettings.enrichment_mode === 'manual'
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Manual
                          </button>
                          <button
                            onClick={() => setEnrichmentSettings({ ...enrichmentSettings, enrichment_mode: 'auto' })}
                            className={`flex-1 px-4 py-2 rounded-lg border-2 transition ${
                              enrichmentSettings.enrichment_mode === 'auto'
                                ? 'border-purple-600 bg-purple-50 text-purple-700'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            Auto
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enrichmentSettings.auto_enrich_new_products}
                            onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, auto_enrich_new_products: e.target.checked })}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Auto-enrich new products on import
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Automatically enrich products with AI when importing from Shopify
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enrichmentSettings.auto_sync_seo_to_shopify}
                            onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, auto_sync_seo_to_shopify: e.target.checked })}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            Auto-sync SEO data to Shopify after enrichment
                          </span>
                        </label>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Automatically push enriched SEO data back to your Shopify store
                        </p>
                      </div>

                      {enrichmentSettings.enrichment_mode === 'auto' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Enrichment Frequency</label>
                          <select
                            value={enrichmentSettings.enrichment_frequency}
                            onChange={(e) => setEnrichmentSettings({ ...enrichmentSettings, enrichment_frequency: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                          >
                            <option value="on_import">On Import Only</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="manual">Manual</option>
                          </select>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => handleSaveEnrichmentSettings(store.id)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition"
                        >
                          Save Settings
                        </button>
                        <button
                          onClick={() => setEditingEnrichmentStoreId(null)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
    </>
  );
}
