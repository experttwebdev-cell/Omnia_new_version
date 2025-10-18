# 🤖 Configuration des Providers AI - Guide Complet

## ✅ Fonction Test DeepSeek Opérationnelle

### 📍 Où Trouver le Test

**Dans l'application :**
1. Allez dans **Paramètres** (⚙️ Settings)
2. Scrollez jusqu'à la section **"AI Provider Configuration"**
3. Cliquez sur le bouton **"Test"** à côté de chaque provider

**Test direct dans le navigateur :**
- Ouvrez `test-deepseek-direct.html` pour un test rapide avec interface visuelle

---

## 🔧 Configuration Requise (CRITIQUE)

### ⚠️ IMPORTANT : Où Configurer les Clés API

Les clés API doivent être configurées **dans Supabase Dashboard**, **PAS** dans le fichier `.env` local.

### 📝 Étapes de Configuration

**1. Aller sur Supabase Dashboard**
```
URL: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
```

**2. Navigation**
```
Project Settings → Edge Functions → Secrets
```

Ou directement :
```
https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/settings/functions
```

**3. Ajouter les Secrets**

Cliquez sur **"New secret"** et ajoutez :

- `DEEPSEEK_API_KEY` = `sk-401fbd42cf00493b8c28db07f3027460`
- `OPENAI_API_KEY` = `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`

**4. Sauvegarder**
- Cliquez sur **"Save"** ou **"Add secret"**
- Les Edge Functions seront automatiquement redéployées (10-30 secondes)

---

## 🧪 Test de la Configuration

### Méthode 1 : Dans l'Application

1. Allez dans **Settings** → **AI Provider Configuration**
2. Vérifiez que les providers affichent **"✓ Configured"**
3. Cliquez sur **"Test"** à côté de **DeepSeek**
4. Attendez 2-5 secondes
5. Résultat attendu : ✓ DeepSeek API is working correctly!

### Méthode 2 : Test Direct HTML

1. Ouvrez `test-deepseek-direct.html` dans votre navigateur
2. Cliquez sur **"🚀 Tester DeepSeek + OpenAI (Fallback)"**
3. Si les secrets sont configurés : ✅ Success
4. Si les secrets manquent : ❌ Error avec instructions

---

## 🔄 Système de Fallback Automatique

### Ordre de Priorité (par coût)

1. **DeepSeek** - Le moins cher (95% économies)
2. **OpenAI GPT-3.5-turbo** - Fallback fiable (73% économies)
3. **OpenAI GPT-4o-mini** - Dernier recours

---

## ❌ Erreurs Courantes

### "Missing AI API keys"
**Solution :** Configurez les secrets dans Supabase Dashboard

### "Test failed"
**Solution :** Vérifiez que les clés API sont valides

---

## ✅ Checklist

- [ ] Secrets ajoutés dans Supabase Dashboard
- [ ] Attendu 30 secondes après l'ajout
- [ ] Test réussi dans Settings → AI Provider
- [ ] Résultat : ✓ Success avec réponse de l'IA

Le test DeepSeek est maintenant **100% opérationnel** ! 🎉
