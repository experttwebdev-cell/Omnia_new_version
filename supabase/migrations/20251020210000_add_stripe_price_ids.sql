/*
  # Add Stripe Price IDs to Subscription Plans

  1. Changes
    - Add `stripe_price_id_monthly` column to store Stripe monthly price ID
    - Add `stripe_price_id_yearly` column to store Stripe yearly price ID
    - Add `price_yearly` column to store annual pricing
    - Add `trial_days` column (default 14 days)

  2. Notes
    - These fields will store the Stripe Price IDs (format: price_xxxxx)
    - You'll need to create products in Stripe Dashboard and add the IDs here
    - Trial is automatically applied through Stripe's trial_period_days parameter
*/

-- Add Stripe Price ID columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id_monthly'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_monthly text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id_yearly'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_yearly text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'price_yearly'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN price_yearly numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'trial_days'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN trial_days integer DEFAULT 14;
  END IF;
END $$;

-- Update existing plans with yearly pricing and trial days
UPDATE subscription_plans SET
  price_yearly = 99.00,
  trial_days = 14
WHERE id = 'starter' AND price_yearly IS NULL;

UPDATE subscription_plans SET
  price_yearly = 790.00,
  trial_days = 14
WHERE id = 'professional' AND price_yearly IS NULL;

UPDATE subscription_plans SET
  price_yearly = 1990.00,
  trial_days = 14
WHERE id = 'enterprise' AND price_yearly IS NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN subscription_plans.stripe_price_id_monthly IS 'Stripe Price ID for monthly billing (format: price_xxxxx)';
COMMENT ON COLUMN subscription_plans.stripe_price_id_yearly IS 'Stripe Price ID for yearly billing (format: price_xxxxx)';
COMMENT ON COLUMN subscription_plans.trial_days IS 'Number of free trial days before first charge';
