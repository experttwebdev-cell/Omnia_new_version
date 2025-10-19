import { useState, createContext, useContext, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { EnhancedProductList } from './components/EnhancedProductList';
import { StoreManager } from './components/StoreManager';
import { ProductDetail } from './components/ProductDetail';
import { SeoOptimization } from './components/SeoOptimization';
import { SeoAltImage } from './components/SeoAltImage';
import { SeoTag } from './components/SeoTag';
import { SeoOpportunities } from './components/SeoOpportunities';
import { BlogArticles } from './components/BlogArticles';
import { AiBlogWriter } from './components/AiBlogWriter';
import { AiCampaigns } from './components/AiCampaigns';
import { GoogleShopping } from './components/GoogleShopping';
import { Settings as SettingsComponent } from './components/Settings';
import { AiChat } from './components/AiChat';
import { ChatHistory } from './components/ChatHistory';
import { ChatSettings } from './components/ChatSettings';
import { ProductSearch } from './components/ProductSearch';
import { OmniaChat } from './components/OmniaChat';
import { CartProvider } from './lib/cartContext';
import { CacheProvider } from './lib/cache';
import { Language, getTranslation, type Translations } from './lib/translations';
import { supabase, getEnvVar } from './lib/supabase';
import {
  LayoutDashboard,
  Package,
  Store,
  ShoppingBag,
  Menu,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Tag as TagIcon,
  Lightbulb,
  BookOpen,
  Sparkles,
  Settings,
  MessageCircle,
  History,
  Settings as SettingsIcon
} from 'lucide-react';

type ViewType = 'dashboard' | 'products' | 'stores' | 'google-shopping' | 'product-search' | 'seo-optimization' | 'seo-alt-image' | 'seo-tags' | 'seo-opportunities' | 'seo-articles' | 'seo-ai-blog' | 'seo-ai-campaigns' | 'ai-chat' | 'ai-chat-history' | 'ai-chat-settings' | 'omniachat' | 'settings';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

function App() {
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(true);
  const [aiChatExpanded, setAiChatExpanded] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const [configError, setConfigError] = useState(false);
  const t = getTranslation(language);

  useEffect(() => {
    const checkConfig = () => {
      const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
      const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

      const isValid = supabaseUrl &&
        supabaseAnonKey &&
        supabaseUrl.trim() !== '' &&
        supabaseAnonKey.trim() !== '' &&
        supabaseUrl !== 'https://placeholder.supabase.co' &&
        supabaseAnonKey !== 'placeholder-key';

      if (!isValid) {
        console.error('Configuration check failed:', {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey,
          urlValue: supabaseUrl || 'undefined',
          isPlaceholder: supabaseUrl === 'https://placeholder.supabase.co'
        });
      }

      return isValid;
    };

    if (!checkConfig()) {
      setConfigError(true);
      setLanguageLoaded(true);
      return;
    }

    const loadLanguage = async () => {
      try {
        const { data: stores } = await supabase
          .from('shopify_stores')
          .select('language')
          .limit(1)
          .maybeSingle();

        if (stores && 'language' in stores && stores.language) {
          setLanguage(stores.language as Language);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setLanguageLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const handleLanguageChange = async (newLanguage: Language) => {
    setLanguage(newLanguage);
    try {
      const { data: stores } = await supabase
        .from('shopify_stores')
        .select('id')
        .limit(1);

      if (stores && Array.isArray(stores) && stores.length > 0 && 'id' in stores[0]) {
        await supabase
          .from('shopify_stores')
          .update({ language: newLanguage })
          .eq('id', stores[0].id);
      }
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const handleImportComplete = () => {
    setRefreshKey(prev => prev + 1);
    setActiveView('products');
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
  };

  const navigation = [
    { id: 'dashboard' as ViewType, name: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'products' as ViewType, name: t.nav.products, icon: Package },
    { id: 'product-search' as ViewType, name: 'Recherche Produits', icon: Search },
    { id: 'omniachat' as ViewType, name: 'OmniaChat', icon: Sparkles },
    { id: 'stores' as ViewType, name: t.nav.stores, icon: Store },
    { id: 'google-shopping' as ViewType, name: 'Google Shopping', icon: ShoppingBag },
  ];

  const seoSubItems = [
    { id: 'seo-optimization' as ViewType, name: t.nav.seoOptimization, icon: FileText },
    { id: 'seo-alt-image' as ViewType, name: t.nav.seoAltImage, icon: ImageIcon },
    { id: 'seo-tags' as ViewType, name: t.nav.seoTags, icon: TagIcon },
    { id: 'seo-opportunities' as ViewType, name: t.nav.seoOpportunities, icon: Lightbulb },
    { id: 'seo-articles' as ViewType, name: t.nav.blogArticles, icon: BookOpen },
    { id: 'seo-ai-blog' as ViewType, name: t.nav.aiBlog, icon: Sparkles },
    { id: 'seo-ai-campaigns' as ViewType, name: 'AI Campaigns', icon: Sparkles },
  ];

  const aiChatSubItems = [
    { id: 'ai-chat' as ViewType, name: 'Chat', icon: MessageCircle },
    { id: 'ai-chat-history' as ViewType, name: 'Historique', icon: History },
    { id: 'ai-chat-settings' as ViewType, name: 'Paramètres', icon: SettingsIcon },
  ];

  const isSeoView = activeView.startsWith('seo-');
  const isAiChatView = activeView.startsWith('ai-chat');

  if (!languageLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleLanguageChange, t }}>
    <CartProvider>
    <CacheProvider>
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 px-4 py-3 flex items-center justify-between z-40 shadow-md" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-white/20 rounded-lg">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-base">Product Catalogue</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 z-40 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-white text-lg">Product Catalogue</h1>
          </div>
        </div>

        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            );
          })}

          <div className="mt-2">
            <button
              onClick={() => setSeoExpanded(!seoExpanded)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition ${
                isSeoView
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5" />
                <span className="font-medium">{t.nav.seo}</span>
              </div>
              {seoExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {seoExpanded && (
              <div className="mt-1 space-y-1">
                {seoSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg transition text-sm ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-2">
            <button
              onClick={() => setAiChatExpanded(!aiChatExpanded)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition ${
                isAiChatView
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">AI Chat</span>
              </div>
              {aiChatExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {aiChatExpanded && (
              <div className="mt-1 space-y-1">
                {aiChatSubItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveView(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg transition text-sm ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              setActiveView('settings');
              setSidebarOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeView === 'settings'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">{t.nav.settings}</span>
          </button>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8 mt-16 lg:mt-0">
          {activeView === 'dashboard' && <Dashboard key={refreshKey} onProductSelect={handleProductSelect} />}
          {activeView === 'products' && (
            <EnhancedProductList key={refreshKey} onProductSelect={handleProductSelect} />
          )}
          {activeView === 'product-search' && <ProductSearch />}
          {activeView === 'omniachat' && <OmniaChat />}
          {activeView === 'stores' && <StoreManager onImportStart={handleImportComplete} />}
          {activeView === 'google-shopping' && <GoogleShopping />}
          {activeView === 'seo-optimization' && <SeoOptimization />}
          {activeView === 'seo-alt-image' && <SeoAltImage />}
          {activeView === 'seo-tags' && <SeoTag />}
          {activeView === 'seo-opportunities' && <SeoOpportunities />}
          {activeView === 'seo-articles' && <BlogArticles />}
          {activeView === 'seo-ai-blog' && <AiBlogWriter onNavigateToCampaigns={() => setActiveView('seo-ai-campaigns')} />}
          {activeView === 'seo-ai-campaigns' && <AiCampaigns />}
          {activeView === 'ai-chat' && <AiChat />}
          {activeView === 'ai-chat-history' && (
            <div className="h-[calc(100vh-150px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <ChatHistory
                onSelectConversation={(conv) => setActiveView('ai-chat')}
                currentConversationId={undefined}
              />
            </div>
          )}
          {activeView === 'ai-chat-settings' && (
            <div className="h-[calc(100vh-150px)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              <ChatSettings />
            </div>
          )}
          {activeView === 'settings' && <SettingsComponent />}
        </div>
      </main>

      {selectedProductId && (
        <ProductDetail
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}
    </div>
    </CacheProvider>
    </CartProvider>
    </LanguageContext.Provider>
  );
}

export default App;
