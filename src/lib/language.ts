// Enhanced types with better organization and additional features
export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'ru' | 'zh' | 'ja';

export type SupportedLanguage = keyof typeof translations;

// Enhanced interface with better type safety and organization
export interface TranslationSection {
  [key: string]: string | TranslationSection;
}

export interface Translations {
  nav: {
    dashboard: string;
    products: string;
    stores: string;
    seo: string;
    settings: string;
    seoOptimization: string;
    seoAltImage: string;
    seoTags: string;
    seoOpportunities: string;
    blogArticles: string;
    aiBlog: string;
  };
  common: {
    loading: string;
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    view: string;
    refresh: string;
    search: string;
    filter: string;
    export: string;
    import: string;
    close: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    confirm: string;
    yes: string;
    no: string;
    retry: string;
    continue: string;
    finish: string;
  };
  dashboard: {
    title: string;
    totalProducts: string;
    aiEnriched: string;
    syncedToShopify: string;
    pendingSync: string;
    topProductTypes: string;
    recentActivity: string;
    quickStats: string;
    uniqueVendors: string;
    avgInventory: string;
    activeProducts: string;
    enrichedProducts: string;
    showAll: string;
    showLess: string;
    noEnrichedProducts: string;
    enrichedAt: string;
    performance: string;
    insights: string;
    recommendations: string;
  };
  products: {
    title: string;
    searchPlaceholder: string;
    filterBy: string;
    allCategories: string;
    enrichmentStatus: string;
    all: string;
    enriched: string;
    pending: string;
    failed: string;
    enrichAll: string;
    enriching: string;
    price: string;
    inventory: string;
    status: string;
    vendor: string;
    category: string;
    noProducts: string;
    totalProducts: string;
    enrichedProducts: string;
    syncedToShopify: string;
    pendingSync: string;
    ofTotal: string;
    selectAll: string;
    bulkActions: string;
    exportSelected: string;
    importProducts: string;
  };
  settings: {
    title: string;
    language: string;
    selectLanguage: string;
    enrichmentSettings: string;
    enrichmentMode: string;
    manual: string;
    automatic: string;
    frequency: string;
    onImport: string;
    daily: string;
    weekly: string;
    saveSettings: string;
    saving: string;
    settingsSaved: string;
    errorSaving: string;
    aboutEnrichment: string;
    account: string;
    notifications: string;
    integrations: string;
    apiKeys: string;
    preferences: string;
  };
  loading: {
    products: string;
    data: string;
    content: string;
    almostThere: string;
    pleaseWait: string;
    preparingData: string;
    processing: string;
    uploading: string;
    downloading: string;
  };
  seo: {
    opportunities: string;
    generateOpportunities: string;
    generating: string;
    categoryGuide: string;
    comparison: string;
    howTo: string;
    productSpotlight: string;
    seasonal: string;
    targetKeywords: string;
    suggestedStructure: string;
    createArticle: string;
    creating: string;
    copyTitle: string;
    score: string;
    difficulty: string;
    easy: string;
    medium: string;
    hard: string;
    allProducts: string;
    notEnriched: string;
    toSync: string;
    synced: string;
    totalProducts: string;
    optimizedProducts: string;
    allCatalog: string;
    tags: string;
    tagsNotEnriched: string;
    tagsEnriched: string;
    analysis: string;
    recommendations: string;
    metrics: string;
  };
  blog: {
    autoBlogWriter: string;
    generateMode: string;
    manualMode: string;
    automaticMode: string;
    scheduling: string;
    contentSettings: string;
    internalLinking: string;
    generateNow: string;
    saveSettings: string;
    wordCount: string;
    outputFormat: string;
    autoPublish: string;
    frequency: string;
    scheduleTime: string;
    dayOfWeek: string;
    dayOfMonth: string;
    topics: string;
    categories: string;
    tags: string;
    seoScore: string;
  };
  campaigns: {
    title: string;
    createCampaign: string;
    campaignName: string;
    description: string;
    topicNiche: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
    noCampaigns: string;
    createFirst: string;
    campaignConfig: string;
    contentEnhancement: string;
    articleParams: string;
    reviewLaunch: string;
    minWordCount: string;
    maxWordCount: string;
    writingStyle: string;
    tone: string;
    targetKeywords: string;
    addKeyword: string;
    contentStructure: string;
    language: string;
    launchCampaign: string;
    creating: string;
    campaignDetails: string;
    contentSettings: string;
    enhancementFeatures: string;
    readyToLaunch: string;
    generated: string;
    published: string;
    lastRun: string;
    nextRun: string;
    recentExecutions: string;
    articlesGenerated: string;
    pauseCampaign: string;
    resumeCampaign: string;
    runNow: string;
    stopCampaign: string;
    deleteCampaign: string;
    stopConfirm: string;
    deleteConfirm: string;
    duplicateCampaign: string;
    exportCampaign: string;
    importCampaign: string;
    status: {
      draft: string;
      active: string;
      paused: string;
      stopped: string;
      completed: string;
    };
    frequency: {
      daily: string;
      weekly: string;
      biWeekly: string;
      monthly: string;
    };
    writingStyles: {
      professional: string;
      casual: string;
      technical: string;
      conversational: string;
    };
    tones: {
      formal: string;
      informal: string;
      friendly: string;
      authoritative: string;
    };
    validation: {
      nameRequired: string;
      topicRequired: string;
      startDateRequired: string;
      minWordCount: string;
      maxWordCount: string;
      keywordsRequired: string;
    };
  };
  notifications: {
    success: string;
    error: string;
    warning: string;
    info: string;
    productEnriched: string;
    syncCompleted: string;
    syncFailed: string;
    campaignStarted: string;
    campaignPaused: string;
    articlePublished: string;
  };
}

// Enhanced deep merge function with better type safety and error handling
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (key in result && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key] as any, source[key] as any);
      } else {
        result[key] = { ...source[key] } as T[Extract<keyof T, string>];
      }
    } else if (source[key] !== undefined) {
      result[key] = source[key] as T[Extract<keyof T, string>];
    }
  }
  
  return result;
}

// Enhanced translation registry with additional features
export class TranslationRegistry {
  private static instance: TranslationRegistry;
  private currentLanguage: Language = 'en';
  private listeners: Array<(lang: Language) => void> = [];

  private constructor() {}

  static getInstance(): TranslationRegistry {
    if (!TranslationRegistry.instance) {
      TranslationRegistry.instance = new TranslationRegistry();
    }
    return TranslationRegistry.instance;
  }

  setLanguage(lang: Language): void {
    this.currentLanguage = lang;
    this.notifyListeners(lang);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', lang);
    }
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  subscribe(listener: (lang: Language) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(lang: Language): void {
    this.listeners.forEach(listener => listener(lang));
  }

  initialize(): void {
    // Load preferred language from localStorage
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('preferred-language') as Language;
      if (savedLang && translations[savedLang]) {
        this.currentLanguage = savedLang;
      } else {
        // Try to detect browser language
        const browserLang = navigator.language.split('-')[0] as Language;
        if (translations[browserLang]) {
          this.currentLanguage = browserLang;
        }
      }
    }
  }
}

// Enhanced translations with additional languages and improved consistency
export const translations: Record<Language, Translations> = {
  // ... (your existing translations remain the same, but I'll show enhanced structure)
  fr: {
    // ... existing French translations
    common: {
      ...translations.fr.common,
      confirm: 'Confirmer',
      yes: 'Oui',
      no: 'Non',
      retry: 'Réessayer',
      continue: 'Continuer',
      finish: 'Terminer'
    },
    dashboard: {
      ...translations.fr.dashboard,
      performance: 'Performance',
      insights: 'Aperçus',
      recommendations: 'Recommandations'
    },
    products: {
      ...translations.fr.products,
      selectAll: 'Tout sélectionner',
      bulkActions: 'Actions groupées',
      exportSelected: 'Exporter la sélection',
      importProducts: 'Importer des produits'
    },
    settings: {
      ...translations.fr.settings,
      account: 'Compte',
      notifications: 'Notifications',
      integrations: 'Intégrations',
      apiKeys: 'Clés API',
      preferences: 'Préférences'
    },
    loading: {
      ...translations.fr.loading,
      processing: 'Traitement en cours...',
      uploading: 'Téléversement...',
      downloading: 'Téléchargement...'
    },
    seo: {
      ...translations.fr.seo,
      analysis: 'Analyse',
      recommendations: 'Recommandations',
      metrics: 'Métriques'
    },
    blog: {
      ...translations.fr.blog,
      topics: 'Sujets',
      categories: 'Catégories',
      tags: 'Étiquettes',
      seoScore: 'Score SEO'
    },
    campaigns: {
      ...translations.fr.campaigns,
      duplicateCampaign: 'Dupliquer la campagne',
      exportCampaign: 'Exporter la campagne',
      importCampaign: 'Importer une campagne'
    },
    notifications: {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Avertissement',
      info: 'Information',
      productEnriched: 'Produit enrichi avec succès',
      syncCompleted: 'Synchronisation terminée',
      syncFailed: 'Échec de la synchronisation',
      campaignStarted: 'Campagne démarrée',
      campaignPaused: 'Campagne mise en pause',
      articlePublished: 'Article publié'
    }
  },
  en: {
    // ... existing English translations with similar enhancements
    // (Add the same new fields as in French)
  },
  // ... other languages with similar enhancements
};

// Enhanced utility functions
export function getTranslation(lang: Language): Translations {
  const selectedLang = translations[lang];
  if (!selectedLang) {
    console.warn(`Language "${lang}" not found, falling back to English`);
    return translations.en;
  }
  return selectedLang;
}

export function getTranslationWithFallback(lang: Language): Translations {
  const baseTranslation = translations.en;
  const targetTranslation = translations[lang] || translations.en;
  
  return deepMerge(baseTranslation, targetTranslation);
}

// Enhanced language detection and management
export function detectUserLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // Check localStorage first
  const savedLang = localStorage.getItem('preferred-language') as Language;
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }
  
  // Detect browser language
  const browserLang = navigator.language.split('-')[0] as Language;
  if (translations[browserLang]) {
    return browserLang;
  }
  
  // Fallback to English
  return 'en';
}

// Enhanced language selector with better typing
export function getAvailableLanguages(): Array<{
  code: Language;
  name: string;
  nativeName: string;
  flag?: string;
}> {
  return [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' }
  ];
}

// React Hook for translations (if using React)
export function useTranslation() {
  const [currentLang, setCurrentLang] = useState<Language>(() => 
    TranslationRegistry.getInstance().getCurrentLanguage()
  );
  
  useEffect(() => {
    const registry = TranslationRegistry.getInstance();
    const unsubscribe = registry.subscribe(setCurrentLang);
    return unsubscribe;
  }, []);
  
  const t = useMemo(() => getTranslationWithFallback(currentLang), [currentLang]);
  
  const setLanguage = useCallback((lang: Language) => {
    TranslationRegistry.getInstance().setLanguage(lang);
  }, []);
  
  return { t, currentLang, setLanguage };
}

// Utility for template strings with variables
export function translateWithVariables(
  template: string, 
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => 
    variables[key]?.toString() || `{${key}}`
  );
}

// Example usage:
// const message = translateWithVariables(t.common.welcome, { username: 'John', count: 5 });