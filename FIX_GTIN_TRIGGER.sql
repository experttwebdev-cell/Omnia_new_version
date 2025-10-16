/*
  # Fix GTIN Trigger - Use Correct Column Name

  This migration fixes the auto_generate_gtin() trigger to use the correct column name 'google_gtin' instead of 'gtin'.

  ## Problem
  The trigger function was referencing NEW.gtin but the actual column name is google_gtin,
  causing the error: "record 'new' has no field 'gtin'"

  ## Solution
  Update auto_generate_gtin() function to reference NEW.google_gtin instead of NEW.gtin

  ## How to Apply
  Run this SQL in your Supabase SQL Editor:
  https://supabase.com/dashboard/project/YOUR_PROJECT/editor
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
  IF NEW.google_gtin IS NULL OR NEW.google_gtin = '' THEN
    NEW.google_gtin := public.generate_gtin();
  END IF;
  RETURN NEW;
END;
$$;
