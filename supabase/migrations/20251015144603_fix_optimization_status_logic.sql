/*
  # Fix SEO Optimization Status Logic

  1. Problem
    - The CASE statement in seo_optimization_tab_cache has incorrect priority
    - Products with seo_title/seo_description are marked as 'optimized' even if they're pending sync
    - This causes incorrect counts in the statistics

  2. Solution
    - Reorder the CASE statement to check sync status first
    - Priority: synced > pending_sync > optimized > not_optimized
    
  3. Changes
    - Drop and recreate seo_optimization_tab_cache with correct logic
    - Maintain all indexes and performance optimizations
*/

-- Drop existing view
DROP MATERIALIZED VIEW IF EXISTS seo_optimization_tab_cache CASCADE;

-- Recreate with correct status logic
CREATE MATERIALIZED VIEW seo_optimization_tab_cache AS
SELECT
  p.id,
  p.title,
  p.vendor,
  p.image_url,
  p.category,
  p.sub_category,
  p.seo_title,
  p.seo_description,
  p.enrichment_status,
  p.seo_synced_to_shopify,
  p.last_seo_sync_at,
  p.imported_at,
  
  -- CORRECTED: Check sync status first, then optimization
  CASE
    WHEN p.enrichment_status = 'enriched' AND p.seo_synced_to_shopify = true THEN 'synced'
    WHEN p.enrichment_status = 'enriched' AND p.seo_synced_to_shopify = false THEN 'pending_sync'
    WHEN p.seo_title IS NOT NULL AND p.seo_description IS NOT NULL THEN 'optimized'
    ELSE 'not_optimized'
  END as optimization_status,
  
  -- SEO quality indicators
  LENGTH(p.seo_title) as seo_title_length,
  LENGTH(p.seo_description) as seo_description_length,
  (LENGTH(p.seo_title) BETWEEN 50 AND 70) as title_optimal_length,
  (LENGTH(p.seo_description) BETWEEN 150 AND 160) as description_optimal_length,
  
  -- Timestamps for cache management
  p.last_enriched_at,
  now() as cached_at

FROM shopify_products p
ORDER BY p.imported_at DESC NULLS LAST;

-- Recreate indexes
CREATE UNIQUE INDEX idx_seo_opt_cache_id ON seo_optimization_tab_cache(id);
CREATE INDEX idx_seo_opt_cache_status ON seo_optimization_tab_cache(optimization_status);
CREATE INDEX idx_seo_opt_cache_enrichment ON seo_optimization_tab_cache(enrichment_status, seo_synced_to_shopify);
CREATE INDEX idx_seo_opt_cache_category ON seo_optimization_tab_cache(category, sub_category) WHERE category IS NOT NULL;
CREATE INDEX idx_seo_opt_cache_imported ON seo_optimization_tab_cache(imported_at DESC NULLS LAST);

COMMENT ON MATERIALIZED VIEW seo_optimization_tab_cache IS
'Optimized cache for SEO Optimization tab. Refreshed every 10 minutes via cron. Fixed status logic: synced > pending_sync > optimized > not_optimized';
