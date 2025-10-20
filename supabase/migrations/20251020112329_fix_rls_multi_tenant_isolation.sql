/*
  # Fix Multi-Tenant RLS Isolation

  ## Critical Security Fix
  
  This migration removes all permissive RLS policies that allow users to see data from other sellers.
  Each seller should ONLY see their own data based on seller_id = auth.uid().

  ## Changes
  
  1. **blog_articles**
     - Remove all permissive policies (qual:true, with_check:true)
     - Keep only seller_id filtered policies
  
  2. **blog_opportunities**
     - Remove all permissive policies
     - Keep only seller_id filtered policies
  
  3. **chat_conversations**
     - Add seller_id column if missing
     - Add seller_id filtered policies
  
  4. **shopify_stores**
     - Remove anonymous/public permissive policies
     - Keep only seller_id filtered policies
  
  5. **seo_opportunities** (if exists)
     - Add seller_id filtered policies

  ## Security
  
  After this migration, all authenticated users will only see their own data.
  Service role can still manage all data for edge functions.
*/

-- ============================================
-- 1. BLOG ARTICLES - Remove permissive policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can read blog articles" ON blog_articles;
DROP POLICY IF EXISTS "Public can read blog articles" ON blog_articles;
DROP POLICY IF EXISTS "Authenticated can manage blog articles" ON blog_articles;
DROP POLICY IF EXISTS "Authenticated users can create blog articles" ON blog_articles;
DROP POLICY IF EXISTS "Authenticated users can update blog articles" ON blog_articles;
DROP POLICY IF EXISTS "Anonymous users can create blog articles" ON blog_articles;
DROP POLICY IF EXISTS "allow_anon_delete" ON blog_articles;
DROP POLICY IF EXISTS "allow_auth_delete" ON blog_articles;

-- Add seller_id column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_articles' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE blog_articles ADD COLUMN seller_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create proper seller-isolated policies
CREATE POLICY "Sellers can read own blog articles"
  ON blog_articles FOR SELECT
  TO authenticated
  USING (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can insert own blog articles"
  ON blog_articles FOR INSERT
  TO authenticated
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can update own blog articles"
  ON blog_articles FOR UPDATE
  TO authenticated
  USING (seller_id::text = auth.uid()::text)
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can delete own blog articles"
  ON blog_articles FOR DELETE
  TO authenticated
  USING (seller_id::text = auth.uid()::text);

-- ============================================
-- 2. BLOG OPPORTUNITIES - Remove permissive policies
-- ============================================

DROP POLICY IF EXISTS "Anyone can read blog opportunities" ON blog_opportunities;
DROP POLICY IF EXISTS "Public can read opportunities" ON blog_opportunities;
DROP POLICY IF EXISTS "Authenticated can manage opportunities" ON blog_opportunities;
DROP POLICY IF EXISTS "Authenticated users can create blog opportunities" ON blog_opportunities;
DROP POLICY IF EXISTS "Authenticated users can update blog opportunities" ON blog_opportunities;
DROP POLICY IF EXISTS "Anonymous users can create blog opportunities" ON blog_opportunities;
DROP POLICY IF EXISTS "allow_auth_delete" ON blog_opportunities;

-- Keep existing seller_id policies (they're correct)
-- Sellers can read/insert/update/delete own opportunities (already exist)

-- ============================================
-- 3. CHAT CONVERSATIONS - Add seller isolation
-- ============================================

DROP POLICY IF EXISTS "Anyone can view conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can insert conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can update conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Anyone can delete conversations" ON chat_conversations;

-- Add seller_id if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chat_conversations' AND column_name = 'seller_id'
  ) THEN
    ALTER TABLE chat_conversations ADD COLUMN seller_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create seller-isolated policies
CREATE POLICY "Sellers can read own chat conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can insert own chat conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can update own chat conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (seller_id::text = auth.uid()::text)
  WITH CHECK (seller_id::text = auth.uid()::text);

CREATE POLICY "Sellers can delete own chat conversations"
  ON chat_conversations FOR DELETE
  TO authenticated
  USING (seller_id::text = auth.uid()::text);

-- ============================================
-- 4. SHOPIFY STORES - Remove permissive anonymous/public
-- ============================================

DROP POLICY IF EXISTS "Anonymous users can read active stores list" ON shopify_stores;
DROP POLICY IF EXISTS "Anonymous users can insert stores" ON shopify_stores;
DROP POLICY IF EXISTS "Anonymous users can update stores" ON shopify_stores;
DROP POLICY IF EXISTS "Anonymous users can delete stores" ON shopify_stores;
DROP POLICY IF EXISTS "Public can read active stores" ON shopify_stores;
DROP POLICY IF EXISTS "Authenticated can manage stores" ON shopify_stores;
DROP POLICY IF EXISTS "Authenticated users can read stores" ON shopify_stores;
DROP POLICY IF EXISTS "Authenticated users can insert stores" ON shopify_stores;
DROP POLICY IF EXISTS "Authenticated users can update stores" ON shopify_stores;
DROP POLICY IF EXISTS "Authenticated users can delete stores" ON shopify_stores;

-- Keep only seller_id policies (already exist):
-- Sellers can read/insert/update/delete own stores

-- ============================================
-- 5. SEO OPPORTUNITIES - Add if exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'seo_opportunities') THEN
    -- Drop any permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can read seo opportunities" ON seo_opportunities';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can manage opportunities" ON seo_opportunities';
    
    -- Add seller_id if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'seo_opportunities' AND column_name = 'seller_id'
    ) THEN
      EXECUTE 'ALTER TABLE seo_opportunities ADD COLUMN seller_id uuid REFERENCES auth.users(id)';
    END IF;
    
    -- Create seller-isolated policies
    EXECUTE 'CREATE POLICY "Sellers can read own seo opportunities"
      ON seo_opportunities FOR SELECT
      TO authenticated
      USING (seller_id::text = auth.uid()::text)';
      
    EXECUTE 'CREATE POLICY "Sellers can insert own seo opportunities"
      ON seo_opportunities FOR INSERT
      TO authenticated
      WITH CHECK (seller_id::text = auth.uid()::text)';
      
    EXECUTE 'CREATE POLICY "Sellers can update own seo opportunities"
      ON seo_opportunities FOR UPDATE
      TO authenticated
      USING (seller_id::text = auth.uid()::text)
      WITH CHECK (seller_id::text = auth.uid()::text)';
      
    EXECUTE 'CREATE POLICY "Sellers can delete own seo opportunities"
      ON seo_opportunities FOR DELETE
      TO authenticated
      USING (seller_id::text = auth.uid()::text)';
  END IF;
END $$;

-- ============================================
-- 6. SERVICE ROLE - Keep for edge functions
-- ============================================

-- Service role policies remain for edge functions (already exist in previous migrations)
