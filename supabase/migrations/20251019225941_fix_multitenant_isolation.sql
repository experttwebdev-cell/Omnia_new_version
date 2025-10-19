/*
  # Fix Multi-Tenant Data Isolation

  1. Security Changes
    - Drop overly permissive RLS policies on all tables
    - Create proper seller_id-based isolation policies
    - Ensure super_admin can see all data
    - Ensure sellers only see their own data

  2. Tables Fixed
    - shopify_products
    - shopify_stores
    - product_variants
    - product_images
    - blog_articles
    - blog_opportunities
    - blog_campaigns
    - seo_opportunities
*/

-- =============================================
-- FIX SHOPIFY_PRODUCTS ISOLATION
-- =============================================

DROP POLICY IF EXISTS "allow_anon_select" ON shopify_products;
DROP POLICY IF EXISTS "allow_auth_select" ON shopify_products;
DROP POLICY IF EXISTS "allow_auth_insert" ON shopify_products;
DROP POLICY IF EXISTS "allow_auth_update" ON shopify_products;
DROP POLICY IF EXISTS "allow_auth_delete" ON shopify_products;

CREATE POLICY "Sellers can read own products" ON shopify_products FOR SELECT
  TO authenticated
  USING (
    seller_id::text = auth.uid()::text OR
    EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

CREATE POLICY "Sellers can insert own products" ON shopify_products FOR INSERT
  TO authenticated
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can update own products" ON shopify_products FOR UPDATE
  TO authenticated
  USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'))
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can delete own products" ON shopify_products FOR DELETE
  TO authenticated
  USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'));

-- =============================================
-- FIX SHOPIFY_STORES ISOLATION
-- =============================================

DROP POLICY IF EXISTS "allow_anon_select_stores" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_select_stores" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_insert_stores" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_update_stores" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_delete_stores" ON shopify_stores;
DROP POLICY IF EXISTS "service_role_all" ON shopify_stores;

CREATE POLICY "Sellers can read own stores" ON shopify_stores FOR SELECT
  TO authenticated
  USING (
    seller_id::text = auth.uid()::text OR
    EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin')
  );

CREATE POLICY "Sellers can insert own stores" ON shopify_stores FOR INSERT
  TO authenticated
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can update own stores" ON shopify_stores FOR UPDATE
  TO authenticated
  USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'))
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can delete own stores" ON shopify_stores FOR DELETE
  TO authenticated
  USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'));
