/*
  # Add Content Quality Tracking to Blog Articles

  1. New Columns
    - `content_quality_score` (integer, 0-100) - Overall quality score for content
    - `content_issues` (text[], array) - List of detected content issues
    - `validation_errors` (text[], array) - List of validation errors
    - `has_placeholders` (boolean) - Flag for placeholder content detection
    - `language_validated` (boolean) - Flag for language consistency
    - `regeneration_count` (integer) - Number of times content was regenerated

  2. Changes
    - Updates status field to support 'needs_review' status
    - Adds default values for quality tracking fields
    - Creates index on content_quality_score for filtering

  3. Purpose
    - Track content quality metrics
    - Flag articles needing manual review
    - Monitor language consistency
    - Detect incomplete or placeholder content
*/

-- Add new columns to blog_articles table
ALTER TABLE blog_articles
ADD COLUMN IF NOT EXISTS content_quality_score integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS content_issues text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS validation_errors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS has_placeholders boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS language_validated boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS regeneration_count integer DEFAULT 0;

-- Create index for filtering by quality score
CREATE INDEX IF NOT EXISTS idx_blog_articles_quality_score
  ON blog_articles(content_quality_score);

-- Create index for filtering articles needing review
CREATE INDEX IF NOT EXISTS idx_blog_articles_needs_review
  ON blog_articles(status) WHERE status = 'needs_review';

-- Create index for placeholder detection
CREATE INDEX IF NOT EXISTS idx_blog_articles_placeholders
  ON blog_articles(has_placeholders) WHERE has_placeholders = true;

-- Create index for language validation
CREATE INDEX IF NOT EXISTS idx_blog_articles_language_validation
  ON blog_articles(language_validated) WHERE language_validated = false;

-- Update existing articles with default quality scores
UPDATE blog_articles
SET
  content_quality_score = 100,
  content_issues = '{}',
  validation_errors = '{}',
  has_placeholders = false,
  language_validated = true,
  regeneration_count = 0
WHERE content_quality_score IS NULL;

-- Add comment explaining the quality score
COMMENT ON COLUMN blog_articles.content_quality_score IS 'Quality score from 0-100 based on content completeness, language consistency, and structure';
COMMENT ON COLUMN blog_articles.has_placeholders IS 'True if article contains placeholder content like [Content for...] or incomplete sections';
COMMENT ON COLUMN blog_articles.language_validated IS 'True if article content matches the specified language parameter';
COMMENT ON COLUMN blog_articles.regeneration_count IS 'Number of times the article was regenerated due to quality issues';
