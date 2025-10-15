/*
  # Fix RLS for All Blog Tables

  1. Changes
    - Fix blog_articles RLS
    - Fix blog_opportunities RLS
    - Fix blog_campaigns RLS
    - Allow anonymous read, authenticated write
*/

-- Blog Articles
DROP POLICY IF EXISTS "allow_anon_select" ON blog_articles;
DROP POLICY IF EXISTS "allow_auth_select" ON blog_articles;
DROP POLICY IF EXISTS "allow_auth_insert" ON blog_articles;
DROP POLICY IF EXISTS "allow_auth_update" ON blog_articles;
DROP POLICY IF EXISTS "allow_auth_delete" ON blog_articles;

CREATE POLICY "allow_anon_select" ON blog_articles FOR SELECT TO anon USING (true);
CREATE POLICY "allow_auth_select" ON blog_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_insert" ON blog_articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_update" ON blog_articles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_delete" ON blog_articles FOR DELETE TO authenticated USING (true);

-- Blog Opportunities
DROP POLICY IF EXISTS "allow_anon_select" ON blog_opportunities;
DROP POLICY IF EXISTS "allow_auth_select" ON blog_opportunities;
DROP POLICY IF EXISTS "allow_auth_insert" ON blog_opportunities;
DROP POLICY IF EXISTS "allow_auth_update" ON blog_opportunities;
DROP POLICY IF EXISTS "allow_auth_delete" ON blog_opportunities;

CREATE POLICY "allow_anon_select" ON blog_opportunities FOR SELECT TO anon USING (true);
CREATE POLICY "allow_auth_select" ON blog_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_insert" ON blog_opportunities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_update" ON blog_opportunities FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_delete" ON blog_opportunities FOR DELETE TO authenticated USING (true);

-- Blog Campaigns
DROP POLICY IF EXISTS "allow_anon_select" ON blog_campaigns;
DROP POLICY IF EXISTS "allow_auth_select" ON blog_campaigns;
DROP POLICY IF EXISTS "allow_auth_insert" ON blog_campaigns;
DROP POLICY IF EXISTS "allow_auth_update" ON blog_campaigns;
DROP POLICY IF EXISTS "allow_auth_delete" ON blog_campaigns;

CREATE POLICY "allow_anon_select" ON blog_campaigns FOR SELECT TO anon USING (true);
CREATE POLICY "allow_auth_select" ON blog_campaigns FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_insert" ON blog_campaigns FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_update" ON blog_campaigns FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_delete" ON blog_campaigns FOR DELETE TO authenticated USING (true);

-- Shopify Stores
DROP POLICY IF EXISTS "allow_anon_select" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_select" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_insert" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_update" ON shopify_stores;
DROP POLICY IF EXISTS "allow_auth_delete" ON shopify_stores;

CREATE POLICY "allow_anon_select" ON shopify_stores FOR SELECT TO anon USING (true);
CREATE POLICY "allow_auth_select" ON shopify_stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "allow_auth_insert" ON shopify_stores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "allow_auth_update" ON shopify_stores FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_auth_delete" ON shopify_stores FOR DELETE TO authenticated USING (true);
