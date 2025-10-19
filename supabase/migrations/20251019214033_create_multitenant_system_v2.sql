/*
  # Multi-Tenant SaaS System - Complete Implementation
  
  Creates sellers, subscriptions, plans, and usage tracking tables.
  Adds seller_id to existing tables only if they exist.
*/

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CREATE SELLERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  company_name text,
  full_name text,
  role text NOT NULL DEFAULT 'seller' CHECK (role IN ('seller', 'superadmin')),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'cancelled')),
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can read own data" ON sellers;
CREATE POLICY "Sellers can read own data" ON sellers FOR SELECT
  USING (id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'
  ));

DROP POLICY IF EXISTS "Sellers can update own data" ON sellers;
CREATE POLICY "Sellers can update own data" ON sellers FOR UPDATE
  USING (id::text = auth.uid()::text)
  WITH CHECK (id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Super admin can manage sellers" ON sellers;
CREATE POLICY "Super admin can manage sellers" ON sellers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'
  ));

-- =============================================
-- 2. CREATE SUBSCRIPTION PLANS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL,
  max_products integer NOT NULL,
  max_optimizations_monthly integer NOT NULL,
  max_articles_monthly integer NOT NULL,
  max_campaigns integer NOT NULL,
  max_chat_responses_monthly integer NOT NULL,
  features jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read plans" ON subscription_plans;
CREATE POLICY "Anyone can read plans" ON subscription_plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admin can manage plans" ON subscription_plans;
CREATE POLICY "Super admin can manage plans" ON subscription_plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'
  ));

INSERT INTO subscription_plans (id, name, price_monthly, max_products, max_optimizations_monthly, max_articles_monthly, max_campaigns, max_chat_responses_monthly, features) VALUES
('starter', 'Starter Lite', 9.99, 100, 300, 1, 1, 200, '{"support": "email", "analytics": "basic"}'),
('professional', 'Professional AI', 79.00, 2000, 5000, 5, 3, 5000, '{"support": "priority", "analytics": "advanced", "api": true}'),
('enterprise', 'Enterprise Commerce+', 199.00, -1, -1, -1, -1, -1, '{"support": "dedicated", "analytics": "enterprise", "api": true, "whitelabel": true, "unlimited": true}')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. CREATE SUBSCRIPTIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('active', 'cancelled', 'past_due', 'trial')),
  current_period_start timestamptz DEFAULT now(),
  current_period_end timestamptz DEFAULT (now() + interval '1 month'),
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can read own subscriptions" ON subscriptions;
CREATE POLICY "Sellers can read own subscriptions" ON subscriptions FOR SELECT
  USING (seller_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'
  ));

DROP POLICY IF EXISTS "Super admin can manage subscriptions" ON subscriptions;
CREATE POLICY "Super admin can manage subscriptions" ON subscriptions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'
  ));

-- =============================================
-- 4. CREATE USAGE TRACKING TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS usage_tracking (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  month date NOT NULL,
  products_count integer DEFAULT 0,
  optimizations_count integer DEFAULT 0,
  articles_count integer DEFAULT 0,
  chat_responses_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(seller_id, month)
);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sellers can read own usage" ON usage_tracking;
CREATE POLICY "Sellers can read own usage" ON usage_tracking FOR SELECT
  USING (seller_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'
  ));

DROP POLICY IF EXISTS "System can update usage" ON usage_tracking;
CREATE POLICY "System can update usage" ON usage_tracking FOR ALL USING (true);

-- =============================================
-- 5. ADD SELLER_ID TO EXISTING TABLES
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_stores' AND column_name = 'seller_id') THEN
    ALTER TABLE shopify_stores ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
    CREATE INDEX idx_shopify_stores_seller_id ON shopify_stores(seller_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'seller_id') THEN
    ALTER TABLE shopify_products ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
    CREATE INDEX idx_shopify_products_seller_id ON shopify_products(seller_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_articles' AND column_name = 'seller_id') THEN
    ALTER TABLE blog_articles ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
    CREATE INDEX idx_blog_articles_seller_id ON blog_articles(seller_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blog_campaigns' AND column_name = 'seller_id') THEN
    ALTER TABLE blog_campaigns ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
    CREATE INDEX idx_blog_campaigns_seller_id ON blog_campaigns(seller_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_conversations' AND column_name = 'seller_id') THEN
    ALTER TABLE chat_conversations ADD COLUMN seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE;
    CREATE INDEX idx_chat_conversations_seller_id ON chat_conversations(seller_id);
  END IF;
END $$;

-- =============================================
-- 6. CREATE HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_seller_limits(p_seller_id uuid)
RETURNS TABLE (
  plan_id text,
  max_products integer,
  max_optimizations_monthly integer,
  max_articles_monthly integer,
  max_campaigns integer,
  max_chat_responses_monthly integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT sp.id, sp.max_products, sp.max_optimizations_monthly, sp.max_articles_monthly, sp.max_campaigns, sp.max_chat_responses_monthly
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.seller_id = p_seller_id AND s.status IN ('active', 'trial')
  ORDER BY s.created_at DESC LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_seller_perform_action(p_seller_id uuid, p_action text, p_current_month date DEFAULT date_trunc('month', now())::date)
RETURNS boolean AS $$
DECLARE v_limits record; v_usage record;
BEGIN
  SELECT * INTO v_limits FROM get_seller_limits(p_seller_id);
  IF NOT FOUND THEN RETURN false; END IF;
  IF v_limits.max_products = -1 THEN RETURN true; END IF;
  SELECT * INTO v_usage FROM usage_tracking WHERE seller_id = p_seller_id AND month = p_current_month;
  IF NOT FOUND THEN
    INSERT INTO usage_tracking (seller_id, month) VALUES (p_seller_id, p_current_month) ON CONFLICT DO NOTHING;
    RETURN true;
  END IF;
  CASE p_action
    WHEN 'add_product' THEN RETURN COALESCE(v_usage.products_count, 0) < v_limits.max_products;
    WHEN 'optimize' THEN RETURN COALESCE(v_usage.optimizations_count, 0) < v_limits.max_optimizations_monthly;
    WHEN 'create_article' THEN RETURN COALESCE(v_usage.articles_count, 0) < v_limits.max_articles_monthly;
    WHEN 'chat_response' THEN RETURN COALESCE(v_usage.chat_responses_count, 0) < v_limits.max_chat_responses_monthly;
    ELSE RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_usage(p_seller_id uuid, p_action text, p_amount integer DEFAULT 1, p_current_month date DEFAULT date_trunc('month', now())::date)
RETURNS void AS $$
BEGIN
  INSERT INTO usage_tracking (seller_id, month, products_count, optimizations_count, articles_count, chat_responses_count, updated_at)
  VALUES (
    p_seller_id, p_current_month,
    CASE WHEN p_action = 'add_product' THEN p_amount ELSE 0 END,
    CASE WHEN p_action = 'optimize' THEN p_amount ELSE 0 END,
    CASE WHEN p_action = 'create_article' THEN p_amount ELSE 0 END,
    CASE WHEN p_action = 'chat_response' THEN p_amount ELSE 0 END, now()
  )
  ON CONFLICT (seller_id, month) DO UPDATE SET
    products_count = usage_tracking.products_count + CASE WHEN p_action = 'add_product' THEN p_amount ELSE 0 END,
    optimizations_count = usage_tracking.optimizations_count + CASE WHEN p_action = 'optimize' THEN p_amount ELSE 0 END,
    articles_count = usage_tracking.articles_count + CASE WHEN p_action = 'create_article' THEN p_amount ELSE 0 END,
    chat_responses_count = usage_tracking.chat_responses_count + CASE WHEN p_action = 'chat_response' THEN p_amount ELSE 0 END,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON sellers(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_seller_id ON subscriptions(seller_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_seller_month ON usage_tracking(seller_id, month);

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sellers_updated_at ON sellers;
CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usage_tracking_updated_at ON usage_tracking;
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();