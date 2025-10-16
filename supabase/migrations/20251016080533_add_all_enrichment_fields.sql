-- Add all fields for AI enrichment with smart dimensions

-- 1. Category and Sub-Category
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'category') THEN
    ALTER TABLE shopify_products ADD COLUMN category TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'sub_category') THEN
    ALTER TABLE shopify_products ADD COLUMN sub_category TEXT DEFAULT '';
  END IF;
END $$;

-- 2. Room and Style
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'room') THEN
    ALTER TABLE shopify_products ADD COLUMN room text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'style') THEN
    ALTER TABLE shopify_products ADD COLUMN style text;
  END IF;
END $$;

-- 3. Smart Dimensions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_length') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_length numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_length_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_length_unit text DEFAULT 'cm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_width') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_width numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_width_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_width_unit text DEFAULT 'cm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_height') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_height numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_height_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_height_unit text DEFAULT 'cm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_depth') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_depth numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_depth_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_depth_unit text DEFAULT 'cm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_diameter') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_diameter numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_diameter_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_diameter_unit text DEFAULT 'cm';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_weight') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_weight numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'smart_weight_unit') THEN
    ALTER TABLE shopify_products ADD COLUMN smart_weight_unit text DEFAULT 'kg';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'dimensions_text') THEN
    ALTER TABLE shopify_products ADD COLUMN dimensions_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shopify_products' AND column_name = 'dimensions_source') THEN
    ALTER TABLE shopify_products ADD COLUMN dimensions_source text;
  END IF;
END $$;

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_shopify_products_category ON shopify_products(category);
CREATE INDEX IF NOT EXISTS idx_shopify_products_sub_category ON shopify_products(sub_category);
CREATE INDEX IF NOT EXISTS idx_shopify_products_room ON shopify_products(room);
CREATE INDEX IF NOT EXISTS idx_shopify_products_style ON shopify_products(style);