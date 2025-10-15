/*
  # Recreate Complete Database Schema

  1. New Tables
    - `shopify_stores` - Store Shopify credentials and settings
    - `shopify_products` - Product catalog with SEO fields
    - `product_variants` - Product variants
    - `product_images` - Product images with SEO alt tags
    - `sync_logs` - Track synchronization history
    - `smart_ai_products` - AI enrichment queue
    - `ai_schedules` - Scheduled AI processing
    - `blog_opportunities` - SEO blog suggestions
    - `blog_articles` - Generated blog content

  2. Security
    - Enable RLS on all tables
    - Create policies for authenticated users
    - Create service role policies where needed

  3. Features
    - Multi-store support
    - AI enrichment tracking
    - SEO optimization fields
    - Google Shopping integration
    - Blog content management
*/

-- Shopify Stores Table
CREATE TABLE IF NOT EXISTS shopify_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  shop_domain text NOT NULL,
  access_token text NOT NULL,
  api_key text,
  api_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_sync_at timestamptz,
  sync_frequency text DEFAULT 'manual',
  currency text DEFAULT 'USD',
  openai_api_key text,
  ai_enrichment_enabled boolean DEFAULT false,
  seo_sync_enabled boolean DEFAULT false,
  blog_auto_generation_enabled boolean DEFAULT false,
  blog_auto_frequency text DEFAULT 'weekly',
  language text DEFAULT 'en'
);

ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own stores"
  ON shopify_stores FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stores"
  ON shopify_stores FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stores"
  ON shopify_stores FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stores"
  ON shopify_stores FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to stores"
  ON shopify_stores FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Shopify Products Table
CREATE TABLE IF NOT EXISTS shopify_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  shopify_product_id text NOT NULL,
  title text NOT NULL,
  description text,
  vendor text,
  product_type text,
  handle text,
  status text DEFAULT 'active',
  tags text,
  price numeric,
  compare_at_price numeric,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  ai_generated_description text,
  ai_generated_tags text,
  ai_last_enriched_at timestamptz,
  category text,
  subcategory text,
  google_product_category text,
  gtin text,
  mpn text,
  brand text,
  condition text DEFAULT 'new',
  availability text DEFAULT 'in stock',
  UNIQUE(store_id, shopify_product_id)
);

ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products from own stores"
  ON shopify_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = shopify_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to own stores"
  ON shopify_products FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = shopify_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in own stores"
  ON shopify_products FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = shopify_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = shopify_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products from own stores"
  ON shopify_products FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = shopify_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to products"
  ON shopify_products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Product Variants Table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES shopify_products(id) ON DELETE CASCADE,
  shopify_variant_id text NOT NULL,
  title text,
  price numeric NOT NULL,
  compare_at_price numeric,
  sku text,
  barcode text,
  inventory_quantity integer DEFAULT 0,
  weight numeric,
  weight_unit text DEFAULT 'kg',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, shopify_variant_id)
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variants from own store products"
  ON product_variants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_products sp
      JOIN shopify_stores ss ON sp.store_id = ss.id
      WHERE sp.id = product_variants.product_id
      AND ss.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to variants"
  ON product_variants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES shopify_products(id) ON DELETE CASCADE,
  shopify_image_id text,
  src text NOT NULL,
  alt text,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images from own store products"
  ON product_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_products sp
      JOIN shopify_stores ss ON sp.store_id = ss.id
      WHERE sp.id = product_images.product_id
      AND ss.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage images for own store products"
  ON product_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_products sp
      JOIN shopify_stores ss ON sp.store_id = ss.id
      WHERE sp.id = product_images.product_id
      AND ss.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_products sp
      JOIN shopify_stores ss ON sp.store_id = ss.id
      WHERE sp.id = product_images.product_id
      AND ss.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to images"
  ON product_images FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Sync Logs Table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text NOT NULL,
  products_synced integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_details jsonb,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view sync logs from own stores"
  ON sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = sync_logs.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to sync logs"
  ON sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Smart AI Products Table
CREATE TABLE IF NOT EXISTS smart_ai_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES shopify_products(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  priority integer DEFAULT 0,
  scheduled_for timestamptz,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE smart_ai_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI queue for own stores"
  ON smart_ai_products FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = smart_ai_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage AI queue for own stores"
  ON smart_ai_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = smart_ai_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = smart_ai_products.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to AI queue"
  ON smart_ai_products FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- AI Schedules Table
CREATE TABLE IF NOT EXISTS ai_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  schedule_type text NOT NULL,
  frequency text NOT NULL,
  last_run_at timestamptz,
  next_run_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules for own stores"
  ON ai_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = ai_schedules.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to schedules"
  ON ai_schedules FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Blog Opportunities Table
CREATE TABLE IF NOT EXISTS blog_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  title text NOT NULL,
  keywords jsonb DEFAULT '[]'::jsonb,
  target_products jsonb DEFAULT '[]'::jsonb,
  suggested_outline text,
  priority integer DEFAULT 0,
  status text DEFAULT 'pending',
  generated_article_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blog opportunities for own stores"
  ON blog_opportunities FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_opportunities.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage blog opportunities for own stores"
  ON blog_opportunities FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_opportunities.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_opportunities.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to blog opportunities"
  ON blog_opportunities FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Blog Articles Table
CREATE TABLE IF NOT EXISTS blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES blog_opportunities(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  seo_title text,
  seo_description text,
  keywords jsonb DEFAULT '[]'::jsonb,
  linked_products jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft',
  shopify_blog_id text,
  shopify_article_id text,
  published_at timestamptz,
  synced_to_shopify boolean DEFAULT false,
  last_synced_at timestamptz,
  image_url text,
  author text,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view blog articles for own stores"
  ON blog_articles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_articles.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage blog articles for own stores"
  ON blog_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_articles.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_articles.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to blog articles"
  ON blog_articles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shopify_products_store_id ON shopify_products(store_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_store_id ON sync_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_smart_ai_products_store_id ON smart_ai_products(store_id);
CREATE INDEX IF NOT EXISTS idx_smart_ai_products_status ON smart_ai_products(status);
CREATE INDEX IF NOT EXISTS idx_blog_opportunities_store_id ON blog_opportunities(store_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_store_id ON blog_articles(store_id);