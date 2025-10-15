export function detectLanguage(text: string): 'fr' | 'en' | 'es' | 'de' | 'it' {
  const frenchWords = ['le', 'la', 'les', 'de', 'des', 'un', 'une', 'du', 'et', 'à', 'en', 'pour', 'avec', 'dans'];
  const englishWords = ['the', 'of', 'and', 'to', 'a', 'in', 'for', 'is', 'on', 'with', 'as', 'by'];
  const spanishWords = ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'en', 'un', 'una', 'con', 'para'];
  const germanWords = ['der', 'die', 'das', 'den', 'dem', 'des', 'und', 'in', 'von', 'mit', 'für'];
  const italianWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'di', 'da', 'in', 'con', 'per', 'su'];

  const words = text.toLowerCase().split(/\s+/);

  let frenchCount = 0;
  let englishCount = 0;
  let spanishCount = 0;
  let germanCount = 0;
  let italianCount = 0;

  words.forEach(word => {
    if (frenchWords.includes(word)) frenchCount++;
    if (englishWords.includes(word)) englishCount++;
    if (spanishWords.includes(word)) spanishCount++;
    if (germanWords.includes(word)) germanCount++;
    if (italianWords.includes(word)) italianCount++;
  });

  const counts = {
    fr: frenchCount,
    en: englishCount,
    es: spanishCount,
    de: germanCount,
    it: italianCount
  };

  const maxLang = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b);

  return maxLang[0] as 'fr' | 'en' | 'es' | 'de' | 'it';
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
        `comment choisir ${category.toLowerCase()}`
      ],
      structure: (category: string) => [
        `Introduction aux ${category}`,
        'Caractéristiques clés à considérer',
        'Comparaison des produits',
        'Options budget vs premium',
        'Recommandations d\'experts',
        'Questions fréquentes'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} Comparés`,
      description: (category: string) =>
        `Comparaison côte à côte des meilleurs produits ${category.toLowerCase()}. Inclut les spécifications détaillées, les prix, les avantages et inconvénients.`,
      keywords: (category: string) => [
        `comparaison ${category.toLowerCase()}`,
        `meilleur ${category.toLowerCase()} 2024`,
        `avis ${category.toLowerCase()}`
      ],
      structure: [
        'Tableau comparatif rapide',
        'Revues de produits détaillées',
        'Analyse des prix',
        'Meilleur pour différents besoins',
        'Verdict final'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `Guide ${subCategory} ${category}`,
      description: (subCategory: string, category: string, count: number) =>
        `Guide spécialisé sur les options ${subCategory.toLowerCase()} dans la catégorie ${category.toLowerCase()}. Couvre ${count} produits.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `guide ${subCategory.toLowerCase()}`,
        `meilleur ${subCategory.toLowerCase()}`
      ]
    },
    color: {
      title: (color: string, category: string) => `Meilleurs Produits ${category} ${color}`,
      description: (color: string, category: string) =>
        `Collection sélectionnée de ${category.toLowerCase()} ${color.toLowerCase()}. Parfait pour les clients avec des préférences de couleur spécifiques.`,
      keywords: (color: string, category: string) => [
        `${category.toLowerCase()} ${color.toLowerCase()}`,
        `${color.toLowerCase()} ${category.toLowerCase()}`
      ]
    },
    material: {
      title: (material: string, category: string) => `${category} en ${material}: Guide & Entretien`,
      description: (material: string, category: string) =>
        `Contenu éducatif sur les ${category.toLowerCase()} en ${material.toLowerCase()}. Avantages, entretien et recommandations de produits.`,
      keywords: (material: string, category: string) => [
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `entretien ${material.toLowerCase()}`
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
        `meilleur ${category.toLowerCase()} moins de ${max}€`
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
        `how to choose ${category.toLowerCase()}`
      ],
      structure: (category: string) => [
        `Introduction to ${category}`,
        'Key Features to Consider',
        'Product Comparisons',
        'Budget vs Premium Options',
        'Expert Recommendations',
        'Frequently Asked Questions'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} Products Compared`,
      description: (category: string) =>
        `Side-by-side comparison of the best ${category.toLowerCase()} products. Include detailed specs, pricing, pros and cons.`,
      keywords: (category: string) => [
        `${category.toLowerCase()} comparison`,
        `best ${category.toLowerCase()} 2024`,
        `${category.toLowerCase()} reviews`
      ],
      structure: [
        'Quick Comparison Table',
        'Detailed Product Reviews',
        'Price Analysis',
        'Best for Different Needs',
        'Final Verdict'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `${subCategory} ${category} Guide`,
      description: (subCategory: string, category: string, count: number) =>
        `Specialized guide focusing on ${subCategory.toLowerCase()} options within ${category.toLowerCase()}. Cover ${count} products.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `best ${subCategory.toLowerCase()}`,
        `${subCategory.toLowerCase()} guide`
      ]
    },
    color: {
      title: (color: string, category: string) => `Best ${color} ${category} Products`,
      description: (color: string, category: string) =>
        `Curated collection of ${color.toLowerCase()} ${category.toLowerCase()} items. Perfect for customers with specific color preferences.`,
      keywords: (color: string, category: string) => [
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} in ${color.toLowerCase()}`
      ]
    },
    material: {
      title: (material: string, category: string) => `${material} ${category}: Benefits & Care Guide`,
      description: (material: string, category: string) =>
        `Educational content about ${material.toLowerCase()} ${category.toLowerCase()}. Cover benefits, maintenance, and product recommendations.`,
      keywords: (material: string, category: string) => [
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} care`
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
        `best ${category.toLowerCase()} under ${max}`
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
        `cómo elegir ${category.toLowerCase()}`
      ],
      structure: (category: string) => [
        `Introducción a ${category}`,
        'Características clave a considerar',
        'Comparación de productos',
        'Opciones económicas vs premium',
        'Recomendaciones de expertos',
        'Preguntas frecuentes'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} Comparados`,
      description: (category: string) =>
        `Comparación lado a lado de los mejores productos ${category.toLowerCase()}. Incluye especificaciones detalladas, precios, pros y contras.`,
      keywords: (category: string) => [
        `comparación ${category.toLowerCase()}`,
        `mejor ${category.toLowerCase()} 2024`,
        `reseñas ${category.toLowerCase()}`
      ],
      structure: [
        'Tabla comparativa rápida',
        'Reseñas detalladas de productos',
        'Análisis de precios',
        'Mejor para diferentes necesidades',
        'Veredicto final'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `Guía ${subCategory} ${category}`,
      description: (subCategory: string, category: string, count: number) =>
        `Guía especializada sobre opciones ${subCategory.toLowerCase()} en la categoría ${category.toLowerCase()}. Cubre ${count} productos.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `guía ${subCategory.toLowerCase()}`,
        `mejor ${subCategory.toLowerCase()}`
      ]
    },
    color: {
      title: (color: string, category: string) => `Mejores Productos ${category} ${color}`,
      description: (color: string, category: string) =>
        `Colección curada de ${category.toLowerCase()} ${color.toLowerCase()}. Perfecto para clientes con preferencias de color específicas.`,
      keywords: (color: string, category: string) => [
        `${category.toLowerCase()} ${color.toLowerCase()}`,
        `${color.toLowerCase()} ${category.toLowerCase()}`
      ]
    },
    material: {
      title: (material: string, category: string) => `${category} de ${material}: Guía y Cuidado`,
      description: (material: string, category: string) =>
        `Contenido educativo sobre ${category.toLowerCase()} de ${material.toLowerCase()}. Beneficios, mantenimiento y recomendaciones de productos.`,
      keywords: (material: string, category: string) => [
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `cuidado ${material.toLowerCase()}`
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
        `mejor ${category.toLowerCase()} menos de ${max}€`
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
        `wie wählt man ${category.toLowerCase()}`
      ],
      structure: (category: string) => [
        `Einführung in ${category}`,
        'Wichtige Merkmale zu beachten',
        'Produktvergleiche',
        'Budget vs Premium Optionen',
        'Expertenempfehlungen',
        'Häufig gestellte Fragen'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} im Vergleich`,
      description: (category: string) =>
        `Direkter Vergleich der besten ${category.toLowerCase()} Produkte. Enthält detaillierte Spezifikationen, Preise, Vor- und Nachteile.`,
      keywords: (category: string) => [
        `${category.toLowerCase()} Vergleich`,
        `beste ${category.toLowerCase()} 2024`,
        `${category.toLowerCase()} Bewertungen`
      ],
      structure: [
        'Schnelle Vergleichstabelle',
        'Detaillierte Produktbewertungen',
        'Preisanalyse',
        'Am besten für verschiedene Bedürfnisse',
        'Endgültiges Urteil'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `${subCategory} ${category} Ratgeber`,
      description: (subCategory: string, category: string, count: number) =>
        `Spezialisierter Ratgeber zu ${subCategory.toLowerCase()} Optionen in der Kategorie ${category.toLowerCase()}. Umfasst ${count} Produkte.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `beste ${subCategory.toLowerCase()}`,
        `${subCategory.toLowerCase()} Ratgeber`
      ]
    },
    color: {
      title: (color: string, category: string) => `Beste ${color} ${category} Produkte`,
      description: (color: string, category: string) =>
        `Kuratierte Auswahl an ${color.toLowerCase()} ${category.toLowerCase()} Artikeln. Perfekt für Kunden mit spezifischen Farbpräferenzen.`,
      keywords: (color: string, category: string) => [
        `${color.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} in ${color.toLowerCase()}`
      ]
    },
    material: {
      title: (material: string, category: string) => `${material} ${category}: Vorteile & Pflegeanleitung`,
      description: (material: string, category: string) =>
        `Lehrreicher Inhalt über ${material.toLowerCase()} ${category.toLowerCase()}. Vorteile, Wartung und Produktempfehlungen.`,
      keywords: (material: string, category: string) => [
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} Pflege`
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
        `beste ${category.toLowerCase()} unter ${max}€`
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
        `come scegliere ${category.toLowerCase()}`
      ],
      structure: (category: string) => [
        `Introduzione a ${category}`,
        'Caratteristiche chiave da considerare',
        'Confronto prodotti',
        'Opzioni budget vs premium',
        'Raccomandazioni degli esperti',
        'Domande frequenti'
      ]
    },
    comparison: {
      title: (category: string, count: number) => `Top ${Math.min(10, count)} ${category} a Confronto`,
      description: (category: string) =>
        `Confronto affiancato dei migliori prodotti ${category.toLowerCase()}. Include specifiche dettagliate, prezzi, pro e contro.`,
      keywords: (category: string) => [
        `confronto ${category.toLowerCase()}`,
        `migliore ${category.toLowerCase()} 2024`,
        `recensioni ${category.toLowerCase()}`
      ],
      structure: [
        'Tabella comparativa rapida',
        'Recensioni dettagliate dei prodotti',
        'Analisi dei prezzi',
        'Migliore per diverse esigenze',
        'Verdetto finale'
      ]
    },
    subcategory: {
      title: (subCategory: string, category: string) => `Guida ${subCategory} ${category}`,
      description: (subCategory: string, category: string, count: number) =>
        `Guida specializzata sulle opzioni ${subCategory.toLowerCase()} nella categoria ${category.toLowerCase()}. Copre ${count} prodotti.`,
      keywords: (subCategory: string, category: string) => [
        `${subCategory.toLowerCase()} ${category.toLowerCase()}`,
        `guida ${subCategory.toLowerCase()}`,
        `migliore ${subCategory.toLowerCase()}`
      ]
    },
    color: {
      title: (color: string, category: string) => `Migliori Prodotti ${category} ${color}`,
      description: (color: string, category: string) =>
        `Collezione curata di ${category.toLowerCase()} ${color.toLowerCase()}. Perfetto per clienti con preferenze di colore specifiche.`,
      keywords: (color: string, category: string) => [
        `${category.toLowerCase()} ${color.toLowerCase()}`,
        `${color.toLowerCase()} ${category.toLowerCase()}`
      ]
    },
    material: {
      title: (material: string, category: string) => `${category} in ${material}: Guida e Cura`,
      description: (material: string, category: string) =>
        `Contenuto educativo su ${category.toLowerCase()} in ${material.toLowerCase()}. Vantaggi, manutenzione e raccomandazioni sui prodotti.`,
      keywords: (material: string, category: string) => [
        `${category.toLowerCase()} ${material.toLowerCase()}`,
        `${material.toLowerCase()} ${category.toLowerCase()}`,
        `cura ${material.toLowerCase()}`
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
        `migliore ${category.toLowerCase()} sotto ${max}€`
      ]
    }
  }
};
