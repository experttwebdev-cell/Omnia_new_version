# ✅ Correction du problème Netlify - Accès base de données

## 🔍 Problème identifié

Netlify ne pouvait pas accéder à la base de données Supabase car les variables d'environnement n'étaient pas correctement injectées dans les fichiers HTML de test.

## 🛠️ Solutions appliquées

### 1. Configuration Netlify mise à jour

**Fichier : `netlify.toml`**
```toml
[build]
  command = "npm run build && chmod +x inject-env.sh && ./inject-env.sh"
  publish = "dist"
```

Le build exécute maintenant automatiquement le script `inject-env.sh` après la compilation.

### 2. Script d'injection amélioré

**Fichier : `inject-env.sh`**
- Crée automatiquement `dist/config.js` avec les vraies valeurs d'environnement
- Affiche des warnings si les variables ne sont pas définies
- Affiche le contenu du fichier pour vérification

### 3. Fichier config.js sécurisé

**Fichier : `public/config.js`**
- Contient maintenant des placeholders au lieu des vraies clés
- Les vraies valeurs sont injectées uniquement au moment du build Netlify

**Fichier : `public/config-local.js`** (nouveau)
- Contient les vraies valeurs pour le développement local
- Ajouté au `.gitignore` pour ne pas être commité

## 📋 Configuration Netlify requise

Sur Netlify, configurez ces 3 variables d'environnement :

### Dans Netlify Dashboard → Site settings → Environment variables

1. **VITE_SUPABASE_URL**
   ```
   https://ufdhzgqrubbnornjdvgv.supabase.co
   ```

2. **VITE_SUPABASE_ANON_KEY**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
   ```

3. **VITE_OPENAI_API_KEY** (optionnel)
   ```
   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
   ```

## 🚀 Étapes de déploiement

1. **Commiter et pusher les changements**
   ```bash
   git add .
   git commit -m "Fix Netlify env variables injection"
   git push
   ```

2. **Configurer les variables sur Netlify**
   - Aller dans Site settings → Environment variables
   - Ajouter les 3 variables ci-dessus

3. **Redéployer**
   - Aller dans Deploys
   - Cliquer "Trigger deploy" → "Clear cache and deploy site"

4. **Vérifier**
   - Ouvrir votre site Netlify
   - Ouvrir la console (F12)
   - Taper `window.ENV`
   - Vérifier que les vraies valeurs apparaissent

## ✅ Résultat attendu

Après le déploiement, tous les fichiers HTML de test (`test-chat-search.html`, `test-opportunities.html`, etc.) pourront accéder à la base de données Supabase.

## 🧪 Tests à effectuer

1. **test-chat-search.html** → Cliquer sur les 30 cas de test
2. **test-opportunities.html** → Charger produits et générer opportunités
3. **test-ai-chat.html** → Envoyer un message de chat

Tous devraient maintenant fonctionner correctement !

## 🔐 Sécurité

- ✅ `VITE_SUPABASE_ANON_KEY` est sûr d'être exposé (clé publique)
- ✅ Les Row Level Security (RLS) policies protègent les données
- ✅ Les vraies clés ne sont plus commitées dans le code
- ❌ Ne JAMAIS exposer `SUPABASE_SERVICE_ROLE_KEY` côté client

## 📝 Fichiers modifiés

- ✅ `netlify.toml` - Ajout du script d'injection au build
- ✅ `inject-env.sh` - Amélioration et simplification
- ✅ `public/config.js` - Placeholders au lieu des vraies clés
- ✅ `public/config-local.js` - Nouveau fichier pour dev local
- ✅ `.gitignore` - Ajout de `config-local.js`
- ✅ `.env.example` - Documentation des variables
- ✅ `NETLIFY_SETUP.md` - Guide détaillé
- ✅ `test-chat-search.html` - 30 cas de test organisés

## 💡 Pour le développement local

Si vous voulez tester localement les fichiers HTML :

**Option 1 : Utiliser config-local.js**
```html
<!-- Dans vos fichiers HTML, remplacez : -->
<script src="/config.js"></script>
<!-- Par : -->
<script src="/config-local.js"></script>
```

**Option 2 : Copier les valeurs**
```bash
cp public/config-local.js public/config.js
```

N'oubliez pas de revenir à `config.js` avec placeholders avant de commiter !
