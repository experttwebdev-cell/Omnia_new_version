/*
  # Add characteristics field to shopify_products

  1. Changes
    - Add `characteristics` TEXT field to store product characteristics
      (e.g., "Déhoussable, Pieds réglables, Résistant aux UV, Facile d'entretien")
    
  2. Purpose
    - Store technical features and characteristics extracted from description
    - Better product filtering and comparison
    - Improved product discovery
*/

-- Add characteristics field
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'characteristics'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN characteristics TEXT DEFAULT '';
  END IF;
END $$;