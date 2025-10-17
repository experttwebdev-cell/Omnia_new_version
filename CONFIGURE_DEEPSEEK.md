# Configuration DeepSeek pour les Edge Functions

## Problème
Les edge functions Supabase ne lisent PAS le fichier `.env` local. Elles utilisent des secrets configurés dans le dashboard Supabase.

## Solution : Configurer les secrets dans Supabase

### Étape 1 : Accéder aux secrets
1. Ouvre le dashboard Supabase : https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/settings/functions
2. Clique sur "Edge Function Secrets" dans le menu latéral

### Étape 2 : Ajouter le secret DeepSeek
1. Clique sur "Add Secret"
2. Nom : `DEEPSEEK_API_KEY`
3. Valeur : `sk-401fbd42cf00493b8c28db07f3027460`
4. Clique sur "Save"

### Étape 3 : Vérifier la configuration OpenAI (déjà fait normalement)
Le secret `OPENAI_API_KEY` devrait déjà être configuré. Si ce n'est pas le cas :
1. Nom : `OPENAI_API_KEY`
2. Valeur : `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`

### Étape 4 : Redéployer l'edge function (IMPORTANT!)
Après avoir ajouté/modifié des secrets, tu DOIS redéployer les edge functions :

```bash
# Si tu utilises Supabase CLI localement
supabase functions deploy ai-chat

# OU via le dashboard Supabase
# Va dans "Edge Functions" → "ai-chat" → "Deploy"
```

> **Note:** Dans notre cas, l'edge function est déjà déployée, il suffit juste d'ajouter le secret et elle le détectera automatiquement au prochain appel.

## Comment ça fonctionne

Une fois configuré, le système utilise automatiquement :
1. **DeepSeek** en priorité (95% moins cher) ✅
2. **GPT-3.5-turbo** en fallback si DeepSeek échoue
3. **GPT-4o-mini** en dernier recours

## Vérifier que ça marche

1. Va dans l'onglet "Chat" de l'application
2. Envoie un message comme "Bonjour"
3. Consulte les logs : https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/logs/edge-functions
4. Tu devrais voir : `✅ Success with deepseek`

## Coûts estimés

- **DeepSeek** : $0.14 par million de tokens → ~$0.001 pour 1000 conversations
- **GPT-3.5-turbo** : $0.50 / $1.50 par million → ~$0.01 pour 1000 conversations
- **GPT-4o-mini** : $0.15 / $0.60 par million → ~$0.005 pour 1000 conversations

**Économies avec DeepSeek : 95% !** 💰
