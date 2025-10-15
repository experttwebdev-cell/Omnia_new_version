# Instructions de Déploiement

## Configuration Requise

Pour que l'application fonctionne après publication, vous devez configurer ces variables d'environnement sur votre plateforme d'hébergement:

### Variables d'Environnement

```
VITE_SUPABASE_URL=https://ufdhzgqrubbnornjdvgv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZGh6Z3FydWJibm9ybmpkdmd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0MjAwMzksImV4cCI6MjA3NTk5NjAzOX0.Xqfe56k9FU-85RBv9h1cxq1UvLU1tUsg24MAdzCqZms
VITE_OPENAI_API_KEY=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
```

## Netlify

1. Allez dans votre projet Netlify
2. Cliquez sur **Site settings** → **Environment variables**
3. Ajoutez les 3 variables ci-dessus avec les valeurs exactes
4. Cliquez sur **Deploys** → **Trigger deploy** → **Deploy site**

## Vercel

1. Allez dans votre projet Vercel
2. Cliquez sur **Settings** → **Environment Variables**
3. Ajoutez les 3 variables ci-dessus avec les valeurs exactes
4. Sélectionnez **Production, Preview, and Development**
5. Retournez à **Deployments** et cliquez sur **Redeploy**

## Important

- Les variables d'environnement sont injectées automatiquement pendant le build par Vite
- Les variables DOIVENT commencer par `VITE_` pour être accessibles dans le code
- Si l'écran reste blanc après déploiement, vérifiez que les variables sont bien configurées
- Ouvrez la console du navigateur (F12) pour voir les erreurs éventuelles
- Après avoir ajouté ou modifié les variables, un redéploiement est nécessaire

## Test Local

Pour tester localement:
```bash
npm install
npm run dev
```

Les variables du fichier `.env` seront utilisées automatiquement.
