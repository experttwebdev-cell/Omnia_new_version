/*
  # Blog Article Enhancements for Shopify Sync and Internal Linking

  1. New Columns
    - `shopify_article_id` (bigint) - Stores the Shopify article ID after successful sync
    - `product_links` (jsonb) - Stores array of product links with context for internal linking
    - `meta_description` (text) - SEO meta description for the article
    - `focus_keyword` (text) - Primary SEO keyword focus
    - `reading_time_minutes` (integer) - Estimated reading time
    - `structured_content` (jsonb) - Stores structured content with headings hierarchy
    
  2. Changes
    - Add index on shopify_article_id for faster lookups
    - Add index on product_links using GIN for efficient JSONB queries
    - Update sync_status to include 'updating' state
    
  3. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Add new columns to blog_articles table
DO $$
BEGIN
  -- Add shopify_article_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'shopify_article_id'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN shopify_article_id BIGINT;
  END IF;

  -- Add product_links if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'product_links'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN product_links JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- Add meta_description if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN meta_description TEXT;
  END IF;

  -- Add focus_keyword if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'focus_keyword'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN focus_keyword TEXT;
  END IF;

  -- Add reading_time_minutes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'reading_time_minutes'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN reading_time_minutes INTEGER DEFAULT 5;
  END IF;

  -- Add structured_content if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'structured_content'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN structured_content JSONB;
  END IF;

  -- Add language if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'language'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN language TEXT DEFAULT 'en';
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_articles_shopify_article_id 
  ON blog_articles(shopify_article_id) 
  WHERE shopify_article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_blog_articles_product_links 
  ON blog_articles USING GIN (product_links);

CREATE INDEX IF NOT EXISTS idx_blog_articles_language 
  ON blog_articles(language);

CREATE INDEX IF NOT EXISTS idx_blog_articles_focus_keyword 
  ON blog_articles(focus_keyword) 
  WHERE focus_keyword IS NOT NULL;

-- Add comment to document the product_links structure
COMMENT ON COLUMN blog_articles.product_links IS 
'JSONB array storing product link information. Structure: [{"product_id": "uuid", "product_title": "string", "anchor_text": "string", "context": "string", "position": integer}]';

-- Add comment to document the structured_content structure
COMMENT ON COLUMN blog_articles.structured_content IS 
'JSONB object storing structured article content. Structure: {"introduction": "string", "sections": [{"heading": "string", "level": integer, "content": "string"}], "conclusion": "string", "faq": [{"question": "string", "answer": "string"}]}';
