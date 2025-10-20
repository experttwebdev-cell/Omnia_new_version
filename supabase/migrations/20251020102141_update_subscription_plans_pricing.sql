/*
  # Update Subscription Plans with Annual/Monthly Pricing

  1. Changes
    - Add price_annual column to subscription_plans
    - Update existing plans with proper pricing
    - Add stripe_price_id_annual for annual Stripe pricing

  2. Plans
    - Starter: €9.99/month or €99/year (save 2 months)
    - Professional: €79/month or €790/year (save 2 months)
    - Enterprise: €199/month or €1990/year (save 2 months)
*/

-- Add annual pricing columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'price_annual'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN price_annual numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'stripe_price_id_annual'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN stripe_price_id_annual text;
  END IF;
END $$;

-- Update plans with correct pricing
UPDATE subscription_plans
SET
  price_monthly = 9.99,
  price_annual = 99.00,
  features = jsonb_set(
    COALESCE(features, '{}'::jsonb),
    '{billing_periods}',
    '["monthly", "annual"]'::jsonb
  )
WHERE id = 'starter';

UPDATE subscription_plans
SET
  price_monthly = 79.00,
  price_annual = 790.00,
  features = jsonb_set(
    COALESCE(features, '{}'::jsonb),
    '{billing_periods}',
    '["monthly", "annual"]'::jsonb
  )
WHERE id = 'professional';

UPDATE subscription_plans
SET
  price_monthly = 199.00,
  price_annual = 1990.00,
  features = jsonb_set(
    COALESCE(features, '{}'::jsonb),
    '{billing_periods}',
    '["monthly", "annual"]'::jsonb
  )
WHERE id = 'enterprise';

-- Add billing_period column to subscriptions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'billing_period'
  ) THEN
    ALTER TABLE subscriptions
    ADD COLUMN billing_period text DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual'));
  END IF;
END $$;