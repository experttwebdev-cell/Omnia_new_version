/*
  # Add chat_text field for full-text search optimization

  ## Changes
  - Add `chat_text` TEXT field to `shopify_products` table
  - This field will combine all searchable text for efficient AI chat product search
  - Create function to auto-populate chat_text when products are inserted/updated
  
  ## Contents of chat_text
  - title, category, sub_category, product_type, tags, vendor
  - AI-generated fields: ai_color, ai_material, ai_texture, ai_pattern, etc.
  - dimensions, room, and style information
  
  ## Notes
  - Automatically maintained via trigger
  - No index needed as ILIKE searches will use other column indexes
*/

-- Add chat_text field
ALTER TABLE shopify_products
ADD COLUMN IF NOT EXISTS chat_text TEXT;

-- Create function to generate chat_text
CREATE OR REPLACE FUNCTION generate_chat_text()
RETURNS TRIGGER AS $$
BEGIN
  NEW.chat_text := LOWER(
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.category, '') || ' ' ||
    COALESCE(NEW.sub_category, '') || ' ' ||
    COALESCE(NEW.product_type, '') || ' ' ||
    COALESCE(NEW.tags, '') || ' ' ||
    COALESCE(NEW.vendor, '') || ' ' ||
    COALESCE(NEW.ai_color, '') || ' ' ||
    COALESCE(NEW.ai_material, '') || ' ' ||
    COALESCE(NEW.ai_texture, '') || ' ' ||
    COALESCE(NEW.ai_pattern, '') || ' ' ||
    COALESCE(NEW.ai_finish, '') || ' ' ||
    COALESCE(NEW.ai_shape, '') || ' ' ||
    COALESCE(NEW.ai_design_elements, '') || ' ' ||
    COALESCE(NEW.room, '') || ' ' ||
    COALESCE(NEW.style, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate chat_text
DROP TRIGGER IF EXISTS generate_chat_text_trigger ON shopify_products;
CREATE TRIGGER generate_chat_text_trigger
  BEFORE INSERT OR UPDATE ON shopify_products
  FOR EACH ROW
  EXECUTE FUNCTION generate_chat_text();

-- Populate existing records (limit batch size to avoid timeout)
UPDATE shopify_products
SET chat_text = LOWER(
  COALESCE(title, '') || ' ' ||
  COALESCE(category, '') || ' ' ||
  COALESCE(sub_category, '') || ' ' ||
  COALESCE(product_type, '') || ' ' ||
  COALESCE(tags, '') || ' ' ||
  COALESCE(vendor, '') || ' ' ||
  COALESCE(ai_color, '') || ' ' ||
  COALESCE(ai_material, '') || ' ' ||
  COALESCE(ai_texture, '') || ' ' ||
  COALESCE(ai_pattern, '') || ' ' ||
  COALESCE(ai_finish, '') || ' ' ||
  COALESCE(ai_shape, '') || ' ' ||
  COALESCE(ai_design_elements, '') || ' ' ||
  COALESCE(room, '') || ' ' ||
  COALESCE(style, '')
)
WHERE chat_text IS NULL;

COMMENT ON COLUMN shopify_products.chat_text IS 
'Auto-generated searchable text combining all product attributes for AI chat search. Updated automatically via trigger. Use with ILIKE for text searches.';
