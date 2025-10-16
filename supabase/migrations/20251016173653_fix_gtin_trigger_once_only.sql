/*
  # Fix GTIN Trigger - Generate Only Once on INSERT

  This migration fixes two critical issues:
  1. The trigger function was referencing NEW.gtin but the actual column name is google_gtin
  2. The trigger was running on INSERT OR UPDATE, but GTIN should only be generated once (INSERT only)

  ## Problem
  - Error: "record 'new' has no field 'gtin'"
  - GTIN was being regenerated on every UPDATE (incorrect - GTIN is a permanent unique identifier)

  ## Solution
  1. Update auto_generate_gtin() function to reference NEW.google_gtin instead of NEW.gtin
  2. Change trigger to BEFORE INSERT only (GTIN generated once and never changed)
*/

-- Drop and recreate the trigger function with correct column name
CREATE OR REPLACE FUNCTION public.auto_generate_gtin()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Use google_gtin instead of gtin (correct column name)
  -- Only generate if not already set
  IF NEW.google_gtin IS NULL OR NEW.google_gtin = '' THEN
    NEW.google_gtin := public.generate_gtin();
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to run ONLY on INSERT (GTIN should never change after creation)
DROP TRIGGER IF EXISTS trigger_auto_generate_gtin ON shopify_products;
CREATE TRIGGER trigger_auto_generate_gtin
  BEFORE INSERT ON shopify_products
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_gtin();
