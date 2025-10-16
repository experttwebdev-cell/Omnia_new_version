/*
  # Change ai_vision_analysis Column Type

  This migration changes the ai_vision_analysis column from jsonb to text.

  1. Changes
    - Alter ai_vision_analysis column type from jsonb to text
    - This allows storing simple text descriptions instead of complex JSON structures
*/

DO $$
BEGIN
  -- Change column type from jsonb to text
  ALTER TABLE shopify_products ALTER COLUMN ai_vision_analysis TYPE text USING ai_vision_analysis::text;
END $$;

COMMENT ON COLUMN shopify_products.ai_vision_analysis IS 'AI-generated vision analysis text description of the product';
