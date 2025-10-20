/*
  # Fix Subscription Plan Column References
  
  1. Problem
    - Database functions reference s.subscription_plan_id which doesn't exist
    - The sellers table doesn't have subscription_plan_id column
    - Plan is stored in subscriptions table with plan_id column
    
  2. Solution
    - Update all functions to join through subscriptions table
    - Replace s.subscription_plan_id with proper join to subscriptions.plan_id
    
  3. Functions Updated
    - create_subscription_usage_for_new_seller trigger function
    - check_usage_limit function
*/

-- Drop and recreate the trigger function for creating usage records
DROP FUNCTION IF EXISTS create_subscription_usage_for_new_seller() CASCADE;

CREATE OR REPLACE FUNCTION create_subscription_usage_for_new_seller()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_limits RECORD;
BEGIN
  -- Get plan limits from subscription
  SELECT 
    sp.max_products as products_limit,
    sp.max_optimizations_monthly as seo_optimizations_limit,
    sp.max_articles_monthly as blog_articles_limit,
    sp.max_chat_responses_monthly as chat_messages_limit,
    100 as ai_enrichments_limit,
    10 as google_shopping_syncs_limit
  INTO v_plan_limits
  FROM subscription_plans sp
  JOIN subscriptions sub ON sub.plan_id = sp.id
  WHERE sub.seller_id = NEW.id
  LIMIT 1;

  -- If no subscription found, use default limits
  IF v_plan_limits IS NULL THEN
    v_plan_limits := ROW(100, 50, 10, 1000, 100, 10);
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
    v_plan_limits.ai_enrichments_limit,
    0,
    v_plan_limits.blog_articles_limit,
    0,
    v_plan_limits.chat_messages_limit,
    0,
    v_plan_limits.google_shopping_syncs_limit,
    0,
    v_plan_limits.seo_optimizations_limit,
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

-- Drop and recreate the check_usage_limit function
DROP FUNCTION IF EXISTS check_usage_limit(uuid, text);

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_seller_id uuid,
  p_resource text
) RETURNS jsonb AS $$
DECLARE
  v_usage RECORD;
  v_plan RECORD;
  v_result jsonb;
BEGIN
  -- Get current usage
  SELECT * INTO v_usage
  FROM subscription_usage
  WHERE seller_id = p_seller_id;

  -- Get plan limits via subscriptions table
  SELECT 
    sp.max_products as products_limit,
    sp.max_optimizations_monthly as seo_optimizations_limit,
    sp.max_articles_monthly as blog_articles_limit,
    sp.max_chat_responses_monthly as chat_messages_limit,
    100 as ai_enrichments_limit,
    10 as google_shopping_syncs_limit
  INTO v_plan
  FROM subscription_plans sp
  JOIN subscriptions sub ON sub.plan_id = sp.id
  WHERE sub.seller_id = p_seller_id
  LIMIT 1;

  -- If no usage record or plan found, allow by default
  IF v_usage IS NULL OR v_plan IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'reason', 'No limits configured');
  END IF;

  -- Check if period has expired and needs reset
  IF v_usage.period_end < now() THEN
    -- Reset counters for new period
    UPDATE subscription_usage
    SET 
      ai_enrichments_used = 0,
      blog_articles_used = 0,
      chat_messages_used = 0,
      google_shopping_syncs = 0,
      seo_optimizations_used = 0,
      period_start = now(),
      period_end = now() + interval '1 month',
      last_reset_at = now()
    WHERE seller_id = p_seller_id;
    
    -- Reload usage after reset
    SELECT * INTO v_usage FROM subscription_usage WHERE seller_id = p_seller_id;
  END IF;

  -- Check specific resource limits
  CASE p_resource
    WHEN 'products' THEN
      IF v_usage.products_count >= v_plan.products_limit AND v_plan.products_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Product limit reached',
          'current', v_usage.products_count,
          'limit', v_plan.products_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;

    WHEN 'ai_enrichments' THEN
      IF v_usage.ai_enrichments_used >= v_plan.ai_enrichments_limit AND v_plan.ai_enrichments_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'AI enrichment limit reached for this period',
          'current', v_usage.ai_enrichments_used,
          'limit', v_plan.ai_enrichments_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;

    WHEN 'blog_articles' THEN
      IF v_usage.blog_articles_used >= v_plan.blog_articles_limit AND v_plan.blog_articles_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Blog article limit reached for this period',
          'current', v_usage.blog_articles_used,
          'limit', v_plan.blog_articles_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;

    WHEN 'chat_messages' THEN
      IF v_usage.chat_messages_used >= v_plan.chat_messages_limit AND v_plan.chat_messages_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Chat message limit reached for this period',
          'current', v_usage.chat_messages_used,
          'limit', v_plan.chat_messages_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;

    WHEN 'seo_optimizations' THEN
      IF v_usage.seo_optimizations_used >= v_plan.seo_optimizations_limit AND v_plan.seo_optimizations_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'SEO optimization limit reached for this period',
          'current', v_usage.seo_optimizations_used,
          'limit', v_plan.seo_optimizations_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;

    WHEN 'google_shopping_syncs' THEN
      IF v_usage.google_shopping_syncs >= v_plan.google_shopping_syncs_limit AND v_plan.google_shopping_syncs_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Google Shopping sync limit reached for this period',
          'current', v_usage.google_shopping_syncs,
          'limit', v_plan.google_shopping_syncs_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;

    ELSE
      v_result := jsonb_build_object('allowed', true, 'reason', 'Unknown resource type');
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;