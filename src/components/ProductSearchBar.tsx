import { useState, useEffect, useRef } from 'react';
import { Search, X, Filter, Loader2, Tag, TrendingUp, Package } from 'lucide-react';
import { searchProducts, getProductSuggestions, extractFiltersFromQuery, type ProductSearchFilters } from '../lib/productSearch';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['shopify_products']['Row'];

interface ProductSearchBarProps {
  onSearch: (products: Product[], query: string) => void;
  onFiltersChange?: (filters: ProductSearchFilters) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  defaultFilters?: Partial<ProductSearchFilters>;
  storeId?: string;
}

export function ProductSearchBar({
  onSearch,
  onFiltersChange,
  placeholder = "Rechercher des produits...",
  showAdvancedFilters = false,
  defaultFilters = {},
  storeId
}: ProductSearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductSearchFilters>({
    status: 'active',
    limit: 20,
    sortBy: 'relevance',
    ...defaultFilters
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length >= 2) {
        const results = await getProductSuggestions(query, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query;

    if (!finalQuery.trim()) {
      return;
    }

    setLoading(true);
    setShowSuggestions(false);

    try {
      const extractedFilters = extractFiltersFromQuery(finalQuery);
      const searchFilters: ProductSearchFilters = {
        ...filters,
        ...extractedFilters,
        query: extractedFilters.query || finalQuery
      };

      const result = await searchProducts(searchFilters, storeId);

      if (onFiltersChange) {
        onFiltersChange(searchFilters);
      }

      onSearch(result.products, finalQuery);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const updateFilter = (key: keyof ProductSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1" ref={suggestionsRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder={placeholder}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
            {query && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleSearch()}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="hidden sm:inline">Recherche...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span className="hidden sm:inline">Rechercher</span>
            </>
          )}
        </button>

        {showAdvancedFilters && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 rounded-lg transition flex items-center gap-2 ${
              showFilters
                ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
        )}
      </div>

      {showAdvancedFilters && showFilters && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres Avancés
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prix Min (€)
              </label>
              <input
                type="number"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Prix Max (€)
              </label>
              <input
                type="number"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Catégorie
              </label>
              <input
                type="text"
                value={filters.category || ''}
                onChange={(e) => updateFilter('category', e.target.value || undefined)}
                placeholder="Toutes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Couleur
              </label>
              <input
                type="text"
                value={filters.color || ''}
                onChange={(e) => updateFilter('color', e.target.value || undefined)}
                placeholder="Toutes"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Matériau
              </label>
              <input
                type="text"
                value={filters.material || ''}
                onChange={(e) => updateFilter('material', e.target.value || undefined)}
                placeholder="Tous"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Statut
              </label>
              <select
                value={filters.status || 'active'}
                onChange={(e) => updateFilter('status', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="active">Actif</option>
                <option value="draft">Brouillon</option>
                <option value="archived">Archivé</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Enrichissement
              </label>
              <select
                value={filters.enrichmentStatus || 'all'}
                onChange={(e) => updateFilter('enrichmentStatus', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Tous</option>
                <option value="enriched">Enrichis</option>
                <option value="not_enriched">Non enrichis</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Trier par
              </label>
              <select
                value={filters.sortBy || 'relevance'}
                onChange={(e) => updateFilter('sortBy', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="relevance">Pertinence</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
                <option value="date_desc">Plus récent</option>
                <option value="date_asc">Plus ancien</option>
                <option value="title_asc">Nom A-Z</option>
                <option value="title_desc">Nom Z-A</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasPromo || false}
                onChange={(e) => updateFilter('hasPromo', e.target.checked || undefined)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <TrendingUp className="w-4 h-4 text-red-500" />
              Promotions uniquement
            </label>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setFilters({
                  status: 'active',
                  limit: 20,
                  sortBy: 'relevance',
                  ...defaultFilters
                });
                if (onFiltersChange) {
                  onFiltersChange({
                    status: 'active',
                    limit: 20,
                    sortBy: 'relevance',
                    ...defaultFilters
                  });
                }
              }}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => handleSearch()}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
