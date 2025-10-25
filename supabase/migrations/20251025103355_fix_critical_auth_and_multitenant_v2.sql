/*
  # Fix Critical Multi-Tenant and Auth Issues V2
  
  ## Summary
  Fixes authentication and multi-tenant architecture with safe policy handling.
  
  ## Changes
  1. Add user_id to sellers table linking to auth.users
  2. Backfill user_id from email matching
  3. Synchronize plan data between sellers and subscriptions
  4. Create signup trigger for automatic seller creation
  5. Ensure all sellers have subscriptions and usage tracking
*/

-- ============================================
-- 1. ADD user_id TO sellers TABLE
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sellers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE sellers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_sellers_user_id ON sellers(user_id);
  END IF;
END $$;

-- ============================================
-- 2. BACKFILL user_id FROM auth.users
-- ============================================

UPDATE sellers s
SET user_id = au.id
FROM auth.users au
WHERE s.email = au.email
AND s.user_id IS NULL;

-- ============================================
-- 3. SYNCHRONIZE PLAN DATA
-- ============================================

-- Update sellers.current_plan_id from active subscriptions
UPDATE sellers
SET current_plan_id = sub.plan_id,
    subscription_status = 'active'
FROM subscriptions sub
WHERE sub.seller_id = sellers.id
AND sub.status IN ('active', 'trial')
AND sellers.current_plan_id IS NULL;

-- Update subscription status for all sellers
UPDATE sellers
SET subscription_status = CASE 
  WHEN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.seller_id = sellers.id 
    AND subscriptions.status = 'active'
  ) THEN 'active'
  WHEN EXISTS (
    SELECT 1 FROM subscriptions 
    WHERE subscriptions.seller_id = sellers.id 
    AND subscriptions.status = 'trial'
  ) THEN 'trial'
  ELSE 'inactive'
END;

-- ============================================
-- 4. CREATE SIGNUP TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  v_seller_id uuid;
  v_plan_id text;
  v_store_name text;
BEGIN
  -- Extract metadata from auth.users
  v_plan_id := COALESCE(NEW.raw_user_meta_data->>'plan_id', 'starter');
  v_store_name := COALESCE(NEW.raw_user_meta_data->>'store_name', 'My Store');

  -- Create seller record
  INSERT INTO sellers (
    id,
    user_id,
    email,
    company_name,
    role,
    status,
    trial_ends_at,
    current_plan_id,
    subscription_status,
    email_verified
  ) VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    v_store_name,
    'seller',
    'trial',
    now() + interval '14 days',
    v_plan_id,
    'trial',
    false
  )
  ON CONFLICT (email) DO UPDATE
  SET user_id = NEW.id
  RETURNING id INTO v_seller_id;

  -- Create subscription record if doesn't exist
  INSERT INTO subscriptions (
    seller_id,
    plan_id,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    v_seller_id,
    v_plan_id,
    'trial',
    now(),
    now() + interval '14 days'
  )
  ON CONFLICT DO NOTHING;

  -- Initialize usage tracking if doesn't exist
  INSERT INTO subscription_usage (
    seller_id,
    period_start,
    period_end
  ) VALUES (
    v_seller_id,
    now(),
    now() + interval '1 month'
  )
  ON CONFLICT (seller_id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in handle_new_user_signup: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- ============================================
-- 5. ENSURE MISSING SUBSCRIPTIONS
-- ============================================

INSERT INTO subscriptions (
  seller_id,
  plan_id,
  status,
  current_period_start,
  current_period_end
)
SELECT 
  s.id,
  COALESCE(s.current_plan_id, 'starter'),
  CASE 
    WHEN s.status = 'active' THEN 'active'
    ELSE 'trial'
  END,
  COALESCE(s.created_at, now()),
  COALESCE(s.trial_ends_at, now() + interval '14 days')
FROM sellers s
WHERE NOT EXISTS (
  SELECT 1 FROM subscriptions sub
  WHERE sub.seller_id = s.id
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 6. ENSURE USAGE TRACKING EXISTS
-- ============================================

INSERT INTO subscription_usage (
  seller_id,
  period_start,
  period_end
)
SELECT 
  id,
  now(),
  now() + interval '1 month'
FROM sellers
WHERE NOT EXISTS (
  SELECT 1 FROM subscription_usage su
  WHERE su.seller_id = sellers.id
)
ON CONFLICT (seller_id) DO NOTHING;

-- ============================================
-- 7. ADD UNIQUE CONSTRAINT ON EMAIL
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sellers_email_key'
  ) THEN
    ALTER TABLE sellers ADD CONSTRAINT sellers_email_key UNIQUE (email);
  END IF;
END $$;
