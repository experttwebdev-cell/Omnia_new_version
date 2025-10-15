import { Store, Key, CheckCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function ShopifyConnectionGuide() {
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const handleCopy = (text: string, step: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const steps = [
    {
      title: "Accéder à votre Admin Shopify",
      description: "Connectez-vous à votre boutique Shopify",
      details: [
        "Allez sur admin.shopify.com",
        "Connectez-vous avec vos identifiants",
        "Vous devez avoir les droits d'administrateur"
      ],
      link: "https://admin.shopify.com"
    },
    {
      title: "Créer une application personnalisée",
      description: "Créez une app pour obtenir les accès API",
      details: [
        "Dans l'admin, allez dans 'Paramètres' (en bas à gauche)",
        "Cliquez sur 'Apps et canaux de vente'",
        "Cliquez sur 'Développer des apps'",
        "Cliquez sur 'Créer une app'",
        "Donnez un nom (ex: 'OmnIA Product Manager')"
      ]
    },
    {
      title: "Configurer les permissions API",
      description: "Définissez les accès nécessaires",
      details: [
        "Dans votre app, allez dans 'Configuration'",
        "Section 'Admin API integration', cliquez 'Configurer'",
        "Activez les permissions suivantes:",
        "  • read_products (lecture produits)",
        "  • write_products (écriture produits)",
        "  • read_content (lecture blog)",
        "  • write_content (écriture blog)",
        "Cliquez 'Enregistrer'"
      ]
    },
    {
      title: "Installer l'application",
      description: "Installez l'app sur votre boutique",
      details: [
        "Cliquez sur 'Installer l'application'",
        "Confirmez l'installation",
        "Vous serez redirigé vers les credentials"
      ]
    },
    {
      title: "Récupérer vos identifiants",
      description: "Copiez le token d'accès",
      details: [
        "Dans 'API credentials', vous verrez:",
        "  • Admin API access token (copiez-le immédiatement)",
        "  • API key",
        "  • API secret key",
        "⚠️ Le token ne sera affiché qu'une seule fois!",
        "Conservez-le en lieu sûr"
      ]
    },
    {
      title: "Obtenir le nom de votre boutique",
      description: "Trouvez votre store name",
      details: [
        "Le nom de boutique est dans l'URL de votre admin",
        "Format: https://[VOTRE-BOUTIQUE].myshopify.com",
        "Exemple: si l'URL est 'https://ma-super-boutique.myshopify.com'",
        "Alors le store name est: 'ma-super-boutique'",
        "N'incluez PAS '.myshopify.com' - juste le nom"
      ],
      example: "ma-super-boutique"
    },
    {
      title: "Connecter dans OmnIA",
      description: "Ajoutez votre boutique",
      details: [
        "Dans OmnIA, allez dans l'onglet 'Stores'",
        "Cliquez sur 'Ajouter un magasin'",
        "Remplissez:",
        "  • Store Name: [nom-boutique]",
        "  • API Token: [votre token d'accès]",
        "Cliquez 'Ajouter'",
        "L'import des produits démarrera automatiquement"
      ]
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <Store className="w-8 h-8 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Guide de connexion Shopify</h1>
          <p className="text-gray-600">Suivez ces étapes pour connecter votre boutique Shopify à OmnIA</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Informations nécessaires</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Store Name</strong>: Le nom de votre boutique (sans .myshopify.com)</li>
              <li>• <strong>Admin API Token</strong>: Token d'accès généré depuis votre admin Shopify</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 mb-1">{step.title}</h3>
                <p className="text-gray-600 mb-3">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="text-sm text-gray-700 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
                {step.example && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-gray-600 uppercase">Exemple:</span>
                        <p className="font-mono text-sm text-gray-800 mt-1">{step.example}</p>
                      </div>
                      <button
                        onClick={() => handleCopy(step.example, index)}
                        className="p-2 hover:bg-gray-200 rounded-lg transition flex-shrink-0"
                      >
                        {copiedStep === index ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Ouvrir Shopify Admin
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-gray-800 mb-2">Vous êtes prêt!</h3>
            <p className="text-gray-700 mb-3">
              Une fois votre boutique connectée, OmnIA importera automatiquement tous vos produits
              et vous pourrez commencer à les enrichir avec l'intelligence artificielle.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition"
              >
                Documentation Shopify
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Conservez votre API token en sécurité - ne le partagez jamais publiquement</li>
          <li>• Le token donne accès complet à vos produits et blogs Shopify</li>
          <li>• Si vous pensez que votre token a été compromis, régénérez-le immédiatement</li>
        </ul>
      </div>
    </div>
  );
}
