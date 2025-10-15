/*
  # Add Language Column to Shopify Stores

  1. New Column
    - `language` (text) - User's preferred language for the application interface
      Supports: fr, en, es, de, it, pt, nl, ru, zh, ja

  2. Changes
    - Add language column to shopify_stores table
    - Set default value to 'en' (English)

  3. Notes
    - This column stores the user's language preference
    - Used for translating the entire application interface
    - Supports 10 major world languages
*/

-- Add language column to shopify_stores table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'language'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN language text DEFAULT 'en';
  END IF;
END $$;