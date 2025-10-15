-- Performance Optimization Testing Script
-- Run this in Supabase SQL Editor to verify all views and caches

-- ============================================================================
-- 1. Test All Views Return Data
-- ============================================================================

\echo 'Testing fast_dashboard_cache...'
SELECT 'fast_dashboard_cache' as view_name,
       total_products,
       enriched_products,
       synced_products,
       cached_at,
       EXTRACT(EPOCH FROM (now() - cached_at)) as cache_age_seconds
FROM fast_dashboard_cache;

\echo 'Testing dashboard_stats_view...'
SELECT 'dashboard_stats_view' as view_name,
       total_products,
       enriched_products,
       synced_products
FROM dashboard_stats_view;

\echo 'Testing fast_products_view...'
SELECT 'fast_products_view' as view_name,
       COUNT(*) as total_rows,
       COUNT(*) FILTER (WHERE enrichment_status = 'enriched') as enriched_count
FROM fast_products_view;

\echo 'Testing product_type_statistics_cache...'
SELECT * FROM product_type_statistics_cache LIMIT 5;

\echo 'Testing seo_optimization_summary_view...'
SELECT * FROM seo_optimization_summary_view;

\echo 'Testing blog_content_stats_view...'
SELECT * FROM blog_content_stats_view;

\echo 'Testing product_categories_view...'
SELECT * FROM product_categories_view LIMIT 5;

\echo 'Testing recent_sync_logs_view...'
SELECT COUNT(*) as sync_log_count FROM recent_sync_logs_view;

-- ============================================================================
-- 2. Check Cache Freshness
-- ============================================================================

\echo ''
\echo 'Cache Status:'
SELECT
  cache_name,
  last_refresh,
  ROUND(seconds_old::numeric, 2) as age_seconds,
  freshness_status,
  CASE
    WHEN freshness_status = 'fresh' THEN '✓ OK'
    WHEN freshness_status = 'stale' THEN '⚠ Consider refresh'
    ELSE '✗ Needs refresh'
  END as recommendation
FROM cache_status_view
ORDER BY seconds_old DESC;

-- ============================================================================
-- 3. Performance Benchmark
-- ============================================================================

\echo ''
\echo 'Performance Benchmark:'
\echo 'Timing cached query (fast_dashboard_cache)...'
\timing on
SELECT * FROM fast_dashboard_cache;
\timing off

\echo 'Timing non-cached aggregation (dashboard_stats_view)...'
\timing on
SELECT * FROM dashboard_stats_view;
\timing off

-- ============================================================================
-- 4. Index Usage Check
-- ============================================================================

\echo ''
\echo 'Checking if indexes are being used...'
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as times_used,
  idx_tup_read as rows_read,
  idx_tup_fetch as rows_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('shopify_products', 'blog_articles', 'sync_logs')
  AND idx_scan > 0
ORDER BY idx_scan DESC
LIMIT 10;

-- ============================================================================
-- 5. Manual Cache Refresh Test
-- ============================================================================

\echo ''
\echo 'Testing manual cache refresh...'
SELECT refresh_all_caches();

\echo ''
\echo 'Verifying cache was refreshed:'
SELECT
  cache_name,
  ROUND(seconds_old::numeric, 2) as age_seconds,
  freshness_status
FROM cache_status_view;

-- ============================================================================
-- 6. View Permissions Check
-- ============================================================================

\echo ''
\echo 'Checking view permissions...'
SELECT
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN (
    'fast_dashboard_cache',
    'fast_products_view',
    'dashboard_stats_view',
    'seo_optimization_summary_view',
    'blog_content_stats_view'
  )
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- ============================================================================
-- Summary Report
-- ============================================================================

\echo ''
\echo '============================================'
\echo 'Performance Optimization Summary'
\echo '============================================'

SELECT
  (SELECT COUNT(*) FROM shopify_products) as total_products,
  (SELECT COUNT(*) FROM fast_products_view) as view_accessible_products,
  (SELECT total_products FROM fast_dashboard_cache) as cached_products,
  (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'shopify_products') as indexes_on_products,
  (SELECT COUNT(*) FROM pg_matviews WHERE schemaname = 'public') as materialized_views,
  (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public' AND viewname LIKE '%_view') as regular_views;

\echo ''
\echo 'All tests completed!'
\echo 'If all queries returned data without errors, optimization is working correctly.'
