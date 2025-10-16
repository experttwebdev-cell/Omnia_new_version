// Dans votre Edge Function, remplacez la fonction generateProductResponse
function generateProductResponse(message: string, products: Product[], filters: any, sector: string): string {
  const config = sectorConfig[sector];
  
  if (products.length === 0) {
    // Récupérer les attributs disponibles depuis la base de données pour des suggestions pertinentes
    return generateDynamicSuggestions(sector, filters, supabase);
  }

  const productCount = products.length;
  const activeFilters = Object.entries(filters)
    .filter(([key, value]) => value && !['intent', 'sector'].includes(key))
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  const baseMessages = {
    meubles: `J'ai trouvé ${productCount} meuble${productCount > 1 ? 's' : ''} qui correspondent à votre recherche ! ${activeFilters ? `(filtres: ${activeFilters})` : ''}`,
    montres: `Parfait ! ${productCount} montre${productCount > 1 ? 's' : ''} correspondente${productCount > 1 ? 'nt' : ''} à vos critères. ${activeFilters ? `(filtres: ${activeFilters})` : ''}`,
    pret_a_porter: `Super ! ${productCount} article${productCount > 1 ? 's' : ''} de prêt-à-porter correspondente${productCount > 1 ? 'nt' : ''} à votre style. ${activeFilters ? `(filtres: ${activeFilters})` : ''}`
  };

  let response = baseMessages[sector] || baseMessages.meubles;
  
  const advice = {
    meubles: "\n\n💡 Conseil : N'hésitez pas à me demander des suggestions d'association ou des conseils d'agencement !",
    montres: "\n\n💡 Conseil : Je peux vous aider à choisir en fonction de l'occasion ou de votre style vestimentaire !", 
    pret_a_porter: "\n\n💡 Conseil : Demandez-moi des conseils d'association ou des tenues complètes !"
  };

  response += advice[sector] || advice.meubles;
  response += `\n\nVoici ma sélection :`;

  return response;
}

// 🎯 --- FONCTION POUR GÉNÉRER DES SUGGESTIONS DYNAMIQUES ---
async function generateDynamicSuggestions(sector: string, filters: any, supabase: any): Promise<string> {
  try {
    // Récupérer les attributs disponibles depuis la base de données
    const availableAttributes = await getAvailableAttributes(sector, supabase);
    
    const baseMessage = `Je n'ai pas trouvé de ${filters.type || 'produits'} ${filters.style ? `de style ${filters.style}` : ''} pour le moment. 😊\n\nPuis-je vous aider à affiner votre recherche ? Par exemple :`;
    
    let suggestions = '';
    
    // Suggestions basées sur ce qui est disponible
    if (availableAttributes.styles.length > 0) {
      const styleExamples = getRandomExamples(availableAttributes.styles, 3);
      suggestions += `\n• **Quel style préférez-vous ?** (${styleExamples.join(', ')}...)`;
    }
    
    if (availableAttributes.rooms.length > 0 && sector === 'meubles') {
      const roomExamples = getRandomExamples(availableAttributes.rooms, 3);
      suggestions += `\n• **Quelle pièce souhaitez-vous aménager ?** (${roomExamples.join(', ')}...)`;
    }
    
    if (availableAttributes.materials.length > 0) {
      const materialExamples = getRandomExamples(availableAttributes.materials, 3);
      suggestions += `\n• **Avez-vous des préférences de matériau ?** (${materialExamples.join(', ')}...)`;
    }
    
    if (availableAttributes.colors.length > 0) {
      const colorExamples = getRandomExamples(availableAttributes.colors, 3);
      suggestions += `\n• **Quelle couleur vous attire ?** (${colorExamples.join(', ')}...)`;
    }
    
    // Suggestions spécifiques au secteur
    if (sector === 'montres') {
      suggestions += `\n• **Pour quelle occasion ?** (quotidienne, sport, soirée...)`;
      suggestions += `\n• **Préférez-vous un mouvement ?** (automatique, quartz, mécanique)`;
    }
    
    if (sector === 'pret_a_porter') {
      suggestions += `\n• **Pour quelle occasion ?** (travail, casual, soirée...)`;
      suggestions += `\n• **Quelle saison ?** (été, hiver, printemps/automne)`;
    }
    
    // Suggestion de budget
    suggestions += `\n• **Avez-vous un budget en tête ?**`;
    
    return baseMessage + suggestions;
    
  } catch (error) {
    console.error('Error generating suggestions:', error);
    
    // Fallback avec des suggestions génériques
    return `Je n'ai pas trouvé de produits correspondant exactement à votre recherche. 😊\n\nPuis-je vous aider à affiner votre recherche ? Par exemple :\n• Quel style préférez-vous ?\n• Quelle pièce souhaitez-vous aménager ?\n• Avez-vous des préférences de couleur ou matériau ?\n• Quel est votre budget ?`;
  }
}

// 🗃️ --- FONCTION POUR RÉCUPÉRER LES ATTRIBUTS DISPONIBLES ---
async function getAvailableAttributes(sector: string, supabase: any) {
  try {
    let query = supabase
      .from('shopify_products')
      .select('style, room, material, color, ai_color, ai_material, category, product_type')
      .eq('status', 'active')
      .not('style', 'is', null)
      .limit(100);

    const { data: products, error } = await query;

    if (error || !products) {
      return getFallbackAttributes(sector);
    }

    // Extraire les valeurs uniques non vides
    const attributes = {
      styles: [...new Set(products.map(p => p.style).filter(Boolean))],
      rooms: [...new Set(products.map(p => p.room).filter(Boolean))],
      materials: [...new Set([
        ...products.map(p => p.material).filter(Boolean),
        ...products.map(p => p.ai_material).filter(Boolean)
      ])],
      colors: [...new Set([
        ...products.map(p => p.color).filter(Boolean),
        ...products.map(p => p.ai_color).filter(Boolean)
      ])],
      categories: [...new Set(products.map(p => p.category).filter(Boolean))]
    };

    // Nettoyer et limiter les résultats
    return {
      styles: attributes.styles.slice(0, 10),
      rooms: attributes.rooms.slice(0, 8),
      materials: attributes.materials.slice(0, 8),
      colors: attributes.colors.slice(0, 8),
      categories: attributes.categories.slice(0, 8)
    };

  } catch (error) {
    console.error('Error fetching attributes:', error);
    return getFallbackAttributes(sector);
  }
}

// 🎯 --- FALLBACK ATTRIBUTES PAR SECTEUR ---
function getFallbackAttributes(sector: string) {
  const fallbacks = {
    meubles: {
      styles: ['scandinave', 'moderne', 'industriel', 'rustique', 'minimaliste', 'contemporain', 'vintage', 'classique'],
      rooms: ['salon', 'chambre', 'cuisine', 'bureau', 'salle à manger', 'salle de bain'],
      materials: ['bois', 'cuir', 'tissu', 'métal', 'verre', 'marbre'],
      colors: ['blanc', 'noir', 'gris', 'bois naturel', 'bleu', 'vert'],
      categories: ['canapé', 'table', 'chaise', 'armoire', 'lit', 'meuble TV']
    },
    montres: {
      styles: ['classique', 'sport', 'luxe', 'vintage', 'moderne', 'minimaliste'],
      rooms: [],
      materials: ['acier', 'or', 'titane', 'céramique', 'cuir', 'caoutchouc'],
      colors: ['argent', 'or', 'noir', 'bleu', 'blanc', 'rose gold'],
      categories: ['montre automatique', 'montre quartz', 'chronographe', 'montre connectée']
    },
    pret_a_porter: {
      styles: ['casual', 'formel', 'sportswear', 'chic', 'bohème', 'streetwear'],
      rooms: [],
      materials: ['coton', 'lin', 'soie', 'laine', 'denim', 'cuir'],
      colors: ['noir', 'blanc', 'bleu', 'beige', 'rouge', 'vert'],
      categories: ['chemise', 'pantalon', 'robe', 'veste', 'chaussures', 'accessoires']
    }
  };

  return fallbacks[sector] || fallbacks.meubles;
}

// 🎲 --- FONCTION POUR OBTENIR DES EXEMPLES ALÉATOIRES ---
function getRandomExamples(array: string[], count: number): string[] {
  if (array.length <= count) return array;
  
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}