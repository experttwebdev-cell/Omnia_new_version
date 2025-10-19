# 🔐 Identifiants de Connexion - Système Multi-Tenant

## ✅ Migration Appliquée avec Succès

La base de données multi-tenant est maintenant opérationnelle avec:
- ✅ Tables: sellers, subscriptions, subscription_plans, usage_tracking
- ✅ seller_id ajouté aux tables existantes
- ✅ Fonctions SQL: get_seller_limits, can_seller_perform_action, increment_usage
- ✅ RLS activé sur toutes les tables
- ✅ 3 plans configurés

## 🎯 Comptes Créés

### 1. Super Admin (Accès Complet)
```
Email: admin@smartecommerce.ai
Password: (À configurer via Supabase Auth)
Role: superadmin
Status: active
ID: 00000000-0000-0000-0000-000000000001
```

**Accès:**
- SuperAdminDashboard
- Voir tous les sellers
- Gérer les abonnements
- Aucune limitation
- Accès à toutes les fonctionnalités

### 2. Seller de Test (Plan Professional - Trial)
```
Email: test@seller.com
Password: (À créer via signup)
Role: seller
Status: trial
Plan: Professional AI (79€/mois)
Trial expire: 14 jours
ID: 3c0904f0-a0fc-42f1-8e13-c3e2717bf83a
```

**Limites du plan Professional:**
- ✅ 2000 produits maximum
- ✅ 5000 optimisations/mois
- ✅ 5 articles IA/mois
- ✅ 3 campagnes actives
- ✅ 5000 réponses chat/mois

**Usage actuel:**
- 0 / 2000 produits
- 0 / 5000 optimisations
- 0 / 5 articles
- 0 / 5000 réponses chat

## 🚀 Comment Se Connecter

### Option 1: Via l'Application (Recommandé)

1. **Lancer l'application:**
   ```bash
   npm run dev
   ```

2. **Accéder à la landing page:**
   - Ouvrir http://localhost:5173
   - Vous verrez la landing page avec les 3 plans

3. **Créer un compte:**
   - Cliquer "Commencer l'essai gratuit"
   - Choisir un plan
   - Remplir le formulaire d'inscription
   - Le compte sera créé automatiquement avec:
     - Seller record
     - Subscription en trial (14 jours)
     - Usage tracking initialisé

### Option 2: Se Connecter avec le Super Admin

**IMPORTANT:** Le super admin doit d'abord être configuré dans Supabase Auth.

1. **Aller dans Supabase Dashboard:**
   - https://supabase.com/dashboard
   - Sélectionner votre projet
   - Aller dans "Authentication" > "Users"

2. **Créer l'utilisateur admin:**
   - Cliquer "Add user" > "Create new user"
   - Email: `admin@smartecommerce.ai`
   - Password: Choisir un mot de passe sécurisé (ex: Admin123!)
   - Confirm email: ✓ Auto-confirm
   - Cliquer "Create user"

3. **Lier l'utilisateur au seller:**
   ```sql
   -- Dans SQL Editor
   UPDATE sellers
   SET id = (SELECT id FROM auth.users WHERE email = 'admin@smartecommerce.ai')
   WHERE email = 'admin@smartecommerce.ai';
   ```

4. **Se connecter:**
   - Aller sur l'app
   - Cliquer "Connexion"
   - Email: admin@smartecommerce.ai
   - Password: (celui que vous avez choisi)
   - Vous serez redirigé vers le SuperAdminDashboard

## 📊 Plans Disponibles

### 🟢 Starter Lite - 9.99€/mois
- 100 produits
- 300 optimisations/mois
- 1 article IA/mois
- 1 campagne active
- 200 réponses chat/mois

### 🔵 Professional AI - 79€/mois (★ Populaire)
- 2000 produits
- 5000 optimisations/mois
- 5 articles IA/mois
- 3 campagnes actives
- 5000 réponses chat/mois

### 🟣 Enterprise Commerce+ - 199€/mois
- **Produits illimités**
- **Optimisations illimitées**
- **Articles illimités**
- **Campagnes illimitées**
- **Réponses chat illimitées**

## 🧪 Tester le Système

### Test 1: Signup Flow
```bash
1. npm run dev
2. Ouvrir http://localhost:5173
3. Cliquer "Commencer l'essai gratuit"
4. Sélectionner "Professional AI"
5. Remplir:
   - Nom: Test User
   - Email: user@test.com
   - Password: Test123!
6. Vérifier:
   ✓ Compte créé
   ✓ Redirection vers dashboard
   ✓ UsageDashboard visible
```

### Test 2: Vérifier les Limites
```sql
-- Voir les limites d'un seller
SELECT * FROM get_seller_limits('SELLER_ID'::uuid);

-- Vérifier si action autorisée
SELECT can_seller_perform_action('SELLER_ID'::uuid, 'add_product');

-- Voir l'usage actuel
SELECT * FROM usage_tracking WHERE seller_id = 'SELLER_ID'::uuid;
```

### Test 3: Incrémenter l'Usage
```sql
-- Simuler l'ajout de 5 produits
SELECT increment_usage('SELLER_ID'::uuid, 'add_product', 5);

-- Simuler 10 optimisations
SELECT increment_usage('SELLER_ID'::uuid, 'optimize', 10);

-- Vérifier l'usage mis à jour
SELECT * FROM usage_tracking WHERE seller_id = 'SELLER_ID'::uuid;
```

## 🔧 Requêtes SQL Utiles

### Lister tous les sellers
```sql
SELECT
  s.id,
  s.email,
  s.full_name,
  s.company_name,
  s.role,
  s.status,
  s.trial_ends_at,
  sub.plan_id,
  sub.status as subscription_status
FROM sellers s
LEFT JOIN subscriptions sub ON s.id = sub.seller_id
ORDER BY s.created_at DESC;
```

### Voir l'usage de tous les sellers
```sql
SELECT
  s.email,
  s.company_name,
  u.products_count,
  u.optimizations_count,
  u.articles_count,
  u.chat_responses_count,
  sp.max_products,
  sp.max_optimizations_monthly
FROM sellers s
JOIN usage_tracking u ON s.id = u.seller_id
JOIN subscriptions sub ON s.id = sub.seller_id
JOIN subscription_plans sp ON sub.plan_id = sp.id
WHERE u.month = date_trunc('month', now())::date;
```

### Créer un nouveau seller manuellement
```sql
DO $$
DECLARE v_seller_id uuid;
BEGIN
  INSERT INTO sellers (email, full_name, company_name, role, status)
  VALUES ('nouveau@seller.com', 'Nouveau Seller', 'Ma Boutique', 'seller', 'trial')
  RETURNING id INTO v_seller_id;

  INSERT INTO subscriptions (seller_id, plan_id, status)
  VALUES (v_seller_id, 'starter', 'trial');

  INSERT INTO usage_tracking (seller_id, month)
  VALUES (v_seller_id, date_trunc('month', now())::date);
END $$;
```

## 📱 URLs de l'Application

- **Landing Page:** http://localhost:5173/
- **Login:** Cliquer "Connexion" sur la landing page
- **Signup:** Cliquer "Commencer l'essai gratuit"
- **Dashboard:** Automatique après connexion
- **SuperAdmin Dashboard:** Automatique si role = 'superadmin'

## ⚠️ Important

1. **Supabase Auth requis:** Pour se connecter, l'utilisateur doit exister dans `auth.users` ET dans `sellers`
2. **ID synchronisés:** L'ID dans `auth.users` doit correspondre à l'ID dans `sellers`
3. **Email confirmé:** L'email doit être confirmé dans Supabase Auth
4. **RLS actif:** Les données sont automatiquement filtrées par seller_id

## 🎉 Statut

- ✅ Migration appliquée
- ✅ Tables créées
- ✅ Fonctions opérationnelles
- ✅ Super admin créé (seller record)
- ✅ Seller de test créé
- ✅ Plans configurés
- ✅ RLS activé
- ✅ Build réussi

## 📚 Documentation

- **QUICK_START.md** - Guide de démarrage rapide
- **MULTI_TENANT_COMPLETE_SUMMARY.md** - Vue d'ensemble complète
- **IMPLEMENTATION_REMAINING.md** - Tâches restantes
- **MULTITENANT_IMPLEMENTATION.md** - Guide technique détaillé

---

**Prêt à utiliser!** L'infrastructure multi-tenant est en place. Il ne reste que l'intégration dans les composants existants.
