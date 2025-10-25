import { useState } from 'react';
import { Download, FileText, Copy, Check, ExternalLink, BookOpen } from 'lucide-react';
import { useAuth } from '../lib/authContext';

export default function GoogleMerchant() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Générer l'URL du flux selon le nouveau format
  const feedUrl = `${window.location.origin}/Shoppingfeed/${user?.id || 'YOUR_SELLER_ID'}.xml`;

  const handleCopy = () => {
    navigator.clipboard.writeText(feedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Google Merchant Center</h1>
        <p className="text-gray-600">
          Générez et configurez votre flux XML Google Shopping pour synchroniser vos produits avec Google Merchant Center
        </p>
      </div>

      {/* XML Feed URL Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Votre Flux XML Google Shopping</h2>
            <p className="text-gray-600 text-sm mb-4">
              Utilisez cette URL pour configurer votre flux de produits dans Google Merchant Center
            </p>

            {/* Feed URL */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">URL du flux XML</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={feedUrl}
                  className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono text-gray-700"
                />
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Format: <code className="bg-gray-100 px-1 rounded">omnia.sale/Shoppingfeed/&#123;SELLER_ID&#125;.xml</code>
              </p>
            </div>

            {/* Test Feed Button */}
            <div className="flex gap-3">
              <a
                href={feedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition"
              >
                <Download className="w-4 h-4" />
                Télécharger le flux XML
              </a>
              <a
                href={feedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <ExternalLink className="w-4 h-4" />
                Prévisualiser
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Setup Guide */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Guide de Configuration Google Merchant Center</h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Créer un compte Google Merchant Center</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Si vous n'avez pas encore de compte, créez-en un sur{' '}
                      <a
                        href="https://merchants.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 font-medium underline"
                      >
                        merchants.google.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Ajouter un flux de produits</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Dans Google Merchant Center, allez dans <strong>Produits → Flux</strong> puis cliquez sur le bouton <strong>+ (Ajouter un flux)</strong>
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Sélectionnez votre pays cible</li>
                      <li>• Choisissez la langue de vos produits</li>
                      <li>• Nommez votre flux (ex: "Mon Catalogue Shopify")</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Configurer la méthode d'import</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Choisissez <strong>"Flux planifiés"</strong> comme méthode d'import
                    </p>
                    <ul className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>• Méthode: <strong>URL planifiée récupérée</strong></li>
                      <li>• Fréquence: Quotidienne (recommandé)</li>
                      <li>• Heure: Choisissez une heure creuse</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Coller l'URL du flux XML</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Collez l'URL de votre flux XML (copiée ci-dessus) dans le champ prévu à cet effet
                    </p>
                    <div className="bg-gray-50 rounded p-2 text-xs font-mono text-gray-700 break-all">
                      {feedUrl}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Format: <code className="bg-gray-100 px-1 rounded">omnia.sale/Shoppingfeed/VOTRE_ID.xml</code>
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 5 */}
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Récupérer et valider</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Cliquez sur <strong>"Récupérer maintenant"</strong> pour tester votre flux. Google validera automatiquement le format et les données.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded p-3 mt-2">
                      <p className="text-sm text-green-800">
                        <strong>✓ Astuce:</strong> La première récupération peut prendre quelques minutes. Surveillez les erreurs dans l'onglet "Diagnostics".
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Format</h3>
          </div>
          <p className="text-sm text-gray-600">XML Google Shopping Feed conforme aux spécifications officielles</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Mise à jour</h3>
          </div>
          <p className="text-sm text-gray-600">Flux mis à jour automatiquement en temps réel avec vos produits</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Compatibilité</h3>
          </div>
          <p className="text-sm text-gray-600">Compatible avec tous les pays et langues supportés par Google Merchant</p>
        </div>
      </div>

      {/* Technical Details */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Détails Techniques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Structure de l'URL</h4>
            <div className="bg-white border border-gray-300 rounded p-3 font-mono text-xs">
              {window.location.origin}/Shoppingfeed/
              <span className="text-blue-600 font-bold">&#123;VOTRE_ID&#125;</span>
              .xml
            </div>
            <p className="text-gray-600 mt-2">
              Votre ID unique est automatiquement inclus dans l'URL pour identifier votre catalogue.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Exemples d'URL</h4>
            <div className="space-y-2 text-xs">
              <div className="bg-white border border-gray-300 rounded p-2 font-mono break-all">
                {window.location.origin}/Shoppingfeed/abc123.xml
              </div>
              <div className="bg-white border border-gray-300 rounded p-2 font-mono break-all">
                {window.location.origin}/Shoppingfeed/shop123.xml
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Link */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-yellow-900 mb-1">Besoin d'aide?</p>
            <p className="text-sm text-yellow-800">
              Pour plus d'informations sur Google Merchant Center, consultez la{' '}
              <a
                href="https://support.google.com/merchants"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium hover:text-yellow-900"
              >
                documentation officielle Google
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}