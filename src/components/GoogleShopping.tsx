import { ShoppingBag, TrendingUp, Package, AlertCircle } from 'lucide-react';

export function GoogleShopping() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-blue-600" />
          Google Shopping
        </h2>
        <p className="text-gray-600 mt-1">
          Gérez et optimisez votre flux de produits Google Shopping
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border-2 border-blue-200 p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Produits</h3>
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">Prêts pour Google Shopping</p>
        </div>

        <div className="bg-white rounded-lg border-2 border-green-200 p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Optimisés</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">Données produits complètes</p>
        </div>

        <div className="bg-white rounded-lg border-2 border-yellow-200 p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Attention Requise</h3>
            <AlertCircle className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">0</p>
          <p className="text-sm text-gray-500 mt-1">Champs manquants</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Intégration Google Shopping
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Optimisez vos produits pour Google Shopping avec des améliorations alimentées par l'IA.
            Assurez-vous que tous les champs requis sont remplis et que vos produits sont prêts pour Google Merchant Center.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="https://merchants.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-medium rounded-lg transition shadow-xl"
            >
              Ouvrir Google Merchant Center
            </a>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Exigences Google Shopping
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <h4 className="font-medium mb-2">Champs Obligatoires :</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Titre du produit</li>
              <li>Description du produit</li>
              <li>Lien produit</li>
              <li>Lien image</li>
              <li>Prix</li>
              <li>Disponibilité</li>
              <li>GTIN ou Marque + MPN</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Champs Recommandés :</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Catégorie de produit</li>
              <li>Type de produit</li>
              <li>Catégorie Google</li>
              <li>État</li>
              <li>Groupe d'âge</li>
              <li>Genre</li>
              <li>Couleur</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
