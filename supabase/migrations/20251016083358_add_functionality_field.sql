/*
  # Add functionality field to shopify_products

  1. Changes
    - Add `functionality` text field to track product functionality
      (e.g., "Convertible", "3 places", "Avec rangement", "Extensible", "Modulable")
    - Add `smart_seat_height` numeric field for seat height dimension
    - Add `smart_seat_height_unit` for seat height unit
    
  2. Purpose
    - Better categorization of products by their key functionality
    - Essential for filtering (e.g., "convertible sofas", "3-seater", "storage beds")
    - Improved product discovery and search
*/

-- Add functionality field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'functionality'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN functionality TEXT DEFAULT '';
  END IF;
END $$;

-- Add smart seat height fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_seat_height'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_seat_height NUMERIC;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'smart_seat_height_unit'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN smart_seat_height_unit TEXT DEFAULT 'cm';
  END IF;
END $$;