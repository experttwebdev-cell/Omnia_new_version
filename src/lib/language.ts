type Language = 'fr' | 'en' | 'es' | 'de' | 'it';
type TemplateType = 'categoryGuide' | 'comparison' | 'subcategory' | 'color' | 'material' | 'priceRange';

interface TemplateConfig {
  title: (...args: any[]) => string;
  description: (...args: any[]) => string;
  keywords: (...args: any[]) => string[];
  structure?: (...args: any[]) => string[] | string[];
}

interface ContentPlan {
  title: string;
  description: string;
  keywords: string[];
  structure?: string[];
}

// Enhanced language detection with better patterns and fallback
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default fallback for empty text
  }

  const languagePatterns = {
    fr: /\b(le|la|les|de|des|un|une|du|et|à|en|pour|avec|dans|est|son|ses|par|au|aux)\b/gi,
    en: /\b(the|of|and|to|a|in|for|is|on|with|as|by|that|this|it|are|from|at)\b/gi,
    es: /\b(el|la|los|las|de|del|y|en|un|una|con|para|por|que|se|no|al|lo)\b/gi,
    de: /\b(der|die|das|den|dem|des|und|in|von|mit|für|ist|sich|nicht|auf|ein|eine)\b/gi,
    it: /\b(il|lo|la|i|gli|le|di|da|in|con|per|su|che|non|una|è|del|della)\b/gi
  };

  const scores = {
    fr: (text.toLowerCase().match(languagePatterns.fr) || []).length,
    en: (text.toLowerCase().match(languagePatterns.en) || []).length,
    es: (text.toLowerCase().match(languagePatterns.es) || []).length,
    de: (text.toLowerCase().match(languagePatterns.de) || []).length,
    it: (text.toLowerCase().match(languagePatterns.it) || []).length
  };

  // Find the language with the highest score
  const maxEntry = Object.entries(scores).reduce((a, b) => 
    a[1] > b[1] ? a : b, ['en', 0]
  );

  return maxEntry[0] as Language;
}

// Safe template accessor with fallback
export function getTemplate(lang: Language, type: TemplateType): TemplateConfig {
  const template = opportunityTemplates[lang]?.[type];
  if (!template) {
    console.warn(`Template ${type} not found for language ${lang}, falling back to English`);
    return opportunityTemplates.en[type];
  }
  return template;
}

// Generate complete content plan
export function generateContentPlan(
  lang: Language, 
  type: TemplateType, 
  ...params: any[]
): ContentPlan {
  const template = getTemplate(lang, type);
  const result: ContentPlan = {
    title: template.title(...params),
    description: template.description(...params),
    keywords: template.keywords(...params)
  };

  // Add structure if the template has it
  if (template.structure) {
    result.structure = Array.isArray(template.structure) 
      ? template.structure 
      : template.structure(...params);
  }

  return result;
}

// Detect language and generate content plan in one call
export function autoGenerateContentPlan(
  text: string,
  type: TemplateType,
  ...params: any[]
): ContentPlan {
  const detectedLang = detectLanguage(text);
  return generateContentPlan(detectedLang, type, ...params);
}

// Utility to get all available languages
export function getAvailableLanguages(): Language[] {
  return ['fr', 'en', 'es', 'de', 'it'];
}

// Utility to get all template types
export function getAvailableTemplateTypes(): TemplateType[] {
  return ['categoryGuide', 'comparison', 'subcategory', 'color', 'material', 'priceRange'];
}

export const opportunityTemplates = {
  fr: {
    categoryGuide: {
      title: (category: string) => `Le Guide Complet ${category}`,
      description: (category: string, count: number) =>
        `Créez un guide complet pour les clients souhaitant acheter des produits ${category.toLowerCase()}. Présentez ${count} produits avec des comparaisons et recommandations détaillées.`,
      keywords: (category: string) => [
        `guide d'achat ${category.toLowerCase()}`,
        `meilleur ${category.toLowerCase()}`,
        `comparaison ${category.toLowerCase()}`,
        `comment choisir ${category.toLowerCase()}`,
        `avis ${category.toLowerCase()}`,
        `test ${category.toLowerCase()}`
      ],
      structure: (category: string) => [
        `Introduction aux ${category}`,
        'Caractéristiques clés à considérer',
        'Comparaison des produits',
        'Options budget vs premium',
        'Recommandations d\'experts',
        'Questions fréquentes',
        'Conclusion et verdict final'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} Comparés`,
      description: (category: string) =>
        `Comparaison côte à côte des meilleurs produits ${category.toLowerCase()}. Inclut les spécifications détaillées, les prix, les avantages et inconvénients.`,
      keywords: (category: string) => [
        `comparaison ${category.toLowerCase()}`,
        `meilleur ${category.toLowerCase()} 2024`,
        `avis ${category.toLowerCase()}`,
        `test ${category.toLowerCase()}`,
        `classement ${category.toLowerCase()}`
      ],
      structure: [
        'Tableau comparatif rapide',
        'Revues de produits détaillées',
        'Analyse des prix et valeur',
        'Meilleur pour différents besoins',
        'Avantages et inconvénients',
        'Verdict final et recommandation'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `Guide ${subCategory} ${category}`,
      description: (subCategory: string, category: string, count: number) =>
        `Guide spécialisé sur les options ${subCategory.toLowerCase()} dans la catégorie ${category.toLowerCase()}. Couvre ${count} produits avec analyse experte.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `guide ${subCategory.toLowerCase()}`,
        `meilleur ${subCategory.toLowerCase()}`,
        `avis ${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `comparaison ${subCategory.toLowerCase()}`
      ],
      structure: (subCategory: string, category: string) => [
        `Introduction à ${subCategory} ${category}`,
        'Critères de sélection spécifiques',
        'Comparaison des modèles',
        'Cas d utilisation recommandés',
        'Guide d achat'
      ]
    },
    color: {
      title: (color: string, category: string) => `Meilleurs Produits ${category} ${color}`,
      description: (color: string, category: string) =>
        `Collection sélectionnée de ${category.toLowerCase()} ${color.toLowerCase()}. Parfait pour les clients avec des préférences de couleur spécifiques.`,
      keywords: (color: string, category: string) => [
        `${category.toLowerCase()} ${color.toLowerCase()}`,
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `couleur ${color.toLowerCase()} ${category.toLowerCase()}`,
        `design ${color.toLowerCase()}`,
        `style ${color.toLowerCase()}`
      ],
      structure: (color: string, category: string) => [
        `Introduction aux ${category} ${color}`,
        'Avantages du design et style',
        'Options disponibles',
        'Conseils de style et coordination',
        'Entretien et maintenance'
      ]
    },
    material: {
      title: (material: string, category: string) => `${category} en ${material} : Guide & Entretien`,
      description: (material: string, category: string) =>
        `Contenu éducatif sur les ${category.toLowerCase()} en ${material.toLowerCase()}. Avantages, entretien et recommandations de produits.`,
      keywords: (material: string, category: string) => [
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `entretien ${material.toLowerCase()}`,
        `avantages ${material.toLowerCase()}`,
        `durabilité ${material.toLowerCase()}`
      ],
      structure: (material: string, category: string) => [
        `Introduction aux ${category} en ${material}`,
        `Avantages du ${material}`,
        'Guide d entretien et maintenance',
        'Comparaison avec autres matériaux',
        'Recommandations produits'
      ]
    },
    priceRange: {
      title: (range: string, category: string, max: number) =>
        `Meilleurs ${category} ${range} Moins de ${max === Infinity ? '500+' : max}€`,
      description: (range: string, category: string) =>
        `Sélection de ${category.toLowerCase()} ${range.toLowerCase()} de qualité. Aidez les clients à trouver des options dans leur budget.`,
      keywords: (category: string, range: string, max: number) => [
        `${category.toLowerCase()} abordable`,
        `${category.toLowerCase()} ${range.toLowerCase()}`,
        `meilleur ${category.toLowerCase()} moins de ${max}€`,
        `bon rapport qualité-prix ${category.toLowerCase()}`,
        `économie ${category.toLowerCase()}`
      ],
      structure: (range: string, category: string) => [
        `Introduction aux ${category} ${range}`,
        'Meilleures options par budget',
        'Comparaison valeur/prix',
        'Conseils d achat intelligents',
        'Alternatives premium'
      ]
    }
  },
  en: {
    categoryGuide: {
      title: (category: string) => `The Ultimate ${category} Buying Guide`,
      description: (category: string, count: number) =>
        `Create a comprehensive guide for customers looking to purchase ${category.toLowerCase()} products. Feature ${count} products with detailed comparisons and recommendations.`,
      keywords: (category: string) => [
        `${category.toLowerCase()} buying guide`,
        `best ${category.toLowerCase()}`,
        `${category.toLowerCase()} comparison`,
        `how to choose ${category.toLowerCase()}`,
        `${category.toLowerCase()} reviews`,
        `${category.toLowerCase()} guide 2024`
      ],
      structure: (category: string) => [
        `Introduction to ${category}`,
        'Key Features to Consider',
        'Product Comparisons',
        'Budget vs Premium Options',
        'Expert Recommendations',
        'Frequently Asked Questions',
        'Final Verdict & Conclusion'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} Products Compared`,
      description: (category: string) =>
        `Side-by-side comparison of the best ${category.toLowerCase()} products. Include detailed specs, pricing, pros and cons.`,
      keywords: (category: string) => [
        `${category.toLowerCase()} comparison`,
        `best ${category.toLowerCase()} 2024`,
        `${category.toLowerCase()} reviews`,
        `${category.toLowerCase()} buying guide`,
        `top rated ${category.toLowerCase()}`
      ],
      structure: [
        'Quick Comparison Table',
        'Detailed Product Reviews',
        'Price & Value Analysis',
        'Best for Different Needs',
        'Pros and Cons',
        'Final Verdict & Recommendation'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `${subCategory} ${category} Guide`,
      description: (subCategory: string, category: string, count: number) =>
        `Specialized guide focusing on ${subCategory.toLowerCase()} options within ${category.toLowerCase()}. Cover ${count} products with expert analysis.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `best ${subCategory.toLowerCase()}`,
        `${subCategory.toLowerCase()} guide`,
        `${subCategory.toLowerCase()} ${category.toLowerCase()} reviews`,
        `compare ${subCategory.toLowerCase()}`
      ],
      structure: (subCategory: string, category: string) => [
        `Introduction to ${subCategory} ${category}`,
        'Specific Selection Criteria',
        'Model Comparison',
        'Recommended Use Cases',
        'Buying Guide'
      ]
    },
    color: {
      title: (color: string, category: string) => `Best ${color} ${category} Products`,
      description: (color: string, category: string) =>
        `Curated collection of ${color.toLowerCase()} ${category.toLowerCase()} items. Perfect for customers with specific color preferences.`,
      keywords: (color: string, category: string) => [
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} in ${color.toLowerCase()}`,
        `${color.toLowerCase()} design ${category.toLowerCase()}`,
        `${color.toLowerCase()} style`,
        `${category.toLowerCase()} color options`
      ],
      structure: (color: string, category: string) => [
        `Introduction to ${color} ${category}`,
        'Design & Style Benefits',
        'Available Options',
        'Styling & Coordination Tips',
        'Care & Maintenance'
      ]
    },
    material: {
      title: (material: string, category: string) => `${material} ${category}: Benefits & Care Guide`,
      description: (material: string, category: string) =>
        `Educational content about ${material.toLowerCase()} ${category.toLowerCase()}. Cover benefits, maintenance, and product recommendations.`,
      keywords: (material: string, category: string) => [
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} care`,
        `${material.toLowerCase()} benefits`,
        `${material.toLowerCase()} durability`
      ],
      structure: (material: string, category: string) => [
        `Introduction to ${material} ${category}`,
        `Benefits of ${material}`,
        'Care & Maintenance Guide',
        'Comparison with Other Materials',
        'Product Recommendations'
      ]
    },
    priceRange: {
      title: (range: string, category: string, max: number) =>
        `Best ${range} ${category} Under $${max === Infinity ? '500+' : max}`,
      description: (range: string, category: string) =>
        `Curated selection of ${range.toLowerCase()} ${category.toLowerCase()} products. Help customers find quality options within their budget.`,
      keywords: (category: string, range: string, max: number) => [
        `affordable ${category.toLowerCase()}`,
        `${range.toLowerCase()} ${category.toLowerCase()}`,
        `best ${category.toLowerCase()} under $${max}`,
        `value ${category.toLowerCase()}`,
        `budget ${category.toLowerCase()}`
      ],
      structure: (range: string, category: string) => [
        `Introduction to ${range} ${category}`,
        'Best Options by Budget',
        'Value for Money Comparison',
        'Smart Buying Tips',
        'Premium Alternatives'
      ]
    }
  },
  es: {
    categoryGuide: {
      title: (category: string) => `Guía Completa de ${category}`,
      description: (category: string, count: number) =>
        `Crea una guía completa para clientes que desean comprar productos de ${category.toLowerCase()}. Presenta ${count} productos con comparaciones y recomendaciones detalladas.`,
      keywords: (category: string) => [
        `guía de compra ${category.toLowerCase()}`,
        `mejor ${category.toLowerCase()}`,
        `comparación ${category.toLowerCase()}`,
        `cómo elegir ${category.toLowerCase()}`,
        `reseñas ${category.toLowerCase()}`,
        `guía ${category.toLowerCase()} 2024`
      ],
      structure: (category: string) => [
        `Introducción a ${category}`,
        'Características clave a considerar',
        'Comparación de productos',
        'Opciones económicas vs premium',
        'Recomendaciones de expertos',
        'Preguntas frecuentes',
        'Veredicto final y conclusión'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} Comparados`,
      description: (category: string) =>
        `Comparación lado a lado de los mejores productos ${category.toLowerCase()}. Incluye especificaciones detalladas, precios, pros y contras.`,
      keywords: (category: string) => [
        `comparación ${category.toLowerCase()}`,
        `mejor ${category.toLowerCase()} 2024`,
        `reseñas ${category.toLowerCase()}`,
        `guía compra ${category.toLowerCase()}`,
        `top ${category.toLowerCase()}`
      ],
      structure: [
        'Tabla comparativa rápida',
        'Reseñas detalladas de productos',
        'Análisis de precios y valor',
        'Mejor para diferentes necesidades',
        'Ventajas y desventajas',
        'Veredicto final y recomendación'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `Guía ${subCategory} ${category}`,
      description: (subCategory: string, category: string, count: number) =>
        `Guía especializada sobre opciones ${subCategory.toLowerCase()} en la categoría ${category.toLowerCase()}. Cubre ${count} productos con análisis experto.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `guía ${subCategory.toLowerCase()}`,
        `mejor ${subCategory.toLowerCase()}`,
        `reseñas ${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `comparar ${subCategory.toLowerCase()}`
      ],
      structure: (subCategory: string, category: string) => [
        `Introducción a ${subCategory} ${category}`,
        'Criterios de selección específicos',
        'Comparación de modelos',
        'Casos de uso recomendados',
        'Guía de compra'
      ]
    },
    color: {
      title: (color: string, category: string) => `Mejores Productos ${category} ${color}`,
      description: (color: string, category: string) =>
        `Colección curada de ${category.toLowerCase()} ${color.toLowerCase()}. Perfecto para clientes con preferencias de color específicas.`,
      keywords: (color: string, category: string) => [
        `${category.toLowerCase()} ${color.toLowerCase()}`,
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `diseño ${color.toLowerCase()} ${category.toLowerCase()}`,
        `estilo ${color.toLowerCase()}`,
        `opciones color ${category.toLowerCase()}`
      ],
      structure: (color: string, category: string) => [
        `Introducción a ${category} ${color}`,
        'Beneficios de diseño y estilo',
        'Opciones disponibles',
        'Consejos de estilo y coordinación',
        'Cuidado y mantenimiento'
      ]
    },
    material: {
      title: (material: string, category: string) => `${category} de ${material}: Guía y Cuidado`,
      description: (material: string, category: string) =>
        `Contenido educativo sobre ${category.toLowerCase()} de ${material.toLowerCase()}. Beneficios, mantenimiento y recomendaciones de productos.`,
      keywords: (material: string, category: string) => [
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `cuidado ${material.toLowerCase()}`,
        `beneficios ${material.toLowerCase()}`,
        `durabilidad ${material.toLowerCase()}`
      ],
      structure: (material: string, category: string) => [
        `Introducción a ${category} de ${material}`,
        `Beneficios del ${material}`,
        'Guía de cuidado y mantenimiento',
        'Comparación con otros materiales',
        'Recomendaciones de productos'
      ]
    },
    priceRange: {
      title: (range: string, category: string, max: number) =>
        `Mejores ${category} ${range} Menos de ${max === Infinity ? '500+' : max}€`,
      description: (range: string, category: string) =>
        `Selección curada de ${category.toLowerCase()} ${range.toLowerCase()} de calidad. Ayuda a los clientes a encontrar opciones dentro de su presupuesto.`,
      keywords: (category: string, range: string, max: number) => [
        `${category.toLowerCase()} asequible`,
        `${category.toLowerCase()} ${range.toLowerCase()}`,
        `mejor ${category.toLowerCase()} menos de ${max}€`,
        `valor ${category.toLowerCase()}`,
        `económico ${category.toLowerCase()}`
      ],
      structure: (range: string, category: string) => [
        `Introducción a ${category} ${range}`,
        'Mejores opciones por presupuesto',
        'Comparación calidad-precio',
        'Consejos de compra inteligente',
        'Alternativas premium'
      ]
    }
  },
  de: {
    categoryGuide: {
      title: (category: string) => `Der ultimative ${category} Kaufratgeber`,
      description: (category: string, count: number) =>
        `Erstellen Sie einen umfassenden Ratgeber für Kunden, die ${category.toLowerCase()} Produkte kaufen möchten. Präsentieren Sie ${count} Produkte mit detaillierten Vergleichen und Empfehlungen.`,
      keywords: (category: string) => [
        `${category.toLowerCase()} Kaufratgeber`,
        `beste ${category.toLowerCase()}`,
        `${category.toLowerCase()} Vergleich`,
        `wie wählt man ${category.toLowerCase()}`,
        `${category.toLowerCase()} Bewertungen`,
        `${category.toLowerCase()} Ratgeber 2024`
      ],
      structure: (category: string) => [
        `Einführung in ${category}`,
        'Wichtige Merkmale zu beachten',
        'Produktvergleiche',
        'Budget vs Premium Optionen',
        'Expertenempfehlungen',
        'Häufig gestellte Fragen',
        'Endgültiges Urteil & Fazit'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} im Vergleich`,
      description: (category: string) =>
        `Direkter Vergleich der besten ${category.toLowerCase()} Produkte. Enthält detaillierte Spezifikationen, Preise, Vor- und Nachteile.`,
      keywords: (category: string) => [
        `${category.toLowerCase()} Vergleich`,
        `beste ${category.toLowerCase()} 2024`,
        `${category.toLowerCase()} Bewertungen`,
        `${category.toLowerCase()} Kaufberatung`,
        `top bewertete ${category.toLowerCase()}`
      ],
      structure: [
        'Schnelle Vergleichstabelle',
        'Detaillierte Produktbewertungen',
        'Preis- und Wertanalyse',
        'Am besten für verschiedene Bedürfnisse',
        'Vor- und Nachteile',
        'Endgültiges Urteil & Empfehlung'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `${subCategory} ${category} Ratgeber`,
      description: (subCategory: string, category: string, count: number) =>
        `Spezialisierter Ratgeber zu ${subCategory.toLowerCase()} Optionen in der Kategorie ${category.toLowerCase()}. Umfasst ${count} Produkte mit Expertenanalyse.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `beste ${subCategory.toLowerCase()}`,
        `${subCategory.toLowerCase()} Ratgeber`,
        `${subCategory.toLowerCase()} ${category.toLowerCase()} Bewertungen`,
        `${subCategory.toLowerCase()} vergleichen`
      ],
      structure: (subCategory: string, category: string) => [
        `Einführung in ${subCategory} ${category}`,
        'Spezifische Auswahlkriterien',
        'Modellvergleich',
        'Empfohlene Anwendungsfälle',
        'Kaufberatung'
      ]
    },
    color: {
      title: (color: string, category: string) => `Beste ${color} ${category} Produkte`,
      description: (color: string, category: string) =>
        `Kuratierte Auswahl an ${color.toLowerCase()} ${category.toLowerCase()} Artikeln. Perfekt für Kunden mit spezifischen Farbpräferenzen.`,
      keywords: (color: string, category: string) => [
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} in ${color.toLowerCase()}`,
        `${color.toLowerCase()} Design ${category.toLowerCase()}`,
        `${color.toLowerCase()} Stil`,
        `${category.toLowerCase()} Farboptionen`
      ],
      structure: (color: string, category: string) => [
        `Einführung in ${color} ${category}`,
        'Design- & Stilvorteile',
        'Verfügbare Optionen',
        'Styling- & Koordinationstipps',
        'Pflege & Wartung'
      ]
    },
    material: {
      title: (material: string, category: string) => `${material} ${category}: Vorteile & Pflegeanleitung`,
      description: (material: string, category: string) =>
        `Lehrreicher Inhalt über ${material.toLowerCase()} ${category.toLowerCase()}. Vorteile, Wartung und Produktempfehlungen.`,
      keywords: (material: string, category: string) => [
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} Pflege`,
        `${material.toLowerCase()} Vorteile`,
        `${material.toLowerCase()} Haltbarkeit`
      ],
      structure: (material: string, category: string) => [
        `Einführung in ${material} ${category}`,
        `Vorteile von ${material}`,
        'Pflege- und Wartungsanleitung',
        'Vergleich mit anderen Materialien',
        'Produktempfehlungen'
      ]
    },
    priceRange: {
      title: (range: string, category: string, max: number) =>
        `Beste ${range} ${category} Unter ${max === Infinity ? '500+' : max}€`,
      description: (range: string, category: string) =>
        `Kuratierte Auswahl an ${range.toLowerCase()} ${category.toLowerCase()} Produkten. Helfen Sie Kunden, Qualitätsoptionen innerhalb ihres Budgets zu finden.`,
      keywords: (category: string, range: string, max: number) => [
        `erschwingliche ${category.toLowerCase()}`,
        `${range.toLowerCase()} ${category.toLowerCase()}`,
        `beste ${category.toLowerCase()} unter ${max}€`,
        `Wert ${category.toLowerCase()}`,
        `Budget ${category.toLowerCase()}`
      ],
      structure: (range: string, category: string) => [
        `Einführung in ${range} ${category}`,
        'Beste Optionen nach Budget',
        'Preis-Leistungs-Vergleich',
        'Kaufberatungstipps',
        'Premium-Alternativen'
      ]
    }
  },
  it: {
    categoryGuide: {
      title: (category: string) => `La Guida Completa ${category}`,
      description: (category: string, count: number) =>
        `Crea una guida completa per i clienti che desiderano acquistare prodotti ${category.toLowerCase()}. Presenta ${count} prodotti con confronti e raccomandazioni dettagliati.`,
      keywords: (category: string) => [
        `guida acquisto ${category.toLowerCase()}`,
        `migliore ${category.toLowerCase()}`,
        `confronto ${category.toLowerCase()}`,
        `come scegliere ${category.toLowerCase()}`,
        `recensioni ${category.toLowerCase()}`,
        `guida ${category.toLowerCase()} 2024`
      ],
      structure: (category: string) => [
        `Introduzione a ${category}`,
        'Caratteristiche chiave da considerare',
        'Confronto prodotti',
        'Opzioni budget vs premium',
        'Raccomandazioni degli esperti',
        'Domande frequenti',
        'Verdetto finale e conclusione'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} a Confronto`,
      description: (category: string) =>
        `Confronto affiancato dei migliori prodotti ${category.toLowerCase()}. Include specifiche dettagliate, prezzi, pro e contro.`,
      keywords: (category: string) => [
        `confronto ${category.toLowerCase()}`,
        `migliore ${category.toLowerCase()} 2024`,
        `recensioni ${category.toLowerCase()}`,
        `guida acquisto ${category.toLowerCase()}`,
        `top ${category.toLowerCase()}`
      ],
      structure: [
        'Tabella comparativa rapida',
        'Recensioni dettagliate dei prodotti',
        'Analisi prezzi e valore',
        'Migliore per diverse esigenze',
        'Pro e contro',
        'Verdetto finale e raccomandazione'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `Guida ${subCategory} ${category}`,
      description: (subCategory: string, category: string, count: number) =>
        `Guida specializzata sulle opzioni ${subCategory.toLowerCase()} nella categoria ${category.toLowerCase()}. Copre ${count} prodotti con analisi esperta.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `guida ${subCategory.toLowerCase()}`,
        `migliore ${subCategory.toLowerCase()}`,
        `recensioni ${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `confronta ${subCategory.toLowerCase()}`
      ],
      structure: (subCategory: string, category: string) => [
        `Introduzione a ${subCategory} ${category}`,
        'Criteri di selezione specifici',
        'Confronto modelli',
        'Casi d uso consigliati',
        'Guida all acquisto'
      ]
    },
    color: {
      title: (color: string, category: string) => `Migliori Prodotti ${category} ${color}`,
      description: (color: string, category: string) =>
        `Collezione curata di ${category.toLowerCase()} ${color.toLowerCase()}. Perfetto per clienti con preferenze di colore specifiche.`,
      keywords: (color: string, category: string) => [
        `${category.toLowerCase()} ${color.toLowerCase()}`,
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `design ${color.toLowerCase()} ${category.toLowerCase()}`,
        `stile ${color.toLowerCase()}`,
        `opzioni colore ${category.toLowerCase()}`
      ],
      structure: (color: string, category: string) => [
        `Introduzione a ${category} ${color}`,
        'Vantaggi design e stile',
        'Opzioni disponibili',
        'Consigli stile e coordinamento',
        'Cura e manutenzione'
      ]
    },
    material: {
      title: (material: string, category: string) => `${category} in ${material}: Guida e Cura`,
      description: (material: string, category: string) =>
        `Contenuto educativo su ${category.toLowerCase()} in ${material.toLowerCase()}. Vantaggi, manutenzione e raccomandazioni sui prodotti.`,
      keywords: (material: string, category: string) => [
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `cura ${material.toLowerCase()}`,
        `vantaggi ${material.toLowerCase()}`,
        `durata ${material.toLowerCase()}`
      ],
      structure: (material: string, category: string) => [
        `Introduzione a ${category} in ${material}`,
        `Vantaggi del ${material}`,
        'Guida alla cura e manutenzione',
        'Confronto con altri materiali',
        'Raccomandazioni prodotti'
      ]
    },
    priceRange: {
      title: (range: string, category: string, max: number) =>
        `Migliori ${category} ${range} Sotto ${max === Infinity ? '500+' : max}€`,
      description: (range: string, category: string) =>
        `Selezione curata di prodotti ${category.toLowerCase()} ${range.toLowerCase()} di qualità. Aiuta i clienti a trovare opzioni nel loro budget.`,
      keywords: (category: string, range: string, max: number) => [
        `${category.toLowerCase()} economico`,
        `${category.toLowerCase()} ${range.toLowerCase()}`,
        `migliore ${category.toLowerCase()} sotto ${max}€`,
        `valore ${category.toLowerCase()}`,
        `budget ${category.toLowerCase()}`
      ],
      structure: (range: string, category: string) => [
        `Introduzione a ${category} ${range}`,
        'Migliori opzioni per budget',
        'Confronto qualità-prezzo',
        'Consigli acquisto intelligente',
        'Alternative premium'
      ]
    }
  }
};