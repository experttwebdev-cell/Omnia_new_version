# Stripe Quick Fix - Action Required

## ⚠️ Current Status: Signups Disabled

**Error Fixed:** ✅ "No such price: 'price_starter_monthly_test'"

**Configuration Needed:** ❌ Real Stripe Price IDs must be added

---

## Quick Fix (10 Minutes)

### Step 1: Create Stripe Products (5 min)

Go to: https://dashboard.stripe.com/products

Create these 3 products with 2 prices each:

#### Starter Lite
- Monthly: 9.99 EUR
- Yearly: 99.00 EUR

#### Professional AI
- Monthly: 79.00 EUR
- Yearly: 790.00 EUR

#### Enterprise Commerce+
- Monthly: 199.00 EUR
- Yearly: 1990.00 EUR

Copy all 6 Price IDs (format: `price_xxxxxxxxxxxxx`)

---

### Step 2: Update Database (2 min)

Go to: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/sql

Run this SQL (replace `price_xxxxxxxxxxxxx` with YOUR actual IDs):

```sql
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

-- Verify (all should show READY)
SELECT * FROM subscription_plans_config_status;
```

---

### Step 3: Add Stripe Secret Key (2 min)

1. Get your Stripe Secret Key from: https://dashboard.stripe.com/apikeys
2. Go to: Supabase Dashboard → Project Settings → Edge Functions → Secrets
3. Add secret:
   - Name: `STRIPE_SECRET_KEY`
   - Value: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)

---

### Step 4: Test (1 min)

1. Visit your app
2. Click Sign Up
3. Should see 3 plans
4. Complete signup
5. Should redirect to Stripe Checkout

Test card: **4242 4242 4242 4242**

---

## Current Database Status

```
All plans: NOT CONFIGURED - Stripe Price IDs needed
```

After configuration:
```
All plans: READY - All price IDs configured
```

---

## Need More Details?

📖 **Full Guide:** `STRIPE_SETUP_GUIDE.md`
📋 **Fix Summary:** `STRIPE_PRICING_FIX_SUMMARY.md`

---

## What Changed

✅ **Fixed:** Invalid placeholder Price IDs removed
✅ **Enhanced:** Better error messages and validation
✅ **Added:** Configuration status monitoring
✅ **Protected:** Can't use invalid Price IDs anymore

❌ **Required:** Add real Stripe Price IDs (follow steps above)

---

**Estimated Time:** 10 minutes to complete
**Once Done:** Signups will work immediately
