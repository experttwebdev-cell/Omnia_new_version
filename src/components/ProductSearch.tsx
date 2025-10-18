import { useState } from 'react';
import { ProductSearchBar } from './ProductSearchBar';
import { Package, Sparkles, TrendingUp } from 'lucide-react';
import { formatPrice } from '../lib/currency';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['shopify_products']['Row'];

export function ProductSearch() {
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (products: Product[], query: string) => {
    setSearchResults(products);
    setSearchQuery(query);
    setIsSearching(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Recherche de Produits
        </h2>
        <p className="text-gray-600">
          Recherchez dans votre catalogue avec des filtres avancés
        </p>
      </div>

      <ProductSearchBar
        onSearch={handleSearch}
        showAdvancedFilters={true}
        placeholder="Rechercher par nom, catégorie, couleur, matériau..."
      />

      {isSearching && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Résultats de recherche
              {searchQuery && (
                <span className="text-sm font-normal text-gray-600 ml-2">
                  pour "{searchQuery}"
                </span>
              )}
            </h3>
            <span className="text-sm text-gray-600">
              {searchResults.length} produit{searchResults.length !== 1 ? 's' : ''} trouvé{searchResults.length !== 1 ? 's' : ''}
            </span>
          </div>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Aucun produit trouvé
              </h3>
              <p className="text-sm text-gray-500">
                Essayez d'ajuster vos filtres ou votre recherche
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {searchResults.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      )}

      {!isSearching && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-12 text-center border border-blue-100">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <Package className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Commencez votre recherche
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Utilisez la barre de recherche ci-dessus pour trouver des produits par nom, catégorie, couleur, matériau, prix, et plus encore.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200">
              Exemple: "table basse bois"
            </span>
            <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200">
              Exemple: "canapé bleu moins de 500€"
            </span>
            <span className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm border border-gray-200">
              Exemple: "chaise promotion"
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const hasPromo = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const discountPercent = hasPromo
    ? Math.round(100 - (Number(product.price) / Number(product.compare_at_price)) * 100)
    : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group">
      <div className="relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-48 object-cover rounded-t-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-400" />
          </div>
        )}

        {hasPromo && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
            -{discountPercent}%
          </div>
        )}

        {product.enrichment_status === 'enriched' && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            AI
          </div>
        )}
      </div>

      <div className="p-4">
        <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition">
          {product.title}
        </h4>

        {product.category && (
          <p className="text-xs text-gray-500 mb-2">
            {product.category}
            {product.sub_category && ` • ${product.sub_category}`}
          </p>
        )}

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

        {(product.ai_color || product.ai_material) && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.ai_color && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                {product.ai_color}
              </span>
            )}
            {product.ai_material && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                {product.ai_material}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            product.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {product.status}
          </span>
          {product.inventory_quantity !== null && product.inventory_quantity !== undefined && (
            <span className="text-xs text-gray-500">
              Stock: {product.inventory_quantity}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
 