/*
  # Usage Tracking and Subscription Limits

  ## New Tables
  
  1. **subscription_usage**
     - Tracks real-time usage for each seller
     - `seller_id` (uuid, FK to sellers)
     - `products_count` (int) - Number of products
     - `ai_enrichments_used` (int) - AI enrichments this period
     - `blog_articles_used` (int) - Blog articles generated
     - `chat_messages_used` (int) - Chat messages
     - `google_shopping_syncs` (int) - Google Shopping syncs
     - `seo_optimizations_used` (int) - SEO optimizations
     - `period_start` (timestamptz) - Start of current billing period
     - `period_end` (timestamptz) - End of current billing period
     - `last_reset_at` (timestamptz) - Last time counters were reset
     - `created_at`, `updated_at`

  2. **Update subscription_plans**
     - Add usage limits for each plan
     - Monthly and annual limits

  ## Security
  
  - Enable RLS on subscription_usage
  - Sellers can only view their own usage
  - Service role can manage all usage
*/

-- ============================================
-- 1. CREATE subscription_usage TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  
  -- Product limits
  products_count int DEFAULT 0,
  
  -- AI Usage (resets monthly/annually based on plan)
  ai_enrichments_used int DEFAULT 0,
  ai_enrichments_limit int DEFAULT 100,
  
  blog_articles_used int DEFAULT 0,
  blog_articles_limit int DEFAULT 10,
  
  chat_messages_used int DEFAULT 0,
  chat_messages_limit int DEFAULT 1000,
  
  google_shopping_syncs int DEFAULT 0,
  google_shopping_syncs_limit int DEFAULT 50,
  
  seo_optimizations_used int DEFAULT 0,
  seo_optimizations_limit int DEFAULT 100,
  
  -- Billing period tracking
  period_start timestamptz DEFAULT now(),
  period_end timestamptz DEFAULT (now() + interval '1 month'),
  last_reset_at timestamptz DEFAULT now(),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(seller_id)
);

-- Enable RLS
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Sellers can read own usage"
  ON subscription_usage FOR SELECT
  TO authenticated
  USING (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can update own usage"
  ON subscription_usage FOR UPDATE
  TO authenticated
  USING (seller_id::text = auth.uid()::text)
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Service role full access on usage"
  ON subscription_usage FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. ADD LIMITS TO subscription_plans
-- ============================================

DO $$
BEGIN
  -- Add monthly limits if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_plans' AND column_name = 'products_limit'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN products_limit int DEFAULT 100;
    ALTER TABLE subscription_plans ADD COLUMN ai_enrichments_limit int DEFAULT 100;
    ALTER TABLE subscription_plans ADD COLUMN blog_articles_limit int DEFAULT 10;
    ALTER TABLE subscription_plans ADD COLUMN chat_messages_limit int DEFAULT 1000;
    ALTER TABLE subscription_plans ADD COLUMN google_shopping_syncs_limit int DEFAULT 50;
    ALTER TABLE subscription_plans ADD COLUMN seo_optimizations_limit int DEFAULT 100;
  END IF;
END $$;

-- Update existing plans with limits
UPDATE subscription_plans SET
  products_limit = 100,
  ai_enrichments_limit = 50,
  blog_articles_limit = 5,
  chat_messages_limit = 500,
  google_shopping_syncs_limit = 20,
  seo_optimizations_limit = 50
WHERE name = 'Starter Lite';

UPDATE subscription_plans SET
  products_limit = -1, -- -1 = unlimited
  ai_enrichments_limit = 500,
  blog_articles_limit = 50,
  chat_messages_limit = 5000,
  google_shopping_syncs_limit = 200,
  seo_optimizations_limit = 500
WHERE name = 'Professional AI';

UPDATE subscription_plans SET
  products_limit = -1, -- unlimited
  ai_enrichments_limit = -1, -- unlimited
  blog_articles_limit = -1, -- unlimited
  chat_messages_limit = -1, -- unlimited
  google_shopping_syncs_limit = -1, -- unlimited
  seo_optimizations_limit = -1 -- unlimited
WHERE name = 'Enterprise Commerce+';

-- ============================================
-- 3. CREATE FUNCTION to initialize usage for new seller
-- ============================================

CREATE OR REPLACE FUNCTION initialize_seller_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_limits RECORD;
BEGIN
  -- Get limits from seller's plan
  SELECT 
    products_limit,
    ai_enrichments_limit,
    blog_articles_limit,
    chat_messages_limit,
    google_shopping_syncs_limit,
    seo_optimizations_limit
  INTO v_plan_limits
  FROM subscription_plans sp
  JOIN sellers s ON s.subscription_plan_id = sp.id
  WHERE s.id = NEW.id;

  -- Create usage record
  INSERT INTO subscription_usage (
    seller_id,
    ai_enrichments_limit,
    blog_articles_limit,
    chat_messages_limit,
    google_shopping_syncs_limit,
    seo_optimizations_limit,
    period_start,
    period_end
  ) VALUES (
    NEW.id,
    COALESCE(v_plan_limits.ai_enrichments_limit, 100),
    COALESCE(v_plan_limits.blog_articles_limit, 10),
    COALESCE(v_plan_limits.chat_messages_limit, 1000),
    COALESCE(v_plan_limits.google_shopping_syncs_limit, 50),
    COALESCE(v_plan_limits.seo_optimizations_limit, 100),
    now(),
    now() + interval '1 month'
  )
  ON CONFLICT (seller_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create usage when seller is created
DROP TRIGGER IF EXISTS trigger_initialize_seller_usage ON sellers;
CREATE TRIGGER trigger_initialize_seller_usage
  AFTER INSERT ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION initialize_seller_usage();

-- ============================================
-- 4. CREATE FUNCTION to update product count
-- ============================================

CREATE OR REPLACE FUNCTION update_products_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product count for this seller
  UPDATE subscription_usage
  SET 
    products_count = (
      SELECT COUNT(*) 
      FROM shopify_products 
      WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id)
    ),
    updated_at = now()
  WHERE seller_id = COALESCE(NEW.seller_id, OLD.seller_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update product count
DROP TRIGGER IF EXISTS trigger_update_products_count ON shopify_products;
CREATE TRIGGER trigger_update_products_count
  AFTER INSERT OR UPDATE OR DELETE ON shopify_products
  FOR EACH ROW
  EXECUTE FUNCTION update_products_count();

-- ============================================
-- 5. CREATE FUNCTION to check usage limits
-- ============================================

CREATE OR REPLACE FUNCTION check_usage_limit(
  p_seller_id uuid,
  p_resource text
) RETURNS jsonb AS $$
DECLARE
  v_usage RECORD;
  v_result jsonb;
BEGIN
  SELECT * INTO v_usage
  FROM subscription_usage
  WHERE seller_id = p_seller_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Usage record not found'
    );
  END IF;

  -- Check if period has expired and needs reset
  IF v_usage.period_end < now() THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Billing period expired - please renew'
    );
  END IF;

  -- Check specific resource limits
  CASE p_resource
    WHEN 'products' THEN
      IF v_usage.products_count >= (SELECT products_limit FROM subscription_plans sp JOIN sellers s ON s.subscription_plan_id = sp.id WHERE s.id = p_seller_id) AND (SELECT products_limit FROM subscription_plans sp JOIN sellers s ON s.subscription_plan_id = sp.id WHERE s.id = p_seller_id) != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Product limit reached',
          'current', v_usage.products_count,
          'limit', (SELECT products_limit FROM subscription_plans sp JOIN sellers s ON s.subscription_plan_id = sp.id WHERE s.id = p_seller_id)
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;
      
    WHEN 'ai_enrichment' THEN
      IF v_usage.ai_enrichments_used >= v_usage.ai_enrichments_limit AND v_usage.ai_enrichments_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'AI enrichment limit reached',
          'current', v_usage.ai_enrichments_used,
          'limit', v_usage.ai_enrichments_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;
      
    WHEN 'blog_article' THEN
      IF v_usage.blog_articles_used >= v_usage.blog_articles_limit AND v_usage.blog_articles_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Blog article limit reached',
          'current', v_usage.blog_articles_used,
          'limit', v_usage.blog_articles_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;
      
    WHEN 'chat_message' THEN
      IF v_usage.chat_messages_used >= v_usage.chat_messages_limit AND v_usage.chat_messages_limit != -1 THEN
        v_result := jsonb_build_object(
          'allowed', false,
          'reason', 'Chat message limit reached',
          'current', v_usage.chat_messages_used,
          'limit', v_usage.chat_messages_limit
        );
      ELSE
        v_result := jsonb_build_object('allowed', true);
      END IF;
      
    ELSE
      v_result := jsonb_build_object('allowed', true);
  END CASE;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Initialize usage for existing sellers
-- ============================================

INSERT INTO subscription_usage (seller_id, period_start, period_end)
SELECT 
  id,
  now(),
  now() + interval '1 month'
FROM sellers
ON CONFLICT (seller_id) DO NOTHING;

-- Update product counts for existing sellers
UPDATE subscription_usage su
SET products_count = (
  SELECT COUNT(*) 
  FROM shopify_products sp 
  WHERE sp.seller_id = su.seller_id
);
