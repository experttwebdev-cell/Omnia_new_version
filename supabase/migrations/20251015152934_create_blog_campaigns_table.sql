/*
  # Create Blog Campaigns Table for AI-Powered Content Automation

  ## Overview
  This migration creates a comprehensive system for managing automated blog content campaigns.
  Users can create campaigns that automatically generate and publish blog articles based on
  predefined parameters and schedules.

  ## New Tables

  ### `blog_campaigns`
  Main table for storing campaign configurations
  - `id` (uuid, primary key) - Unique campaign identifier
  - `store_id` (uuid, foreign key) - Reference to shopify_stores
  - `name` (text) - Campaign name
  - `description` (text) - Campaign description
  - `status` (text) - Campaign status: 'draft', 'active', 'paused', 'stopped', 'completed'
  - `topic_niche` (text) - Content topic/niche
  - `target_audience` (text) - Target audience definition
  - `frequency` (text) - Publishing frequency: 'daily', 'weekly', 'bi-weekly', 'monthly'
  - `start_date` (timestamptz) - Campaign start date
  - `end_date` (timestamptz) - Campaign end date (nullable)
  - `word_count_min` (integer) - Minimum word count
  - `word_count_max` (integer) - Maximum word count
  - `writing_style` (text) - Writing style: 'professional', 'casual', 'technical', 'conversational'
  - `tone` (text) - Tone: 'formal', 'informal', 'friendly', 'authoritative'
  - `keywords` (text[]) - Array of target keywords
  - `content_structure` (text) - Preferred content structure
  - `internal_linking_enabled` (boolean) - Enable automatic internal linking
  - `max_internal_links` (integer) - Maximum internal links per article
  - `image_integration_enabled` (boolean) - Enable automatic image integration
  - `product_links_enabled` (boolean) - Enable automatic product link insertion
  - `seo_optimization_enabled` (boolean) - Enable SEO optimization
  - `auto_publish` (boolean) - Automatically publish to Shopify
  - `language` (text) - Content language
  - `articles_generated` (integer) - Counter of articles generated
  - `articles_published` (integer) - Counter of articles published
  - `last_execution` (timestamptz) - Last time campaign was executed
  - `next_execution` (timestamptz) - Next scheduled execution
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### `campaign_execution_log`
  Log of campaign execution history
  - `id` (uuid, primary key) - Unique log entry identifier
  - `campaign_id` (uuid, foreign key) - Reference to blog_campaigns
  - `execution_time` (timestamptz) - When execution occurred
  - `status` (text) - Execution status: 'success', 'failed', 'partial'
  - `articles_generated` (integer) - Number of articles generated in this execution
  - `error_message` (text) - Error message if failed
  - `created_at` (timestamptz) - Creation timestamp

  ## Security
  - Enable RLS on both tables
  - Add policies for authenticated users to manage their own campaigns
  - Service role can execute campaigns

  ## Indexes
  - Index on store_id for faster lookups
  - Index on status for filtering
  - Index on next_execution for cron job efficiency
*/

-- Create blog_campaigns table
CREATE TABLE IF NOT EXISTS blog_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES shopify_stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'stopped', 'completed')),
  topic_niche text NOT NULL,
  target_audience text,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly', 'monthly')),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  word_count_min integer NOT NULL DEFAULT 700,
  word_count_max integer NOT NULL DEFAULT 900,
  writing_style text NOT NULL DEFAULT 'professional' CHECK (writing_style IN ('professional', 'casual', 'technical', 'conversational')),
  tone text NOT NULL DEFAULT 'formal' CHECK (tone IN ('formal', 'informal', 'friendly', 'authoritative')),
  keywords text[] DEFAULT '{}',
  content_structure text,
  internal_linking_enabled boolean DEFAULT true,
  max_internal_links integer DEFAULT 5,
  image_integration_enabled boolean DEFAULT true,
  product_links_enabled boolean DEFAULT true,
  seo_optimization_enabled boolean DEFAULT true,
  auto_publish boolean DEFAULT false,
  language text DEFAULT 'fr',
  articles_generated integer DEFAULT 0,
  articles_published integer DEFAULT 0,
  last_execution timestamptz,
  next_execution timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create campaign_execution_log table
CREATE TABLE IF NOT EXISTS campaign_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES blog_campaigns(id) ON DELETE CASCADE,
  execution_time timestamptz DEFAULT now(),
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  articles_generated integer DEFAULT 0,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_store_id ON blog_campaigns(store_id);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_status ON blog_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_blog_campaigns_next_execution ON blog_campaigns(next_execution);
CREATE INDEX IF NOT EXISTS idx_campaign_execution_log_campaign_id ON campaign_execution_log(campaign_id);

-- Enable Row Level Security
ALTER TABLE blog_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_execution_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_campaigns

-- Policy: Users can view campaigns for their stores
CREATE POLICY "Users can view own campaigns"
  ON blog_campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_campaigns.store_id
    )
  );

-- Policy: Users can insert campaigns for their stores
CREATE POLICY "Users can create campaigns"
  ON blog_campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_campaigns.store_id
    )
  );

-- Policy: Users can update their own campaigns
CREATE POLICY "Users can update own campaigns"
  ON blog_campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_campaigns.store_id
    )
  );

-- Policy: Users can delete their own campaigns
CREATE POLICY "Users can delete own campaigns"
  ON blog_campaigns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM shopify_stores
      WHERE shopify_stores.id = blog_campaigns.store_id
    )
  );

-- Policy: Service role can manage all campaigns
CREATE POLICY "Service role full access to campaigns"
  ON blog_campaigns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS Policies for campaign_execution_log

-- Policy: Users can view execution logs for their campaigns
CREATE POLICY "Users can view own campaign logs"
  ON campaign_execution_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM blog_campaigns
      JOIN shopify_stores ON shopify_stores.id = blog_campaigns.store_id
      WHERE blog_campaigns.id = campaign_execution_log.campaign_id
    )
  );

-- Policy: Service role can manage all logs
CREATE POLICY "Service role full access to logs"
  ON campaign_execution_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blog_campaigns_updated_at
  BEFORE UPDATE ON blog_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_timestamp();
