/*
  # Fix Plan Limits Record Structure
  
  1. Problem
    - Function returns record with wrong field names
    - Record structure doesn't match how it's being used
    - Need to align field names with actual usage
    
  2. Solution
    - Fix the v_plan_limits RECORD fields to match subscription_plans columns
    - Update default values when no subscription exists
*/

-- Drop and recreate the trigger function with correct field names
DROP FUNCTION IF EXISTS create_subscription_usage_for_new_seller() CASCADE;

CREATE OR REPLACE FUNCTION create_subscription_usage_for_new_seller()
RETURNS TRIGGER AS $$
DECLARE
  v_products_limit int;
  v_seo_limit int;
  v_blog_limit int;
  v_chat_limit int;
  v_ai_enrichments_limit int;
  v_google_shopping_limit int;
BEGIN
  -- Get plan limits from subscription
  SELECT 
    sp.max_products,
    sp.max_optimizations_monthly,
    sp.max_articles_monthly,
    sp.max_chat_responses_monthly,
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

  -- If no subscription found, use default limits (starter plan)
  IF v_products_limit IS NULL THEN
    v_products_limit := 100;
    v_seo_limit := 300;
    v_blog_limit := 1;
    v_chat_limit := 200;
    v_ai_enrichments_limit := 100;
    v_google_shopping_limit := 10;
  END IF;

  -- Create usage record with plan limits
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS create_usage_on_seller_insert ON sellers;
CREATE TRIGGER create_usage_on_seller_insert
  AFTER INSERT ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION create_subscription_usage_for_new_seller();