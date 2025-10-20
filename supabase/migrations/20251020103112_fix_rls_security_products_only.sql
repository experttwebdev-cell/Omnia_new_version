/*
  # Fix RLS Security - Remove Insecure Policies for Products

  ## Critical Security Fix
  
  This migration removes dangerous RLS policies that allow:
  - Anyone to see all products from all sellers
  - Authenticated users to manage any products
  
  ## Changes
  
  1. Drop insecure policies from shopify_products:
     - "Anyone can read products" (allows viewing all data)
     - "Authenticated can manage products" (allows managing all data)
     - "Public can read products" (allows viewing all data)
  
  2. Keep secure policies:
     - "Sellers can read own products" (seller_id = auth.uid())
     - "Sellers can insert own products" (seller_id = auth.uid())
     - "Sellers can update own products" (seller_id = auth.uid())
     - "Sellers can delete own products" (seller_id = auth.uid())
  
  ## Security Impact
  
  After this migration:
  - ✅ Sellers can ONLY see their own products
  - ✅ Sellers can ONLY manage their own products
  - ✅ Multi-tenant isolation enforced
*/

-- Drop the insecure policies that allow viewing all data
DROP POLICY IF EXISTS "Anyone can read products" ON shopify_products;
DROP POLICY IF EXISTS "Public can read products" ON shopify_products;
DROP POLICY IF EXISTS "Authenticated can manage products" ON shopify_products;

-- Verify the secure policies exist
DO $$
BEGIN
  -- Secure SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopify_products' 
    AND policyname = 'Sellers can read own products'
  ) THEN
    CREATE POLICY "Sellers can read own products"
      ON shopify_products
      FOR SELECT
      TO authenticated
      USING (seller_id::text = auth.uid()::text);
  END IF;

  -- Secure INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopify_products' 
    AND policyname = 'Sellers can insert own products'
  ) THEN
    CREATE POLICY "Sellers can insert own products"
      ON shopify_products
      FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text);
  END IF;

  -- Secure UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopify_products' 
    AND policyname = 'Sellers can update own products'
  ) THEN
    CREATE POLICY "Sellers can update own products"
      ON shopify_products
      FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text)
      WITH CHECK (seller_id::text = auth.uid()::text);
  END IF;

  -- Secure DELETE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'shopify_products' 
    AND policyname = 'Sellers can delete own products'
  ) THEN
    CREATE POLICY "Sellers can delete own products"
      ON shopify_products
      FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text);
  END IF;
END $$;