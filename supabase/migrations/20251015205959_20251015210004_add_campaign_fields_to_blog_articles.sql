/*
  # Add Campaign Fields to Blog Articles

  1. Changes
    - Add store_id column to blog_articles
    - Add campaign_id column to blog_articles
    - Add keywords column to blog_articles
    - Add foreign key constraints

  2. Security
    - Maintain existing RLS policies
*/

-- Add missing columns to blog_articles
ALTER TABLE blog_articles 
  ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES shopify_stores(id),
  ADD COLUMN IF NOT EXISTS campaign_id uuid REFERENCES blog_campaigns(id),
  ADD COLUMN IF NOT EXISTS keywords jsonb DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_articles_store_id ON blog_articles(store_id);
CREATE INDEX IF NOT EXISTS idx_blog_articles_campaign_id ON blog_articles(campaign_id);
