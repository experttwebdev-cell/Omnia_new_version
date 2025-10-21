# 🔴 URGENT: Stripe Live Payment Setup Required

## Current Status

**Database Status:** ✅ 3 subscription plans exist
- Starter Lite: 9.99€/month or 99€/year
- Professional AI: 79€/month or 790€/year
- Enterprise Commerce+: 199€/month or 1990€/year

**Stripe Status:** ❌ NOT CONFIGURED - All Price IDs are NULL

**Impact:** Users cannot see plans on signup page and see error: "Les forfaits ne sont pas encore configurés"

---

## ⚡ Quick Setup (15 minutes)

### STEP 1: Create Stripe Products (LIVE MODE) - 8 minutes

**IMPORTANT:** Make sure you're in **LIVE MODE** (not Test Mode)

1. **Go to Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/products
   - **CRITICAL:** Toggle to LIVE MODE in top-right corner (should show green "LIVE" badge)

2. **Create Product 1: Starter Lite**
   - Click **"+ Add product"**
   - **Name:** `Starter Lite`
   - **Description:** `Plan de démarrage - 100 produits, 300 optimisations SEO/mois`
   - **Pricing model:** Select "Recurring"
   - **Price:** `9.99`
   - **Currency:** `EUR`
   - **Billing period:** `Monthly`
   - Click **"Add another price"**
     - **Price:** `99.00`
     - **Currency:** `EUR`
     - **Billing period:** `Yearly`
   - Click **"Save product"**
   - **COPY BOTH PRICE IDs:**
     - Monthly Price ID: `price_xxxxxxxxxxxxx` (starts with price_, 30 chars total)
     - Yearly Price ID: `price_xxxxxxxxxxxxx`

3. **Create Product 2: Professional AI**
   - Click **"+ Add product"**
   - **Name:** `Professional AI`
   - **Description:** `Plan professionnel - 2000 produits, 5000 optimisations SEO/mois, IA avancée`
   - **Pricing model:** Select "Recurring"
   - **Price:** `79.00`
   - **Currency:** `EUR`
   - **Billing period:** `Monthly`
   - Click **"Add another price"**
     - **Price:** `790.00`
     - **Currency:** `EUR`
     - **Billing period:** `Yearly`
   - Click **"Save product"**
   - **COPY BOTH PRICE IDs**

4. **Create Product 3: Enterprise Commerce+**
   - Click **"+ Add product"**
   - **Name:** `Enterprise Commerce+`
   - **Description:** `Solution complète - Produits illimités, optimisations illimitées`
   - **Pricing model:** Select "Recurring"
   - **Price:** `199.00`
   - **Currency:** `EUR`
   - **Billing period:** `Monthly`
   - Click **"Add another price"**
     - **Price:** `1990.00`
     - **Currency:** `EUR`
     - **Billing period:** `Yearly`
   - Click **"Save product"**
   - **COPY BOTH PRICE IDs**

**You should now have 6 Price IDs total** (2 for each plan)

---

### STEP 2: Get Your Live Stripe Secret Key - 2 minutes

1. **In Stripe Dashboard (LIVE MODE):**
   - Click **"Developers"** in left sidebar
   - Click **"API keys"**
   - Find **"Secret key"** section
   - Click **"Reveal live key"** (starts with `sk_live_`)
   - Click to copy the key
   - **SAVE THIS KEY SECURELY** - you'll need it in Step 3

⚠️ **IMPORTANT:** This is your LIVE secret key - treat it like a password!

---

### STEP 3: Configure Supabase Edge Functions - 3 minutes

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
   - Click **"Project Settings"** (gear icon in bottom left)
   - Click **"Edge Functions"** in the sidebar
   - Click **"Secrets"** tab

2. **Add Stripe Secret Key:**
   - Click **"Add new secret"**
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Paste your live Stripe secret key (from Step 2)
   - Click **"Save"**

---

### STEP 4: Update Database with Price IDs - 2 minutes

1. **Go to Supabase SQL Editor:**
   - Visit: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/sql
   - Click **"New query"**

2. **Paste and MODIFY this SQL** (replace the `price_xxxxxxxxxxxxx` with YOUR actual Price IDs):

```sql
-- ========================================
-- CRITICAL: Replace ALL price_xxxxxxxxxxxxx
-- with your REAL Stripe Price IDs from Step 1
-- ========================================

-- Update Starter Lite Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- ← Replace with Starter monthly Price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- ← Replace with Starter yearly Price ID
WHERE id = 'starter';

-- Update Professional AI Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- ← Replace with Professional monthly Price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- ← Replace with Professional yearly Price ID
WHERE id = 'professional';

-- Update Enterprise Commerce+ Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- ← Replace with Enterprise monthly Price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- ← Replace with Enterprise yearly Price ID
WHERE id = 'enterprise';

-- Verify configuration (should show all READY)
SELECT id, name,
       CASE
         WHEN stripe_price_id_monthly IS NOT NULL AND stripe_price_id_yearly IS NOT NULL
         THEN '✅ READY'
         ELSE '❌ NOT CONFIGURED'
       END as status,
       stripe_price_id_monthly,
       stripe_price_id_yearly
FROM subscription_plans
ORDER BY price_monthly;
```

3. **Run the query** - The last SELECT should show all plans as "✅ READY"

---

### STEP 5: Test Your Setup - 2 minutes

1. **Visit your application signup page**
   - The three plans should now display
   - The error message should be gone

2. **Test the flow** (optional - will charge real money):
   - Fill out signup form
   - Select a plan
   - Click "Commencer l'essai gratuit"
   - You should be redirected to Stripe Checkout
   - Use a REAL credit card (it will charge for real!)
   - Complete payment to verify everything works

⚠️ **Note:** You can cancel the subscription immediately in Stripe Dashboard if just testing

---

## 🔍 Verification Checklist

Before going live, verify:

- [ ] You're in Stripe LIVE MODE (not Test Mode)
- [ ] Created 3 products with 6 prices total (2 per product)
- [ ] All Price IDs copied correctly (format: `price_` + 24 alphanumeric characters)
- [ ] Live Secret Key added to Supabase Edge Functions secrets
- [ ] Database updated with all 6 Price IDs
- [ ] Verification query shows all plans as READY
- [ ] Plans display on signup page without errors
- [ ] Stripe Checkout loads successfully
- [ ] Your Stripe account is verified for live payments

---

## 🚨 Important Stripe Live Mode Requirements

Before accepting live payments, ensure:

1. **Stripe Account Verification:**
   - Your business information is complete
   - Identity verification is done
   - Bank account connected for payouts
   - Tax information provided

2. **Webhook Configuration (Important!):**
   - Endpoint URL: `https://ufdhzgqrubbnornjdvgv.supabase.co/functions/v1/stripe-webhook`
   - Events to listen:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - Get webhook signing secret and add to Supabase secrets as `STRIPE_WEBHOOK_SECRET`

3. **Legal Requirements:**
   - Terms of Service published
   - Privacy Policy published
   - Refund Policy defined
   - GDPR compliance if serving EU customers

---

## 💰 Pricing Summary

Your configured plans:

| Plan | Monthly | Yearly | Yearly Savings |
|------|---------|--------|----------------|
| **Starter Lite** | 9.99€ | 99€ | 20.88€ (17%) |
| **Professional AI** | 79€ | 790€ | 158€ (17%) |
| **Enterprise Commerce+** | 199€ | 1990€ | 398€ (17%) |

All plans include 14-day free trial.

---

## 🐛 Troubleshooting

### Plans still not showing?
**Solution:** Clear browser cache and refresh. Check browser console for errors.

### Error: "No such price"
**Solution:** Double-check you copied the correct Price IDs. They must exist in LIVE mode, not test mode.

### Error: "Stripe secret key not configured"
**Solution:** Verify you added `STRIPE_SECRET_KEY` to Supabase Edge Functions secrets.

### Stripe Checkout shows wrong amount
**Solution:** The Price ID controls the amount. Verify you assigned the correct Price ID to the correct plan.

### Can't switch to Live Mode in Stripe
**Solution:** Complete Stripe account verification first. Go to Stripe Dashboard → Settings → Business settings.

---

## 📊 After Setup - Next Steps

Once live payments are working:

1. **Monitor Subscriptions:**
   - Check Stripe Dashboard regularly
   - Set up email notifications for failed payments
   - Monitor customer metrics

2. **Test Edge Cases:**
   - Failed payment handling
   - Subscription cancellation
   - Plan upgrades/downgrades
   - Trial period expiration

3. **Customer Support:**
   - Prepare responses for billing questions
   - Set up support email for payment issues
   - Document refund process

---

## 📞 Support

**Stripe Support:** https://support.stripe.com
**Supabase Support:** https://supabase.com/support

**Your Stripe Account:** https://dashboard.stripe.com
**Your Supabase Project:** https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv

---

## ✅ Quick Reference: What You Need

From Stripe Dashboard:
- [ ] 6 Price IDs (2 per plan, format: `price_xxxxxxxxxxxxx`)
- [ ] 1 Live Secret Key (format: `sk_live_xxxxxxxxxxxxx`)
- [ ] 1 Webhook Secret (format: `whsec_xxxxxxxxxxxxx`) - optional but recommended

To Update:
- [ ] Database: 6 UPDATE statements for subscription_plans
- [ ] Supabase: Add STRIPE_SECRET_KEY to Edge Function secrets
- [ ] Supabase: Add STRIPE_WEBHOOK_SECRET to Edge Function secrets (optional)

---

**Estimated Time:** 15 minutes
**Difficulty:** Easy - just copy/paste configuration
**Technical Changes:** None - configuration only

**Current Status:** ⏳ Awaiting your Stripe configuration
**After Setup:** ✅ Real payments accepted immediately

---

*Last Updated: 2025-10-21*
*Migration Applied: fix_stripe_price_ids_configuration*
