# 🔍 Diagnostic Chat API - Pourquoi pas de connexion ?

## ❌ Problème identifié

L'erreur `DeepSeek API error: 401 - Missing authorization header` se produit parce que :

1. **L'edge function `ai-chat` cherche la clé DeepSeek** dans `Deno.env.get("DEEPSEEK_API_KEY")`
2. **Cette variable n'existe PAS dans les secrets Supabase**
3. **L'edge function ne peut pas accéder aux variables `.env` locales**

## 🧪 Test créé : `test-api-connections.html`

J'ai créé une page de test complète qui permet de :

### ✅ Tests disponibles

1. **📋 Variables d'environnement**
   - Vérifie que SUPABASE_URL est chargé
   - Vérifie que OPENAI_API_KEY est chargé
   - Affiche les clés (masquées pour sécurité)

2. **🤖 Test DeepSeek API**
   - Test Direct : Vérifie si DeepSeek répond avec une clé valide
   - Test Authorization : Simule l'erreur 401 sans header
   - Vous devrez entrer une clé DeepSeek manuellement pour tester

3. **🧠 Test OpenAI API**
   - Test Direct : Utilise la clé de `.env` pour tester OpenAI
   - Test Authorization : Vérifie le comportement avec une clé invalide
   - Utilise automatiquement votre clé OpenAI

4. **⚡ Test Edge Function**
   - Appelle directement `/functions/v1/ai-chat`
   - Vérifie si l'edge function reçoit les secrets Supabase
   - Teste avec un message réel de recherche de produit

## 🎯 Comment utiliser la page de test

1. **Ouvrir la page** : `test-api-connections.html`
2. **Vérifier les variables** : Section 1 affiche les clés disponibles
3. **Tester OpenAI** : Cliquer "Test Direct OpenAI" (devrait marcher si clé valide)
4. **Tester DeepSeek** : Entrer une clé DeepSeek pour tester (optionnel)
5. **Tester Edge Function** : Cliquer "Test Edge Function" pour voir l'erreur réelle

## 🔑 Vraie solution : Configurer les secrets Supabase

### Les edge functions ne lisent PAS le fichier `.env` !

Les edge functions Supabase ont accès uniquement aux variables configurées dans le Dashboard Supabase :

**Variables automatiques** (déjà disponibles) :
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_DB_URL`

**Variables à configurer manuellement** :
- ❌ `OPENAI_API_KEY` - **À AJOUTER**
- ❌ `DEEPSEEK_API_KEY` - **À AJOUTER** (optionnel)

## 📝 Étapes pour corriger

### Option 1 : Utiliser OpenAI (recommandé)

1. **Aller sur Supabase Dashboard**
   - https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv

2. **Naviguer vers Edge Functions Secrets**
   - Settings → Edge Functions → Manage secrets

3. **Ajouter le secret OPENAI_API_KEY**
   ```
   Name: OPENAI_API_KEY
   Value: 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
   ```

4. **Sauvegarder**
   - Les edge functions auront accès immédiatement

### Option 2 : Utiliser DeepSeek (économique)

1. **Créer un compte DeepSeek**
   - https://platform.deepseek.com/

2. **Générer une API Key**
   - Copier la clé générée

3. **Ajouter dans Supabase Dashboard**
   ```
   Name: DEEPSEEK_API_KEY
   Value: sk-xxxxx (votre clé DeepSeek)
   ```

## 🧪 Résultats attendus après configuration

### Test Edge Function

**Avant configuration** :
```json
{
  "error": "DeepSeek API error: 401 - Missing authorization header",
  "success": false
}
```

**Après configuration** :
```json
{
  "success": true,
  "response": "J'ai trouvé plusieurs canapés scandinaves magnifiques...",
  "products": [...],
  "totalProducts": 5
}
```

## 🔄 Pourquoi l'edge function a été modifiée avec fallback

Le fallback OpenAI a été ajouté pour :
- ✅ Ne pas avoir besoin de 2 clés API
- ✅ Utiliser une API que vous avez déjà configurée
- ✅ Éviter les erreurs si DeepSeek n'est pas configuré

**Logique actuelle** :
```javascript
const aiKey = deepseekKey || openaiKey;
const aiProvider = deepseekKey ? "deepseek" : "openai";
```

**Priorité** :
1. Si DeepSeek configuré → Utilise DeepSeek
2. Sinon → Utilise OpenAI
3. Si aucun → Erreur

## 📊 Résumé visuel

```
┌─────────────────────────────────────────────┐
│  User envoie message dans Chat AI          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Frontend appelle Edge Function ai-chat    │
│  URL: /functions/v1/ai-chat                │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  Edge Function cherche les secrets:         │
│  - Deno.env.get("DEEPSEEK_API_KEY")  ❌    │
│  - Deno.env.get("OPENAI_API_KEY")    ❌    │
└──────────────┬──────────────────────────────┘
               │
               ▼ (Aucune clé trouvée)
┌─────────────────────────────────────────────┐
│  ❌ Erreur 401 - Missing authorization      │
└─────────────────────────────────────────────┘

SOLUTION : Configurer OPENAI_API_KEY dans
           Supabase Dashboard → Edge Functions Secrets
```

## ✅ Fichiers créés pour diagnostic

1. **test-api-connections.html** - Page de test complète
2. **DIAGNOSTIC_CHAT_API.md** - Ce document
3. **AI_CHAT_FIX.md** - Guide de correction détaillé

## 🎯 Prochaine étape

**Ouvre `test-api-connections.html` et clique sur "Test Edge Function"** pour voir l'erreur exacte que l'edge function renvoie. Cela confirmera que le problème vient bien des secrets manquants.
