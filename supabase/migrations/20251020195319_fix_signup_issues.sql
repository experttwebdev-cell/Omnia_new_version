/*
  # Fix Signup Issues
  
  1. Schema Changes
    - Add price_yearly, stripe_price_id, stripe_price_id_yearly, description fields to subscription_plans
    - Update existing plans with yearly prices
  
  2. Security
    - Add INSERT policy for sellers table to allow signup
    - Add INSERT policy for subscriptions table to allow signup
    
  3. Data Updates
    - Set yearly prices for all plans (with ~17% discount)
*/

-- Add missing columns to subscription_plans
ALTER TABLE subscription_plans 
  ADD COLUMN IF NOT EXISTS price_yearly numeric(10,2),
  ADD COLUMN IF NOT EXISTS stripe_price_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly text DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Update existing plans with yearly prices and descriptions
UPDATE subscription_plans 
SET 
  price_yearly = 99.00,
  description = 'Parfait pour débuter avec l''IA'
WHERE id = 'starter';

UPDATE subscription_plans 
SET 
  price_yearly = 790.00,
  description = 'Solution complète pour professionnels'
WHERE id = 'professional';

UPDATE subscription_plans 
SET 
  price_yearly = 1990.00,
  description = 'Entreprise avec tout illimité'
WHERE id = 'enterprise';

-- Fix sellers table RLS - Allow INSERT during signup
DROP POLICY IF EXISTS "Allow signup insert" ON sellers;
CREATE POLICY "Allow signup insert" ON sellers
  FOR INSERT
  WITH CHECK (id::text = auth.uid()::text);

-- Fix subscriptions table RLS - Allow INSERT during signup
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT
  WITH CHECK (seller_id::text = auth.uid()::text);

-- Fix usage_tracking table RLS - Allow INSERT during signup
DROP POLICY IF EXISTS "Users can insert own usage" ON usage_tracking;
CREATE POLICY "Users can insert own usage" ON usage_tracking
  FOR INSERT
  WITH CHECK (seller_id::text = auth.uid()::text);