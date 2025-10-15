/*
  # Add Anonymous Read Access to Shopify Products

  1. Security Changes
    - Add policy to allow anonymous users to read products from shopify_products table
    - This enables the frontend (using VITE_SUPABASE_ANON_KEY) to fetch and display products
    - Write operations remain restricted to authenticated users and service role

  2. Notes
    - The edge function uses the service role key to insert/update products
    - The frontend uses the anonymous key to read and display products
    - This is a common pattern for public product catalogs
*/

-- Drop existing authenticated-only read policy
DROP POLICY IF EXISTS "Authenticated users can read products" ON shopify_products;

-- Create new policy allowing anonymous users to read products
CREATE POLICY "Anyone can read products"
  ON shopify_products
  FOR SELECT
  TO anon, authenticated
  USING (true);