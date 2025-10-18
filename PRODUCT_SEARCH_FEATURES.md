# Fonctionnalités de Recherche de Produits

## Vue d'ensemble

Un système de recherche de produits centralisé, puissant et réutilisable a été implémenté dans l'application. Ce système permet de rechercher et filtrer les produits de manière avancée à travers toute l'application.

## Fichiers créés

### 1. `src/lib/productSearch.ts`
**Fonction principale de recherche centralisée**

#### Fonctions exportées:

- **`searchProducts(filters, storeId?)`** - Fonction principale de recherche **RECHERCHE DANS 32 CHAMPS !** 🔥
  - Filtres disponibles:
    - `query`: Recherche textuelle libre dans **32 champs** (titre, description, tags, catégorie, sous-catégorie, vendor, SEO, AI vision complète, texture, pattern, finish, design, craftsmanship, room, style, dimensions, characteristics, Google Shopping labels, etc.)
    - `category`: Filtrer par catégorie
    - `subCategory`: Filtrer par sous-catégorie
    - `minPrice` / `maxPrice`: Fourchette de prix
    - `color`: Couleur du produit (AI ou tags)
    - `material`: Matériau du produit (AI ou tags)
    - `shape`: Forme du produit (AI ou tags)
    - `texture`: Texture du produit (AI) ✨ **NOUVEAU**
    - `pattern`: Motif du produit (AI) ✨ **NOUVEAU**
    - `finish`: Finition surface (AI) ✨ **NOUVEAU**
    - `room`: Pièce/destination (salon, chambre) ✨ **NOUVEAU**
    - `style`: Style (moderne, classique) ✨ **NOUVEAU**
    - `craftsmanship`: Niveau qualité (premium, standard) ✨ **NOUVEAU**
    - `tags`: Liste de tags à filtrer
    - `vendor`: Filtrer par vendeur
    - `hasPromo`: Uniquement les produits en promotion
    - `enrichmentStatus`: 'enriched' | 'not_enriched' | 'all'
    - `status`: 'active' | 'draft' | 'archived'
    - `limit`: Nombre de résultats (défaut: 20)
    - `offset`: Pagination
    - `sortBy`: Tri ('relevance', 'price_asc', 'price_desc', 'date_desc', etc.)

- **`searchProductsByIds(productIds)`** - Recherche par IDs
- **`searchProductsByCategory(category, limit?)`** - Recherche par catégorie
- **`findSimilarProducts(productId, limit?)`** - Trouve des produits similaires
- **`getProductSuggestions(query, limit?)`** - Suggestions d'autocomplétion
- **`extractFiltersFromQuery(query)`** - Extrait automatiquement les filtres depuis une requête en langage naturel

#### Fonctionnalités clés:

✅ **Recherche intelligente** avec scoring de pertinence
✅ **Extraction automatique de filtres** depuis le texte (couleur, prix, matériau)
✅ **Multi-critères** avec opérateurs AND/OR
✅ **Recherche floue** dans plusieurs champs simultanément
✅ **Tri personnalisable** (pertinence, prix, date, nom)
✅ **Pagination** intégrée
✅ **Gestion des promotions** automatique

---

### 2. `src/components/ProductSearchBar.tsx`
**Composant de barre de recherche réutilisable**

#### Props:

```typescript
interface ProductSearchBarProps {
  onSearch: (products: Product[], query: string) => void;
  onFiltersChange?: (filters: ProductSearchFilters) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  defaultFilters?: Partial<ProductSearchFilters>;
  storeId?: string;
}
```

#### Fonctionnalités:

✅ **Autocomplétion** en temps réel
✅ **Suggestions** de produits pendant la frappe
✅ **Filtres avancés** repliables (prix, catégorie, couleur, matériau, etc.)
✅ **Debouncing** pour les performances
✅ **Extraction automatique** de filtres depuis la recherche
✅ **Interface responsive** et accessible
✅ **Indicateurs visuels** (loading, nombre de résultats)

---

### 3. `src/components/ProductSearch.tsx`
**Page complète de recherche de produits**

#### Fonctionnalités:

✅ Page dédiée à la recherche de produits
✅ Affichage en grille des résultats
✅ Cartes produits avec images, prix, promotions
✅ Indicateurs d'enrichissement AI
✅ État vide avec exemples de recherche
✅ Compteur de résultats
✅ Interface responsive

---

## Intégrations effectuées

### 1. **Chat OmnIA** (`src/lib/omniaChat.ts`)
- ✅ Utilise maintenant `searchProducts()` centralisée
- ✅ Fonction `searchProductsForChat()` qui convertit les filtres du chat vers le format standard
- ✅ Meilleure détection des intentions de recherche
- ✅ Extraction automatique des filtres (couleur, matériau, prix, promotions)

### 2. **Opportunités SEO** (`src/components/SeoOpportunities.tsx`)
- ✅ Import de `searchProductsByCategory` et `searchProductsByIds`
- ✅ Peut maintenant rechercher des produits pour générer des opportunités ciblées
- ✅ Utilisable pour la création d'articles avec des produits spécifiques

### 3. **Menu Navigation** (`src/App.tsx`)
- ✅ Nouvel item de menu "Recherche Produits" avec icône Search
- ✅ Route `/product-search` ajoutée
- ✅ Composant `ProductSearch` intégré

---

## Exemples d'utilisation

### Utilisation basique dans un composant

```typescript
import { searchProducts } from '../lib/productSearch';

// Recherche simple
const result = await searchProducts({
  query: 'table basse',
  status: 'active',
  limit: 10
});

console.log(result.products); // Tableau de produits
console.log(result.total);    // Nombre total
console.log(result.hasMore);  // Y a-t-il plus de résultats?
```

### Recherche avancée avec filtres

```typescript
const result = await searchProducts({
  query: 'canapé',
  color: 'bleu',
  material: 'tissu',
  minPrice: 200,
  maxPrice: 800,
  hasPromo: true,
  enrichmentStatus: 'enriched',
  sortBy: 'price_asc',
  limit: 20
});
```

### Utilisation du composant SearchBar

```typescript
import { ProductSearchBar } from './components/ProductSearchBar';

function MyComponent() {
  const handleSearch = (products, query) => {
    console.log(`Found ${products.length} products for "${query}"`);
    // Faire quelque chose avec les résultats
  };

  return (
    <ProductSearchBar
      onSearch={handleSearch}
      showAdvancedFilters={true}
      placeholder="Rechercher des produits..."
    />
  );
}
```

### Extraction automatique de filtres

```typescript
import { extractFiltersFromQuery } from '../lib/productSearch';

const filters = extractFiltersFromQuery("canapé bleu en tissu moins de 500€");
// Résultat:
// {
//   query: "canapé",
//   color: "bleu",
//   material: "tissu",
//   maxPrice: 500
// }
```

---

## Cas d'usage

### 1. **Chat AI (OmnIA)**
Le chat peut maintenant comprendre des requêtes complexes:
- "Trouve-moi des tables en bois moins de 300€"
- "Montre-moi les canapés bleus en promotion"
- "Chaises blanches en stock"

### 2. **Opportunités SEO**
- Rechercher des produits par catégorie pour créer des articles
- Trouver des produits similaires pour des comparaisons
- Identifier des produits enrichis AI pour du contenu de qualité

### 3. **Création de produits**
- Vérifier les doublons avant création
- Trouver des produits similaires pour suggestions
- Recherche rapide par ID ou handle Shopify

### 4. **Interface utilisateur**
- Page de recherche dédiée avec filtres avancés
- Autocomplétion pour aide à la saisie
- Tri et filtrage en temps réel

---

## Performance

### Optimisations implémentées:

✅ **Scoring de pertinence** pour tri intelligent des résultats
✅ **Debouncing** des suggestions (300ms)
✅ **Pagination** pour grandes listes
✅ **Requêtes optimisées** avec filtres côté base de données
✅ **Cache** des suggestions (à venir)

### Recommandations futures:

- Créer des vues matérialisées PostgreSQL pour recherches fréquentes
- Implémenter Elasticsearch pour recherche full-text avancée
- Ajouter un cache Redis pour suggestions populaires
- Indexer les colonnes de recherche fréquente

---

## Tests

### Pour tester la nouvelle fonctionnalité:

1. **Page de recherche**
   - Cliquer sur "Recherche Produits" dans le menu
   - Essayer des recherches simples: "table", "chaise", etc.
   - Activer les filtres avancés
   - Tester les différents tris

2. **Chat OmnIA**
   - Ouvrir "AI Chat"
   - Essayer: "Trouve-moi des produits bleus"
   - Essayer: "Canapés moins de 500€"
   - Essayer: "Tables en bois en promotion"

3. **Autocomplétion**
   - Taper dans la barre de recherche
   - Vérifier que les suggestions apparaissent
   - Cliquer sur une suggestion

---

## Prochaines étapes suggérées

1. **Améliorer l'extraction de filtres**
   - Ajouter plus de synonymes (ex: "bon marché" → maxPrice)
   - Gérer plus de langues
   - Détecter les styles et formes

2. **Recherche sémantique**
   - Intégrer un modèle de similarité sémantique
   - Recherche par description longue
   - "Je cherche un canapé confortable pour mon salon"

3. **Historique de recherche**
   - Sauvegarder les recherches de l'utilisateur
   - Suggestions basées sur l'historique
   - Recherches populaires

4. **Filtres sauvegardés**
   - Permettre de sauvegarder des filtres favoris
   - Recherches rapides pré-configurées
   - Alertes sur nouveaux produits correspondants

5. **Analytics**
   - Tracker les recherches effectuées
   - Identifier les termes sans résultats
   - Optimiser le catalogue en conséquence

---

## Support

Pour toute question ou amélioration, référez-vous à la documentation des fichiers:
- `src/lib/productSearch.ts` - Fonctions de recherche
- `src/components/ProductSearchBar.tsx` - Composant barre de recherche
- `src/components/ProductSearch.tsx` - Page de recherche complète
