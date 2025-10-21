-- ========================================
-- Stripe Price IDs Configuration
-- ========================================
-- INSTRUCTIONS:
-- 1. Replace ALL 'price_xxxxxxxxxxxxx' with your REAL Stripe Price IDs
-- 2. Price IDs must be from LIVE MODE (not test mode)
-- 3. Format: price_ followed by 24 alphanumeric characters
-- 4. Get these from: https://dashboard.stripe.com/products
-- ========================================

-- Starter Lite Plan (9.99€/month or 99€/year)
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- ← REPLACE: Starter monthly Price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- ← REPLACE: Starter yearly Price ID
WHERE id = 'starter';

-- Professional AI Plan (79€/month or 790€/year)
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- ← REPLACE: Professional monthly Price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- ← REPLACE: Professional yearly Price ID
WHERE id = 'professional';

-- Enterprise Commerce+ Plan (199€/month or 1990€/year)
UPDATE subscription_plans SET
  stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',  -- ← REPLACE: Enterprise monthly Price ID
  stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'    -- ← REPLACE: Enterprise yearly Price ID
WHERE id = 'enterprise';

-- ========================================
-- Verification Query
-- ========================================
-- This should show all plans as "✅ READY" after updating
SELECT
  id,
  name,
  price_monthly || '€' as monthly_price,
  price_yearly || '€' as yearly_price,
  CASE
    WHEN stripe_price_id_monthly IS NOT NULL AND stripe_price_id_yearly IS NOT NULL
    THEN '✅ READY'
    WHEN stripe_price_id_monthly IS NULL AND stripe_price_id_yearly IS NULL
    THEN '❌ NOT CONFIGURED'
    ELSE '⚠️ PARTIAL'
  END as status,
  stripe_price_id_monthly,
  stripe_price_id_yearly
FROM subscription_plans
ORDER BY price_monthly;

-- ========================================
-- Expected Result:
-- ========================================
-- All rows should show status = "✅ READY"
-- stripe_price_id_monthly should start with "price_"
-- stripe_price_id_yearly should start with "price_"
-- Both IDs should be exactly 30 characters
-- ========================================
