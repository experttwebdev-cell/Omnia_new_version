/*
  # Fix Stripe Price IDs Configuration
  
  ## Summary
  This migration fixes the Stripe pricing error by setting the price IDs to NULL
  and adding clear instructions for proper Stripe configuration.
  
  ## Problem
  - Database currently has placeholder test values like 'price_starter_monthly_test'
  - These don't exist in Stripe, causing "No such price" errors
  - Users cannot complete signup flow
  
  ## Solution
  1. Clear invalid placeholder price IDs
  2. Add check constraint to ensure price IDs follow Stripe format when set
  3. Add helpful comments explaining what needs to be configured
  
  ## Required Manual Configuration
  After applying this migration, you MUST:
  1. Create products in Stripe Dashboard (https://dashboard.stripe.com)
  2. Create recurring prices (monthly and yearly) for each product
  3. Copy the Stripe Price IDs (format: price_xxxxxxxxxxxxx)
  4. Update the database with real Stripe Price IDs using:
     
     UPDATE subscription_plans SET 
       stripe_price_id_monthly = 'price_xxxxxxxxxxxxx',
       stripe_price_id_yearly = 'price_xxxxxxxxxxxxx'
     WHERE id = 'starter';
  
  ## Important Notes
  - Stripe Price IDs start with 'price_' followed by 24 alphanumeric characters
  - Each plan needs both monthly and yearly price IDs
  - Test mode price IDs work for testing (use test card: 4242 4242 4242 4242)
  - Switch to live mode price IDs before production launch
*/

-- Step 1: Clear invalid placeholder price IDs
UPDATE subscription_plans 
SET 
  stripe_price_id_monthly = NULL,
  stripe_price_id_yearly = NULL
WHERE 
  stripe_price_id_monthly LIKE '%_test' 
  OR stripe_price_id_yearly LIKE '%_test';

-- Step 2: Add check constraints to validate Stripe Price ID format
DO $$
BEGIN
  -- Add constraint for monthly price ID format
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_price_id_monthly_format'
  ) THEN
    ALTER TABLE subscription_plans
    ADD CONSTRAINT stripe_price_id_monthly_format
    CHECK (
      stripe_price_id_monthly IS NULL 
      OR stripe_price_id_monthly ~ '^price_[A-Za-z0-9]{24}$'
    );
  END IF;

  -- Add constraint for yearly price ID format
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'stripe_price_id_yearly_format'
  ) THEN
    ALTER TABLE subscription_plans
    ADD CONSTRAINT stripe_price_id_yearly_format
    CHECK (
      stripe_price_id_yearly IS NULL 
      OR stripe_price_id_yearly ~ '^price_[A-Za-z0-9]{24}$'
    );
  END IF;
END $$;

-- Step 3: Add helpful column comments
COMMENT ON COLUMN subscription_plans.stripe_price_id_monthly IS 
  'Stripe Price ID for monthly billing. Format: price_xxxxxxxxxxxxx (24 chars). 
   Create in Stripe Dashboard: Products > Add Product > Add Price (Recurring/Monthly).
   MUST be set before users can sign up with this plan.';

COMMENT ON COLUMN subscription_plans.stripe_price_id_yearly IS 
  'Stripe Price ID for yearly billing. Format: price_xxxxxxxxxxxxx (24 chars).
   Create in Stripe Dashboard: Products > Add Product > Add Price (Recurring/Yearly).
   MUST be set before users can sign up with this plan.';

-- Step 4: Add a configuration status view for easy monitoring
CREATE OR REPLACE VIEW subscription_plans_config_status AS
SELECT 
  id,
  name,
  price_monthly,
  price_yearly,
  stripe_price_id_monthly IS NOT NULL as has_monthly_price_id,
  stripe_price_id_yearly IS NOT NULL as has_yearly_price_id,
  (stripe_price_id_monthly IS NOT NULL AND stripe_price_id_yearly IS NOT NULL) as fully_configured,
  CASE 
    WHEN stripe_price_id_monthly IS NULL AND stripe_price_id_yearly IS NULL THEN 'NOT CONFIGURED - Stripe Price IDs needed'
    WHEN stripe_price_id_monthly IS NULL THEN 'PARTIAL - Missing monthly price ID'
    WHEN stripe_price_id_yearly IS NULL THEN 'PARTIAL - Missing yearly price ID'
    ELSE 'READY - All price IDs configured'
  END as configuration_status
FROM subscription_plans
ORDER BY price_monthly;

-- Add helpful comment
COMMENT ON VIEW subscription_plans_config_status IS 
  'Shows which subscription plans are fully configured with Stripe Price IDs.
   Query this view to check configuration status: SELECT * FROM subscription_plans_config_status;';
