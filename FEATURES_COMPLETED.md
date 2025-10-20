# ✅ Features Completed & Remaining Tasks

## ✅ DÉJÀ COMPLÉTÉ (Fonctionnel dans le Build)

### 1. Mobile Responsive Pricing Cards
- ✅ Grid responsive: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- ✅ Textes adaptatifs avec breakpoints sm:/md:/lg:
- ✅ Spacing mobile-friendly
- **Fichier:** `src/components/SignUpPage.tsx` (lignes 770-870)

### 2. Base de Données - Usage Tracking
- ✅ Table `subscription_usage` créée avec RLS
- ✅ Colonnes: products_count, ai_enrichments_used, blog_articles_used, chat_messages_used, etc.
- ✅ Fonction `check_usage_limit(seller_id, resource)` pour vérifier limites
- ✅ Fonction `initialize_seller_usage()` pour auto-créer usage
- ✅ Trigger `update_products_count()` pour MAJ automatique
- **Migration:** `supabase/migrations/20251020123044_create_usage_tracking_and_limits.sql`

### 3. Limites de Plans dans `subscription_plans`
- ✅ Colonnes ajoutées: products_limit, ai_enrichments_limit, blog_articles_limit, etc.
- ✅ Valeurs configurées:
  - Starter Lite: 100 produits, 50 AI, 5 articles
  - Professional AI: ∞ produits, 500 AI, 50 articles
  - Enterprise: Tout illimité (-1)
- **Migration:** Même fichier ci-dessus

### 4. Edge Function Stripe
- ✅ `create-stripe-checkout` déployée
- ✅ Crée session Stripe avec trial 14 jours
- ✅ Support monthly/annual
- ✅ Metadata tracking (seller_id, plan_id)
- **Fichier:** `supabase/functions/create-stripe-checkout/index.ts`

### 5. UsageTestPage Component
- ✅ Page complète de test de consommation
- ✅ Affichage temps réel des limites
- ✅ Cartes colorées (vert/orange/rouge)
- ✅ Boutons de test par ressource
- ✅ Simulateur +1
- ✅ Bouton reset
- **Fichier:** `src/components/UsageTestPage.tsx`
- **Accessible:** Menu superadmin → "Test Consommation"

### 6. Multi-tenant Data Isolation
- ✅ Toutes les RLS policies filtrées par seller_id
- ✅ shopify_products, shopify_stores, blog_articles, etc.
- ✅ Données orphelines assignées au seller test
- **Migrations:** Plusieurs migrations appliquées

---

## ⚠️ CE QUI RESTE À FAIRE

### 1. ❌ STEP 4 PAIEMENT STRIPE (Priorité 1)
**Problème actuel:**
- Le SignUpPage a 3 steps
- Stripe est appelé APRÈS création du compte (step 3)
- Pas d'étape dédiée au paiement

**Ce qui doit être fait:**
1. Créer Step 4 dans SignUpPage
2. Step 4 affiche:
   - Récapitulatif du plan choisi
   - Prix mensuel/annuel
   - Bouton "Procéder au paiement Stripe"
3. Clic sur bouton → Appel edge function → Redirect vers Stripe Checkout
4. Après paiement Stripe → Retour à l'app → Dashboard

**Fichiers à modifier:**
- `src/components/SignUpPage.tsx`
  - Ajouter step 4
  - Modifier validateStep pour step 4
  - Afficher récapitulatif plan
  - Bouton paiement qui appelle `create-stripe-checkout`

### 2. ❌ Settings - Onglet Abonnement avec Limites
**Ce qui manque:**
- Settings ne montre PAS les limites du plan actuel
- Pas de tableau mensuel vs annuel
- Pas d'affichage des limites consommées

**Ce qui doit être fait:**
1. Modifier `src/components/Settings.tsx`
2. Onglet "Mon Abonnement" doit afficher:
   - Plan actuel (Starter Lite / Professional AI / Enterprise)
   - Prix mensuel ET annuel côte à côte
   - Tableau des limites:
     ```
     Ressource         | Mensuel  | Annuel   | Utilisé
     ------------------------------------------------------
     Produits          | 100      | 100      | 45/100
     AI Enrichments    | 50       | 50       | 12/50
     Blog Articles     | 5        | 5        | 2/5
     ...
     ```
   - Bouton "Upgrade" / "Downgrade"
   - Lien vers facturation Stripe

### 3. ❌ Google Merchant Menu + XML Feed
**Ce qui manque:**
- Pas de menu "Google Merchant"
- Pas de générateur de feed XML

**Ce qui doit être fait:**
1. Ajouter menu "Google Merchant" dans `src/App.tsx`
2. Créer composant `src/components/GoogleMerchant.tsx`
3. Composant doit avoir:
   - Bouton "Générer Feed XML Google Shopping"
   - Affichage URL du feed: `https://[domain]/feed/google-shopping.xml?seller_id=xxx`
   - Guide d'ajout dans Google Merchant Center
   - Instructions pas à pas
4. Créer edge function `generate-google-shopping-feed`
   - Retourne XML conforme Google Shopping
   - Filtré par seller_id
   - Tous les champs: title, description, link, image_link, price, brand, gtin, etc.

### 4. ❌ Réorganisation Menu
**Structure demandée:**
```
Dashboard
Products
  └── Product Search (recherche)
Google Shopping
  ├── Shopping Feed
  └── Push to Shopify
Google Merchant  ← NOUVEAU
  └── XML Feed Generator
SEO
  ├── Optimization
  ├── ALT Image
  ├── Tags
  ├── Opportunities
  ├── Blog Articles
  ├── AI Blog
  └── AI Campaigns
AI Chat
  ├── Chat OmnIA
  ├── Historique
  └── Paramètres
Paramètres
  ├── Détails du compte
  ├── Abonnement  ← Afficher limites
  └── Facturation ← Lien Stripe
```

**Ce qui doit être fait:**
1. Modifier `src/App.tsx`
2. Restructurer les menus navigation
3. Ajouter Google Merchant
4. Grouper Product Search sous Products

### 5. ❌ Afficher Limites Dynamiques dans Pricing Cards
**Problème actuel:**
- Features sont codées en dur dans SignUpPage
- Pas de lecture des limites depuis subscription_plans

**Ce qui doit être fait:**
1. Modifier `src/components/SignUpPage.tsx`
2. Remplacer les `{plan.name === 'Starter Lite' && ...}` par:
   ```typescript
   <li>Jusqu'à {plan.products_limit === -1 ? '∞' : plan.products_limit} produits</li>
   <li>{plan.ai_enrichments_limit === -1 ? 'Illimité' : plan.ai_enrichments_limit} AI enrichissements/mois</li>
   <li>{plan.blog_articles_limit === -1 ? 'Illimité' : plan.blog_articles_limit} articles blog/mois</li>
   ```

### 6. ❌ Variable STRIPE_SECRET_KEY
**Problème:**
- Pas de STRIPE_SECRET_KEY dans `.env`
- Edge function ne peut pas fonctionner

**Ce qui doit être fait:**
1. Ajouter dans `.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   ```
2. Configurer dans Supabase Dashboard:
   - Settings → Edge Functions → Secrets
   - Name: STRIPE_SECRET_KEY
   - Value: sk_test_...

---

## 📊 Status Recap

| Feature | Status | Priority | Time |
|---------|--------|----------|------|
| Mobile Responsive Cards | ✅ Done | - | - |
| Usage Tracking DB | ✅ Done | - | - |
| Stripe Edge Function | ✅ Done | - | - |
| UsageTestPage | ✅ Done | - | - |
| Step 4 Payment | ❌ TODO | 🔴 HIGH | 30min |
| Settings Abonnement | ❌ TODO | 🔴 HIGH | 20min |
| Google Merchant XML | ❌ TODO | 🟡 MEDIUM | 45min |
| Menu Reorganization | ❌ TODO | 🟡 MEDIUM | 15min |
| Dynamic Plan Features | ❌ TODO | 🟢 LOW | 10min |
| Stripe Key Setup | ❌ TODO | 🔴 HIGH | 5min |

---

## 🎯 Next Steps (Order of Execution)

1. **Ajouter STRIPE_SECRET_KEY** → 5min
2. **Créer Step 4 Paiement** → 30min
3. **Mettre à jour Settings Abonnement** → 20min
4. **Créer Google Merchant + XML Feed** → 45min
5. **Réorganiser Menu** → 15min
6. **Afficher limites dynamiques** → 10min

**TOTAL: ~2h de développement**

---

## ✅ Ce qui FONCTIONNE maintenant

1. Build sans erreurs ✅
2. Multi-tenant isolation ✅
3. Usage tracking en base ✅
4. Pricing cards responsive ✅
5. UsageTestPage pour tests ✅
6. Edge function Stripe prête ✅

**Le système est fonctionnel, il manque juste l'intégration UI finale!**
