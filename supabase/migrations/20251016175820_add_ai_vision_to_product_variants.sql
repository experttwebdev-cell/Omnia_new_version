/*
  # Add AI Vision Analysis to Product Variants

  ## Overview
  This migration adds AI vision fields to product_variants table to analyze
  each variant (color, size, etc.) individually with its specific image.

  ## Why This is Important
  - Each variant can have different visual attributes (white sofa vs gray sofa)
  - Allows per-variant enrichment for accurate product descriptions
  - Essential for multi-variant products where each variant looks different

  ## New Columns Added to product_variants

  ### Core Vision Fields
  - `ai_color`: Detected color for this specific variant
  - `ai_material`: Detected material appearance for this variant
  - `ai_texture`: Texture description
  - `ai_pattern`: Pattern type (solid, striped, etc.)
  - `ai_finish`: Surface finish (matte, glossy, etc.)
  - `ai_shape`: Shape description
  - `ai_design_elements`: Key design features
  
  ### Visual Analysis
  - `ai_vision_analysis`: Full visual description for this variant
  - `ai_product_name`: AI-detected product type name (ex: "Canapé", "Table", "Chaise")
  
  ### Metadata
  - `ai_vision_model`: Model used (gpt-4o, etc.)
  - `ai_vision_confidence`: Confidence score (0-100)
  - `ai_vision_timestamp`: When analysis was performed
  - `ai_enrichment_status`: Status (pending, enriched, error)
  
  ## Example Use Case
  Product: "Modern Sofa"
  - Variant 1 (White): ai_color="Blanc", ai_texture="Lisse"
  - Variant 2 (Gray): ai_color="Gris", ai_texture="Lisse"
  - Variant 3 (Blue): ai_color="Bleu marine", ai_texture="Velours"
*/

-- Add core vision fields to variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_color'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_color TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_material'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_material TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_texture'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_texture TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_pattern'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_pattern TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_finish'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_finish TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_shape'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_shape TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_design_elements'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_design_elements TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_vision_analysis'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_vision_analysis TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_product_name'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_product_name TEXT;
  END IF;
END $$;

-- Add metadata fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_vision_model'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_vision_model TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_vision_confidence'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_vision_confidence INTEGER CHECK (ai_vision_confidence >= 0 AND ai_vision_confidence <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_vision_timestamp'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_vision_timestamp TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'ai_enrichment_status'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN ai_enrichment_status TEXT DEFAULT 'pending';
  END IF;
END $$;

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_product_variants_ai_color 
  ON product_variants(ai_color) 
  WHERE ai_color IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_ai_product_name 
  ON product_variants(ai_product_name) 
  WHERE ai_product_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_variants_ai_enrichment_status 
  ON product_variants(ai_enrichment_status);

-- Add comments for documentation
COMMENT ON COLUMN product_variants.ai_color IS 'AI-detected color for this specific variant';
COMMENT ON COLUMN product_variants.ai_material IS 'AI-detected material for this variant';
COMMENT ON COLUMN product_variants.ai_product_name IS 'AI-detected product type name (ex: Canapé, Table, Chaise)';
COMMENT ON COLUMN product_variants.ai_vision_analysis IS 'Full visual description for this variant';
COMMENT ON COLUMN product_variants.ai_enrichment_status IS 'Enrichment status: pending, enriched, error';
