/*
  # Add Complete Vision AI Attributes

  ## Overview
  This migration adds all AI vision analysis fields to the shopify_products table
  to support comprehensive product enrichment through visual analysis.

  ## New Columns Added
  
  ### Visual Analysis Fields
  - `ai_texture`: Text description of product texture detected by vision AI
  - `ai_pattern`: Pattern identification (solid, striped, geometric, floral, etc.)
  - `ai_finish`: Surface finish (matte, glossy, brushed, polished, etc.)
  - `ai_shape`: Product shape description (rectangular, round, curved, etc.)
  - `ai_design_elements`: Key design features identified visually
  
  ### Context & Environment Fields
  - `ai_lighting_type`: Lighting characteristics in product images
  - `ai_background_style`: Background setting (studio, room, lifestyle, etc.)
  - `ai_presentation_quality`: Overall image presentation quality score
  
  ### Product Condition & Quality Fields
  - `ai_condition_notes`: Visual condition assessment
  - `ai_craftsmanship_level`: Detected quality level (premium, standard, budget)
  
  ### Metadata Fields
  - `ai_vision_model`: AI model used for vision analysis (gpt-4o, etc.)
  - `ai_vision_confidence`: Confidence score for vision analysis (0-100)
  - `ai_vision_timestamp`: When vision analysis was performed
  
  ## Notes
  - All fields are optional (nullable)
  - Fields use TEXT type for flexibility
  - Confidence and quality scores use INTEGER (0-100)
  - No default values to distinguish between "not analyzed" and "analyzed but empty"
*/

-- Visual Analysis Fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_texture'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_texture TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_pattern'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_pattern TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_finish'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_finish TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_shape'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_shape TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_design_elements'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_design_elements TEXT;
  END IF;
END $$;

-- Context & Environment Fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_lighting_type'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_lighting_type TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_background_style'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_background_style TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_presentation_quality'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_presentation_quality INTEGER CHECK (ai_presentation_quality >= 0 AND ai_presentation_quality <= 100);
  END IF;
END $$;

-- Product Condition & Quality Fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_condition_notes'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_condition_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_craftsmanship_level'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_craftsmanship_level TEXT;
  END IF;
END $$;

-- Metadata Fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_vision_model'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_vision_model TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_vision_confidence'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_vision_confidence INTEGER CHECK (ai_vision_confidence >= 0 AND ai_vision_confidence <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'ai_vision_timestamp'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_vision_timestamp TIMESTAMPTZ;
  END IF;
END $$;

-- Add indexes for commonly queried vision fields
CREATE INDEX IF NOT EXISTS idx_shopify_products_ai_pattern 
  ON shopify_products(ai_pattern) 
  WHERE ai_pattern IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shopify_products_ai_finish 
  ON shopify_products(ai_finish) 
  WHERE ai_finish IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shopify_products_ai_craftsmanship 
  ON shopify_products(ai_craftsmanship_level) 
  WHERE ai_craftsmanship_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_shopify_products_ai_vision_confidence 
  ON shopify_products(ai_vision_confidence) 
  WHERE ai_vision_confidence IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN shopify_products.ai_texture IS 'Texture description detected by vision AI';
COMMENT ON COLUMN shopify_products.ai_pattern IS 'Pattern type (solid, striped, geometric, etc.)';
COMMENT ON COLUMN shopify_products.ai_finish IS 'Surface finish (matte, glossy, brushed, etc.)';
COMMENT ON COLUMN shopify_products.ai_shape IS 'Product shape description';
COMMENT ON COLUMN shopify_products.ai_design_elements IS 'Key visual design features';
COMMENT ON COLUMN shopify_products.ai_craftsmanship_level IS 'Quality level (premium, standard, budget)';
COMMENT ON COLUMN shopify_products.ai_vision_model IS 'AI model used for vision analysis';
COMMENT ON COLUMN shopify_products.ai_vision_confidence IS 'Vision analysis confidence score (0-100)';
COMMENT ON COLUMN shopify_products.ai_vision_timestamp IS 'When vision analysis was performed';
