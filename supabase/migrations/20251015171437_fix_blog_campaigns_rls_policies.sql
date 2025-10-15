/*
  # Fix Blog Campaigns RLS Policies

  ## Problem
  The current RLS policies for blog_campaigns are too restrictive and prevent
  users from creating campaigns even when they have access to the store.

  ## Solution
  Update the RLS policies to allow:
  - Anonymous and authenticated users to access campaigns (since we're not using auth)
  - More permissive policies that work with the current store setup

  ## Changes
  1. Drop existing restrictive policies
  2. Create new permissive policies that allow all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own campaigns" ON blog_campaigns;
DROP POLICY IF EXISTS "Users can create campaigns" ON blog_campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON blog_campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON blog_campaigns;

-- Create new permissive policies for anon and authenticated users

-- Policy: Allow anyone to view campaigns
CREATE POLICY "Allow public read access to campaigns"
  ON blog_campaigns FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert campaigns
CREATE POLICY "Allow public insert access to campaigns"
  ON blog_campaigns FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to update campaigns
CREATE POLICY "Allow public update access to campaigns"
  ON blog_campaigns FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow anyone to delete campaigns
CREATE POLICY "Allow public delete access to campaigns"
  ON blog_campaigns FOR DELETE
  USING (true);
