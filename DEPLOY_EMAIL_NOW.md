# 🚀 Déployer le Système d'Email - MAINTENANT

## ⚡ Action Rapide: 20 Minutes

Votre système d'envoi d'email est prêt à être déployé!

---

## 📋 Étape 1: Déployer l'Edge Function (5-10 min)

### Méthode Recommandée: Via Dashboard

1. **Ouvrir Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
   ```

2. **Aller sur Edge Functions:**
   - Cliquer "Edge Functions" dans le menu gauche
   - Cliquer "Deploy new function"

3. **Créer la fonction:**
   - **Name:** `send-verification-email`
   - **Code:** Copier depuis `supabase/functions/send-verification-email/index.ts`
   - Cliquer "Deploy"

✅ **Vérification:** La fonction apparaît dans la liste avec status "Active"

---

## 🔐 Étape 2: Configurer les Secrets (5 min)

1. **Dans Supabase Dashboard:**
   - Project Settings (icône engrenage en bas à gauche)
   - Edge Functions
   - Secrets

2. **Ajouter ces 8 secrets:**

Click "Add new secret" pour chaque:

```
Secret 1:
Name: SMTP_HOST
Value: ohio.o2switch.net

Secret 2:
Name: SMTP_PORT
Value: 465

Secret 3:
Name: SMTP_USER
Value: support@omnia.sale

Secret 4:
Name: SMTP_PASSWORD
Value: Seoplan@2024

Secret 5:
Name: SMTP_SECURE
Value: true

Secret 6:
Name: FROM_EMAIL
Value: support@omnia.sale

Secret 7:
Name: FROM_NAME
Value: OmnIA Support

Secret 8:
Name: APP_URL
Value: https://omnia.sale
(ou votre domaine)
```

✅ **Vérification:** 8 secrets visibles dans la liste

---

## 🧪 Étape 3: Tester (10 min)

### Test 1: Créer un Compte

1. **Ouvrir votre app**
2. **Aller sur page signup**
3. **Remplir avec VRAIE email** (que vous pouvez checker)
4. **Submit form**

### Test 2: Vérifier les Logs

1. **Supabase Dashboard:**
   - Edge Functions
   - send-verification-email
   - Logs

2. **Chercher:**
   ```
   ✅ Verification email sent successfully to: votre@email.com
   ```

### Test 3: Check Email

1. **Ouvrir votre inbox**
2. **Chercher email de:** OmnIA Support <support@omnia.sale>
3. **Vérifier:**
   - ✅ Email reçu
   - ✅ Design professionnel
   - ✅ Bouton "Confirmer mon email" visible
   - ✅ Lien cliquable

### Test 4: Vérifier l'Email

1. **Cliquer sur le bouton/lien dans l'email**
2. **Devrait rediriger vers:** `https://votre-app/#/verify-email?token=...`
3. **Vérifier:**
   - ✅ Page de vérification s'affiche
   - ✅ Message "Email vérifié!"
   - ✅ Redirection automatique vers login

### Test 5: Check Database

```sql
SELECT id, email, email_verified
FROM sellers
WHERE email = 'votre@email.com';
```

**Résultat attendu:**
- `email_verified` = `true`

---

## ✅ Checklist Rapide

### Avant Déploiement:
- [ ] Code lu et compris
- [ ] Variables SMTP vérifiées
- [ ] Dashboard Supabase accessible

### Déploiement:
- [ ] Edge Function déployée
- [ ] 8 secrets configurés
- [ ] Fonction status = "Active"

### Testing:
- [ ] Compte test créé
- [ ] Logs vérifiés (pas d'erreur)
- [ ] Email reçu dans inbox
- [ ] Lien de vérification fonctionne
- [ ] email_verified mis à jour en DB

---

## 🐛 Si Ça Ne Marche Pas

### Problème: Email pas reçu

**Check 1: Logs Edge Function**
```
Dashboard → Edge Functions → send-verification-email → Logs
```
Chercher erreurs SMTP

**Check 2: Secrets**
Vérifier tous les 8 secrets sont présents et corrects

**Check 3: Spam Folder**
L'email peut être dans spam

**Check 4: Credentials SMTP**
Tester avec client SMTP:
- Host: ohio.o2switch.net
- Port: 465
- User: support@omnia.sale
- Pass: Seoplan@2024

### Problème: Lien ne fonctionne pas

**Check 1: APP_URL**
Doit correspondre au domaine réel
Format: `https://omnia.sale` (sans trailing slash)

**Check 2: Browser Console**
Ouvrir DevTools → Console
Chercher erreurs JavaScript

**Check 3: Route**
Vérifier `/#/verify-email` route existe dans App.tsx

---

## 📊 Commandes Utiles

### Voir Statistiques Users

```sql
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE email_verified = true) as verified,
  COUNT(*) FILTER (WHERE email_verified = false) as not_verified
FROM sellers;
```

### Voir Tokens Actifs

```sql
SELECT *
FROM verification_tokens
WHERE expires_at > now()
ORDER BY created_at DESC
LIMIT 10;
```

### Nettoyer Tokens Expirés

```sql
SELECT cleanup_expired_tokens();
```

### Envoyer Email Manuellement

```typescript
const response = await fetch(
  `${SUPABASE_URL}/functions/v1/send-verification-email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: 'user@example.com',
      userId: 'uuid-here',
      verificationToken: crypto.randomUUID(),
      userName: 'John Doe',
      companyName: 'Company Name',
    }),
  }
);
```

---

## 📚 Docs Complètes

**Pour plus de détails:**
- [EMAIL_SETUP_SUMMARY.md](EMAIL_SETUP_SUMMARY.md) - Résumé complet
- [EMAIL_CONFIGURATION.md](EMAIL_CONFIGURATION.md) - Guide technique

**Code Source:**
- `supabase/functions/send-verification-email/index.ts` - Edge Function
- `src/components/EmailVerification.tsx` - Page vérification
- `src/lib/authContext.tsx` - Integration signup

**Database:**
- Migration: `add_email_verification`
- Table: `verification_tokens`
- Column: `sellers.email_verified`

---

## 🎯 Résumé

| Étape | Temps | Status |
|-------|-------|--------|
| Deploy Edge Function | 5-10 min | ⏳ À faire |
| Configure Secrets | 5 min | ⏳ À faire |
| Test System | 10 min | ⏳ À faire |
| **TOTAL** | **20-25 min** | ⏳ **Ready to start** |

---

## 🚀 Commencer Maintenant

**Étape suivante:** Ouvrir Supabase Dashboard et commencer Étape 1

```
https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
```

**Support:** support@omnia.sale

---

**Status:** ✅ Code ready - ⏳ Needs deployment
**Build:** ✅ Passed
**Next:** Deploy Edge Function

🎉 **Let's do this!**
