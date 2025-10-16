/*
  # Add Smart Dimension Fields to Products

  This migration adds intelligent dimension detection fields that will be populated by AI analysis.

  1. New Columns
    - `smart_length` (numeric) - Detected length value
    - `smart_length_unit` (text) - Unit for length (cm, m, inch, etc.)
    - `smart_width` (numeric) - Detected width value
    - `smart_width_unit` (text) - Unit for width
    - `smart_height` (numeric) - Detected height value
    - `smart_height_unit` (text) - Unit for height
    - `smart_depth` (numeric) - Detected depth value
    - `smart_depth_unit` (text) - Unit for depth
    - `smart_diameter` (numeric) - Detected diameter value (for round items)
    - `smart_diameter_unit` (text) - Unit for diameter
    - `smart_weight` (numeric) - Detected weight value
    - `smart_weight_unit` (text) - Unit for weight (kg, g, lb, etc.)
    - `dimensions_text` (text) - Human-readable dimension summary
    - `dimensions_source` (text) - Where dimensions were found (title, description, ai_inference)

  2. Notes
    - AI will extract dimensions from title, description, and make smart inferences
    - All dimension values are nullable (not all products have all dimensions)
    - Units are stored separately for flexibility and conversion
    - dimensions_text provides a user-friendly summary like "120 x 80 x 45 cm"
*/

DO $$
BEGIN
  -- Smart Length
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_length'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_length numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_length_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_length_unit text DEFAULT 'cm';
  END IF;

  -- Smart Width
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_width'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_width numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_width_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_width_unit text DEFAULT 'cm';
  END IF;

  -- Smart Height
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_height'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_height numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_height_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_height_unit text DEFAULT 'cm';
  END IF;

  -- Smart Depth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_depth'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_depth numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_depth_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_depth_unit text DEFAULT 'cm';
  END IF;

  -- Smart Diameter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_diameter'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_diameter numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_diameter_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_diameter_unit text DEFAULT 'cm';
  END IF;

  -- Smart Weight
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_weight'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_weight numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_weight_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_weight_unit text DEFAULT 'kg';
  END IF;

  -- Dimensions Text (human-readable summary)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'dimensions_text'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN dimensions_text text;
  END IF;

  -- Dimensions Source (tracking where we found the info)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'dimensions_source'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN dimensions_source text;
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN shopify_products.smart_length IS 'AI-detected length value';
COMMENT ON COLUMN shopify_products.smart_length_unit IS 'Unit for length (cm, m, inch, etc.)';
COMMENT ON COLUMN shopify_products.smart_width IS 'AI-detected width value';
COMMENT ON COLUMN shopify_products.smart_width_unit IS 'Unit for width';
COMMENT ON COLUMN shopify_products.smart_height IS 'AI-detected height value';
COMMENT ON COLUMN shopify_products.smart_height_unit IS 'Unit for height';
COMMENT ON COLUMN shopify_products.smart_depth IS 'AI-detected depth value';
COMMENT ON COLUMN shopify_products.smart_depth_unit IS 'Unit for depth';
COMMENT ON COLUMN shopify_products.smart_diameter IS 'AI-detected diameter value for round items';
COMMENT ON COLUMN shopify_products.smart_diameter_unit IS 'Unit for diameter';
COMMENT ON COLUMN shopify_products.smart_weight IS 'AI-detected weight value';
COMMENT ON COLUMN shopify_products.smart_weight_unit IS 'Unit for weight (kg, g, lb, etc.)';
COMMENT ON COLUMN shopify_products.dimensions_text IS 'Human-readable dimension summary (e.g., "120 x 80 x 45 cm")';
COMMENT ON COLUMN shopify_products.dimensions_source IS 'Source of dimension data (title, description, ai_inference)';
