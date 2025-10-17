# ✅ Correction de l'erreur DeepSeek API dans le Chat

## 🔍 Problème identifié

Le chat AI affichait l'erreur : `DeepSeek API error: 401 - {"code":401,"message":"Missing authorization header"}`

**Cause** : La clé API DeepSeek n'était pas configurée dans les secrets Supabase.

## ✅ Solution appliquée

### **1. Modification de l'edge function `ai-chat`**

L'edge function utilise maintenant **OpenAI comme fallback** si DeepSeek n'est pas configuré :

```typescript
// Use OpenAI if DeepSeek is not configured
const aiKey = deepseekKey || openaiKey;
const aiProvider = deepseekKey ? "deepseek" : "openai";
```

**Avantages** :
- ✅ Utilise DeepSeek si la clé est configurée (moins cher, plus rapide)
- ✅ Fallback automatique vers OpenAI si DeepSeek n'est pas disponible
- ✅ Même qualité de réponse avec les deux providers

### **2. Support multi-provider**

La fonction `generateResponse` supporte maintenant les deux APIs :

| Provider | API Endpoint | Model | Coût |
|----------|-------------|-------|------|
| **DeepSeek** | `api.deepseek.com` | `deepseek-chat` | ~0.14$/M tokens |
| **OpenAI** | `api.openai.com` | `gpt-4o-mini` | ~0.15$/M tokens |

## 🔧 Configuration requise dans Supabase Dashboard

Pour que le chat fonctionne, vous devez configurer **au moins une** des deux clés API :

### **Option 1 : OpenAI (recommandé, déjà configuré)**

La clé OpenAI est déjà dans votre `.env`. Pour l'ajouter aux secrets Supabase :

1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner votre projet : `ufdhzgqrubbnornjdvgv`
3. Aller dans **Project Settings** → **Edge Functions** → **Manage secrets**
4. Ajouter le secret :
   ```
   Name: OPENAI_API_KEY
   Value: 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
   ```

### **Option 2 : DeepSeek (optionnel, plus économique)**

Si vous voulez utiliser DeepSeek à la place :

1. Créer un compte sur [DeepSeek Platform](https://platform.deepseek.com/)
2. Générer une clé API
3. Dans Supabase Dashboard → Manage secrets :
   ```
   Name: DEEPSEEK_API_KEY
   Value: sk-...votre-clé...
   ```

## 🧪 Test du chat

Après avoir ajouté le secret :

1. Ouvrir l'application
2. Aller dans l'onglet **Chat AI**
3. Tester avec : `"Je cherche un canapé scandinave"`
4. Vous devriez recevoir une réponse personnalisée avec les produits correspondants

## 📊 Comportement actuel

| Clé configurée | Provider utilisé | Status |
|----------------|-----------------|--------|
| ❌ DeepSeek ❌ OpenAI | Aucun | ❌ Erreur |
| ❌ DeepSeek ✅ OpenAI | OpenAI | ✅ Fonctionne |
| ✅ DeepSeek ❌ OpenAI | DeepSeek | ✅ Fonctionne |
| ✅ DeepSeek ✅ OpenAI | DeepSeek | ✅ Fonctionne (priorité à DeepSeek) |

## 🚀 Déploiement effectué

L'edge function `ai-chat` a été redéployée avec succès avec les modifications :
- ✅ Support OpenAI + DeepSeek
- ✅ Fallback automatique
- ✅ Messages d'erreur améliorés
- ✅ Logging du provider utilisé

## 💡 Recommandation

**Pour une utilisation immédiate** : Configurez la clé OpenAI dans les secrets Supabase (voir Option 1 ci-dessus).

**Pour réduire les coûts** : Ajoutez une clé DeepSeek après avoir testé avec OpenAI.

## 📝 Fichiers modifiés

- ✅ `supabase/functions/ai-chat/index.ts` - Support multi-provider
- ✅ Edge function redéployée sur Supabase

## ⚠️ Note importante

Les secrets Supabase sont différents des variables `.env` locales. Les edge functions n'ont **pas accès** aux variables préfixées par `VITE_`. C'est pourquoi nous devons ajouter `OPENAI_API_KEY` (sans le préfixe `VITE_`) dans les secrets Supabase.
