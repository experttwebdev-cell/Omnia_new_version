/*
  # Update product type statistics to use category

  ## Changes
  - Recreate `product_type_statistics_cache` materialized view to use `category` field instead of `product_type`
  - Update index to use category field
  - This provides better product grouping by category in the dashboard
  
  ## Notes
  - View is recreated with DROP and CREATE to ensure clean state
  - Concurrent refresh is maintained with unique index
  - Initial refresh is performed automatically
*/

-- Drop existing view and index
DROP MATERIALIZED VIEW IF EXISTS product_type_statistics_cache CASCADE;

-- Recreate view using category instead of product_type
CREATE MATERIALIZED VIEW product_type_statistics_cache AS
SELECT 
  category as product_type,
  COUNT(*) as product_count,
  COUNT(*) FILTER (WHERE enrichment_status = 'enriched') as enriched_count,
  COUNT(*) FILTER (WHERE seo_synced_to_shopify = true) as synced_count,
  ROUND(AVG(price), 2) as avg_price,
  SUM(inventory_quantity) as total_inventory
FROM shopify_products
WHERE category IS NOT NULL
GROUP BY category
ORDER BY product_count DESC
LIMIT 10;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_product_type_stats_type ON product_type_statistics_cache(product_type);

COMMENT ON MATERIALIZED VIEW product_type_statistics_cache IS 
'Top 10 product categories with statistics. Used for dashboard breakdown. Refreshed every 30 minutes.';

-- Grant permissions
GRANT SELECT ON product_type_statistics_cache TO anon, authenticated;

-- Initial refresh
REFRESH MATERIALIZED VIEW product_type_statistics_cache;
