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

-- =============================================
-- FIX PRODUCT_VARIANTS ISOLATION (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_variants') THEN
    DROP POLICY IF EXISTS "allow_auth_all" ON product_variants;

    CREATE POLICY "Sellers can read own variants" ON product_variants FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin')
      );

    CREATE POLICY "Sellers can insert own variants" ON product_variants FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text);

    CREATE POLICY "Sellers can update own variants" ON product_variants FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'))
      WITH CHECK (seller_id::text = auth.uid()::text);

    CREATE POLICY "Sellers can delete own variants" ON product_variants FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'));
  END IF;
END $$;

-- =============================================
-- FIX PRODUCT_IMAGES ISOLATION (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
    DROP POLICY IF EXISTS "allow_auth_all_images" ON product_images;

    CREATE POLICY "Sellers can read own images" ON product_images FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin')
      );

    CREATE POLICY "Sellers can insert own images" ON product_images FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text);

    CREATE POLICY "Sellers can update own images" ON product_images FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'))
      WITH CHECK (seller_id::text = auth.uid()::text);

    CREATE POLICY "Sellers can delete own images" ON product_images FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = 'superadmin'));
  END IF;
END $$;

-- =============================================
-- FIX BLOG_ARTICLES ISOLATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_articles') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read articles" ON blog_articles';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert articles" ON blog_articles';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update articles" ON blog_articles';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete articles" ON blog_articles';

    EXECUTE 'CREATE POLICY "Sellers can read own articles" ON blog_articles FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin'')
      )';

    EXECUTE 'CREATE POLICY "Sellers can insert own articles" ON blog_articles FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can update own articles" ON blog_articles FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can delete own articles" ON blog_articles FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))';
  END IF;
END $$;

-- =============================================
-- FIX BLOG_OPPORTUNITIES ISOLATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_opportunities') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read opportunities" ON blog_opportunities';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert opportunities" ON blog_opportunities';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update opportunities" ON blog_opportunities';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete opportunities" ON blog_opportunities';

    EXECUTE 'CREATE POLICY "Sellers can read own opportunities" ON blog_opportunities FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin'')
      )';

    EXECUTE 'CREATE POLICY "Sellers can insert own opportunities" ON blog_opportunities FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can update own opportunities" ON blog_opportunities FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can delete own opportunities" ON blog_opportunities FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))';
  END IF;
END $$;

-- =============================================
-- FIX BLOG_CAMPAIGNS ISOLATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_campaigns') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read campaigns" ON blog_campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON blog_campaigns';

    EXECUTE 'CREATE POLICY "Sellers can read own campaigns" ON blog_campaigns FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin'')
      )';

    EXECUTE 'CREATE POLICY "Sellers can insert own campaigns" ON blog_campaigns FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can update own campaigns" ON blog_campaigns FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can delete own campaigns" ON blog_campaigns FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))';
  END IF;
END $$;

-- =============================================
-- FIX SEO_OPPORTUNITIES ISOLATION
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_opportunities') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_auth_all_seo" ON seo_opportunities';

    EXECUTE 'CREATE POLICY "Sellers can read own seo opportunities" ON seo_opportunities FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin'')
      )';

    EXECUTE 'CREATE POLICY "Sellers can insert own seo opportunities" ON seo_opportunities FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can update own seo opportunities" ON seo_opportunities FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can delete own seo opportunities" ON seo_opportunities FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))';
  END IF;
END $$;

-- =============================================
-- FIX CHAT_CONVERSATIONS ISOLATION (if exists)
-- =============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_conversations') THEN
    EXECUTE 'DROP POLICY IF EXISTS "allow_auth_all_chat" ON chat_conversations';

    EXECUTE 'CREATE POLICY "Sellers can read own conversations" ON chat_conversations FOR SELECT
      TO authenticated
      USING (
        seller_id::text = auth.uid()::text OR
        EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin'')
      )';

    EXECUTE 'CREATE POLICY "Sellers can insert own conversations" ON chat_conversations FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can update own conversations" ON chat_conversations FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))
      WITH CHECK (seller_id::text = auth.uid()::text)';

    EXECUTE 'CREATE POLICY "Sellers can delete own conversations" ON chat_conversations FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text OR EXISTS (SELECT 1 FROM sellers WHERE id::text = auth.uid()::text AND role = ''superadmin''))';
  END IF;
END $$;
