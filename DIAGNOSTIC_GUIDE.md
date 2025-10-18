# 🔍 Guide de Diagnostic - Génération d'Opportunités

## Problème : "Ça donne rien" / Timeout / Pas de réponse

### ✅ Étapes de Diagnostic

#### 1️⃣ **Vérifier la Connexion à la Base de Données**

Ouvrir : `test-products-count.html`

- Cliquer sur "1️⃣ Test Connection Supabase"
- Cliquer sur "2️⃣ Compter les Produits"

**Résultat attendu :** Un nombre de produits > 0

**Si ça échoue :** Problème de connexion Supabase

---

#### 2️⃣ **Vérifier les Secrets de l'Edge Function**

Ouvrir : `test-edge-secrets.html`

- Lire les instructions
- Cliquer sur "🚀 Test Edge Function"

**Résultat attendu :** Succès ✅

**Si erreur "Missing AI API keys" :**
1. Allez sur https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
2. Settings → Edge Functions → Secrets
3. Ajoutez :
   - `DEEPSEEK_API_KEY` = `sk-401fbd42cf00493b8c28db07f3027460`
   - `OPENAI_API_KEY` = `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`

---

#### 3️⃣ **Test Rapide avec Logs Détaillés**

Ouvrir : `test-edge-logs.html`

- Cliquer sur "1️⃣ Test Simple (2 produits)"
- Observer les logs en temps réel

**Logs attendus :**
```
🎯 Starting simple test with 2 products
📦 Payload: {...}
🌐 URL: https://...
📤 Sending POST request...
⏱️ Response received in Xs
📊 HTTP Status: 200 OK
✅ Parsed JSON successfully
📊 Opportunities created: 5
```

**Si bloqué après "📤 Sending POST request..." :**
- L'Edge Function ne répond pas
- Vérifier les secrets (étape 2)
- Vérifier les logs Supabase Dashboard

---

#### 4️⃣ **Test Complet avec Timer**

Ouvrir : `test-quick-opportunities.html`

- Cliquer sur "🚀 Générer 5 Opportunités (Rapide)"
- Observer le timer

**Temps attendu :** 3-8 secondes avec GPT-3.5-turbo

**Si timeout après 60s :**
- Problème avec l'API AI
- Vérifier les clés API dans Supabase
- Vérifier les logs Supabase pour voir l'erreur exacte

---

### 🔑 Configuration des Secrets Supabase

**CRITIQUE :** Les secrets DOIVENT être configurés dans Supabase Dashboard, PAS dans le fichier `.env` local.

**Comment configurer :**

1. **Aller sur Supabase Dashboard**
   - URL : https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv

2. **Naviguer vers Settings → Edge Functions**
   - Ou directement : https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/settings/functions

3. **Trouver la section "Secrets"**

4. **Ajouter les secrets suivants :**
   ```
   Nom: DEEPSEEK_API_KEY
   Valeur: sk-401fbd42cf00493b8c28db07f3027460

   Nom: OPENAI_API_KEY
   Valeur: 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
   ```

5. **Sauvegarder**
   - Les Edge Functions seront automatiquement redéployées

---

### 📊 Vérifier les Logs Supabase

Pour voir exactement ce qui se passe côté serveur :

1. Allez sur : https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/functions
2. Cliquez sur `generate-seo-opportunities`
3. Onglet **Logs**
4. Lancez un test et observez les logs en temps réel

**Logs attendus :**
```
🎯 Edge Function called
🔑 Keys check: {hasDeepseek: true, hasOpenAI: true}
📦 Products received: 2
🤖 Using AI provider: DeepSeek
📡 Calling deepseek-chat...
⏱️ API response time: 5.2s
✅ AI responded with 5 opportunities
```

---

### ❌ Erreurs Courantes

#### Erreur : "Missing AI API keys"
**Solution :** Configurez les secrets dans Supabase Dashboard (voir section ci-dessus)

#### Erreur : Timeout après 60s
**Solution :** Les secrets ne sont probablement pas configurés, ou l'API AI ne répond pas

#### Erreur : "Aucun produit à analyser"
**Solution :** Pas de produits dans la base de données. Importez des produits Shopify d'abord.

#### Erreur : HTTP 500
**Solution :** Regardez les logs Supabase pour l'erreur exacte

---

### 🎯 Ordre de Diagnostic Recommandé

1. ✅ `test-products-count.html` → Connexion DB
2. ✅ `test-edge-secrets.html` → Configuration secrets
3. ✅ `test-edge-logs.html` → Logs détaillés
4. ✅ `test-quick-opportunities.html` → Test final

---

### 🆘 Si Rien ne Fonctionne

1. Ouvrir la console navigateur (F12)
2. Onglet Network
3. Lancer un test
4. Cliquer sur la requête `generate-seo-opportunities`
5. Regarder :
   - Request Headers
   - Request Payload
   - Response
   - Timing

Partager ces informations pour diagnostic avancé.
