/*
  # Add Missing Columns for Edge Functions

  1. Add missing columns to shopify_products
    - shopify_id (for compatibility)
    - shop_name
    - currency
    - inventory_quantity
    - raw_data
    - enrichment_status
    - enrichment_error
    - ai_vision_analysis
    - ai_confidence_score
    - length, width, height with units
    - other_dimensions
    - seo_synced_to_shopify
    - last_seo_sync_at
    - seo_sync_error

  2. Add missing columns to shopify_stores
    - api_token

  3. Add missing columns to product_variants
    - shopify_variant_id (for compatibility)
    - option1, option2, option3
    - currency
    - image_url
    - raw_data

  4. Add missing columns to product_images
    - alt_text
    - width, height

  5. Create sync_logs table with correct schema

  6. Create seo_sync_logs table
*/

-- Add missing columns to shopify_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'shopify_id'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN shopify_id bigint;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_shopify_products_shopify_id ON shopify_products(shopify_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'shop_name'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN shop_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'inventory_quantity'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN inventory_quantity integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN raw_data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'enrichment_status'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN enrichment_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'enrichment_error'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN enrichment_error text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_vision_analysis'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_vision_analysis text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_confidence_score'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_confidence_score integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'length'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN length numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'length_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN length_unit text DEFAULT 'cm';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'width'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN width numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'width_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN width_unit text DEFAULT 'cm';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'height'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN height numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'height_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN height_unit text DEFAULT 'cm';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'other_dimensions'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN other_dimensions jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'seo_synced_to_shopify'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN seo_synced_to_shopify boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'last_seo_sync_at'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN last_seo_sync_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'seo_sync_error'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN seo_sync_error text;
  END IF;
END $$;

-- Add missing columns to shopify_stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'api_token'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN api_token text;
  END IF;
END $$;

-- Add missing columns to product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'shopify_variant_id'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN shopify_variant_id bigint;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variants_shopify_variant_id ON product_variants(shopify_variant_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'option1'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN option1 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'option2'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN option2 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'option3'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN option3 text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'currency'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN currency text DEFAULT 'USD';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN image_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'raw_data'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN raw_data jsonb;
  END IF;
END $$;

-- Add missing columns to product_images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'alt_text'
  ) THEN
    ALTER TABLE product_images ADD COLUMN alt_text text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'width'
  ) THEN
    ALTER TABLE product_images ADD COLUMN width integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_images' AND column_name = 'height'
  ) THEN
    ALTER TABLE product_images ADD COLUMN height integer;
  END IF;
END $$;

-- Update sync_logs table structure
DO $$
BEGIN
  -- Check if sync_logs exists and has the correct columns
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sync_logs') THEN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sync_logs' AND column_name = 'store_name'
    ) THEN
      ALTER TABLE sync_logs ADD COLUMN store_name text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sync_logs' AND column_name = 'operation_type'
    ) THEN
      ALTER TABLE sync_logs ADD COLUMN operation_type text;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sync_logs' AND column_name = 'products_processed'
    ) THEN
      ALTER TABLE sync_logs ADD COLUMN products_processed integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sync_logs' AND column_name = 'products_added'
    ) THEN
      ALTER TABLE sync_logs ADD COLUMN products_added integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sync_logs' AND column_name = 'products_updated'
    ) THEN
      ALTER TABLE sync_logs ADD COLUMN products_updated integer DEFAULT 0;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'sync_logs' AND column_name = 'variants_processed'
    ) THEN
      ALTER TABLE sync_logs ADD COLUMN variants_processed integer DEFAULT 0;
    END IF;
  END IF;
END $$;

-- Create seo_sync_logs table
CREATE TABLE IF NOT EXISTS seo_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES shopify_products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  fields_synced jsonb,
  status text NOT NULL,
  error_message text,
  synced_at timestamptz DEFAULT now(),
  synced_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE seo_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view seo sync logs for own stores"
  ON seo_sync_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = seo_sync_logs.store_id
      AND shopify_stores.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to seo sync logs"
  ON seo_sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_product_id ON seo_sync_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_seo_sync_logs_store_id ON seo_sync_logs(store_id);