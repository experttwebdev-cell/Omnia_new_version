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
  }
};
