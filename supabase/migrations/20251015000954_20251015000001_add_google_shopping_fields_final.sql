/*
  # Add Google Shopping Fields to Products

  1. New Columns
    - `google_product_category` (text) - Hierarchical Google product category
    - `google_gender` (text) - Gender targeting (male, female, unisex)
    - `google_age_group` (text) - Age group (adult, kids, toddler, infant, newborn)
    - `google_mpn` (text) - Manufacturer Part Number
    - `google_gtin` (text) - Global Trade Item Number (auto-generated if not provided)
    - `google_condition` (text) - Product condition (new, refurbished, used)
    - `google_custom_product` (boolean) - Is custom product
    - `google_custom_label_0` (text) - Custom label 0
    - `google_custom_label_1` (text) - Custom label 1
    - `google_custom_label_2` (text) - Custom label 2
    - `google_custom_label_3` (text) - Custom label 3
    - `google_custom_label_4` (text) - Custom label 4
    - `google_availability` (text) - Product availability (in stock, out of stock, preorder, backorder)
    - `google_brand` (text) - Product brand (defaults to vendor)
    - `google_synced_at` (timestamptz) - Last sync to Google Shopping

  2. Changes
    - Add all Google Shopping fields to shopify_products table
    - Set default values based on existing product data
    - Create trigger to auto-generate GTIN when missing
*/

DO $$
BEGIN
  -- Add google_product_category if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_product_category'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_product_category text;
  END IF;

  -- Add google_gender if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_gender'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_gender text;
  END IF;

  -- Add google_age_group if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_age_group'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_age_group text DEFAULT 'adult';
  END IF;

  -- Add google_mpn if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_mpn'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_mpn text;
  END IF;

  -- Add google_gtin if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_gtin'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_gtin text;
  END IF;

  -- Add google_condition if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_condition'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_condition text DEFAULT 'new';
  END IF;

  -- Add google_custom_product if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_custom_product'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_custom_product boolean DEFAULT false;
  END IF;

  -- Add google_custom_label_0 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_custom_label_0'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_custom_label_0 text;
  END IF;

  -- Add google_custom_label_1 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_custom_label_1'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_custom_label_1 text;
  END IF;

  -- Add google_custom_label_2 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_custom_label_2'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_custom_label_2 text;
  END IF;

  -- Add google_custom_label_3 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_custom_label_3'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_custom_label_3 text;
  END IF;

  -- Add google_custom_label_4 if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_custom_label_4'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_custom_label_4 text;
  END IF;

  -- Add google_availability if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_availability'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_availability text DEFAULT 'in stock';
  END IF;

  -- Add google_brand if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_brand'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_brand text;
  END IF;

  -- Add google_synced_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'google_synced_at'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN google_synced_at timestamptz;
  END IF;
END $$;

-- Update google_brand to default to vendor for existing products
UPDATE shopify_products
SET google_brand = vendor
WHERE google_brand IS NULL AND vendor IS NOT NULL AND vendor != '';

-- Update google_availability based on inventory
UPDATE shopify_products
SET google_availability = CASE
  WHEN inventory_quantity > 0 THEN 'in stock'
  ELSE 'out of stock'
END
WHERE google_availability IS NULL OR google_availability = 'in stock';

-- Create function to auto-generate GTIN
CREATE OR REPLACE FUNCTION generate_gtin()
RETURNS text AS $$
DECLARE
  base_number text;
  check_digit integer;
  gtin text;
  digit_sum integer := 0;
  i integer;
BEGIN
  -- Generate a 13-digit base number (EAN-13 format without check digit)
  base_number := lpad(floor(random() * 1000000000000)::text, 12, '0');

  -- Calculate check digit for EAN-13
  FOR i IN 1..12 LOOP
    IF i % 2 = 1 THEN
      digit_sum := digit_sum + substring(base_number, i, 1)::integer;
    ELSE
      digit_sum := digit_sum + (substring(base_number, i, 1)::integer * 3);
    END IF;
  END LOOP;

  check_digit := (10 - (digit_sum % 10)) % 10;
  gtin := base_number || check_digit::text;

  RETURN gtin;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate GTIN before insert/update
CREATE OR REPLACE FUNCTION auto_generate_gtin()
RETURNS trigger AS $$
BEGIN
  IF NEW.google_gtin IS NULL OR NEW.google_gtin = '' THEN
    NEW.google_gtin := generate_gtin();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trigger_auto_generate_gtin ON shopify_products;
CREATE TRIGGER trigger_auto_generate_gtin
  BEFORE INSERT OR UPDATE ON shopify_products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_gtin();

-- Generate GTINs for existing products without one
UPDATE shopify_products
SET google_gtin = generate_gtin()
WHERE google_gtin IS NULL OR google_gtin = '';
