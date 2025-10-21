# ✅ Stripe Live Payment Setup Checklist

## Pre-Setup Requirements

### Stripe Account Verification
- [ ] Stripe account created and logged in
- [ ] Business information completed
- [ ] Identity verification completed (if required)
- [ ] Bank account connected for payouts
- [ ] Tax information provided

**Check here:** https://dashboard.stripe.com/settings/account

---

## Step 1: Create Stripe Products (LIVE MODE)

**CRITICAL: Ensure you're in LIVE MODE (green badge in top-right)**

### Product 1: Starter Lite
- [ ] Navigate to https://dashboard.stripe.com/products
- [ ] Verify LIVE MODE is active
- [ ] Create new product: "Starter Lite"
- [ ] Add monthly recurring price: 9.99 EUR
- [ ] Add yearly recurring price: 99.00 EUR
- [ ] Copy Monthly Price ID: `price_____________________` (30 chars)
- [ ] Copy Yearly Price ID: `price_____________________` (30 chars)

### Product 2: Professional AI
- [ ] Create new product: "Professional AI"
- [ ] Add monthly recurring price: 79.00 EUR
- [ ] Add yearly recurring price: 790.00 EUR
- [ ] Copy Monthly Price ID: `price_____________________`
- [ ] Copy Yearly Price ID: `price_____________________`

### Product 3: Enterprise Commerce+
- [ ] Create new product: "Enterprise Commerce+"
- [ ] Add monthly recurring price: 199.00 EUR
- [ ] Add yearly recurring price: 1990.00 EUR
- [ ] Copy Monthly Price ID: `price_____________________`
- [ ] Copy Yearly Price ID: `price_____________________`

**Total Price IDs Collected:** [ ] 6 Price IDs (2 per product)

---

## Step 2: Get Stripe Secret Key

- [ ] Go to https://dashboard.stripe.com/apikeys
- [ ] Ensure you're in LIVE MODE
- [ ] Locate "Secret key" section
- [ ] Click "Reveal live key"
- [ ] Copy the key (starts with `sk_live_`)
- [ ] Store securely: `sk_live_________________________________`

---

## Step 3: Configure Supabase Edge Functions

### Add Stripe Secret Key
- [ ] Go to https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
- [ ] Navigate to: Project Settings → Edge Functions → Secrets
- [ ] Add new secret:
  - **Name:** `STRIPE_SECRET_KEY`
  - **Value:** Your live secret key from Step 2
- [ ] Click "Save"

### Add Webhook Secret (Recommended)
- [ ] In Stripe Dashboard, go to: Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] URL: `https://ufdhzgqrubbnornjdvgv.supabase.co/functions/v1/stripe-webhook`
- [ ] Select events:
  - [x] checkout.session.completed
  - [x] customer.subscription.created
  - [x] customer.subscription.updated
  - [x] customer.subscription.deleted
  - [x] invoice.paid
  - [x] invoice.payment_failed
- [ ] Click "Add endpoint"
- [ ] Copy "Signing secret" (starts with `whsec_`)
- [ ] In Supabase, add new secret:
  - **Name:** `STRIPE_WEBHOOK_SECRET`
  - **Value:** Webhook signing secret

---

## Step 4: Update Database with Price IDs

### Option A: Using SQL Editor
- [ ] Go to https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/sql
- [ ] Open file: `UPDATE_STRIPE_PRICE_IDS.sql` (created in your project)
- [ ] Replace ALL `price_xxxxxxxxxxxxx` with YOUR actual Price IDs from Step 1
- [ ] Run the query
- [ ] Verify results show all plans as "✅ READY"

### Option B: Manual Updates
Run these queries one by one (replace with YOUR Price IDs):

```sql
-- Starter Lite
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'YOUR_STARTER_MONTHLY_PRICE_ID',
  stripe_price_id_yearly = 'YOUR_STARTER_YEARLY_PRICE_ID'
WHERE id = 'starter';

-- Professional AI
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'YOUR_PROFESSIONAL_MONTHLY_PRICE_ID',
  stripe_price_id_yearly = 'YOUR_PROFESSIONAL_YEARLY_PRICE_ID'
WHERE id = 'professional';

-- Enterprise Commerce+
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'YOUR_ENTERPRISE_MONTHLY_PRICE_ID',
  stripe_price_id_yearly = 'YOUR_ENTERPRISE_YEARLY_PRICE_ID'
WHERE id = 'enterprise';
```

### Verification
- [ ] Run verification query:
```sql
SELECT * FROM subscription_plans_config_status;
```
- [ ] Confirm all plans show "READY - All price IDs configured"

---

## Step 5: Test Configuration

### Frontend Testing
- [ ] Open your application in browser
- [ ] Navigate to signup page
- [ ] Verify error message is gone
- [ ] Confirm 3 plans are displayed
- [ ] Check plan names, prices, and features are correct
- [ ] Test monthly/yearly toggle
- [ ] Verify savings calculation for yearly plans

### Checkout Flow Testing (Optional - WILL CHARGE REAL MONEY)
- [ ] Fill out signup form with real information
- [ ] Select "Starter Lite" plan
- [ ] Click "Commencer l'essai gratuit"
- [ ] Verify redirect to Stripe Checkout
- [ ] Check Stripe Checkout shows correct plan and price
- [ ] Use real credit card to complete payment
- [ ] Verify successful redirect back to dashboard
- [ ] Check Stripe Dashboard for new subscription
- [ ] Cancel test subscription if desired

---

## Post-Setup Verification

### Database Checks
- [ ] Run: `SELECT * FROM sellers WHERE created_at > now() - interval '1 hour'`
- [ ] Verify test user created successfully
- [ ] Check subscriptions table for new subscription record
- [ ] Verify trial_ends_at is set to 14 days from now

### Stripe Dashboard Checks
- [ ] Customer created in Stripe
- [ ] Subscription created with correct plan
- [ ] Subscription shows "trialing" status
- [ ] Next billing date is 14 days away
- [ ] Webhook events received successfully

### Edge Function Logs
- [ ] Go to Supabase Dashboard → Edge Functions
- [ ] Check "create-stripe-checkout" logs
- [ ] Verify no errors in recent calls
- [ ] Check "stripe-webhook" logs
- [ ] Confirm webhook events processed

---

## Troubleshooting Guide

### Plans Still Not Showing
**Symptoms:** Error message still appears, no plans visible

**Solutions:**
1. [ ] Clear browser cache and refresh
2. [ ] Check browser console for JavaScript errors
3. [ ] Verify database Price IDs are not NULL:
   ```sql
   SELECT id, stripe_price_id_monthly, stripe_price_id_yearly
   FROM subscription_plans;
   ```
4. [ ] Confirm Price IDs are exactly 30 characters
5. [ ] Verify Price IDs start with `price_`

### Error: "No such price"
**Symptoms:** Plans display but clicking checkout fails

**Solutions:**
1. [ ] Verify you're using LIVE Mode Price IDs (not test)
2. [ ] Check Price IDs exist in Stripe Dashboard → Products
3. [ ] Confirm Price IDs are copied correctly (no extra spaces)
4. [ ] Make sure billing_period matches (monthly vs yearly)

### Error: "Stripe secret key not configured"
**Symptoms:** Checkout button fails before redirecting

**Solutions:**
1. [ ] Verify `STRIPE_SECRET_KEY` exists in Supabase secrets
2. [ ] Confirm secret key starts with `sk_live_` (not `sk_test_`)
3. [ ] Check Edge Function has been redeployed after adding secret
4. [ ] View Edge Function logs for detailed error

### Webhook Not Working
**Symptoms:** Subscription created in Stripe but not updating database

**Solutions:**
1. [ ] Verify webhook endpoint URL is correct
2. [ ] Check `STRIPE_WEBHOOK_SECRET` is set in Supabase
3. [ ] View webhook logs in Stripe Dashboard → Developers → Webhooks
4. [ ] Check Edge Function logs for webhook errors
5. [ ] Test webhook manually using Stripe CLI

---

## Security Checklist

- [ ] Never commit Stripe secret keys to git
- [ ] Stripe secret key stored only in Supabase secrets
- [ ] Webhook endpoint uses signature verification
- [ ] HTTPS used for all Stripe communication
- [ ] Test thoroughly before announcing to customers
- [ ] Set up billing alerts in Stripe Dashboard
- [ ] Configure fraud detection rules
- [ ] Enable 3D Secure authentication if required

---

## Go-Live Checklist

Before announcing to customers:

### Legal & Compliance
- [ ] Terms of Service published and accessible
- [ ] Privacy Policy published and GDPR compliant
- [ ] Refund/Cancellation policy defined
- [ ] Cookie consent implemented
- [ ] Customer support email configured

### Technical
- [ ] All tests passing in production
- [ ] Webhook endpoint monitored
- [ ] Error tracking enabled
- [ ] Backup system in place
- [ ] Database performance optimized

### Business
- [ ] Pricing confirmed and approved
- [ ] Customer support process defined
- [ ] Cancellation flow tested
- [ ] Refund process documented
- [ ] First customer ready to sign up

---

## Quick Reference

### Important URLs
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Products:** https://dashboard.stripe.com/products
- **Stripe API Keys:** https://dashboard.stripe.com/apikeys
- **Stripe Webhooks:** https://dashboard.stripe.com/webhooks
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
- **Supabase SQL Editor:** https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/sql
- **Edge Functions:** https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/functions

### Support Resources
- **Stripe Documentation:** https://stripe.com/docs
- **Stripe Support:** https://support.stripe.com
- **Supabase Documentation:** https://supabase.com/docs
- **Project Guide:** `STRIPE_LIVE_SETUP_NOW.md`

---

## Summary

**Current Status:**
- Database: ✅ 3 plans configured
- Stripe Products: ⏳ Needs creation
- Stripe Secret Key: ⏳ Needs configuration
- Database Price IDs: ⏳ Needs update
- Testing: ⏳ Pending completion

**After Completion:**
- Users can see all 3 subscription plans
- Signup flow works end-to-end
- Real payments accepted via Stripe
- 14-day free trial automatically applied
- Webhooks update subscription status

**Time Required:** 15-20 minutes
**Difficulty:** Easy (configuration only)
**Technical Changes:** None (no code modifications)

---

**Last Updated:** 2025-10-21
**Version:** 1.0 - Live Payment Setup
