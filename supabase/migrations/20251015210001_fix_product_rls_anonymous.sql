/*
  # Fix RLS Policies for Anonymous Access to Products

  1. Changes
    - Drop existing restrictive policies on shopify_products
    - Add new policies allowing anonymous read access
    - Keep authenticated user write access

  2. Security
    - Anonymous users: READ only (for blog generation)
    - Authenticated users: FULL access
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow anonymous read access to products" ON shopify_products;
DROP POLICY IF EXISTS "Allow authenticated full access to products" ON shopify_products;
DROP POLICY IF EXISTS "Enable read access for service role" ON shopify_products;
DROP POLICY IF EXISTS "Service role can manage products" ON shopify_products;

-- Anonymous users can read all products (needed for blog generation)
CREATE POLICY "Anonymous users can read products"
  ON shopify_products FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can read all products
CREATE POLICY "Authenticated users can read products"
  ON shopify_products FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert products
CREATE POLICY "Authenticated users can insert products"
  ON shopify_products FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update products
CREATE POLICY "Authenticated users can update products"
  ON shopify_products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Authenticated users can delete products
CREATE POLICY "Authenticated users can delete products"
  ON shopify_products FOR DELETE
  TO authenticated
  USING (true);
