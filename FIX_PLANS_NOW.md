# 🚨 Fix "Les forfaits ne sont pas encore configurés" - RIGHT NOW

## The Problem

Your signup page shows: **"Les forfaits ne sont pas encore configurés"**

The 3 subscription plans are not visible because Stripe Price IDs are NULL in the database.

---

## The Solution (15 minutes)

### ✅ Step 1: Stripe Dashboard - Create Products (8 min)

1. **Go to:** https://dashboard.stripe.com/products
2. **IMPORTANT:** Switch to **LIVE MODE** (toggle in top-right)
3. **Create 3 products with these exact settings:**

#### Product 1: Starter Lite
```
Name: Starter Lite
Monthly Price: 9.99 EUR (recurring)
Yearly Price: 99.00 EUR (recurring)

→ Copy Monthly Price ID: price_____________________
→ Copy Yearly Price ID: price_____________________
```

#### Product 2: Professional AI
```
Name: Professional AI
Monthly Price: 79.00 EUR (recurring)
Yearly Price: 790.00 EUR (recurring)

→ Copy Monthly Price ID: price_____________________
→ Copy Yearly Price ID: price_____________________
```

#### Product 3: Enterprise Commerce+
```
Name: Enterprise Commerce+
Monthly Price: 199.00 EUR (recurring)
Yearly Price: 1990.00 EUR (recurring)

→ Copy Monthly Price ID: price_____________________
→ Copy Yearly Price ID: price_____________________
```

**You now have 6 Price IDs** ✓

---

### ✅ Step 2: Get Stripe Secret Key (2 min)

1. **Go to:** https://dashboard.stripe.com/apikeys
2. **Stay in LIVE MODE**
3. Find "Secret key" section
4. Click "Reveal live key"
5. **Copy:** `sk_live_________________________________`

---

### ✅ Step 3: Update Supabase (3 min)

1. **Add Secret Key:**
   - Go to: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
   - Click: Project Settings → Edge Functions → Secrets
   - Add new secret:
     - Name: `STRIPE_SECRET_KEY`
     - Value: Your `sk_live_` key from Step 2
   - Click Save

2. **Update Database:**
   - Go to: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/sql
   - Copy the SQL below
   - **REPLACE** all `price_xxxxxxxxxxxxx` with YOUR Price IDs from Step 1
   - Click Run

```sql
-- Starter Lite Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- Your Starter monthly ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- Your Starter yearly ID
WHERE id = 'starter';

-- Professional AI Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- Your Professional monthly ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- Your Professional yearly ID
WHERE id = 'professional';

-- Enterprise Commerce+ Plan
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- Your Enterprise monthly ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- Your Enterprise yearly ID
WHERE id = 'enterprise';

-- Verify (should show all READY)
SELECT id, name,
  CASE
    WHEN stripe_price_id_monthly IS NOT NULL AND stripe_price_id_yearly IS NOT NULL
    THEN '✅ READY'
    ELSE '❌ NOT READY'
  END as status
FROM subscription_plans;
```

---

### ✅ Step 4: Test (2 min)

1. **Open your app**
2. **Go to signup page**
3. **You should now see:**
   - ✅ 3 plans displayed
   - ✅ No error message
   - ✅ Prices showing correctly
   - ✅ Monthly/Yearly toggle working

4. **Test checkout (optional):**
   - Fill signup form
   - Select a plan
   - Click "Commencer l'essai gratuit"
   - Should redirect to Stripe Checkout
   - **IMPORTANT:** This will charge REAL money!

---

## ⚠️ Important Notes

### About LIVE MODE
- ✅ Accepts real credit cards
- ✅ Charges real money
- ✅ Requires verified Stripe account
- ❌ Test card 4242... will NOT work

### Before Going Live
- [ ] Verify your Stripe account is fully set up
- [ ] Connect bank account for payouts
- [ ] Add business information
- [ ] Set up webhook endpoint (recommended)

### Webhook Setup (Optional but Recommended)
In Stripe Dashboard → Developers → Webhooks:
- Add endpoint: `https://ufdhzgqrubbnornjdvgv.supabase.co/functions/v1/stripe-webhook`
- Select events: `checkout.session.completed`, `customer.subscription.*`
- Copy webhook secret and add to Supabase as `STRIPE_WEBHOOK_SECRET`

---

## 🔧 Troubleshooting

**Plans still not showing?**
1. Clear browser cache
2. Check browser console for errors
3. Verify all Price IDs are set (run verification query)
4. Ensure Price IDs are from LIVE mode, not test

**Error: "No such price"**
- You're using test Price IDs instead of live
- Create products in LIVE MODE and copy those Price IDs

**Error: "Stripe secret key not configured"**
- Add `STRIPE_SECRET_KEY` to Supabase Edge Functions secrets
- Make sure it starts with `sk_live_` (not `sk_test_`)

---

## 📋 Quick Checklist

- [ ] Switched Stripe to LIVE MODE
- [ ] Created 3 products in Stripe
- [ ] Copied 6 Price IDs (2 per product)
- [ ] Added Stripe secret key to Supabase
- [ ] Updated database with all 6 Price IDs
- [ ] Ran verification query (shows all READY)
- [ ] Tested signup page (plans visible)
- [ ] Tested checkout flow (optional)

---

## 📚 More Help Needed?

**Detailed Guides:**
- [STRIPE_LIVE_SETUP_NOW.md](STRIPE_LIVE_SETUP_NOW.md) - Complete setup guide
- [STRIPE_SETUP_CHECKLIST.md](STRIPE_SETUP_CHECKLIST.md) - Detailed checklist
- [STRIPE_SETUP_GUIDE.md](STRIPE_SETUP_GUIDE.md) - Full guide with troubleshooting

**SQL Template:**
- [UPDATE_STRIPE_PRICE_IDS.sql](UPDATE_STRIPE_PRICE_IDS.sql) - Copy/paste SQL file

---

## ✅ Success Criteria

**Before setup:**
- ❌ Plans not visible
- ❌ Error: "Les forfaits ne sont pas encore configurés"
- ❌ Cannot sign up

**After setup:**
- ✅ 3 plans visible on signup page
- ✅ No error messages
- ✅ Can proceed through signup
- ✅ Redirects to Stripe Checkout
- ✅ Real payments accepted

---

**Time:** 15 minutes
**Difficulty:** Easy (copy/paste configuration)
**Cost:** FREE setup, only pay Stripe fees on successful sales

**Status:** ⏳ Waiting for your configuration
**Next:** Follow steps 1-4 above

---

*Last Updated: 2025-10-21*
