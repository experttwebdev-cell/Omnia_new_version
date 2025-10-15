/*
  # Create Blog Opportunities and Articles Tables

  1. New Tables
    - `blog_opportunities`
      - `id` (uuid, primary key)
      - `title` (text, blog opportunity title)
      - `description` (text, opportunity description)
      - `type` (text, category-guide|comparison|how-to|product-spotlight)
      - `target_keywords` (jsonb, array of keywords)
      - `related_product_ids` (jsonb, array of product UUIDs)
      - `product_language` (text, language code from Shopify products)
      - `category` (text, main category)
      - `sub_category` (text, sub category)
      - `score` (integer, opportunity score)
      - `estimated_word_count` (integer)
      - `difficulty` (text, easy|medium|hard)
      - `status` (text, pending|approved|created)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `blog_articles`
      - `id` (uuid, primary key)
      - `opportunity_id` (uuid, reference to blog_opportunities)
      - `title` (text, article title)
      - `content` (text, article content HTML/markdown)
      - `excerpt` (text, short excerpt)
      - `target_keywords` (jsonb, array of keywords)
      - `related_product_ids` (jsonb, array of product UUIDs)
      - `shopify_blog_id` (bigint, Shopify blog post ID)
      - `shopify_article_id` (bigint, Shopify article ID)
      - `sync_status` (text, draft|syncing|synced|error)
      - `last_synced_at` (timestamptz)
      - `sync_error` (text)
      - `author` (text)
      - `tags` (text)
      - `published` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their content
    - Add service role policies for edge functions

  3. Indexes
    - Add indexes on frequently queried columns for performance
*/

-- Create blog_opportunities table
CREATE TABLE IF NOT EXISTS blog_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'category-guide',
  target_keywords jsonb DEFAULT '[]'::jsonb,
  related_product_ids jsonb DEFAULT '[]'::jsonb,
  product_language text DEFAULT 'en',
  category text DEFAULT '',
  sub_category text DEFAULT '',
  score integer DEFAULT 0,
  estimated_word_count integer DEFAULT 1000,
  difficulty text DEFAULT 'medium',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create blog_articles table
CREATE TABLE IF NOT EXISTS blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid REFERENCES blog_opportunities(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text DEFAULT '',
  target_keywords jsonb DEFAULT '[]'::jsonb,
  related_product_ids jsonb DEFAULT '[]'::jsonb,
  shopify_blog_id bigint,
  shopify_article_id bigint,
  sync_status text DEFAULT 'draft',
  last_synced_at timestamptz,
  sync_error text DEFAULT '',
  author text DEFAULT '',
  tags text DEFAULT '',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blog_opportunities_status ON blog_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_blog_opportunities_created_at ON blog_opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_opportunities_category ON blog_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_sync_status ON blog_articles(sync_status);
CREATE INDEX IF NOT EXISTS idx_blog_articles_created_at ON blog_articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_articles_opportunity_id ON blog_articles(opportunity_id);

-- Enable Row Level Security
ALTER TABLE blog_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

-- Policies for blog_opportunities
CREATE POLICY "Anyone can read blog opportunities"
  ON blog_opportunities FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert blog opportunities"
  ON blog_opportunities FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update blog opportunities"
  ON blog_opportunities FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete blog opportunities"
  ON blog_opportunities FOR DELETE
  TO service_role
  USING (true);

-- Policies for blog_articles
CREATE POLICY "Anyone can read blog articles"
  ON blog_articles FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert blog articles"
  ON blog_articles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update blog articles"
  ON blog_articles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete blog articles"
  ON blog_articles FOR DELETE
  TO service_role
  USING (true);