export type Language = 'fr' | 'en' | 'es' | 'de' | 'it' | 'pt' | 'nl' | 'ru' | 'zh' | 'ja';

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
  };
  loading: {
    products: string;
    data: string;
    content: string;
    almostThere: string;
    pleaseWait: string;
    preparingData: string;
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
}

export const translations: Record<Language, Translations> = {
  fr: {
    nav: {
      dashboard: 'Tableau de bord',
      products: 'Produits',
      stores: 'Magasins',
      seo: 'SEO',
      settings: 'Paramètres',
      seoOptimization: 'Optimisation',
      seoAltImage: 'ALT Image',
      seoTags: 'Tags',
      seoOpportunities: 'Opportunités',
      blogArticles: 'Articles de Blog',
      aiBlog: 'AI Blog'
    },
    common: {
      loading: 'Chargement...',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      edit: 'Modifier',
      view: 'Voir',
      refresh: 'Actualiser',
      search: 'Rechercher',
      filter: 'Filtrer',
      export: 'Exporter',
      import: 'Importer',
      close: 'Fermer',
      back: 'Retour',
      next: 'Suivant',
      previous: 'Précédent',
      submit: 'Soumettre',
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information'
    },
    dashboard: {
      title: 'Tableau de bord',
      totalProducts: 'Total Produits',
      aiEnriched: 'Enrichis par IA',
      syncedToShopify: 'Synchronisés',
      pendingSync: 'En attente',
      topProductTypes: 'Types de produits',
      recentActivity: 'Activité récente',
      quickStats: 'Statistiques rapides',
      uniqueVendors: 'Vendeurs uniques',
      avgInventory: 'Inventaire moyen',
      activeProducts: 'Produits actifs',
      enrichedProducts: 'Produits enrichis IA',
      showAll: 'Tout afficher',
      showLess: 'Afficher moins',
      noEnrichedProducts: 'Aucun produit enrichi',
      enrichedAt: 'Enrichi le'
    },
    products: {
      title: 'Produits',
      searchPlaceholder: 'Rechercher des produits...',
      filterBy: 'Filtrer par',
      allCategories: 'Toutes les catégories',
      enrichmentStatus: 'Statut enrichissement',
      all: 'Tous',
      enriched: 'Enrichis',
      pending: 'En attente',
      failed: 'Échoué',
      enrichAll: 'Enrichir tout',
      enriching: 'Enrichissement...',
      price: 'Prix',
      inventory: 'Inventaire',
      status: 'Statut',
      vendor: 'Vendeur',
      category: 'Catégorie',
      noProducts: 'Aucun produit trouvé',
      totalProducts: 'Total Produits',
      enrichedProducts: 'Produits enrichis',
      syncedToShopify: 'Synchronisés avec Shopify',
      pendingSync: 'En attente de synchro',
      ofTotal: 'du total'
    },
    settings: {
      title: 'Paramètres',
      language: 'Langue',
      selectLanguage: 'Sélectionner la langue',
      enrichmentSettings: 'Paramètres d\'enrichissement',
      enrichmentMode: 'Mode d\'enrichissement',
      manual: 'Manuel',
      automatic: 'Automatique',
      frequency: 'Fréquence',
      onImport: 'À l\'importation',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      saveSettings: 'Enregistrer les paramètres',
      saving: 'Enregistrement...',
      settingsSaved: 'Paramètres enregistrés',
      errorSaving: 'Erreur lors de l\'enregistrement',
      aboutEnrichment: 'À propos de l\'enrichissement'
    },
    loading: {
      products: 'Chargement des produits...',
      data: 'Chargement des données...',
      content: 'Chargement du contenu...',
      almostThere: 'Presque prêt...',
      pleaseWait: 'Veuillez patienter...',
      preparingData: 'Préparation des données...'
    },
    seo: {
      opportunities: 'Opportunités SEO',
      generateOpportunities: 'Générer des opportunités',
      generating: 'Génération...',
      categoryGuide: 'Guide de catégorie',
      comparison: 'Comparaison',
      howTo: 'Guide pratique',
      productSpotlight: 'Mise en avant',
      seasonal: 'Saisonnier',
      targetKeywords: 'Mots-clés cibles',
      suggestedStructure: 'Structure suggérée',
      createArticle: 'Créer un article',
      creating: 'Création...',
      copyTitle: 'Copier le titre',
      score: 'Score',
      difficulty: 'Difficulté',
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      allProducts: 'Tous les produits',
      notEnriched: 'Produits non enrichis',
      toSync: 'À synchroniser',
      synced: 'Synchronisés',
      totalProducts: 'Total Produits',
      optimizedProducts: 'Produits optimisés',
      allCatalog: 'Tout le catalogue',
      tags: 'Tags',
      tagsNotEnriched: 'Tags non enrichis',
      tagsEnriched: 'Tags enrichis'
    },
    blog: {
      autoBlogWriter: 'Rédacteur automatique',
      generateMode: 'Mode de génération',
      manualMode: 'Manuel',
      automaticMode: 'Automatique',
      scheduling: 'Planification',
      contentSettings: 'Paramètres de contenu',
      internalLinking: 'Liens internes',
      generateNow: 'Générer maintenant',
      saveSettings: 'Enregistrer les paramètres',
      wordCount: 'Nombre de mots',
      outputFormat: 'Format de sortie',
      autoPublish: 'Publication automatique',
      frequency: 'Fréquence',
      scheduleTime: 'Heure planifiée',
      dayOfWeek: 'Jour de la semaine',
      dayOfMonth: 'Jour du mois'
    },
    campaigns: {
      title: 'Campagnes IA',
      createCampaign: 'Créer une campagne',
      campaignName: 'Nom de la campagne',
      description: 'Description',
      topicNiche: 'Sujet/Niche du contenu',
      targetAudience: 'Public cible',
      startDate: 'Date de début',
      endDate: 'Date de fin (Optionnel)',
      noCampaigns: 'Aucune campagne pour le moment',
      createFirst: 'Créez votre première campagne IA pour commencer à générer du contenu de blog automatiquement',
      campaignConfig: 'Configuration de la campagne',
      contentEnhancement: 'Amélioration du contenu',
      articleParams: 'Paramètres de génération d\'articles',
      reviewLaunch: 'Révision et lancement',
      minWordCount: 'Nombre de mots minimum',
      maxWordCount: 'Nombre de mots maximum',
      writingStyle: 'Style d\'écriture',
      tone: 'Ton',
      targetKeywords: 'Mots-clés cibles',
      addKeyword: 'Ajouter',
      contentStructure: 'Préférences de structure du contenu',
      language: 'Langue',
      launchCampaign: 'Lancer la campagne',
      creating: 'Création...',
      campaignDetails: 'Détails de la campagne',
      contentSettings: 'Paramètres de contenu',
      enhancementFeatures: 'Fonctionnalités d\'amélioration',
      readyToLaunch: 'Prêt à lancer !',
      generated: 'Générés',
      published: 'Publiés',
      lastRun: 'Dernière exécution',
      nextRun: 'Prochaine exécution',
      recentExecutions: 'Exécutions récentes',
      articlesGenerated: 'article(s) généré(s)',
      pauseCampaign: 'Mettre en pause',
      resumeCampaign: 'Reprendre',
      runNow: 'Exécuter maintenant',
      stopCampaign: 'Arrêter la campagne',
      deleteCampaign: 'Supprimer la campagne',
      stopConfirm: 'Êtes-vous sûr de vouloir arrêter cette campagne ? Cette action ne peut pas être annulée.',
      deleteConfirm: 'Êtes-vous sûr de vouloir supprimer cette campagne ? Toutes les données seront perdues.',
      status: {
        draft: 'Brouillon',
        active: 'Active',
        paused: 'En pause',
        stopped: 'Arrêtée',
        completed: 'Terminée'
      },
      frequency: {
        daily: 'Quotidien',
        weekly: 'Hebdomadaire',
        biWeekly: 'Bihebdomadaire',
        monthly: 'Mensuel'
      },
      writingStyles: {
        professional: 'Professionnel',
        casual: 'Décontracté',
        technical: 'Technique',
        conversational: 'Conversationnel'
      },
      tones: {
        formal: 'Formel',
        informal: 'Informel',
        friendly: 'Amical',
        authoritative: 'Autoritaire'
      },
      validation: {
        nameRequired: 'Le nom de la campagne est requis',
        topicRequired: 'Le sujet/niche est requis',
        startDateRequired: 'La date de début est requise',
        minWordCount: 'Le nombre minimum de mots doit être d\'au moins 300',
        maxWordCount: 'Le maximum doit être supérieur au minimum',
        keywordsRequired: 'Au moins un mot-clé est requis'
      }
    }
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      products: 'Products',
      stores: 'Stores',
      seo: 'SEO',
      settings: 'Settings',
      seoOptimization: 'Optimization',
      seoAltImage: 'ALT Image',
      seoTags: 'Tags',
      seoOpportunities: 'Opportunities',
      blogArticles: 'Blog Articles',
      aiBlog: 'AI Blog'
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      refresh: 'Refresh',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      import: 'Import',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      success: 'Success',
      error: 'Error',
      warning: 'Warning',
      info: 'Information'
    },
    dashboard: {
      title: 'Dashboard',
      totalProducts: 'Total Products',
      aiEnriched: 'AI Enriched',
      syncedToShopify: 'Synced to Shopify',
      pendingSync: 'Pending Sync',
      topProductTypes: 'Top Product Types',
      recentActivity: 'Recent Sync Activity',
      quickStats: 'Quick Stats',
      uniqueVendors: 'Unique Vendors',
      avgInventory: 'Avg. Inventory Per Product',
      activeProducts: 'Active Products',
      enrichedProducts: 'AI Enriched Products',
      showAll: 'Show All',
      showLess: 'Show Less',
      noEnrichedProducts: 'No AI Enriched Products Yet',
      enrichedAt: 'Enriched'
    },
    products: {
      title: 'Products',
      searchPlaceholder: 'Search products...',
      filterBy: 'Filter by',
      allCategories: 'All Categories',
      enrichmentStatus: 'Enrichment Status',
      all: 'All',
      enriched: 'Enriched',
      pending: 'Pending',
      failed: 'Failed',
      enrichAll: 'Enrich All',
      enriching: 'Enriching...',
      price: 'Price',
      inventory: 'Inventory',
      status: 'Status',
      vendor: 'Vendor',
      category: 'Category',
      noProducts: 'No products found',
      totalProducts: 'Total Products',
      enrichedProducts: 'Enriched Products',
      syncedToShopify: 'Synced to Shopify',
      pendingSync: 'Pending Sync',
      ofTotal: 'of total'
    },
    settings: {
      title: 'Settings',
      language: 'Language',
      selectLanguage: 'Select Language',
      enrichmentSettings: 'Enrichment Settings',
      enrichmentMode: 'Enrichment Mode',
      manual: 'Manual',
      automatic: 'Automatic',
      frequency: 'Frequency',
      onImport: 'On Import',
      daily: 'Daily',
      weekly: 'Weekly',
      saveSettings: 'Save Settings',
      saving: 'Saving...',
      settingsSaved: 'Settings saved successfully',
      errorSaving: 'Error saving settings',
      aboutEnrichment: 'About Enrichment'
    },
    loading: {
      products: 'Loading products...',
      data: 'Loading data...',
      content: 'Loading content...',
      almostThere: 'Almost there...',
      pleaseWait: 'Please wait...',
      preparingData: 'Preparing data...'
    },
    seo: {
      opportunities: 'SEO Opportunities',
      generateOpportunities: 'Generate Opportunities',
      generating: 'Generating...',
      categoryGuide: 'Category Guide',
      comparison: 'Comparison',
      howTo: 'How-To Guide',
      productSpotlight: 'Product Spotlight',
      seasonal: 'Seasonal',
      targetKeywords: 'Target Keywords',
      suggestedStructure: 'Suggested Structure',
      createArticle: 'Create Article',
      creating: 'Creating...',
      copyTitle: 'Copy title',
      score: 'Score',
      difficulty: 'Difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      allProducts: 'All Products',
      notEnriched: 'Not Enriched',
      toSync: 'To Sync',
      synced: 'Synced',
      totalProducts: 'Total Products',
      optimizedProducts: 'Optimized Products',
      allCatalog: 'All products in catalog',
      tags: 'Tags',
      tagsNotEnriched: 'Tags Not Enriched',
      tagsEnriched: 'Tags Enriched'
    },
    blog: {
      autoBlogWriter: 'Auto Blog Writer',
      generateMode: 'Generation Mode',
      manualMode: 'Manual',
      automaticMode: 'Automatic',
      scheduling: 'Scheduling',
      contentSettings: 'Content Settings',
      internalLinking: 'Internal Linking',
      generateNow: 'Generate Now',
      saveSettings: 'Save Settings',
      wordCount: 'Word Count',
      outputFormat: 'Output Format',
      autoPublish: 'Auto-publish',
      frequency: 'Frequency',
      scheduleTime: 'Schedule Time',
      dayOfWeek: 'Day of Week',
      dayOfMonth: 'Day of Month'
    },
    campaigns: {
      title: 'AI Campaigns',
      createCampaign: 'Create Campaign',
      campaignName: 'Campaign Name',
      description: 'Description',
      topicNiche: 'Content Topic/Niche',
      targetAudience: 'Target Audience',
      startDate: 'Start Date',
      endDate: 'End Date (Optional)',
      noCampaigns: 'No campaigns yet',
      createFirst: 'Create your first AI campaign to start generating automated blog content',
      campaignConfig: 'Campaign Configuration',
      contentEnhancement: 'Content Enhancement',
      articleParams: 'Article Generation Parameters',
      reviewLaunch: 'Review & Launch',
      minWordCount: 'Min Word Count',
      maxWordCount: 'Max Word Count',
      writingStyle: 'Writing Style',
      tone: 'Tone',
      targetKeywords: 'Target Keywords',
      addKeyword: 'Add',
      contentStructure: 'Content Structure Preferences',
      language: 'Language',
      launchCampaign: 'Launch Campaign',
      creating: 'Creating...',
      campaignDetails: 'Campaign Details',
      contentSettings: 'Content Settings',
      enhancementFeatures: 'Enhancement Features',
      readyToLaunch: 'Ready to launch!',
      generated: 'Generated',
      published: 'Published',
      lastRun: 'Last Run',
      nextRun: 'Next Run',
      recentExecutions: 'Recent Executions',
      articlesGenerated: 'article(s) generated',
      pauseCampaign: 'Pause Campaign',
      resumeCampaign: 'Resume Campaign',
      runNow: 'Run Now',
      stopCampaign: 'Stop Campaign',
      deleteCampaign: 'Delete Campaign',
      stopConfirm: 'Are you sure you want to stop this campaign? This action cannot be undone.',
      deleteConfirm: 'Are you sure you want to delete this campaign? All data will be lost.',
      status: {
        draft: 'Draft',
        active: 'Active',
        paused: 'Paused',
        stopped: 'Stopped',
        completed: 'Completed'
      },
      frequency: {
        daily: 'Daily',
        weekly: 'Weekly',
        biWeekly: 'Bi-weekly',
        monthly: 'Monthly'
      },
      writingStyles: {
        professional: 'Professional',
        casual: 'Casual',
        technical: 'Technical',
        conversational: 'Conversational'
      },
      tones: {
        formal: 'Formal',
        informal: 'Informal',
        friendly: 'Friendly',
        authoritative: 'Authoritative'
      },
      validation: {
        nameRequired: 'Campaign name is required',
        topicRequired: 'Content topic/niche is required',
        startDateRequired: 'Start date is required',
        minWordCount: 'Minimum word count must be at least 300',
        maxWordCount: 'Maximum must be greater than minimum',
        keywordsRequired: 'At least one keyword is required'
      }
    }
  },
  es: {
    nav: {
      dashboard: 'Panel',
      products: 'Productos',
      stores: 'Tiendas',
      seo: 'SEO',
      settings: 'Configuración',
      seoOptimization: 'Optimización',
      seoAltImage: 'ALT Imagen',
      seoTags: 'Etiquetas',
      seoOpportunities: 'Oportunidades',
      blogArticles: 'Artículos de Blog',
      aiBlog: 'Blog IA'
    },
    common: {
      loading: 'Cargando...',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      view: 'Ver',
      refresh: 'Actualizar',
      search: 'Buscar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      close: 'Cerrar',
      back: 'Atrás',
      next: 'Siguiente',
      previous: 'Anterior',
      submit: 'Enviar',
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    },
    dashboard: {
      title: 'Panel',
      totalProducts: 'Productos Totales',
      aiEnriched: 'Enriquecidos por IA',
      syncedToShopify: 'Sincronizados',
      pendingSync: 'Pendiente',
      topProductTypes: 'Tipos principales',
      recentActivity: 'Actividad reciente',
      quickStats: 'Estadísticas rápidas',
      uniqueVendors: 'Vendedores únicos',
      avgInventory: 'Inventario promedio',
      activeProducts: 'Productos activos',
      enrichedProducts: 'Productos enriquecidos',
      showAll: 'Mostrar todo',
      showLess: 'Mostrar menos',
      noEnrichedProducts: 'Sin productos enriquecidos',
      enrichedAt: 'Enriquecido'
    },
    products: {
      title: 'Productos',
      searchPlaceholder: 'Buscar productos...',
      filterBy: 'Filtrar por',
      allCategories: 'Todas las categorías',
      enrichmentStatus: 'Estado de enriquecimiento',
      all: 'Todos',
      enriched: 'Enriquecidos',
      pending: 'Pendiente',
      failed: 'Fallido',
      enrichAll: 'Enriquecer todo',
      enriching: 'Enriqueciendo...',
      price: 'Precio',
      inventory: 'Inventario',
      status: 'Estado',
      vendor: 'Vendedor',
      category: 'Categoría',
      noProducts: 'No se encontraron productos',
      totalProducts: 'Total Productos',
      enrichedProducts: 'Productos enriquecidos',
      syncedToShopify: 'Sincronizados con Shopify',
      pendingSync: 'Pendiente de sincronización',
      ofTotal: 'del total'
    },
    settings: {
      title: 'Configuración',
      language: 'Idioma',
      selectLanguage: 'Seleccionar idioma',
      enrichmentSettings: 'Configuración de enriquecimiento',
      enrichmentMode: 'Modo de enriquecimiento',
      manual: 'Manual',
      automatic: 'Automático',
      frequency: 'Frecuencia',
      onImport: 'Al importar',
      daily: 'Diario',
      weekly: 'Semanal',
      saveSettings: 'Guardar configuración',
      saving: 'Guardando...',
      settingsSaved: 'Configuración guardada',
      errorSaving: 'Error al guardar',
      aboutEnrichment: 'Acerca del enriquecimiento'
    },
    loading: {
      products: 'Cargando productos...',
      data: 'Cargando datos...',
      content: 'Cargando contenido...',
      almostThere: 'Casi listo...',
      pleaseWait: 'Por favor espere...',
      preparingData: 'Preparando datos...'
    },
    seo: {
      opportunities: 'Oportunidades SEO',
      generateOpportunities: 'Generar oportunidades',
      generating: 'Generando...',
      categoryGuide: 'Guía de categoría',
      comparison: 'Comparación',
      howTo: 'Guía práctica',
      productSpotlight: 'Destacado',
      seasonal: 'Estacional',
      targetKeywords: 'Palabras clave',
      suggestedStructure: 'Estructura sugerida',
      createArticle: 'Crear artículo',
      creating: 'Creando...',
      copyTitle: 'Copiar título',
      score: 'Puntuación',
      difficulty: 'Dificultad',
      easy: 'Fácil',
      medium: 'Medio',
      hard: 'Difícil',
      allProducts: 'Todos los productos',
      notEnriched: 'No enriquecidos',
      toSync: 'A sincronizar',
      synced: 'Sincronizados',
      totalProducts: 'Total Productos',
      optimizedProducts: 'Productos optimizados',
      allCatalog: 'Todo el catálogo',
      tags: 'Etiquetas',
      tagsNotEnriched: 'Etiquetas no enriquecidas',
      tagsEnriched: 'Etiquetas enriquecidas'
    },
    blog: {
      autoBlogWriter: 'Escritor automático',
      generateMode: 'Modo de generación',
      manualMode: 'Manual',
      automaticMode: 'Automático',
      scheduling: 'Programación',
      contentSettings: 'Configuración de contenido',
      internalLinking: 'Enlaces internos',
      generateNow: 'Generar ahora',
      saveSettings: 'Guardar configuración',
      wordCount: 'Conteo de palabras',
      outputFormat: 'Formato de salida',
      autoPublish: 'Publicación automática',
      frequency: 'Frecuencia',
      scheduleTime: 'Hora programada',
      dayOfWeek: 'Día de la semana',
      dayOfMonth: 'Día del mes'
    }
  },
  de: {
    nav: {
      dashboard: 'Dashboard',
      products: 'Produkte',
      stores: 'Geschäfte',
      seo: 'SEO',
      settings: 'Einstellungen',
      seoOptimization: 'Optimierung',
      seoAltImage: 'ALT-Bild',
      seoTags: 'Tags',
      seoOpportunities: 'Chancen',
      blogArticles: 'Blog-Artikel',
      aiBlog: 'KI Blog'
    },
    common: {
      loading: 'Lädt...',
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      view: 'Ansehen',
      refresh: 'Aktualisieren',
      search: 'Suchen',
      filter: 'Filtern',
      export: 'Exportieren',
      import: 'Importieren',
      close: 'Schließen',
      back: 'Zurück',
      next: 'Weiter',
      previous: 'Vorherige',
      submit: 'Absenden',
      success: 'Erfolg',
      error: 'Fehler',
      warning: 'Warnung',
      info: 'Information'
    },
    dashboard: {
      title: 'Dashboard',
      totalProducts: 'Gesamtprodukte',
      aiEnriched: 'KI-angereichert',
      syncedToShopify: 'Synchronisiert',
      pendingSync: 'Ausstehend',
      topProductTypes: 'Top-Produkttypen',
      recentActivity: 'Letzte Aktivität',
      quickStats: 'Schnellstatistiken',
      uniqueVendors: 'Eindeutige Anbieter',
      avgInventory: 'Durchschn. Bestand',
      activeProducts: 'Aktive Produkte',
      enrichedProducts: 'Angereicherte Produkte',
      showAll: 'Alle anzeigen',
      showLess: 'Weniger anzeigen',
      noEnrichedProducts: 'Keine angereicherten Produkte',
      enrichedAt: 'Angereichert'
    },
    products: {
      title: 'Produkte',
      searchPlaceholder: 'Produkte suchen...',
      filterBy: 'Filtern nach',
      allCategories: 'Alle Kategorien',
      enrichmentStatus: 'Anreicherungsstatus',
      all: 'Alle',
      enriched: 'Angereichert',
      pending: 'Ausstehend',
      failed: 'Fehlgeschlagen',
      enrichAll: 'Alle anreichern',
      enriching: 'Anreicherung...',
      price: 'Preis',
      inventory: 'Bestand',
      status: 'Status',
      vendor: 'Anbieter',
      category: 'Kategorie',
      noProducts: 'Keine Produkte gefunden'
    },
    settings: {
      title: 'Einstellungen',
      language: 'Sprache',
      selectLanguage: 'Sprache auswählen',
      enrichmentSettings: 'Anreicherungseinstellungen',
      enrichmentMode: 'Anreicherungsmodus',
      manual: 'Manuell',
      automatic: 'Automatisch',
      frequency: 'Häufigkeit',
      onImport: 'Beim Import',
      daily: 'Täglich',
      weekly: 'Wöchentlich',
      saveSettings: 'Einstellungen speichern',
      saving: 'Speichert...',
      settingsSaved: 'Einstellungen gespeichert',
      errorSaving: 'Fehler beim Speichern',
      aboutEnrichment: 'Über die Anreicherung'
    },
    loading: {
      products: 'Produkte werden geladen...',
      data: 'Daten werden geladen...',
      content: 'Inhalt wird geladen...',
      almostThere: 'Fast fertig...',
      pleaseWait: 'Bitte warten...',
      preparingData: 'Daten werden vorbereitet...'
    },
    seo: {
      opportunities: 'SEO-Chancen',
      generateOpportunities: 'Chancen generieren',
      generating: 'Generiert...',
      categoryGuide: 'Kategorieleitfaden',
      comparison: 'Vergleich',
      howTo: 'Anleitung',
      productSpotlight: 'Produkthighlight',
      seasonal: 'Saisonal',
      targetKeywords: 'Ziel-Keywords',
      suggestedStructure: 'Vorgeschlagene Struktur',
      createArticle: 'Artikel erstellen',
      creating: 'Erstellt...',
      copyTitle: 'Titel kopieren',
      score: 'Bewertung',
      difficulty: 'Schwierigkeit',
      easy: 'Einfach',
      medium: 'Mittel',
      hard: 'Schwer'
    },
    blog: {
      autoBlogWriter: 'Auto-Blog-Schreiber',
      generateMode: 'Generierungsmodus',
      manualMode: 'Manuell',
      automaticMode: 'Automatisch',
      scheduling: 'Zeitplanung',
      contentSettings: 'Inhaltseinstellungen',
      internalLinking: 'Interne Verlinkung',
      generateNow: 'Jetzt generieren',
      saveSettings: 'Einstellungen speichern',
      wordCount: 'Wortzahl',
      outputFormat: 'Ausgabeformat',
      autoPublish: 'Auto-Veröffentlichung',
      frequency: 'Häufigkeit',
      scheduleTime: 'Geplante Zeit',
      dayOfWeek: 'Wochentag',
      dayOfMonth: 'Tag des Monats'
    }
  },
  it: {
    nav: {
      dashboard: 'Pannello',
      products: 'Prodotti',
      stores: 'Negozi',
      seo: 'SEO',
      settings: 'Impostazioni',
      seoOptimization: 'Ottimizzazione',
      seoAltImage: 'ALT Immagine',
      seoTags: 'Tag',
      seoOpportunities: 'Opportunità',
      blogArticles: 'Articoli Blog',
      aiBlog: 'Blog IA'
    },
    common: {
      loading: 'Caricamento...',
      save: 'Salva',
      cancel: 'Annulla',
      delete: 'Elimina',
      edit: 'Modifica',
      view: 'Visualizza',
      refresh: 'Aggiorna',
      search: 'Cerca',
      filter: 'Filtra',
      export: 'Esporta',
      import: 'Importa',
      close: 'Chiudi',
      back: 'Indietro',
      next: 'Avanti',
      previous: 'Precedente',
      submit: 'Invia',
      success: 'Successo',
      error: 'Errore',
      warning: 'Avviso',
      info: 'Informazione'
    },
    dashboard: {
      title: 'Pannello',
      totalProducts: 'Prodotti Totali',
      aiEnriched: 'Arricchiti IA',
      syncedToShopify: 'Sincronizzati',
      pendingSync: 'In attesa',
      topProductTypes: 'Tipi principali',
      recentActivity: 'Attività recente',
      quickStats: 'Statistiche rapide',
      uniqueVendors: 'Fornitori unici',
      avgInventory: 'Inventario medio',
      activeProducts: 'Prodotti attivi',
      enrichedProducts: 'Prodotti arricchiti',
      showAll: 'Mostra tutto',
      showLess: 'Mostra meno',
      noEnrichedProducts: 'Nessun prodotto arricchito',
      enrichedAt: 'Arricchito'
    },
    products: {
      title: 'Prodotti',
      searchPlaceholder: 'Cerca prodotti...',
      filterBy: 'Filtra per',
      allCategories: 'Tutte le categorie',
      enrichmentStatus: 'Stato arricchimento',
      all: 'Tutti',
      enriched: 'Arricchiti',
      pending: 'In attesa',
      failed: 'Fallito',
      enrichAll: 'Arricchisci tutto',
      enriching: 'Arricchimento...',
      price: 'Prezzo',
      inventory: 'Inventario',
      status: 'Stato',
      vendor: 'Fornitore',
      category: 'Categoria',
      noProducts: 'Nessun prodotto trovato'
    },
    settings: {
      title: 'Impostazioni',
      language: 'Lingua',
      selectLanguage: 'Seleziona lingua',
      enrichmentSettings: 'Impostazioni arricchimento',
      enrichmentMode: 'Modalità arricchimento',
      manual: 'Manuale',
      automatic: 'Automatico',
      frequency: 'Frequenza',
      onImport: 'All\'importazione',
      daily: 'Giornaliero',
      weekly: 'Settimanale',
      saveSettings: 'Salva impostazioni',
      saving: 'Salvataggio...',
      settingsSaved: 'Impostazioni salvate',
      errorSaving: 'Errore nel salvataggio',
      aboutEnrichment: 'Informazioni sull\'arricchimento'
    },
    loading: {
      products: 'Caricamento prodotti...',
      data: 'Caricamento dati...',
      content: 'Caricamento contenuto...',
      almostThere: 'Quasi pronto...',
      pleaseWait: 'Attendere prego...',
      preparingData: 'Preparazione dati...'
    },
    seo: {
      opportunities: 'Opportunità SEO',
      generateOpportunities: 'Genera opportunità',
      generating: 'Generazione...',
      categoryGuide: 'Guida categoria',
      comparison: 'Confronto',
      howTo: 'Guida pratica',
      productSpotlight: 'In evidenza',
      seasonal: 'Stagionale',
      targetKeywords: 'Parole chiave target',
      suggestedStructure: 'Struttura suggerita',
      createArticle: 'Crea articolo',
      creating: 'Creazione...',
      copyTitle: 'Copia titolo',
      score: 'Punteggio',
      difficulty: 'Difficoltà',
      easy: 'Facile',
      medium: 'Medio',
      hard: 'Difficile'
    },
    blog: {
      autoBlogWriter: 'Scrittore automatico',
      generateMode: 'Modalità generazione',
      manualMode: 'Manuale',
      automaticMode: 'Automatico',
      scheduling: 'Programmazione',
      contentSettings: 'Impostazioni contenuto',
      internalLinking: 'Collegamenti interni',
      generateNow: 'Genera ora',
      saveSettings: 'Salva impostazioni',
      wordCount: 'Conteggio parole',
      outputFormat: 'Formato output',
      autoPublish: 'Pubblicazione automatica',
      frequency: 'Frequenza',
      scheduleTime: 'Ora programmata',
      dayOfWeek: 'Giorno della settimana',
      dayOfMonth: 'Giorno del mese'
    }
  },
  pt: {
    nav: {
      dashboard: 'Painel',
      products: 'Produtos',
      stores: 'Lojas',
      seo: 'SEO',
      settings: 'Configurações',
      seoOptimization: 'Otimização',
      seoAltImage: 'ALT Imagem',
      seoTags: 'Tags',
      seoOpportunities: 'Oportunidades',
      blogArticles: 'Artigos Blog',
      aiBlog: 'Blog IA'
    },
    common: {
      loading: 'Carregando...',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      edit: 'Editar',
      view: 'Ver',
      refresh: 'Atualizar',
      search: 'Pesquisar',
      filter: 'Filtrar',
      export: 'Exportar',
      import: 'Importar',
      close: 'Fechar',
      back: 'Voltar',
      next: 'Próximo',
      previous: 'Anterior',
      submit: 'Enviar',
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Aviso',
      info: 'Informação'
    },
    dashboard: {
      title: 'Painel',
      totalProducts: 'Total de Produtos',
      aiEnriched: 'Enriquecidos IA',
      syncedToShopify: 'Sincronizados',
      pendingSync: 'Pendente',
      topProductTypes: 'Tipos principais',
      recentActivity: 'Atividade recente',
      quickStats: 'Estatísticas rápidas',
      uniqueVendors: 'Fornecedores únicos',
      avgInventory: 'Estoque médio',
      activeProducts: 'Produtos ativos',
      enrichedProducts: 'Produtos enriquecidos',
      showAll: 'Mostrar tudo',
      showLess: 'Mostrar menos',
      noEnrichedProducts: 'Nenhum produto enriquecido',
      enrichedAt: 'Enriquecido'
    },
    products: {
      title: 'Produtos',
      searchPlaceholder: 'Pesquisar produtos...',
      filterBy: 'Filtrar por',
      allCategories: 'Todas as categorias',
      enrichmentStatus: 'Status de enriquecimento',
      all: 'Todos',
      enriched: 'Enriquecidos',
      pending: 'Pendente',
      failed: 'Falhou',
      enrichAll: 'Enriquecer tudo',
      enriching: 'Enriquecendo...',
      price: 'Preço',
      inventory: 'Estoque',
      status: 'Status',
      vendor: 'Fornecedor',
      category: 'Categoria',
      noProducts: 'Nenhum produto encontrado'
    },
    settings: {
      title: 'Configurações',
      language: 'Idioma',
      selectLanguage: 'Selecionar idioma',
      enrichmentSettings: 'Configurações de enriquecimento',
      enrichmentMode: 'Modo de enriquecimento',
      manual: 'Manual',
      automatic: 'Automático',
      frequency: 'Frequência',
      onImport: 'Na importação',
      daily: 'Diário',
      weekly: 'Semanal',
      saveSettings: 'Salvar configurações',
      saving: 'Salvando...',
      settingsSaved: 'Configurações salvas',
      errorSaving: 'Erro ao salvar',
      aboutEnrichment: 'Sobre o enriquecimento'
    },
    loading: {
      products: 'Carregando produtos...',
      data: 'Carregando dados...',
      content: 'Carregando conteúdo...',
      almostThere: 'Quase lá...',
      pleaseWait: 'Por favor aguarde...',
      preparingData: 'Preparando dados...'
    },
    seo: {
      opportunities: 'Oportunidades SEO',
      generateOpportunities: 'Gerar oportunidades',
      generating: 'Gerando...',
      categoryGuide: 'Guia de categoria',
      comparison: 'Comparação',
      howTo: 'Guia prático',
      productSpotlight: 'Destaque',
      seasonal: 'Sazonal',
      targetKeywords: 'Palavras-chave alvo',
      suggestedStructure: 'Estrutura sugerida',
      createArticle: 'Criar artigo',
      creating: 'Criando...',
      copyTitle: 'Copiar título',
      score: 'Pontuação',
      difficulty: 'Dificuldade',
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil'
    },
    blog: {
      autoBlogWriter: 'Escritor automático',
      generateMode: 'Modo de geração',
      manualMode: 'Manual',
      automaticMode: 'Automático',
      scheduling: 'Agendamento',
      contentSettings: 'Configurações de conteúdo',
      internalLinking: 'Links internos',
      generateNow: 'Gerar agora',
      saveSettings: 'Salvar configurações',
      wordCount: 'Contagem de palavras',
      outputFormat: 'Formato de saída',
      autoPublish: 'Publicação automática',
      frequency: 'Frequência',
      scheduleTime: 'Hora agendada',
      dayOfWeek: 'Dia da semana',
      dayOfMonth: 'Dia do mês'
    }
  },
  nl: {
    nav: {
      dashboard: 'Dashboard',
      products: 'Producten',
      stores: 'Winkels',
      seo: 'SEO',
      settings: 'Instellingen',
      seoOptimization: 'Optimalisatie',
      seoAltImage: 'ALT Afbeelding',
      seoTags: 'Tags',
      seoOpportunities: 'Kansen',
      blogArticles: 'Blog Artikelen',
      aiBlog: 'AI Blog'
    },
    common: {
      loading: 'Laden...',
      save: 'Opslaan',
      cancel: 'Annuleren',
      delete: 'Verwijderen',
      edit: 'Bewerken',
      view: 'Bekijken',
      refresh: 'Vernieuwen',
      search: 'Zoeken',
      filter: 'Filteren',
      export: 'Exporteren',
      import: 'Importeren',
      close: 'Sluiten',
      back: 'Terug',
      next: 'Volgende',
      previous: 'Vorige',
      submit: 'Verzenden',
      success: 'Succes',
      error: 'Fout',
      warning: 'Waarschuwing',
      info: 'Informatie'
    },
    dashboard: {
      title: 'Dashboard',
      totalProducts: 'Totaal Producten',
      aiEnriched: 'AI-verrijkt',
      syncedToShopify: 'Gesynchroniseerd',
      pendingSync: 'In afwachting',
      topProductTypes: 'Top producttypen',
      recentActivity: 'Recente activiteit',
      quickStats: 'Snelle statistieken',
      uniqueVendors: 'Unieke leveranciers',
      avgInventory: 'Gem. voorraad',
      activeProducts: 'Actieve producten',
      enrichedProducts: 'Verrijkte producten',
      showAll: 'Alles tonen',
      showLess: 'Minder tonen',
      noEnrichedProducts: 'Geen verrijkte producten',
      enrichedAt: 'Verrijkt'
    },
    products: {
      title: 'Producten',
      searchPlaceholder: 'Producten zoeken...',
      filterBy: 'Filteren op',
      allCategories: 'Alle categorieën',
      enrichmentStatus: 'Verrijkingsstatus',
      all: 'Alle',
      enriched: 'Verrijkt',
      pending: 'In afwachting',
      failed: 'Mislukt',
      enrichAll: 'Alles verrijken',
      enriching: 'Verrijken...',
      price: 'Prijs',
      inventory: 'Voorraad',
      status: 'Status',
      vendor: 'Leverancier',
      category: 'Categorie',
      noProducts: 'Geen producten gevonden'
    },
    settings: {
      title: 'Instellingen',
      language: 'Taal',
      selectLanguage: 'Taal selecteren',
      enrichmentSettings: 'Verrijkingsinstellingen',
      enrichmentMode: 'Verrijkingsmodus',
      manual: 'Handmatig',
      automatic: 'Automatisch',
      frequency: 'Frequentie',
      onImport: 'Bij import',
      daily: 'Dagelijks',
      weekly: 'Wekelijks',
      saveSettings: 'Instellingen opslaan',
      saving: 'Opslaan...',
      settingsSaved: 'Instellingen opgeslagen',
      errorSaving: 'Fout bij opslaan',
      aboutEnrichment: 'Over verrijking'
    },
    loading: {
      products: 'Producten laden...',
      data: 'Gegevens laden...',
      content: 'Inhoud laden...',
      almostThere: 'Bijna klaar...',
      pleaseWait: 'Even geduld...',
      preparingData: 'Gegevens voorbereiden...'
    },
    seo: {
      opportunities: 'SEO-kansen',
      generateOpportunities: 'Kansen genereren',
      generating: 'Genereren...',
      categoryGuide: 'Categoriegids',
      comparison: 'Vergelijking',
      howTo: 'Handleiding',
      productSpotlight: 'Productspotlight',
      seasonal: 'Seizoensgebonden',
      targetKeywords: 'Doelzoekwoorden',
      suggestedStructure: 'Voorgestelde structuur',
      createArticle: 'Artikel maken',
      creating: 'Maken...',
      copyTitle: 'Titel kopiëren',
      score: 'Score',
      difficulty: 'Moeilijkheid',
      easy: 'Makkelijk',
      medium: 'Gemiddeld',
      hard: 'Moeilijk'
    },
    blog: {
      autoBlogWriter: 'Auto Blog Schrijver',
      generateMode: 'Genereermodus',
      manualMode: 'Handmatig',
      automaticMode: 'Automatisch',
      scheduling: 'Planning',
      contentSettings: 'Inhoudsinstellingen',
      internalLinking: 'Interne links',
      generateNow: 'Nu genereren',
      saveSettings: 'Instellingen opslaan',
      wordCount: 'Woordentelling',
      outputFormat: 'Uitvoerformaat',
      autoPublish: 'Auto-publiceren',
      frequency: 'Frequentie',
      scheduleTime: 'Geplande tijd',
      dayOfWeek: 'Dag van de week',
      dayOfMonth: 'Dag van de maand'
    }
  },
  ru: {
    nav: {
      dashboard: 'Панель',
      products: 'Продукты',
      stores: 'Магазины',
      seo: 'SEO',
      settings: 'Настройки',
      seoOptimization: 'Оптимизация',
      seoAltImage: 'ALT Изображение',
      seoTags: 'Теги',
      seoOpportunities: 'Возможности',
      blogArticles: 'Статьи блога',
      aiBlog: 'ИИ Блог'
    },
    common: {
      loading: 'Загрузка...',
      save: 'Сохранить',
      cancel: 'Отмена',
      delete: 'Удалить',
      edit: 'Редактировать',
      view: 'Просмотр',
      refresh: 'Обновить',
      search: 'Поиск',
      filter: 'Фильтр',
      export: 'Экспорт',
      import: 'Импорт',
      close: 'Закрыть',
      back: 'Назад',
      next: 'Далее',
      previous: 'Предыдущий',
      submit: 'Отправить',
      success: 'Успех',
      error: 'Ошибка',
      warning: 'Предупреждение',
      info: 'Информация'
    },
    dashboard: {
      title: 'Панель',
      totalProducts: 'Всего продуктов',
      aiEnriched: 'Обогащено ИИ',
      syncedToShopify: 'Синхронизировано',
      pendingSync: 'Ожидание',
      topProductTypes: 'Топ типов',
      recentActivity: 'Недавняя активность',
      quickStats: 'Быстрая статистика',
      uniqueVendors: 'Уникальные поставщики',
      avgInventory: 'Средний запас',
      activeProducts: 'Активные продукты',
      enrichedProducts: 'Обогащенные продукты',
      showAll: 'Показать все',
      showLess: 'Показать меньше',
      noEnrichedProducts: 'Нет обогащенных продуктов',
      enrichedAt: 'Обогащено'
    },
    products: {
      title: 'Продукты',
      searchPlaceholder: 'Поиск продуктов...',
      filterBy: 'Фильтр по',
      allCategories: 'Все категории',
      enrichmentStatus: 'Статус обогащения',
      all: 'Все',
      enriched: 'Обогащенные',
      pending: 'Ожидание',
      failed: 'Неудача',
      enrichAll: 'Обогатить все',
      enriching: 'Обогащение...',
      price: 'Цена',
      inventory: 'Запас',
      status: 'Статус',
      vendor: 'Поставщик',
      category: 'Категория',
      noProducts: 'Продукты не найдены'
    },
    settings: {
      title: 'Настройки',
      language: 'Язык',
      selectLanguage: 'Выбрать язык',
      enrichmentSettings: 'Настройки обогащения',
      enrichmentMode: 'Режим обогащения',
      manual: 'Ручной',
      automatic: 'Автоматический',
      frequency: 'Частота',
      onImport: 'При импорте',
      daily: 'Ежедневно',
      weekly: 'Еженедельно',
      saveSettings: 'Сохранить настройки',
      saving: 'Сохранение...',
      settingsSaved: 'Настройки сохранены',
      errorSaving: 'Ошибка сохранения',
      aboutEnrichment: 'Об обогащении'
    },
    loading: {
      products: 'Загрузка продуктов...',
      data: 'Загрузка данных...',
      content: 'Загрузка контента...',
      almostThere: 'Почти готово...',
      pleaseWait: 'Пожалуйста, подождите...',
      preparingData: 'Подготовка данных...'
    },
    seo: {
      opportunities: 'SEO возможности',
      generateOpportunities: 'Создать возможности',
      generating: 'Создание...',
      categoryGuide: 'Руководство по категории',
      comparison: 'Сравнение',
      howTo: 'Руководство',
      productSpotlight: 'В центре внимания',
      seasonal: 'Сезонное',
      targetKeywords: 'Целевые ключевые слова',
      suggestedStructure: 'Предлагаемая структура',
      createArticle: 'Создать статью',
      creating: 'Создание...',
      copyTitle: 'Копировать заголовок',
      score: 'Оценка',
      difficulty: 'Сложность',
      easy: 'Легко',
      medium: 'Средне',
      hard: 'Сложно'
    },
    blog: {
      autoBlogWriter: 'Автоматический писатель',
      generateMode: 'Режим генерации',
      manualMode: 'Ручной',
      automaticMode: 'Автоматический',
      scheduling: 'Планирование',
      contentSettings: 'Настройки контента',
      internalLinking: 'Внутренние ссылки',
      generateNow: 'Создать сейчас',
      saveSettings: 'Сохранить настройки',
      wordCount: 'Количество слов',
      outputFormat: 'Формат вывода',
      autoPublish: 'Авто-публикация',
      frequency: 'Частота',
      scheduleTime: 'Время планирования',
      dayOfWeek: 'День недели',
      dayOfMonth: 'День месяца'
    }
  },
  zh: {
    nav: {
      dashboard: '仪表板',
      products: '产品',
      stores: '商店',
      seo: 'SEO',
      settings: '设置',
      seoOptimization: '优化',
      seoAltImage: 'ALT 图片',
      seoTags: '标签',
      seoOpportunities: '机会',
      blogArticles: '博客文章',
      aiBlog: 'AI 博客'
    },
    common: {
      loading: '加载中...',
      save: '保存',
      cancel: '取消',
      delete: '删除',
      edit: '编辑',
      view: '查看',
      refresh: '刷新',
      search: '搜索',
      filter: '过滤',
      export: '导出',
      import: '导入',
      close: '关闭',
      back: '返回',
      next: '下一个',
      previous: '上一个',
      submit: '提交',
      success: '成功',
      error: '错误',
      warning: '警告',
      info: '信息'
    },
    dashboard: {
      title: '仪表板',
      totalProducts: '总产品数',
      aiEnriched: 'AI 丰富',
      syncedToShopify: '已同步',
      pendingSync: '待同步',
      topProductTypes: '热门类型',
      recentActivity: '最近活动',
      quickStats: '快速统计',
      uniqueVendors: '唯一供应商',
      avgInventory: '平均库存',
      activeProducts: '活跃产品',
      enrichedProducts: '丰富产品',
      showAll: '显示全部',
      showLess: '显示较少',
      noEnrichedProducts: '没有丰富的产品',
      enrichedAt: '丰富于'
    },
    products: {
      title: '产品',
      searchPlaceholder: '搜索产品...',
      filterBy: '过滤条件',
      allCategories: '所有类别',
      enrichmentStatus: '丰富状态',
      all: '全部',
      enriched: '已丰富',
      pending: '待处理',
      failed: '失败',
      enrichAll: '全部丰富',
      enriching: '丰富中...',
      price: '价格',
      inventory: '库存',
      status: '状态',
      vendor: '供应商',
      category: '类别',
      noProducts: '未找到产品'
    },
    settings: {
      title: '设置',
      language: '语言',
      selectLanguage: '选择语言',
      enrichmentSettings: '丰富设置',
      enrichmentMode: '丰富模式',
      manual: '手动',
      automatic: '自动',
      frequency: '频率',
      onImport: '导入时',
      daily: '每日',
      weekly: '每周',
      saveSettings: '保存设置',
      saving: '保存中...',
      settingsSaved: '设置已保存',
      errorSaving: '保存错误',
      aboutEnrichment: '关于丰富'
    },
    loading: {
      products: '加载产品中...',
      data: '加载数据中...',
      content: '加载内容中...',
      almostThere: '即将完成...',
      pleaseWait: '请稍候...',
      preparingData: '准备数据中...'
    },
    seo: {
      opportunities: 'SEO 机会',
      generateOpportunities: '生成机会',
      generating: '生成中...',
      categoryGuide: '类别指南',
      comparison: '比较',
      howTo: '指南',
      productSpotlight: '产品聚焦',
      seasonal: '季节性',
      targetKeywords: '目标关键词',
      suggestedStructure: '建议结构',
      createArticle: '创建文章',
      creating: '创建中...',
      copyTitle: '复制标题',
      score: '得分',
      difficulty: '难度',
      easy: '简单',
      medium: '中等',
      hard: '困难'
    },
    blog: {
      autoBlogWriter: '自动博客作者',
      generateMode: '生成模式',
      manualMode: '手动',
      automaticMode: '自动',
      scheduling: '日程安排',
      contentSettings: '内容设置',
      internalLinking: '内部链接',
      generateNow: '立即生成',
      saveSettings: '保存设置',
      wordCount: '字数',
      outputFormat: '输出格式',
      autoPublish: '自动发布',
      frequency: '频率',
      scheduleTime: '计划时间',
      dayOfWeek: '星期',
      dayOfMonth: '日期'
    }
  },
  ja: {
    nav: {
      dashboard: 'ダッシュボード',
      products: '製品',
      stores: 'ストア',
      seo: 'SEO',
      settings: '設定',
      seoOptimization: '最適化',
      seoAltImage: 'ALT画像',
      seoTags: 'タグ',
      seoOpportunities: '機会',
      blogArticles: 'ブログ記事',
      aiBlog: 'AIブログ'
    },
    common: {
      loading: '読み込み中...',
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      view: '表示',
      refresh: '更新',
      search: '検索',
      filter: 'フィルター',
      export: 'エクスポート',
      import: 'インポート',
      close: '閉じる',
      back: '戻る',
      next: '次へ',
      previous: '前へ',
      submit: '送信',
      success: '成功',
      error: 'エラー',
      warning: '警告',
      info: '情報'
    },
    dashboard: {
      title: 'ダッシュボード',
      totalProducts: '合計製品数',
      aiEnriched: 'AI強化済み',
      syncedToShopify: '同期済み',
      pendingSync: '同期待ち',
      topProductTypes: '上位タイプ',
      recentActivity: '最近の活動',
      quickStats: 'クイック統計',
      uniqueVendors: '固有ベンダー',
      avgInventory: '平均在庫',
      activeProducts: 'アクティブ製品',
      enrichedProducts: '強化製品',
      showAll: 'すべて表示',
      showLess: '少なく表示',
      noEnrichedProducts: '強化製品なし',
      enrichedAt: '強化済み'
    },
    products: {
      title: '製品',
      searchPlaceholder: '製品を検索...',
      filterBy: 'フィルター',
      allCategories: 'すべてのカテゴリ',
      enrichmentStatus: '強化状態',
      all: 'すべて',
      enriched: '強化済み',
      pending: '保留中',
      failed: '失敗',
      enrichAll: 'すべて強化',
      enriching: '強化中...',
      price: '価格',
      inventory: '在庫',
      status: 'ステータス',
      vendor: 'ベンダー',
      category: 'カテゴリ',
      noProducts: '製品が見つかりません'
    },
    settings: {
      title: '設定',
      language: '言語',
      selectLanguage: '言語を選択',
      enrichmentSettings: '強化設定',
      enrichmentMode: '強化モード',
      manual: '手動',
      automatic: '自動',
      frequency: '頻度',
      onImport: 'インポート時',
      daily: '毎日',
      weekly: '毎週',
      saveSettings: '設定を保存',
      saving: '保存中...',
      settingsSaved: '設定が保存されました',
      errorSaving: '保存エラー',
      aboutEnrichment: '強化について'
    },
    loading: {
      products: '製品を読み込み中...',
      data: 'データを読み込み中...',
      content: 'コンテンツを読み込み中...',
      almostThere: 'もうすぐです...',
      pleaseWait: 'お待ちください...',
      preparingData: 'データを準備中...'
    },
    seo: {
      opportunities: 'SEO機会',
      generateOpportunities: '機会を生成',
      generating: '生成中...',
      categoryGuide: 'カテゴリガイド',
      comparison: '比較',
      howTo: 'ガイド',
      productSpotlight: '製品スポットライト',
      seasonal: '季節',
      targetKeywords: 'ターゲットキーワード',
      suggestedStructure: '提案構造',
      createArticle: '記事を作成',
      creating: '作成中...',
      copyTitle: 'タイトルをコピー',
      score: 'スコア',
      difficulty: '難易度',
      easy: '簡単',
      medium: '中程度',
      hard: '難しい'
    },
    blog: {
      autoBlogWriter: '自動ブログライター',
      generateMode: '生成モード',
      manualMode: '手動',
      automaticMode: '自動',
      scheduling: 'スケジュール',
      contentSettings: 'コンテンツ設定',
      internalLinking: '内部リンク',
      generateNow: '今すぐ生成',
      saveSettings: '設定を保存',
      wordCount: '単語数',
      outputFormat: '出力形式',
      autoPublish: '自動公開',
      frequency: '頻度',
      scheduleTime: 'スケジュール時間',
      dayOfWeek: '曜日',
      dayOfMonth: '日'
    }
  }
};

export function getTranslation(lang: Language): Translations {
  return translations[lang] || translations.en;
}
