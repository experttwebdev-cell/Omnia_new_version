/*
  # Create Admin Account for Omnia AI

  This script creates the super admin account that can be used to log in.

  IMPORTANT: You MUST also create this user in Supabase Auth Dashboard!

  Steps:
  1. Go to Supabase Dashboard > Authentication > Users
  2. Click "Add user" > "Create new user"
  3. Email: admin@smartecommerce.ai
  4. Password: (choose a secure password)
  5. Auto Confirm Email: ✓ (checked)
  6. Click "Create user"
  7. Copy the user ID that was generated
  8. Run this script and replace 'USER_ID_FROM_AUTH' with the actual ID
*/

-- First, check if the admin seller already exists
DO $$
DECLARE
  admin_exists boolean;
  auth_user_id uuid;
BEGIN
  -- Check if seller exists
  SELECT EXISTS (
    SELECT 1 FROM sellers WHERE email = 'admin@smartecommerce.ai'
  ) INTO admin_exists;

  IF admin_exists THEN
    RAISE NOTICE 'Admin seller already exists. Updating...';

    -- Get the auth user ID
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'admin@smartecommerce.ai';

    IF auth_user_id IS NULL THEN
      RAISE EXCEPTION 'User not found in auth.users. Please create the user in Supabase Auth first!';
    END IF;

    -- Update existing seller with auth user ID
    UPDATE sellers
    SET
      id = auth_user_id,
      role = 'superadmin',
      status = 'active',
      trial_ends_at = NULL,
      updated_at = now()
    WHERE email = 'admin@smartecommerce.ai';

    RAISE NOTICE 'Admin seller updated successfully with ID: %', auth_user_id;
  ELSE
    -- Get the auth user ID
    SELECT id INTO auth_user_id FROM auth.users WHERE email = 'admin@smartecommerce.ai';

    IF auth_user_id IS NULL THEN
      RAISE EXCEPTION 'User not found in auth.users. Please create the user in Supabase Auth Dashboard first!';
    END IF;

    -- Create new seller
    INSERT INTO sellers (
      id,
      email,
      company_name,
      full_name,
      role,
      status,
      trial_ends_at
    ) VALUES (
      auth_user_id,
      'admin@smartecommerce.ai',
      'Omnia AI',
      'Super Admin',
      'superadmin',
      'active',
      NULL
    );

    RAISE NOTICE 'Admin seller created successfully with ID: %', auth_user_id;
  END IF;

  -- Create or update subscription
  INSERT INTO subscriptions (
    seller_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    auth_user_id,
    'enterprise',
    'active',
    now(),
    now() + interval '1 year',
    false
  )
  ON CONFLICT (seller_id)
  DO UPDATE SET
    plan_id = 'enterprise',
    status = 'active',
    updated_at = now();

  RAISE NOTICE 'Admin subscription configured';

  -- Create or update usage tracking
  INSERT INTO usage_tracking (
    seller_id,
    month,
    products_count,
    optimizations_count,
    articles_count,
    chat_responses_count
  ) VALUES (
    auth_user_id,
    date_trunc('month', now())::date,
    0,
    0,
    0,
    0
  )
  ON CONFLICT (seller_id, month)
  DO NOTHING;

  RAISE NOTICE 'Usage tracking initialized';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Admin account is ready!';
  RAISE NOTICE 'Email: admin@smartecommerce.ai';
  RAISE NOTICE 'Password: (the one you set in Supabase Auth)';
  RAISE NOTICE '========================================';
END $$;

-- Verify the admin account
SELECT
  s.id,
  s.email,
  s.full_name,
  s.company_name,
  s.role,
  s.status,
  sub.plan_id,
  sub.status as subscription_status,
  sp.name as plan_name
FROM sellers s
LEFT JOIN subscriptions sub ON s.id = sub.seller_id
LEFT JOIN subscription_plans sp ON sub.plan_id = sp.id
WHERE s.email = 'admin@smartecommerce.ai';
