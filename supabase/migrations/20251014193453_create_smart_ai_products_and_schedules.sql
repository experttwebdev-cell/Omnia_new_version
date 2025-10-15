/*
  # Create Smart AI Products and Update Schedules Tables

  1. New Tables
    - `smart_ai_products`
      - Stores AI-enriched product data with SEO optimization, visual attributes, and marketing content
      - Links to original shopify_products via `source_product_id`
      - Contains ~40 fields for comprehensive product enrichment
      - Includes AI metadata like confidence scores and model versions
    
    - `store_update_schedules`
      - Manages automatic product sync schedules for each store
      - Supports manual, hourly, daily, weekly, and custom frequencies
      - Tracks next scheduled run time and last execution
      - Stores configuration for automated updates

  2. Smart AI Products Fields
    - Source & Identity: source_product_id, source_platform, shopify_id
    - Enriched Content: name (SEO optimized), description (long), short_description
    - Pricing: price, compare_at_price, percent_off
    - Classification: vendor, product_type, category (standardized), google_product_category
    - Visual Attributes: style[], color, material[], shape, room, image_url, image_alt, image_tags[]
    - Product Details: dimensions (jsonb), weight, weight_unit, stock_quantity, availability
    - SEO: seo_title, seo_description, keywords[]
    - Marketing: promotion_text, usp[] (unique selling points)
    - Metadata: ai_confidence, ai_model_used, validation_score, enrichment_source
    - Relationships: related_product_ids[]
    - Timestamps: enriched_at, updated_at, created_at

  3. Store Update Schedules Fields
    - store_id: Links to shopify_stores table
    - frequency_type: manual, hourly, daily, weekly, custom
    - scheduled_time: Time of day for daily/weekly updates (HH:MM format)
    - custom_cron: Custom cron expression for advanced scheduling
    - next_run_at: Calculated next execution time
    - last_run_at: Last execution timestamp
    - is_active: Enable/disable schedule
    - status: idle, running, completed, failed
    - Timestamps: created_at, updated_at

  4. Security
    - Enable RLS on both tables
    - Allow public read access to smart_ai_products for display
    - Restrict write operations to service role only
    - Allow public read access to store_update_schedules
    - Restrict write operations to service role only

  5. Indexes
    - Index on source_product_id for fast lookups
    - Index on category for filtering
    - Index on availability for stock queries
    - Index on store_id for schedule lookups
    - Index on next_run_at for scheduler queries
*/

-- Create smart_ai_products table
CREATE TABLE IF NOT EXISTS smart_ai_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id uuid REFERENCES shopify_products(id) ON DELETE CASCADE,
  source_platform text DEFAULT 'shopify',
  shopify_id bigint,
  
  -- Enriched content
  name text NOT NULL,
  description text DEFAULT '',
  short_description text DEFAULT '',
  
  -- Pricing
  price numeric DEFAULT 0,
  compare_at_price numeric,
  percent_off int DEFAULT 0,
  
  -- Classification
  vendor text DEFAULT '',
  product_type text DEFAULT '',
  category text DEFAULT '',
  google_product_category text DEFAULT '',
  
  -- Visual attributes (AI analyzed)
  style text[] DEFAULT '{}',
  color text DEFAULT '',
  material text[] DEFAULT '{}',
  shape text DEFAULT '',
  room text DEFAULT '',
  
  -- Images
  image_url text DEFAULT '',
  image_alt text DEFAULT '',
  image_tags text[] DEFAULT '{}',
  
  -- Product details
  dimensions jsonb DEFAULT '{}',
  weight numeric,
  weight_unit text DEFAULT 'kg',
  stock_quantity int DEFAULT 0,
  availability text DEFAULT 'out_of_stock',
  
  -- SEO
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  keywords text[] DEFAULT '{}',
  
  -- Marketing
  promotion_text text DEFAULT '',
  usp text[] DEFAULT '{}',
  
  -- AI metadata
  ai_confidence numeric DEFAULT 0,
  ai_model_used text DEFAULT 'gpt-4o-mini',
  validation_score int DEFAULT 0,
  enrichment_source text DEFAULT 'smart_product_ai',
  
  -- Relationships
  related_product_ids uuid[] DEFAULT '{}',
  
  -- Timestamps
  enriched_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create store_update_schedules table
CREATE TABLE IF NOT EXISTS store_update_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  
  -- Schedule configuration
  frequency_type text DEFAULT 'manual' CHECK (frequency_type IN ('manual', 'hourly', 'daily', 'weekly', 'custom')),
  scheduled_time text DEFAULT '00:00',
  custom_cron text,
  
  -- Schedule state
  next_run_at timestamptz,
  last_run_at timestamptz,
  is_active boolean DEFAULT false,
  status text DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed')),
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(store_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_smart_ai_products_source_product_id ON smart_ai_products(source_product_id);
CREATE INDEX IF NOT EXISTS idx_smart_ai_products_category ON smart_ai_products(category);
CREATE INDEX IF NOT EXISTS idx_smart_ai_products_availability ON smart_ai_products(availability);
CREATE INDEX IF NOT EXISTS idx_smart_ai_products_shopify_id ON smart_ai_products(shopify_id);

CREATE INDEX IF NOT EXISTS idx_store_update_schedules_store_id ON store_update_schedules(store_id);
CREATE INDEX IF NOT EXISTS idx_store_update_schedules_next_run_at ON store_update_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_store_update_schedules_is_active ON store_update_schedules(is_active);

-- Enable RLS
ALTER TABLE smart_ai_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_update_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smart_ai_products
CREATE POLICY "Allow public read access to smart AI products"
  ON smart_ai_products
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to insert smart AI products"
  ON smart_ai_products
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to update smart AI products"
  ON smart_ai_products
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to delete smart AI products"
  ON smart_ai_products
  FOR DELETE
  TO service_role
  USING (true);

-- RLS Policies for store_update_schedules
CREATE POLICY "Allow public read access to update schedules"
  ON store_update_schedules
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service role to insert update schedules"
  ON store_update_schedules
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service role to update update schedules"
  ON store_update_schedules
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role to delete update schedules"
  ON store_update_schedules
  FOR DELETE
  TO service_role
  USING (true);