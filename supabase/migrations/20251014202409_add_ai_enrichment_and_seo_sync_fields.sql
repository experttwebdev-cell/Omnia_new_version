/*
  # Add AI Enrichment and SEO Sync Fields

  1. New Columns in shopify_products
    - SEO Fields (native Shopify, overwritten by AI):
      - `seo_title` (text) - SEO title from Shopify metafields_global_title_tag
      - `seo_description` (text) - SEO description from Shopify metafields_global_description_tag
    
    - AI Enrichment Fields:
      - `ai_vision_analysis` (text) - Complete synthesis of image analysis
      - `ai_color` (text) - Main color detected by AI
      - `ai_material` (text) - Material detected by AI
    
    - Dimension Fields:
      - `length` (decimal) - Product length
      - `length_unit` (text) - Unit (cm, m, inches, etc.)
      - `width` (decimal) - Product width
      - `width_unit` (text) - Unit
      - `height` (decimal) - Product height
      - `height_unit` (text) - Unit
      - `other_dimensions` (jsonb) - Special dimensions (e.g., sleeping dimensions for sofa)
    
    - Enrichment Metadata:
      - `ai_confidence_score` (integer) - Confidence score 0-100
      - `enrichment_status` (text) - Status: pending, enriched, failed, manual
      - `last_enriched_at` (timestamptz) - Last enrichment timestamp
      - `enrichment_error` (text) - Error message if enrichment failed
    
    - SEO Sync Tracking:
      - `seo_synced_to_shopify` (boolean) - Whether SEO data synced to Shopify
      - `last_seo_sync_at` (timestamptz) - Last sync timestamp
      - `seo_sync_error` (text) - Error message if sync failed

  2. New Columns in shopify_stores
    - `enrichment_mode` (text) - manual or auto
    - `enrichment_frequency` (text) - on_import, daily, weekly, manual
    - `auto_enrich_new_products` (boolean) - Auto-enrich on import
    - `auto_sync_seo_to_shopify` (boolean) - Auto-sync after enrichment
    - `last_auto_enrichment_at` (timestamptz) - Last auto-enrichment timestamp

  3. New Table: seo_sync_logs
    - Tracks all SEO synchronizations to Shopify
    - `id` (uuid, primary key)
    - `product_id` (uuid, foreign key) - Reference to shopify_products
    - `store_id` (uuid, foreign key) - Reference to shopify_stores
    - `sync_type` (text) - manual or auto
    - `fields_synced` (jsonb) - Which fields were synced
    - `status` (text) - success or failed
    - `error_message` (text) - Error message if failed
    - `synced_at` (timestamptz) - When sync occurred
    - `synced_by` (uuid) - User ID who triggered sync (nullable for auto)

  4. Indexes
    - Index on enrichment_status for filtering
    - Index on seo_synced_to_shopify for filtering
    - Index on last_enriched_at for sorting
    - Index on seo_sync_logs product_id and store_id

  5. Security
    - Enable RLS on seo_sync_logs table
    - Add policies for authenticated users
*/

-- Add columns to shopify_products
DO $$
BEGIN
  -- SEO fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'seo_title') THEN
    ALTER TABLE shopify_products ADD COLUMN seo_title text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'seo_description') THEN
    ALTER TABLE shopify_products ADD COLUMN seo_description text DEFAULT '';
  END IF;

  -- AI enrichment fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'ai_vision_analysis') THEN
    ALTER TABLE shopify_products ADD COLUMN ai_vision_analysis text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'ai_color') THEN
    ALTER TABLE shopify_products ADD COLUMN ai_color text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'ai_material') THEN
    ALTER TABLE shopify_products ADD COLUMN ai_material text DEFAULT '';
  END IF;

  -- Dimension fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'length') THEN
    ALTER TABLE shopify_products ADD COLUMN length decimal(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'length_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN length_unit text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'width') THEN
    ALTER TABLE shopify_products ADD COLUMN width decimal(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'width_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN width_unit text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'height') THEN
    ALTER TABLE shopify_products ADD COLUMN height decimal(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'height_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN height_unit text DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'other_dimensions') THEN
    ALTER TABLE shopify_products ADD COLUMN other_dimensions jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Enrichment metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'ai_confidence_score') THEN
    ALTER TABLE shopify_products ADD COLUMN ai_confidence_score integer DEFAULT 0 CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'enrichment_status') THEN
    ALTER TABLE shopify_products ADD COLUMN enrichment_status text DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'enriched', 'failed', 'manual'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'last_enriched_at') THEN
    ALTER TABLE shopify_products ADD COLUMN last_enriched_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'enrichment_error') THEN
    ALTER TABLE shopify_products ADD COLUMN enrichment_error text DEFAULT '';
  END IF;

  -- SEO sync tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'seo_synced_to_shopify') THEN
    ALTER TABLE shopify_products ADD COLUMN seo_synced_to_shopify boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'last_seo_sync_at') THEN
    ALTER TABLE shopify_products ADD COLUMN last_seo_sync_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'seo_sync_error') THEN
    ALTER TABLE shopify_products ADD COLUMN seo_sync_error text DEFAULT '';
  END IF;
END $$;

-- Add columns to shopify_stores
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_stores' AND column_name = 'enrichment_mode') THEN
    ALTER TABLE shopify_stores ADD COLUMN enrichment_mode text DEFAULT 'manual' CHECK (enrichment_mode IN ('manual', 'auto'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_stores' AND column_name = 'enrichment_frequency') THEN
    ALTER TABLE shopify_stores ADD COLUMN enrichment_frequency text DEFAULT 'manual' CHECK (enrichment_frequency IN ('on_import', 'daily', 'weekly', 'manual'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_stores' AND column_name = 'auto_enrich_new_products') THEN
    ALTER TABLE shopify_stores ADD COLUMN auto_enrich_new_products boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_stores' AND column_name = 'auto_sync_seo_to_shopify') THEN
    ALTER TABLE shopify_stores ADD COLUMN auto_sync_seo_to_shopify boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_stores' AND column_name = 'last_auto_enrichment_at') THEN
    ALTER TABLE shopify_stores ADD COLUMN last_auto_enrichment_at timestamptz;
  END IF;
END $$;

-- Create seo_sync_logs table
CREATE TABLE IF NOT EXISTS seo_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES shopify_products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  sync_type text DEFAULT 'manual' CHECK (sync_type IN ('manual', 'auto')),
  fields_synced jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'success' CHECK (status IN ('success', 'failed')),
  error_message text DEFAULT '',
  synced_at timestamptz DEFAULT now(),
  synced_by uuid
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_products_enrichment_status ON shopify_products(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_shopify_products_seo_synced ON shopify_products(seo_synced_to_shopify);
CREATE INDEX IF NOT EXISTS idx_shopify_products_last_enriched ON shopify_products(last_enriched_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_product_id ON seo_sync_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_store_id ON seo_sync_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_synced_at ON seo_sync_logs(synced_at DESC);

-- Enable RLS on seo_sync_logs
ALTER TABLE seo_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for seo_sync_logs
CREATE POLICY "Authenticated users can read sync logs"
  ON seo_sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sync logs"
  ON seo_sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can manage sync logs"
  ON seo_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);