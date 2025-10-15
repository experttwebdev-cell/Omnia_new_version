/*
  # Add Featured Image and Enhancements to Blog Articles

  1. Changes
    - Add `featured_image_url` column to blog_articles for storing featured image URLs
    - Add `reading_time` column for estimated reading time in minutes
    - Add `view_count` column for tracking article views
    - Add index on featured_image_url for faster queries

  2. Notes
    - Uses IF NOT EXISTS to safely add columns
    - All new columns are nullable to maintain compatibility
*/

DO $$
BEGIN
  -- Add featured_image_url column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'featured_image_url'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN featured_image_url text;
  END IF;

  -- Add reading_time column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'reading_time'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN reading_time integer;
  END IF;

  -- Add view_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN view_count integer DEFAULT 0;
  END IF;
END $$;

-- Create index on featured_image_url for faster filtering
CREATE INDEX IF NOT EXISTS idx_blog_articles_featured_image
ON blog_articles(featured_image_url)
WHERE featured_image_url IS NOT NULL;

-- Create index on view_count for popular articles queries
CREATE INDEX IF NOT EXISTS idx_blog_articles_view_count
ON blog_articles(view_count DESC);
