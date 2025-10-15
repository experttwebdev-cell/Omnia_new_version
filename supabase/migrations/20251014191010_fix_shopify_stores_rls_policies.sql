/*
  # Fix RLS Policies for shopify_stores Table

  ## Changes
  - Allow anonymous users to insert, update, and delete stores
  - This is needed because the application doesn't have authentication enabled
  - Keep existing policies for authenticated users when auth is added later

  ## Security Note
  - These policies allow public access for development
  - When authentication is added, remove the anon policies and keep only authenticated policies
*/

-- Allow anonymous users to insert stores
CREATE POLICY "Anonymous users can insert stores"
  ON shopify_stores
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anonymous users to update stores
CREATE POLICY "Anonymous users can update stores"
  ON shopify_stores
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow anonymous users to delete stores
CREATE POLICY "Anonymous users can delete stores"
  ON shopify_stores
  FOR DELETE
  TO anon
  USING (true);