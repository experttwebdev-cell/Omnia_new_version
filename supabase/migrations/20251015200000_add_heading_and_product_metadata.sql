/*
  # Add Heading Hierarchy and Enhanced Product Metadata

  1. Changes to blog_articles table
    - Add `heading_structure` (jsonb) - Stores extracted heading hierarchy with levels and text
    - Add `heading_hierarchy_score` (integer) - SEO quality score of heading structure (0-100)
    - Add `heading_issues` (jsonb) - Array of heading hierarchy problems found
    - Add `heading_corrected` (boolean) - Indicates if automatic corrections were applied
    - Add `products_featured` (jsonb) - Array of main products showcased in article
    - Add `product_images_count` (integer) - Number of product images in article
    - Add `internal_links_count` (integer) - Total number of product links
    - Add `link_density` (numeric) - Product link saturation percentage

  2. Security
    - Maintains existing RLS policies
    - No changes to authentication or permissions
*/

-- Add heading hierarchy metadata columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'heading_structure'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN heading_structure jsonb DEFAULT '{"headings": []}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'heading_hierarchy_score'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN heading_hierarchy_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'heading_issues'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN heading_issues jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'heading_corrected'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN heading_corrected boolean DEFAULT false;
  END IF;
END $$;

-- Add enhanced product metadata columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'products_featured'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN products_featured jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'product_images_count'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN product_images_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'internal_links_count'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN internal_links_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'blog_articles' AND column_name = 'link_density'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN link_density numeric(5,2) DEFAULT 0.00;
  END IF;
END $$;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_blog_articles_heading_score
  ON blog_articles(heading_hierarchy_score DESC);

CREATE INDEX IF NOT EXISTS idx_blog_articles_product_count
  ON blog_articles(product_images_count DESC);

CREATE INDEX IF NOT EXISTS idx_blog_articles_heading_issues
  ON blog_articles USING GIN (heading_issues);

CREATE INDEX IF NOT EXISTS idx_blog_articles_products_featured
  ON blog_articles USING GIN (products_featured);

-- Add helpful comments
COMMENT ON COLUMN blog_articles.heading_structure IS
  'Extracted heading hierarchy with levels (H1-H6), text, and ids for SEO analysis';

COMMENT ON COLUMN blog_articles.heading_hierarchy_score IS
  'SEO quality score of heading structure (0-100). Score based on proper H1 usage, H2 sections, no skipped levels';

COMMENT ON COLUMN blog_articles.heading_issues IS
  'Array of heading hierarchy problems: multiple H1s, skipped levels, missing H2s, etc.';

COMMENT ON COLUMN blog_articles.heading_corrected IS
  'Indicates if automatic heading hierarchy corrections were applied during generation';

COMMENT ON COLUMN blog_articles.products_featured IS
  'Array of main products showcased in article with product_id, title, handle, image_url, price, and position';

COMMENT ON COLUMN blog_articles.product_images_count IS
  'Total number of product images displayed in article content';

COMMENT ON COLUMN blog_articles.internal_links_count IS
  'Total number of internal product links (both cards and inline mentions)';

COMMENT ON COLUMN blog_articles.link_density IS
  'Product link saturation percentage (internal_links_count / word_count * 100)';
