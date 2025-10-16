-- =====================================================
-- MIGRATION COMPLÈTE - À EXÉCUTER DANS SUPABASE
-- =====================================================
-- Cette migration ajoute TOUS les champs nécessaires
-- pour l'enrichissement AI avec dimensions intelligentes
-- =====================================================

-- 1. Ajouter category et sub_category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'category'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN category TEXT DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'sub_category'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN sub_category TEXT DEFAULT '';
  END IF;
END $$;

-- 2. Ajouter room et style
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'room'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN room text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'style'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN style text;
  END IF;
END $$;

-- 3. Ajouter les dimensions intelligentes
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

-- 4. Ajouter les commentaires pour documentation
COMMENT ON COLUMN shopify_products.category IS 'Main product category (e.g., Table basse, Canapé, Chaise)';
COMMENT ON COLUMN shopify_products.sub_category IS 'Detailed sub-category with material or functionality';
COMMENT ON COLUMN shopify_products.room IS 'Room usage (bedroom, living_room, dining_room, office, etc.)';
COMMENT ON COLUMN shopify_products.style IS 'Style classification (modern, scandinavian, industrial, etc.)';
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

-- 5. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shopify_products_category ON shopify_products(category);
CREATE INDEX IF NOT EXISTS idx_shopify_products_sub_category ON shopify_products(sub_category);
CREATE INDEX IF NOT EXISTS idx_shopify_products_room ON shopify_products(room);
CREATE INDEX IF NOT EXISTS idx_shopify_products_style ON shopify_products(style);

-- Confirmation
SELECT 'Migration appliquée avec succès! Tous les champs sont maintenant disponibles.' AS status;
