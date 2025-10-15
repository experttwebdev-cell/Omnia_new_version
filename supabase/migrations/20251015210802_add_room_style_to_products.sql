/*
  # Add Room and Style Columns to Products

  This migration adds support for room categorization and style classification for products.

  1. Changes to shopify_products table
    - Add `room` column (text) - Categories like 'bedroom', 'living_room', 'dining_room', 'office', 'bathroom', 'kitchen', 'outdoor', 'hallway'
    - Add `style` column (text) - Style categories like 'scandinavian', 'modern', 'industrial', 'minimalist', 'bohemian', 'traditional', 'contemporary', 'rustic'
    - Add `ai_vision_analysis` column (jsonb) - Stores detailed AI vision analysis of product images

  2. Indexes
    - Add index on room column for faster filtering
    - Add index on style column for faster filtering

  3. Notes
    - These fields will be populated by AI enrichment process
    - Allows for advanced filtering and categorization
    - Supports multi-language display in UI
*/

-- Add new columns to shopify_products table
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

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_products' AND column_name = 'ai_vision_analysis'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN ai_vision_analysis jsonb;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shopify_products_room ON shopify_products(room);
CREATE INDEX IF NOT EXISTS idx_shopify_products_style ON shopify_products(style);

-- Add comments for documentation
COMMENT ON COLUMN shopify_products.room IS 'Room category for the product (e.g., bedroom, living_room, dining_room)';
COMMENT ON COLUMN shopify_products.style IS 'Style classification for the product (e.g., scandinavian, modern, industrial)';
COMMENT ON COLUMN shopify_products.ai_vision_analysis IS 'Detailed AI vision analysis of product images including detected objects, colors, materials, and visual features';