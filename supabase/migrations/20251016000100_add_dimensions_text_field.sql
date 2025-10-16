/*
  # Add Comprehensive Dimensions Text Field

  This migration adds a text field to store all dimension information in a readable format.

  1. Changes
    - Add `dimensions_text` column (text) - Stores complete dimension information
    - This field will contain all dimensions in a human-readable format

  2. Notes
    - Populated by AI enrichment
    - Contains all dimensions: length, width, height, depth, diameter, etc.
    - Example: "Longueur: 120 cm, Largeur: 80 cm, Hauteur: 45 cm, Hauteur d'assise: 40 cm"
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'dimensions_text'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN dimensions_text text;
  END IF;
END $$;

COMMENT ON COLUMN shopify_products.dimensions_text IS 'Complete dimension information in human-readable text format';
