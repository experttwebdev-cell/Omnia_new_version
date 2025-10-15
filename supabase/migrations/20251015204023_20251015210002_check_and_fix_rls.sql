/*
  # Check and Fix RLS Policies for Product Access

  1. Changes
    - Ensure anonymous read access is enabled
    - Ensure authenticated full access
*/

-- First, let's see what policies exist
DO $$
BEGIN
  -- Drop ALL existing policies to start fresh
  DROP POLICY IF EXISTS "Anonymous users can read products" ON shopify_products;
  DROP POLICY IF EXISTS "Authenticated users can read products" ON shopify_products;
  DROP POLICY IF EXISTS "Authenticated users can insert products" ON shopify_products;
  DROP POLICY IF EXISTS "Authenticated users can update products" ON shopify_products;
  DROP POLICY IF EXISTS "Authenticated users can delete products" ON shopify_products;
  DROP POLICY IF EXISTS "Allow anonymous read access to products" ON shopify_products;
  DROP POLICY IF EXISTS "Allow authenticated full access to products" ON shopify_products;
  DROP POLICY IF EXISTS "Enable read access for service role" ON shopify_products;
  DROP POLICY IF EXISTS "Service role can manage products" ON shopify_products;
  DROP POLICY IF EXISTS "Users can read own store products" ON shopify_products;
  DROP POLICY IF EXISTS "Users can insert own store products" ON shopify_products;
  DROP POLICY IF EXISTS "Users can update own store products" ON shopify_products;
  DROP POLICY IF EXISTS "Users can delete own store products" ON shopify_products;
  DROP POLICY IF EXISTS "Service role has full access" ON shopify_products;
END $$;

-- Now create simple, working policies
CREATE POLICY "allow_anon_select" ON shopify_products FOR SELECT TO anon USING (true);
CREATE POLICY "allow_auth_select" ON shopify_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_insert" ON shopify_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_update" ON shopify_products FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_delete" ON shopify_products FOR DELETE TO authenticated USING (true);
