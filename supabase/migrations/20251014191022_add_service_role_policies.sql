/*
  # Add Service Role Policies for Edge Functions

  ## Changes
  - Add policies to allow service_role to write to all tables
  - Edge Functions use service_role key and need full access
  - These policies ensure the import Edge Function can insert products, variants, images, and logs

  ## Security Note
  - service_role bypasses RLS by default in most cases
  - These explicit policies ensure compatibility across all Supabase configurations
*/

-- Service role policies for product_images (already has anon read, need service_role write)
CREATE POLICY "Service role can insert images"
  ON product_images
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update images"
  ON product_images
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role policies for sync_logs
CREATE POLICY "Service role can insert sync logs"
  ON sync_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update sync logs"
  ON sync_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);