# Configuration Netlify - Variables d'environnement

## 🚀 Déploiement sur Netlify

Pour que l'application fonctionne correctement sur Netlify, vous devez configurer les variables d'environnement suivantes :

### 1️⃣ Aller dans les paramètres Netlify

1. Connectez-vous à [Netlify](https://app.netlify.com)
2. Sélectionnez votre site
3. Allez dans **Site settings** > **Environment variables**

### 2️⃣ Ajouter ces variables d'environnement

Cliquez sur **Add a variable** et ajoutez les 3 variables suivantes :

#### Variable 1 : VITE_SUPABASE_URL
```
Key: VITE_SUPABASE_URL
Value: https://ufdhzgqrubbnornjdvgv.supabase.co
```

#### Variable 2 : VITE_SUPABASE_ANON_KEY
```
Key: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
```

#### Variable 3 : VITE_OPENAI_API_KEY (optionnel)
```
Key: VITE_OPENAI_API_KEY
Value: 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
```

### 3️⃣ Redéployer le site

Après avoir ajouté les variables :
1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy** > **Clear cache and deploy site**

### ✅ Vérification

Après le déploiement :
1. Ouvrez la console du navigateur sur votre site Netlify
2. Tapez `window.ENV` et appuyez sur Entrée
3. Vous devriez voir vos variables d'environnement correctement configurées

### 🔧 Comment ça marche ?

1. Le build Netlify exécute : `npm run build && chmod +x inject-env.sh && ./inject-env.sh`
2. Le script `inject-env.sh` crée le fichier `dist/config.js` avec les vraies valeurs
3. Les fichiers HTML de test chargent ce `config.js` avec `<script src="/config.js"></script>`

### 🧪 Test local

Pour tester localement avec les vraies valeurs :
1. Renommez `public/config-local.js` en `public/config.js`
2. Ou utilisez directement les variables dans `.env`

### ⚠️ Sécurité

- ✅ `VITE_SUPABASE_ANON_KEY` est sûr d'être exposé (clé publique)
- ✅ Les Row Level Security (RLS) policies protègent les données
- ❌ Ne JAMAIS exposer `SUPABASE_SERVICE_ROLE_KEY` côté client
