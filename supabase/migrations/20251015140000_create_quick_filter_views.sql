/*
  # Quick Filter Views for Product Management

  ## Overview
  This migration creates optimized views and materialized views to support
  quick filtering tabs in the product management interface. These views allow
  instant access to products needing attention (no ALT text, no tags, etc.).

  ## Views Created

  ### products_without_alt_text_view
  - Products that have images without ALT text
  - Used for quick filtering in SEO Alt Image tab

  ### products_without_tags_view
  - Products without any tags
  - Used for quick filtering in SEO Tags tab

  ### products_by_optimization_status_view
  - Products grouped by SEO optimization status
  - Provides quick counts for filtering tabs

  ### images_by_alt_status_view
  - Images grouped by ALT text status
  - Provides quick counts for image management

  ## Benefits
  - Instant access to products/images needing work
  - Pre-computed counts for filter tab badges
  - Optimized indexes for fast queries
  - Supports concurrent refresh without blocking
*/

-- ============================================================================
-- SECTION 1: DROP EXISTING VIEWS
-- ============================================================================

DROP VIEW IF EXISTS products_without_alt_text_view CASCADE;
DROP VIEW IF EXISTS products_without_tags_view CASCADE;
DROP VIEW IF EXISTS products_by_optimization_status_view CASCADE;
DROP VIEW IF EXISTS images_by_alt_status_view CASCADE;
DROP MATERIALIZED VIEW IF EXISTS quick_filter_stats_cache CASCADE;

-- ============================================================================
-- SECTION 2: PRODUCTS WITHOUT ALT TEXT VIEW
-- ============================================================================

CREATE VIEW products_without_alt_text_view AS
SELECT DISTINCT
  p.id,
  p.title,
  p.vendor,
  p.image_url,
  p.category,
  p.sub_category,
  p.shop_name,
  p.imported_at,
  COUNT(pi.id) as total_images,
  COUNT(pi.id) FILTER (WHERE pi.alt_text IS NULL OR pi.alt_text = '') as images_without_alt
FROM shopify_products p
INNER JOIN product_images pi ON p.id = pi.product_id
WHERE pi.alt_text IS NULL OR pi.alt_text = ''
GROUP BY p.id, p.title, p.vendor, p.image_url, p.category, p.sub_category, p.shop_name, p.imported_at
ORDER BY p.imported_at DESC;

COMMENT ON VIEW products_without_alt_text_view IS
'Products with at least one image missing ALT text. Used for quick filtering.';

-- ============================================================================
-- SECTION 3: PRODUCTS WITHOUT TAGS VIEW
-- ============================================================================

CREATE VIEW products_without_tags_view AS
SELECT
  id,
  title,
  vendor,
  image_url,
  category,
  sub_category,
  product_type,
  shop_name,
  enrichment_status,
  seo_synced_to_shopify,
  imported_at
FROM shopify_products
WHERE tags IS NULL OR tags = ''
ORDER BY imported_at DESC;

COMMENT ON VIEW products_without_tags_view IS
'Products without tags. Used for quick filtering in SEO Tags page.';

-- ============================================================================
-- SECTION 4: PRODUCTS BY OPTIMIZATION STATUS VIEW
-- ============================================================================

CREATE VIEW products_by_optimization_status_view AS
SELECT
  id,
  title,
  vendor,
  image_url,
  category,
  sub_category,
  seo_title,
  seo_description,
  enrichment_status,
  seo_synced_to_shopify,
  imported_at,
  CASE
    WHEN enrichment_status = 'enriched' AND seo_synced_to_shopify = true THEN 'synced'
    WHEN enrichment_status = 'enriched' AND seo_synced_to_shopify = false THEN 'pending_sync'
    WHEN seo_title IS NULL AND seo_description IS NULL THEN 'not_optimized'
    WHEN enrichment_status = 'pending' THEN 'pending_enrichment'
    WHEN enrichment_status = 'failed' THEN 'failed'
    ELSE 'partial'
  END as optimization_status
FROM shopify_products
ORDER BY imported_at DESC;

COMMENT ON VIEW products_by_optimization_status_view IS
'Products with computed optimization status for quick filtering.';

-- ============================================================================
-- SECTION 5: IMAGES BY ALT STATUS VIEW
-- ============================================================================

CREATE VIEW images_by_alt_status_view AS
SELECT
  pi.id,
  pi.product_id,
  pi.src,
  pi.position,
  pi.alt_text,
  pi.created_at,
  p.title as product_title,
  p.shop_name,
  CASE
    WHEN pi.alt_text IS NOT NULL AND pi.alt_text != '' THEN 'has_alt'
    ELSE 'needs_alt'
  END as alt_status
FROM product_images pi
INNER JOIN shopify_products p ON pi.product_id = p.id
ORDER BY p.imported_at DESC, pi.position ASC;

COMMENT ON VIEW images_by_alt_status_view IS
'All product images with their ALT text status for quick filtering.';

-- ============================================================================
-- SECTION 6: MATERIALIZED VIEW FOR QUICK STATS
-- ============================================================================

CREATE MATERIALIZED VIEW quick_filter_stats_cache AS
SELECT
  -- Products without ALT text stats
  (SELECT COUNT(DISTINCT product_id) FROM product_images WHERE alt_text IS NULL OR alt_text = '') as products_without_alt_count,
  (SELECT COUNT(*) FROM product_images WHERE alt_text IS NULL OR alt_text = '') as images_without_alt_count,

  -- Products without tags stats
  (SELECT COUNT(*) FROM shopify_products WHERE tags IS NULL OR tags = '') as products_without_tags_count,

  -- Products by optimization status
  (SELECT COUNT(*) FROM shopify_products WHERE enrichment_status = 'enriched' AND seo_synced_to_shopify = true) as products_synced_count,
  (SELECT COUNT(*) FROM shopify_products WHERE enrichment_status = 'enriched' AND seo_synced_to_shopify = false) as products_pending_sync_count,
  (SELECT COUNT(*) FROM shopify_products WHERE seo_title IS NULL AND seo_description IS NULL) as products_not_optimized_count,
  (SELECT COUNT(*) FROM shopify_products WHERE enrichment_status = 'pending') as products_pending_enrichment_count,
  (SELECT COUNT(*) FROM shopify_products WHERE enrichment_status = 'failed') as products_failed_enrichment_count,

  -- Images stats
  (SELECT COUNT(*) FROM product_images) as total_images_count,
  (SELECT COUNT(*) FROM product_images WHERE alt_text IS NOT NULL AND alt_text != '') as images_with_alt_count,

  -- Tags stats
  (SELECT COUNT(*) FROM shopify_products WHERE tags IS NOT NULL AND tags != '') as products_with_tags_count,
  (SELECT COUNT(*) FROM shopify_products WHERE tags IS NOT NULL AND tags != '' AND seo_synced_to_shopify = false) as products_tags_pending_sync_count,

  -- Timestamp
  now() as cached_at;

CREATE UNIQUE INDEX idx_quick_filter_stats_cached_at ON quick_filter_stats_cache(cached_at);

COMMENT ON MATERIALIZED VIEW quick_filter_stats_cache IS
'Pre-computed counts for all quick filter tabs. Refreshed automatically.';

-- ============================================================================
-- SECTION 7: REFRESH FUNCTION FOR QUICK FILTER STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_quick_filter_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY quick_filter_stats_cache;
  RAISE NOTICE 'Quick filter stats refreshed at %', now();
END;
$$;

COMMENT ON FUNCTION refresh_quick_filter_stats IS
'Refreshes the quick filter statistics cache. Can be called manually or by Edge Function.';

-- ============================================================================
-- SECTION 8: PERFORMANCE INDEXES
-- ============================================================================

-- Index for products without tags filtering
CREATE INDEX IF NOT EXISTS idx_products_tags_null
ON shopify_products(id, imported_at)
WHERE tags IS NULL OR tags = '';

-- Index for images without alt text
CREATE INDEX IF NOT EXISTS idx_images_alt_null
ON product_images(product_id, id, position)
WHERE alt_text IS NULL OR alt_text = '';

-- Index for optimization status filtering
CREATE INDEX IF NOT EXISTS idx_products_optimization_status
ON shopify_products(enrichment_status, seo_synced_to_shopify, seo_title, seo_description);

-- ============================================================================
-- SECTION 9: INITIAL REFRESH
-- ============================================================================

SELECT refresh_quick_filter_stats();

-- ============================================================================
-- SECTION 10: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON products_without_alt_text_view TO anon, authenticated;
GRANT SELECT ON products_without_tags_view TO anon, authenticated;
GRANT SELECT ON products_by_optimization_status_view TO anon, authenticated;
GRANT SELECT ON images_by_alt_status_view TO anon, authenticated;
GRANT SELECT ON quick_filter_stats_cache TO anon, authenticated;
GRANT EXECUTE ON FUNCTION refresh_quick_filter_stats() TO authenticated;
