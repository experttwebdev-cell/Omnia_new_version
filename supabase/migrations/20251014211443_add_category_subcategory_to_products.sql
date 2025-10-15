/*
  # Add Category and Sub-Category Fields to Products

  1. Changes
    - Add `category` field to shopify_products table for main product classification (e.g., "Canapé")
    - Add `sub_category` field to shopify_products table for detailed classification (e.g., "Canapé d'angle")
    - Both fields are text type with default empty string
    - Add indexes on both fields for faster filtering and querying
  
  2. Purpose
    - Enable AI-powered product categorization using ChatGPT
    - Allow filtering products by category and sub-category in all interfaces
    - Support bulk operations by category grouping
    - Enable content opportunity discovery based on product categories
*/

-- Add category and sub_category columns
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

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_shopify_products_category ON shopify_products(category);
CREATE INDEX IF NOT EXISTS idx_shopify_products_sub_category ON shopify_products(sub_category);
CREATE INDEX IF NOT EXISTS idx_shopify_products_category_sub_category ON shopify_products(category, sub_category);