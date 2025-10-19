import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Package, 
  Sparkles, 
  TrendingUp, 
  Search, 
  X, 
  Filter,
  SlidersHorizontal,
  Zap,
  Clock,
  Tag,
  Palette,
  Box,
  Home,
  Star,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { formatPrice } from '../lib/currency';
import { searchProducts, quickProductSearch, getProductSuggestions } from '../lib/productSearch';
import type { Database } from '../lib/database.types';
import type { ProductSearchFilters, ProductSearchResult } from '../lib/productSearch';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface SearchSuggestion {
  suggestion: string;
  type: 'product' | 'category' | 'style' | 'material';
}

export function ProductSearch() {
  const [searchResult, setSearchResult] = useState<ProductSearchResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ProductSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'date_desc'>('relevance');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Charger les suggestions au démarrage
  useEffect(() => {
    loadInitialSuggestions();
  }, []);

  // Fermer les suggestions en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadInitialSuggestions = async () => {
    try {
      const initialSuggestions = await getProductSuggestions('', 8);
      setSuggestions(initialSuggestions);
    } catch (error) {
      console.error('Error loading initial suggestions:', error);
    }
  };

  const handleInputChange = async (value: string) => {
    setInputValue(value);
    
    if (value.length >= 2) {
      try {
        const newSuggestions = await getProductSuggestions(value, 6);
        setSuggestions(newSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearch = async (searchText: string = inputValue) => {
    if (!searchText.trim()) return;

    setLoading(true);
    setSearchQuery(searchText);
    setIsSearching(true);
    setShowSuggestions(false);

    try {
      const filters: ProductSearchFilters = {
        query: searchText,
        sortBy: sortBy,
        limit: 24
      };

      setActiveFilters(filters);
      
      const result = await searchProducts(filters);
      setSearchResult(result);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResult({
        products: [],
        total: 0,
        hasMore: false,
        searchMeta: {
          originalQuery: searchText,
          processedQuery: searchText,
          searchTime: 0,
          matchType: 'fallback',
          extractedFilters: {}
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSearchResult(null);
    setIsSearching(false);
    setActiveFilters({});
    setSearchQuery('');
    setShowFilters(false);
    searchInputRef.current?.focus();
  };

  const handleSortChange = (newSort: 'relevance' | 'price_asc' | 'price_desc' | 'date_desc') => {
    setSortBy(newSort);
    if (isSearching && searchQuery) {
      handleSearch(searchQuery);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product': return <Package className="w-4 h-4" />;
      case 'category': return <Box className="w-4 h-4" />;
      case 'style': return <Sparkles className="w-4 h-4" />;
      case 'material': return <Palette className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getSuggestionColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'product': return 'text-blue-600 bg-blue-50';
      case 'category': return 'text-green-600 bg-green-50';
      case 'style': return 'text-purple-600 bg-purple-50';
      case 'material': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Fonction pour afficher les filtres extraits par DeepSeek
  const renderExtractedFilters = () => {
    if (!searchResult?.searchMeta?.extractedFilters) return null;

    const filters = searchResult.searchMeta.extractedFilters;
    const filterEntries = Object.entries(filters).filter(([key, value]) => 
      value && key !== 'query' && key !== 'limit' && key !== 'sortBy'
    );

    if (filterEntries.length === 0) return null;

    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-purple-600" />
          <span className="text-sm font-medium text-gray-700">Filtres détectés automatiquement :</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {filterEntries.map(([key, value]) => (
            <span key={key} className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-full text-sm border border-purple-200">
              <Sparkles className="w-3 h-3" />
              {key}: {value}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recherche Intelligente
          </h2>
          <p className="text-gray-600">
            Parlez comme à un assistant - Je comprends le langage naturel
          </p>
        </div>
        {searchResult && (
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{searchResult.total}</span> résultats
              {searchResult.searchMeta && (
                <span className="ml-2">• {searchResult.searchMeta.searchTime}ms</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => inputValue.length >= 2 && setShowSuggestions(true)}
              placeholder="Exemple: 'table basse travertin moins de 100 euros' ou 'canapé scandinave bleu pour salon'..."
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-400"
            />
            {inputValue && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
              >
                <div className="p-2">
                  {suggestions.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(item.suggestion)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 rounded-lg transition group"
                    >
                      <div className={`p-2 rounded-lg ${getSuggestionColor(item.type)}`}>
                        {getSuggestionIcon(item.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 group-hover:text-blue-600">
                          {item.suggestion}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {item.type}
                        </div>
                      </div>
                      <ChevronUp className="w-4 h-4 text-gray-400 transform rotate-45" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border flex items-center gap-2 transition ${
                showFilters 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Options
            </button>
            
            <button
              onClick={() => handleSearch()}
              disabled={loading || !inputValue.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Rechercher
                </>
              )}
            </button>
          </div>
        </div>

        {/* Options de tri */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tri par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as any)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="relevance">Pertinence</option>
                  <option value="date_desc">Plus récent</option>
                  <option value="price_asc">Prix croissant</option>
                  <option value="price_desc">Prix décroissant</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const newFilters = { ...activeFilters, status: e.target.value as any };
                    setActiveFilters(newFilters);
                    if (isSearching) handleSearch(searchQuery);
                  }}
                >
                  <option value="active">Actif</option>
                  <option value="all">Tous</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enrichissement IA
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const newFilters = { ...activeFilters, enrichmentStatus: e.target.value as any };
                    setActiveFilters(newFilters);
                    if (isSearching) handleSearch(searchQuery);
                  }}
                >
                  <option value="all">Tous</option>
                  <option value="enriched">Avec IA</option>
                  <option value="not_enriched">Sans IA</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    const newFilters = { ...activeFilters, inStock: e.target.value === 'in_stock' };
                    setActiveFilters(newFilters);
                    if (isSearching) handleSearch(searchQuery);
                  }}
                >
                  <option value="all">Tous</option>
                  <option value="in_stock">En stock</option>
                  <option value="out_of_stock">Rupture</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filtres extraits par DeepSeek */}
        {renderExtractedFilters()}

        {/* Exemples de recherche */}
        {!isSearching && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Exemples de recherches naturelles :</p>
            <div className="flex flex-wrap gap-2">
              {[
                "table basse travertin moins de 100 euros",
                "canapé scandinave bleu pour salon",
                "chaise design en bois avec promotion",
                "meuble tv moderne en chêne"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInputValue(example);
                    handleSearch(example);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Résultats de Recherche */}
      {isSearching && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* En-tête des résultats */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Résultats de recherche
                </h3>
                {searchQuery && (
                  <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    "{searchQuery}"
                  </span>
                )}
                {searchResult?.searchMeta && (
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {searchResult.searchMeta.searchTime}ms
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      searchResult.searchMeta.matchType === 'exact' 
                        ? 'bg-green-100 text-green-700'
                        : searchResult.searchMeta.matchType === 'partial'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {searchResult.searchMeta.matchType === 'exact' ? 'Correspondance exacte' :
                       searchResult.searchMeta.matchType === 'partial' ? 'Correspondance partielle' : 'Recherche élargie'}
                    </span>
                  </div>
                )}
              </div>
              
              {searchResult && (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {searchResult.products.length} sur {searchResult.total} produit{searchResult.total !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={clearSearch}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Contenu des résultats */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Zap className="w-5 h-5 text-purple-500" />
                    <p>Analyse de votre recherche avec l'IA...</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">Je comprends votre intention pour trouver les meilleurs résultats</p>
                </div>
              </div>
            ) : searchResult?.products.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Aucun produit trouvé
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
                  Essayez de reformuler votre recherche ou utilisez des termes plus généraux.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => handleSuggestionClick('canapé')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    Rechercher "canapé"
                  </button>
                  <button
                    onClick={() => handleSuggestionClick('table')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    Rechercher "table"
                  </button>
                  <button
                    onClick={() => handleSuggestionClick('chaise')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                  >
                    Rechercher "chaise"
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Grille de produits */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResult?.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Chargement supplémentaire */}
                {searchResult?.hasMore && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => {
                        const newFilters = { ...activeFilters, offset: (activeFilters.offset || 0) + 24 };
                        setActiveFilters(newFilters);
                        handleSearch(searchQuery);
                      }}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      Charger plus de produits
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* État Initial - Suggestions */}
      {!isSearching && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Carte de bienvenue */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 border border-blue-100">
            <div className="flex items-center gap-4 mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl">
                <MessageCircle className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  Recherche Conversationnelle
                </h3>
                <p className="text-gray-600">
                  Parlez comme à un assistant - Je comprends le langage naturel
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Décrivez ce que vous cherchez en phrases complètes</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Mentionnez le budget, les couleurs, les matériaux</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>L'IA analyse votre intention pour des résultats précis</span>
              </div>
            </div>
          </div>

          {/* Suggestions rapides */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Recherches populaires
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.suggestion)}
                  className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getSuggestionColor(suggestion.type)}`}>
                      {getSuggestionIcon(suggestion.type)}
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-blue-600">
                      {suggestion.suggestion}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product & { _relevance_score?: number; _match_type?: string } }) {
  const hasPromo = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const discountPercent = hasPromo
    ? Math.round(100 - (Number(product.price) / Number(product.compare_at_price)) * 100)
    : 0;

  const getMatchBadge = () => {
    if (!product._match_type) return null;
    
    const config = {
      exact: { label: 'Exact', color: 'bg-green-100 text-green-700' },
      partial: { label: 'Partiel', color: 'bg-yellow-100 text-yellow-700' },
      fallback: { label: 'Élargi', color: 'bg-gray-100 text-gray-700' }
    };

    const matchConfig = config[product._match_type as keyof typeof config] || config.fallback;
    
    return (
      <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${matchConfig.color} flex items-center gap-1`}>
        <Star className="w-3 h-3" />
        {matchConfig.label}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <div className="relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {/* Badge de correspondance */}
        {getMatchBadge()}

        {/* Badge promotion */}
        {hasPromo && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            -{discountPercent}%
          </div>
        )}

        {/* Badge IA */}
        {product.enrichment_status === 'enriched' && (
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            IA
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition leading-tight">
          {product.title}
        </h4>

        {/* Catégorie et sous-catégorie */}
        {(product.category || product.sub_category) && (
          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <Box className="w-3 h-3" />
            {product.category}
            {product.sub_category && ` • ${product.sub_category}`}
          </p>
        )}

        {/* Prix */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl font-bold text-green-600">
            {formatPrice(Number(product.price), product.currency || 'EUR')}
          </span>
          {hasPromo && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(Number(product.compare_at_price), product.currency || 'EUR')}
            </span>
          )}
        </div>

        {/* Attributs IA */}
        <div className="flex flex-wrap gap-1 mb-3">
          {product.ai_color && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              <Palette className="w-3 h-3" />
              {product.ai_color}
            </span>
          )}
          {product.ai_material && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
              <Tag className="w-3 h-3" />
              {product.ai_material}
            </span>
          )}
          {product.room && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
              <Home className="w-3 h-3" />
              {product.room}
            </span>
          )}
          {product.style && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
              <Sparkles className="w-3 h-3" />
              {product.style}
            </span>
          )}
        </div>

        {/* Statut et stock */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            product.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {product.status === 'active' ? 'Actif' : 'Inactif'}
          </span>
          
          {product.inventory_quantity !== null && product.inventory_quantity !== undefined && (
            <span className={`text-xs font-medium ${
              product.inventory_quantity > 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {product.inventory_quantity > 0 
                ? `${product.inventory_quantity} en stock` 
                : 'Rupture'
              }
            </span>
          )}
        </div>

        {/* Score de pertinence (debug) */}
        {product._relevance_score !== undefined && process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-400">
            Score: {product._relevance_score}
          </div>
        )}
      </div>
    </div>
  );
}