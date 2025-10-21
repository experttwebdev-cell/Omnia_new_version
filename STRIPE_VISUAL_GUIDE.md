# 🎯 Visual Guide: Fix Missing Subscription Plans

## Current State

```
┌─────────────────────────────────────┐
│   Your Application Signup Page      │
├─────────────────────────────────────┤
│                                      │
│  ❌ Les forfaits ne sont pas        │
│     encore configurés.               │
│     Veuillez réessayer plus tard    │
│     ou contacter le support.        │
│                                      │
│  [ No plans visible ]                │
│                                      │
└─────────────────────────────────────┘
```

**Problem:** Database has NULL Stripe Price IDs

```
Database: subscription_plans table
┌────────────┬─────────────────────┬──────────────────────┐
│ id         │ stripe_price_id_    │ stripe_price_id_     │
│            │ monthly             │ yearly               │
├────────────┼─────────────────────┼──────────────────────┤
│ starter    │ NULL ❌             │ NULL ❌              │
│ professional│ NULL ❌            │ NULL ❌              │
│ enterprise │ NULL ❌             │ NULL ❌              │
└────────────┴─────────────────────┴──────────────────────┘
```

---

## After Configuration

```
┌─────────────────────────────────────┐
│   Your Application Signup Page      │
├─────────────────────────────────────┤
│                                      │
│  Choose your plan:                   │
│                                      │
│  ┌──────────┐  ┌──────────┐  ┌─────┐│
│  │ Starter  │  │  Pro ⭐  │  │ Ent ││
│  │  9.99€   │  │  79.00€  │  │199€ ││
│  │  /month  │  │  /month  │  │/mo  ││
│  └──────────┘  └──────────┘  └─────┘│
│                                      │
│  ✅ 14-day free trial                │
│  ✅ Cancel anytime                   │
│                                      │
└─────────────────────────────────────┘
```

**Solution:** Database populated with Stripe Price IDs

```
Database: subscription_plans table
┌────────────┬─────────────────────┬──────────────────────┐
│ id         │ stripe_price_id_    │ stripe_price_id_     │
│            │ monthly             │ yearly               │
├────────────┼─────────────────────┼──────────────────────┤
│ starter    │ price_abc123... ✅  │ price_xyz789... ✅   │
│ professional│ price_def456... ✅ │ price_uvw012... ✅   │
│ enterprise │ price_ghi789... ✅  │ price_rst345... ✅   │
└────────────┴─────────────────────┴──────────────────────┘
```

---

## The 4-Step Flow

```
┌────────────────────────────────────────────────────────────┐
│                     STEP 1: STRIPE                         │
│                  Create Products (8 min)                    │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Stripe Dashboard → Products → Add Product                 │
│                                                             │
│  1️⃣ Starter Lite                                           │
│     → Monthly: 9.99 EUR   → Get: price_abc123...           │
│     → Yearly: 99.00 EUR   → Get: price_xyz789...           │
│                                                             │
│  2️⃣ Professional AI                                        │
│     → Monthly: 79.00 EUR  → Get: price_def456...           │
│     → Yearly: 790.00 EUR  → Get: price_uvw012...           │
│                                                             │
│  3️⃣ Enterprise Commerce+                                   │
│     → Monthly: 199.00 EUR → Get: price_ghi789...           │
│     → Yearly: 1990.00 EUR → Get: price_rst345...           │
│                                                             │
│  ✅ Result: 6 Price IDs collected                          │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                     STEP 2: STRIPE                         │
│                 Get Secret Key (2 min)                      │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Stripe Dashboard → Developers → API Keys                  │
│                                                             │
│  Secret Key (LIVE MODE)                                    │
│  → Reveal: sk_live_xxxxxxxxxxxxx...                        │
│  → Copy this key                                            │
│                                                             │
│  ✅ Result: Live secret key copied                         │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                     STEP 3: SUPABASE                       │
│              Configure Edge Functions (3 min)              │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  A) Add Secret Key:                                        │
│     Supabase → Project Settings → Edge Functions           │
│     → Secrets → Add New Secret                             │
│     Name: STRIPE_SECRET_KEY                                │
│     Value: sk_live_xxxxxxxxxxxxx...                        │
│                                                             │
│  B) Update Database:                                       │
│     Supabase → SQL Editor → New Query                      │
│     Run UPDATE commands with your 6 Price IDs              │
│                                                             │
│  ✅ Result: Configuration complete                         │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│                     STEP 4: TEST                           │
│                  Verify Everything (2 min)                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Open your app                                          │
│  2. Go to signup page                                      │
│  3. See 3 plans displayed ✅                               │
│  4. No error message ✅                                    │
│  5. Click through to Stripe Checkout ✅                    │
│                                                             │
│  ✅ Result: Live payments ready!                           │
└────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌──────────────────┐
│  User visits     │
│  Signup Page     │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐
│  Frontend loads  │
│  subscription_   │
│  plans from DB   │
└────────┬─────────┘
         │
         ↓  Query Database
┌──────────────────────────────────────────┐
│        subscription_plans table           │
│  ┌────────────────────────────────────┐  │
│  │ stripe_price_id_monthly IS NULL? │  │
│  │ stripe_price_id_yearly IS NULL?  │  │
│  └────────────────────────────────────┘  │
└────────┬─────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
   YES       NO
    │         │
    ↓         ↓
┌─────────┐  ┌──────────────┐
│ Show    │  │ Display 3    │
│ Error   │  │ Plans with   │
│ Message │  │ Pricing      │
└─────────┘  └──────┬───────┘
                    │
                    ↓
             ┌──────────────────┐
             │ User selects     │
             │ plan & submits   │
             └──────┬───────────┘
                    │
                    ↓
             ┌──────────────────┐
             │ create-stripe-   │
             │ checkout Edge    │
             │ Function         │
             └──────┬───────────┘
                    │
                    ↓ Uses STRIPE_SECRET_KEY
             ┌──────────────────┐
             │ Stripe API       │
             │ Creates session  │
             │ with Price ID    │
             └──────┬───────────┘
                    │
                    ↓
             ┌──────────────────┐
             │ Redirect to      │
             │ Stripe Checkout  │
             │ (Real payment)   │
             └──────────────────┘
```

---

## Configuration Points

```
┌────────────────────────────────────────────────────────┐
│                  CONFIGURATION MAP                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│  🔴 MUST CONFIGURE (3 locations)                       │
│                                                         │
│  1. Stripe Dashboard (Products)                        │
│     ├─ Starter: 2 prices → 2 Price IDs                │
│     ├─ Professional: 2 prices → 2 Price IDs           │
│     └─ Enterprise: 2 prices → 2 Price IDs             │
│                                                         │
│  2. Stripe Dashboard (API Keys)                        │
│     └─ Copy live secret key                            │
│                                                         │
│  3. Supabase Project                                   │
│     ├─ Edge Functions secrets:                         │
│     │  └─ STRIPE_SECRET_KEY = sk_live_...             │
│     │                                                   │
│     └─ Database (subscription_plans):                  │
│        ├─ starter.stripe_price_id_monthly              │
│        ├─ starter.stripe_price_id_yearly               │
│        ├─ professional.stripe_price_id_monthly         │
│        ├─ professional.stripe_price_id_yearly          │
│        ├─ enterprise.stripe_price_id_monthly           │
│        └─ enterprise.stripe_price_id_yearly            │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

```
┌─────────────────────────────────────────────────────────┐
│              CONFIGURATION VERIFICATION                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Stripe Dashboard:                                      │
│  ☐ Switched to LIVE MODE (green badge)                 │
│  ☐ Created 3 products                                   │
│  ☐ Each product has 2 prices                           │
│  ☐ 6 Price IDs copied (30 chars each)                  │
│  ☐ Live secret key copied                              │
│                                                          │
│  Supabase Dashboard:                                    │
│  ☐ STRIPE_SECRET_KEY added to secrets                  │
│  ☐ Database updated with 6 Price IDs                   │
│  ☐ Verification query shows all READY                  │
│                                                          │
│  Application:                                            │
│  ☐ Signup page loads without errors                    │
│  ☐ 3 plans visible with correct prices                 │
│  ☐ Monthly/Yearly toggle works                         │
│  ☐ Clicking checkout redirects to Stripe               │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Time Breakdown

```
┌────────────────────┬──────────┬────────────────────────┐
│ Step               │ Time     │ What You're Doing      │
├────────────────────┼──────────┼────────────────────────┤
│ Stripe Products    │ 8 min    │ Creating 3 products    │
│                    │          │ with 6 prices          │
├────────────────────┼──────────┼────────────────────────┤
│ Stripe Secret Key  │ 2 min    │ Copying API key        │
├────────────────────┼──────────┼────────────────────────┤
│ Supabase Config    │ 3 min    │ Adding secret +        │
│                    │          │ updating database      │
├────────────────────┼──────────┼────────────────────────┤
│ Testing            │ 2 min    │ Verifying it works     │
├────────────────────┼──────────┼────────────────────────┤
│ TOTAL              │ 15 min   │ Ready for payments!    │
└────────────────────┴──────────┴────────────────────────┘
```

---

## Quick Links

**Stripe:**
- Products: https://dashboard.stripe.com/products
- API Keys: https://dashboard.stripe.com/apikeys

**Supabase:**
- Project: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv
- SQL Editor: https://supabase.com/dashboard/project/ufdhzgqrubbnornjdvgv/sql

**Documentation:**
- [FIX_PLANS_NOW.md](FIX_PLANS_NOW.md) - Quick fix guide
- [STRIPE_LIVE_SETUP_NOW.md](STRIPE_LIVE_SETUP_NOW.md) - Detailed setup
- [UPDATE_STRIPE_PRICE_IDS.sql](UPDATE_STRIPE_PRICE_IDS.sql) - SQL template

---

**Start Here:** [FIX_PLANS_NOW.md](FIX_PLANS_NOW.md)
