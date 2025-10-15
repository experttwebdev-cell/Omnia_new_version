/*
  # Add Missing Columns to Blog Articles Table

  1. New Columns Added to blog_articles
    - `category` (text) - Main product category for the article
    - `subcategory` (text) - Sub-category for more specific categorization
    - `language` (text) - Language code (fr, en, es, de, etc.)
    - `word_count` (integer) - Number of words in the article content
    - `format` (text) - Output format (markdown or html)
    - `product_links` (jsonb) - Array of product link objects with metadata
    - `status` (text) - Article status (draft, published, etc.)
    - `generated_at` (timestamptz) - Timestamp when AI generated the article
    - `meta_description` (text) - SEO meta description for the article

  2. Changes
    - Alter blog_articles table to add missing columns used by Edge Functions
    - Add default values for all new columns
    - Create indexes for frequently queried columns

  3. Notes
    - These columns are required for the generate-blog-article Edge Function
    - Ensures schema matches application expectations
    - Maintains backward compatibility with existing data
*/

-- Add missing columns to blog_articles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'category'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN category text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'subcategory'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN subcategory text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'language'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN language text DEFAULT 'en';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'word_count'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN word_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'format'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN format text DEFAULT 'html';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'product_links'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN product_links jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'status'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN status text DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'generated_at'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN generated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN meta_description text DEFAULT '';
  END IF;
END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_language ON blog_articles(language);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_generated_at ON blog_articles(generated_at DESC);