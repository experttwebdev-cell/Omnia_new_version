/*
  # Fix Signup Trigger Order Issue
  
  1. Problem
    - When seller is created, trigger fires immediately
    - Subscription doesn't exist yet (created after seller)
    - Trigger tries to join to non-existent subscription
    - This causes "subscription_plan_id does not exist" type errors
    
  2. Solution
    - Make trigger gracefully handle case when subscription doesn't exist yet
    - Use default limits when no subscription found
    - Subscription creation will update the limits later if needed
    
  3. Changes
    - Update create_subscription_usage_for_new_seller to use COALESCE for defaults
    - Don't fail when subscription doesn't exist
*/

-- Drop and recreate the trigger function to handle missing subscription
DROP FUNCTION IF EXISTS create_subscription_usage_for_new_seller() CASCADE;

CREATE OR REPLACE FUNCTION create_subscription_usage_for_new_seller()
RETURNS TRIGGER AS $$
DECLARE
  v_products_limit int := 100; -- Default starter plan
  v_seo_limit int := 300;
  v_blog_limit int := 1;
  v_chat_limit int := 200;
  v_ai_enrichments_limit int := 100;
  v_google_shopping_limit int := 10;
BEGIN
  -- Try to get plan limits from subscription if it exists
  -- If not, use defaults (subscription might be created after seller)
  SELECT 
    COALESCE(sp.max_products, 100),
    COALESCE(sp.max_optimizations_monthly, 300),
    COALESCE(sp.max_articles_monthly, 1),
    COALESCE(sp.max_chat_responses_monthly, 200),
    100,
    10
  INTO 
    v_products_limit,
    v_seo_limit,
    v_blog_limit,
    v_chat_limit,
    v_ai_enrichments_limit,
    v_google_shopping_limit
  FROM subscription_plans sp
  JOIN subscriptions sub ON sub.plan_id = sp.id
  WHERE sub.seller_id = NEW.id
  LIMIT 1;

  -- Create usage record with plan limits (uses defaults if subscription not found)
  INSERT INTO subscription_usage (
    seller_id,
    products_count,
    ai_enrichments_used,
    ai_enrichments_limit,
    blog_articles_used,
    blog_articles_limit,
    chat_messages_used,
    chat_messages_limit,
    google_shopping_syncs,
    google_shopping_syncs_limit,
    seo_optimizations_used,
    seo_optimizations_limit,
    period_start,
    period_end
  ) VALUES (
    NEW.id,
    0,
    0,
    v_ai_enrichments_limit,
    0,
    v_blog_limit,
    0,
    v_chat_limit,
    0,
    v_google_shopping_limit,
    0,
    v_seo_limit,
    now(),
    now() + interval '1 month'
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- If anything fails, still allow seller creation
    -- Usage record can be created later
    RAISE WARNING 'Could not create usage record for seller %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_usage_on_seller_insert ON sellers;
CREATE TRIGGER create_usage_on_seller_insert
  AFTER INSERT ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_usage_for_new_seller();

-- Also create a function to update usage limits when subscription is created
CREATE OR REPLACE FUNCTION update_usage_limits_on_subscription()
RETURNS TRIGGER AS $$
DECLARE
  v_products_limit int;
  v_seo_limit int;
  v_blog_limit int;
  v_chat_limit int;
BEGIN
  -- Get the plan limits
  SELECT 
    max_products,
    max_optimizations_monthly,
    max_articles_monthly,
    max_chat_responses_monthly
  INTO
    v_products_limit,
    v_seo_limit,
    v_blog_limit,
    v_chat_limit
  FROM subscription_plans
  WHERE id = NEW.plan_id;

  -- Update usage limits
  UPDATE subscription_usage
  SET
    blog_articles_limit = COALESCE(v_blog_limit, blog_articles_limit),
    chat_messages_limit = COALESCE(v_chat_limit, chat_messages_limit),
    seo_optimizations_limit = COALESCE(v_seo_limit, seo_optimizations_limit)
  WHERE seller_id = NEW.seller_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on subscriptions to update usage limits
DROP TRIGGER IF EXISTS update_usage_on_subscription_insert ON subscriptions;
CREATE TRIGGER update_usage_on_subscription_insert
  AFTER INSERT ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_usage_limits_on_subscription();