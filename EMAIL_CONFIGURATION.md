# 📧 Configuration Email - OmnIA

## Système de Vérification d'Email Configuré

Votre application est maintenant configurée avec un système complet de vérification d'email utilisant votre serveur SMTP O2switch.

---

## ✅ Ce Qui a Été Configuré

### 1. Variables d'Environnement (.env)
```
SMTP_HOST=ohio.o2switch.net
SMTP_PORT=465
SMTP_USER=support@omnia.sale
SMTP_PASSWORD=Seoplan@2024
SMTP_SECURE=true
FROM_EMAIL=support@omnia.sale
FROM_NAME=OmnIA Support
```

### 2. Edge Function Créée
**`supabase/functions/send-verification-email/index.ts`**
- Envoie des emails via SMTP O2switch
- Email HTML professionnel avec design moderne
- Lien de vérification sécurisé
- Gestion des erreurs complète

### 3. Base de Données
**Migration appliquée:** `add_email_verification`
- Colonne `email_verified` ajoutée à la table `sellers`
- Table `verification_tokens` créée pour tracker les tokens
- Policies RLS configurées
- Fonction de nettoyage des tokens expirés

### 4. Frontend
- Composant `EmailVerification.tsx` créé
- Route `/verify-email` ajoutée
- Intégration avec le flux d'inscription
- Page de vérification avec états (success/error/expired)

### 5. Flux d'Inscription Modifié
- Email de vérification envoyé automatiquement après inscription
- Lien de vérification valide 24h
- Redirection vers login après vérification

---

## 🚀 Déploiement de l'Edge Function

Pour que l'envoi d'emails fonctionne, vous devez déployer l'Edge Function:

### Option 1: Via Supabase Dashboard (Recommandé)

1. **Go to Supabase Dashboard:**
   https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv

2. **Navigate to Edge Functions:**
   - Click "Edge Functions" in sidebar
   - Click "Deploy new function"

3. **Deploy send-verification-email:**
   - Function name: `send-verification-email`
   - Copy code from: `supabase/functions/send-verification-email/index.ts`
   - Click "Deploy"

### Option 2: Via Supabase CLI (Si installé)

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref ufdhzgqrubbnornjdvgv

# Deploy function
supabase functions deploy send-verification-email
```

---

## 🔐 Configuration des Secrets Supabase

Les variables SMTP doivent être configurées comme secrets dans Supabase:

1. **Go to:** https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
2. **Navigate to:** Project Settings → Edge Functions → Secrets
3. **Add these secrets:**

```
SMTP_HOST = ohio.o2switch.net
SMTP_PORT = 465
SMTP_USER = support@omnia.sale
SMTP_PASSWORD = Seoplan@2024
SMTP_SECURE = true
FROM_EMAIL = support@omnia.sale
FROM_NAME = OmnIA Support
APP_URL = https://omnia.sale
```

**Important:** Sans ces secrets, l'Edge Function ne pourra pas envoyer d'emails!

---

## 📧 Email de Vérification

### Design de l'Email

L'email envoyé est professionnel et moderne avec:
- **Header:** Gradient violet avec "Bienvenue sur OmnIA!"
- **Content:** Message personnalisé avec nom d'utilisateur/entreprise
- **Button:** Call-to-action "Confirmer mon email"
- **Features Box:** Liste des avantages OmnIA
- **Footer:** Informations de contact et liens légaux

### Exemple de Contenu:

```
Objet: ✨ Confirmez votre adresse email - OmnIA

Bonjour [Nom],

Merci de vous être inscrit sur OmnIA, votre plateforme d'optimisation
e-commerce propulsée par l'intelligence artificielle!

Pour commencer à utiliser toutes les fonctionnalités de votre compte,
veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous:

[✅ Confirmer mon email]

Vos avantages OmnIA:
- Optimisation SEO automatique de vos produits
- Génération de contenu intelligent
- Analytics et insights avancés
- Support prioritaire 7j/7

Besoin d'aide?
Contactez-nous à support@omnia.sale
```

---

## 🔄 Flux de Vérification

### 1. Inscription Utilisateur
```
User → Fill signup form → Click "Créer mon compte"
  ↓
Create auth.users account
  ↓
Create sellers record
  ↓
Create subscription record
  ↓
Generate verification token
  ↓
Call send-verification-email Edge Function
  ↓
Email sent via SMTP O2switch
```

### 2. Vérification Email
```
User → Receive email → Click verification link
  ↓
Redirected to: /#/verify-email?token=xxx&userId=xxx
  ↓
EmailVerification component loads
  ↓
Verify token & userId
  ↓
Update sellers.email_verified = true
  ↓
Show success message
  ↓
Redirect to login after 3 seconds
```

---

## 🧪 Test du Système

### Test Complet:

1. **Créer un compte test:**
   - Go to signup page
   - Fill form with REAL email address
   - Submit

2. **Vérifier logs:**
   - Supabase Dashboard → Edge Functions → send-verification-email
   - Check logs for successful email send

3. **Check email:**
   - Open inbox
   - Find email from "OmnIA Support <support@omnia.sale>"
   - Verify email design looks good

4. **Click verification link:**
   - Should redirect to verification page
   - Should show success message
   - Should redirect to login

5. **Verify database:**
   ```sql
   SELECT id, email, email_verified FROM sellers WHERE email = 'test@example.com';
   ```
   - email_verified should be `true`

---

## 🐛 Troubleshooting

### Emails Ne Sont Pas Envoyés

**Symptômes:** Aucun email reçu après inscription

**Solutions:**
1. ✅ Vérifier Edge Function est déployée
2. ✅ Vérifier secrets SMTP sont configurés dans Supabase
3. ✅ Check Edge Function logs pour erreurs
4. ✅ Vérifier credentials SMTP O2switch sont corrects
5. ✅ Tester connexion SMTP manuellement

### Erreur "SMTP Connection Failed"

**Solutions:**
- Vérifier SMTP_HOST est correct: `ohio.o2switch.net`
- Vérifier SMTP_PORT est `465` (SSL/TLS)
- Vérifier SMTP_USER et SMTP_PASSWORD
- Vérifier compte O2switch est actif

### Lien de Vérification Ne Fonctionne Pas

**Solutions:**
- Vérifier APP_URL est configuré correctement
- Vérifier token est bien passé dans l'URL
- Check browser console pour erreurs JavaScript
- Vérifier EmailVerification component est importé

### Email Verified Ne Change Pas

**Solutions:**
```sql
-- Check si colonne existe
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sellers' AND column_name = 'email_verified';

-- Si besoin, mettre à jour manuellement
UPDATE sellers SET email_verified = true WHERE id = 'user_id_here';
```

---

## 📊 Monitoring

### Check Email Sending Stats:

```sql
-- Count verification emails sent (in Edge Function logs)
-- Go to: Supabase Dashboard → Edge Functions → send-verification-email → Logs

-- Check verified users
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
  COUNT(*) FILTER (WHERE email_verified = false) as unverified_users
FROM sellers;
```

### Monitor Expired Tokens:

```sql
-- See expired tokens
SELECT * FROM verification_tokens
WHERE expires_at < now()
AND used_at IS NULL;

-- Clean up old tokens (older than 7 days)
SELECT cleanup_expired_tokens();
```

---

## 🔧 Maintenance

### Clean Up Old Tokens

Run periodically (ou configurer un cron job):

```sql
SELECT cleanup_expired_tokens();
```

### Resend Verification Email

Si un utilisateur n'a pas reçu l'email:

```typescript
// Call Edge Function manually
const response = await fetch(`${SUPABASE_URL}/functions/v1/send-verification-email`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'apikey': SUPABASE_ANON_KEY,
  },
  body: JSON.stringify({
    email: 'user@example.com',
    userId: 'user-uuid',
    verificationToken: crypto.randomUUID(),
    userName: 'User Name',
    companyName: 'Company',
  }),
});
```

---

## 📝 Customization

### Modifier le Template Email

Edit: `supabase/functions/send-verification-email/index.ts`

**Variables disponibles:**
- `{userName}` - Nom complet de l'utilisateur
- `{companyName}` - Nom de l'entreprise
- `{email}` - Email de l'utilisateur
- `{verificationLink}` - Lien de vérification

### Modifier le Délai d'Expiration

Par défaut: 24 heures

Pour changer:
```typescript
// Dans send-verification-email/index.ts
const expiresAt = new Date();
expiresAt.setHours(expiresAt.getHours() + 24); // Change ici
```

### Ajouter d'Autres Types d'Emails

La table `verification_tokens` supporte:
- `email_verification` (actuel)
- `password_reset` (à implémenter)

---

## ✅ Checklist de Production

Avant de déployer en production:

- [ ] Edge Function `send-verification-email` déployée
- [ ] Secrets SMTP configurés dans Supabase
- [ ] Test email send réussi
- [ ] Email design vérifié (mobile + desktop)
- [ ] Verification flow testé end-to-end
- [ ] APP_URL configuré avec domaine production
- [ ] SPF/DKIM configurés pour support@omnia.sale
- [ ] Monitoring configuré pour suivre delivery rate
- [ ] Backup SMTP configuré (si primaire échoue)

---

## 📚 Resources

**O2switch SMTP:**
- Host: ohio.o2switch.net
- Port: 465 (SSL/TLS)
- Documentation: https://faq.o2switch.fr/hebergement-mutualise/emails

**Supabase Edge Functions:**
- Documentation: https://supabase.com/docs/guides/functions
- Deploy: https://supabase.com/docs/guides/functions/deploy

**SMTP Testing:**
- Test SMTP: https://www.smtper.net/
- Email validator: https://www.mail-tester.com/

---

## 🎯 Next Steps

1. **Deploy Edge Function** (15 min)
2. **Configure Secrets** (5 min)
3. **Test Email Send** (10 min)
4. **Configure SPF/DKIM** (20 min - optional but recommended)
5. **Monitor First Emails** (ongoing)

---

**Status:** ✅ Configured - Needs deployment
**Last Updated:** 2025-10-21
**Contact:** support@omnia.sale

---

**Ready to deploy! 🚀**
