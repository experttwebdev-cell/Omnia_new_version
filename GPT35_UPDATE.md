# ✅ Edge Function mise à jour : GPT-3.5-turbo

## 🎉 Changement effectué

L'edge function `ai-chat` utilise maintenant **GPT-3.5-turbo** au lieu de GPT-4o-mini.

## 💰 Comparaison des coûts

| Model | Input | Output | Économie vs GPT-4o-mini |
|-------|-------|--------|-------------------------|
| GPT-4o-mini | $0.150/M | $0.600/M | - |
| **GPT-3.5-turbo** | $0.050/M | $0.150/M | **-73%** ✅ |
| DeepSeek | $0.014/M | $0.028/M | **-95%** 🚀 |

## 📝 Code modifié

```typescript
// Avant
const model = provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";

// Après
const model = provider === "deepseek" ? "deepseek-chat" : "gpt-3.5-turbo";
```

## 🚀 Déploiement

Edge function redéployée avec succès sur Supabase !

## 🧪 Pour tester

1. Recharger OpenAI (ajouter crédit)
2. OU configurer DeepSeek (encore moins cher)
3. Tester avec "canapé moderne" dans le chat

## ⚡ Prochaine étape

Recharger ton compte OpenAI ou configurer DeepSeek pour activer le chat !
