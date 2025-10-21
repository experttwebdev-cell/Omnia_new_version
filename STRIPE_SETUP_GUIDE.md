# Stripe Setup Guide - Omnia AI

## Critical: Stripe Configuration Required

Your application currently **cannot accept signups** because Stripe Price IDs are not configured. This guide will help you set up Stripe properly in **10 minutes**.

---

## Current Status

❌ **Stripe Price IDs: NOT CONFIGURED**

The database has been cleaned and is ready for proper Stripe configuration. You need to:
1. Create products in Stripe
2. Create recurring prices for each product
3. Update the database with real Stripe Price IDs

---

## Step-by-Step Setup

### Step 1: Access Stripe Dashboard (2 minutes)

1. Go to https://dashboard.stripe.com
2. Sign in to your Stripe account (or create one if you don't have it)
3. **Important:** Check if you're in Test Mode or Live Mode (toggle in top-right corner)
   - Use **Test Mode** for development and testing
   - Use **Live Mode** for production (switch later)

---

### Step 2: Create Products (3 minutes)

You need to create **3 products** in Stripe:

#### Product 1: Starter Lite
1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name:** `Starter Lite`
   - **Description:** `Forfait de démarrage pour petites boutiques - 100 produits maximum`
   - **Pricing model:** Recurring
   - **Price:** `9.99 EUR`
   - **Billing period:** Monthly
   - Click **Add another price** (important!)
     - **Price:** `99.00 EUR`
     - **Billing period:** Yearly
3. Click **Save product**
4. **Copy both Price IDs:**
   - Monthly: `price_xxxxxxxxxxxxx` (24 characters after price_)
   - Yearly: `price_xxxxxxxxxxxxx`

#### Product 2: Professional AI
1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name:** `Professional AI`
   - **Description:** `Forfait professionnel avec IA avancée - 500 produits maximum`
   - **Pricing model:** Recurring
   - **Price:** `79.00 EUR`
   - **Billing period:** Monthly
   - Click **Add another price**
     - **Price:** `790.00 EUR`
     - **Billing period:** Yearly
3. Click **Save product**
4. **Copy both Price IDs**

#### Product 3: Enterprise Commerce+
1. Go to **Products** → **Add Product**
2. Fill in:
   - **Name:** `Enterprise Commerce+`
   - **Description:** `Solution complète pour grandes entreprises - Produits illimités`
   - **Pricing model:** Recurring
   - **Price:** `199.00 EUR`
   - **Billing period:** Monthly
   - Click **Add another price**
     - **Price:** `1990.00 EUR`
     - **Billing period:** Yearly
3. Click **Save product**
4. **Copy both Price IDs**

---

### Step 3: Update Database with Price IDs (2 minutes)

Now that you have your 6 Stripe Price IDs (2 per product), you need to update your database.

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
2. Navigate to **SQL Editor**
3. Run these SQL commands (replace with YOUR actual Price IDs):

```sql
-- Update Starter plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- Replace with your Starter monthly price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- Replace with your Starter yearly price ID
WHERE id = 'starter';

-- Update Professional plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- Replace with your Professional monthly price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- Replace with your Professional yearly price ID
WHERE id = 'professional';

-- Update Enterprise plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- Replace with your Enterprise monthly price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- Replace with your Enterprise yearly price ID
WHERE id = 'enterprise';

-- Verify configuration
SELECT * FROM subscription_plans_config_status;
```

4. Check the output of the last query - all plans should show **"READY - All price IDs configured"**

#### Option B: Using SQL Client

If you have a PostgreSQL client connected to your Supabase database, run the same SQL commands above.

---

### Step 4: Configure Stripe Secret Key in Supabase (2 minutes)

Your Edge Functions need access to your Stripe Secret Key.

1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Secret key** (starts with `sk_test_` in Test Mode or `sk_live_` in Live Mode)
3. Go to your Supabase Dashboard
4. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
5. Add a new secret:
   - **Name:** `STRIPE_SECRET_KEY`
   - **Value:** Paste your Stripe secret key
6. Click **Save**

---

### Step 5: Test Your Configuration (1 minute)

1. Visit your application
2. Click **Sign Up** or **Essai Gratuit**
3. Fill in the signup form
4. You should now see the 3 plans displayed
5. Select a plan and billing cycle
6. Click **Commencer l'essai gratuit**
7. You should be redirected to Stripe Checkout

**Test Card Number:** 4242 4242 4242 4242 (any future expiry date, any CVC)

---

## Verification Checklist

Use this checklist to verify everything is configured correctly:

- [ ] Created 3 products in Stripe Dashboard
- [ ] Each product has 2 prices (monthly and yearly)
- [ ] Copied all 6 Price IDs (should start with `price_` and be 30 characters total)
- [ ] Updated database with all 6 Price IDs
- [ ] Verified all plans show "READY" status in `subscription_plans_config_status` view
- [ ] Added `STRIPE_SECRET_KEY` to Supabase Edge Function secrets
- [ ] Tested signup flow and reached Stripe Checkout page
- [ ] Verified test payment works with test card

---

## Quick Reference: Finding Your Price IDs

### In Stripe Dashboard:
1. Go to **Products**
2. Click on a product
3. Under **Pricing**, you'll see all prices
4. Click on a price to see its full ID
5. The format is: `price_` followed by 24 alphanumeric characters

Example: `price_1QABc2D3EfgHIjkLMnoPQrst`

---

## Troubleshooting

### Error: "No such price: price_xxxxx"
**Solution:** The Price ID in your database doesn't exist in Stripe. Double-check you copied the correct Price IDs from Stripe Dashboard.

### Error: "Stripe secret key not configured"
**Solution:** Add `STRIPE_SECRET_KEY` to Supabase Edge Function secrets (see Step 4).

### Error: "Les forfaits ne sont pas encore configurés"
**Solution:** The database doesn't have valid Stripe Price IDs. Complete Step 3 to add them.

### Plans not showing on signup page
**Solution:** Run this query to check configuration status:
```sql
SELECT * FROM subscription_plans_config_status;
```
All plans must show "READY" status.

### Stripe Checkout shows wrong prices
**Solution:** Verify you're using the correct Price IDs. The price displayed in Stripe Checkout is controlled by the Price ID, not your database.

---

## Test Mode vs Live Mode

### Test Mode (For Development)
- Use while building and testing
- Price IDs start with: `price_` (same format as live)
- Secret keys start with: `sk_test_`
- Use test card: 4242 4242 4242 4242
- No real money is charged

### Live Mode (For Production)
- Use when ready to accept real payments
- Price IDs start with: `price_` (same format as test)
- Secret keys start with: `sk_live_`
- Real credit cards and real charges
- **Important:** You need to complete Stripe account verification before accepting live payments

### Switching from Test to Live
1. Create the same 3 products in Live Mode
2. Get the new Live Mode Price IDs
3. Update database with Live Mode Price IDs
4. Update `STRIPE_SECRET_KEY` in Supabase with your Live Mode secret key
5. Test thoroughly before announcing to users

---

## Database Schema Reference

Your `subscription_plans` table has these columns for Stripe integration:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| `stripe_price_id_monthly` | text | Stripe Price ID for monthly billing | `price_1QABc2D3EfgHIjkLMnoPQrst` |
| `stripe_price_id_yearly` | text | Stripe Price ID for yearly billing | `price_9ZyXwV8uTsRQpoNmLkJihGfE` |

Both columns have validation constraints:
- Must be NULL or start with `price_`
- Must be exactly 30 characters total (including `price_` prefix)

---

## Support

If you encounter issues:

1. **Check Supabase Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → `create-stripe-checkout`
   - Look for error messages in logs

2. **Check Stripe Dashboard logs:**
   - Go to Stripe Dashboard → Developers → Logs
   - Look for failed API requests

3. **Verify database configuration:**
   ```sql
   SELECT * FROM subscription_plans_config_status;
   ```

4. **Test the Edge Function directly:**
   Visit: `test-stripe-checkout.html` (if available)

---

## Security Notes

⚠️ **IMPORTANT:**

- **Never commit** Stripe Secret Keys to git
- **Never expose** Secret Keys in frontend code
- Secret Keys should only be in Supabase Edge Function secrets
- Price IDs are safe to expose (they're in checkout URLs)
- Always use Test Mode during development
- Complete Stripe account verification before Live Mode

---

## Next Steps After Configuration

Once Stripe is configured:

1. ✅ Users can sign up with 14-day free trial
2. ✅ Stripe Checkout handles payment collection
3. ✅ Webhooks update subscription status automatically
4. ✅ Users get access to their selected plan features

Configure Stripe Webhook (optional but recommended):
- Webhook URL: `https://ufdhzgqrubbnornjdvgv.supabase.co/functions/v1/stripe-webhook`
- Events to listen: `checkout.session.completed`, `customer.subscription.updated`, etc.
- See `PRODUCTION_DEPLOYMENT_GUIDE.md` for webhook setup

---

## Quick Setup Commands

Copy and paste these with your actual Price IDs:

```sql
-- IMPORTANT: Replace all 'price_xxxxxxxxxxxxx' with your actual Stripe Price IDs

-- Starter Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'
WHERE id = 'starter';

-- Professional Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'
WHERE id = 'professional';

-- Enterprise Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'
WHERE id = 'enterprise';

-- Verify (should show all READY)
SELECT * FROM subscription_plans_config_status;
```

---

**Estimated Setup Time:** 10 minutes

**Current Status:** Awaiting Stripe Price ID configuration

**Ready to accept signups:** ❌ Not yet (complete steps above)

---

*Last Updated: After migration `fix_stripe_price_ids_configuration`*
