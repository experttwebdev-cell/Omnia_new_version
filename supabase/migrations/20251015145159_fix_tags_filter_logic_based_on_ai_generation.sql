/*
  # Fix Tags Filter Logic - Based on AI Generation

  1. Problem
    - Current logic: "Sans tags" = tags IS NULL, "Avec tags" = tags IS NOT NULL
    - Should be: "Sans tags" = NOT enriched by AI, "Avec tags" = enriched by AI
    - This causes incorrect counts: 570 products show "Avec tags" just because they have any tags

  2. Solution
    - Change tag_status logic to check enrichment_status instead of just tags field
    - "Sans tags" should mean: not enriched OR (enriched but no tags generated)
    - "Avec tags" should mean: enriched AND has tags from AI

  3. Changes
    - Drop and recreate tags_tab_cache with corrected logic
    - Tag status priority:
      * 'synced' - enriched AND synced to Shopify
      * 'pending_sync' - enriched AND not synced
      * 'has_tags' - enriched AND has tags (but sync status unclear)
      * 'no_tags' - NOT enriched OR no tags
*/

-- Drop existing view
DROP MATERIALIZED VIEW IF EXISTS tags_tab_cache CASCADE;

-- Recreate with AI-based logic
CREATE MATERIALIZED VIEW tags_tab_cache AS
SELECT
  p.id,
  p.title,
  p.vendor,
  p.image_url,
  p.category,
  p.sub_category,
  p.tags,
  p.enrichment_status,
  p.seo_synced_to_shopify,
  p.last_seo_sync_at,
  p.imported_at,
  
  -- CORRECTED: Tag status based on AI enrichment
  CASE
    WHEN p.enrichment_status = 'enriched' AND p.seo_synced_to_shopify = true THEN 'synced'
    WHEN p.enrichment_status = 'enriched' AND p.seo_synced_to_shopify = false THEN 'pending_sync'
    WHEN p.enrichment_status = 'enriched' AND p.tags IS NOT NULL AND p.tags != '' THEN 'has_tags'
    ELSE 'no_tags'
  END as tag_status,
  
  -- Tag statistics
  CASE
    WHEN p.tags IS NOT NULL AND p.tags != '' 
    THEN array_length(string_to_array(p.tags, ','), 1)
    ELSE 0
  END as tag_count,
  
  -- Cache metadata
  now() as cached_at

FROM shopify_products p
ORDER BY p.imported_at DESC NULLS LAST;

-- Recreate indexes
CREATE UNIQUE INDEX idx_tags_cache_id ON tags_tab_cache(id);
CREATE INDEX idx_tags_cache_status ON tags_tab_cache(tag_status);
CREATE INDEX idx_tags_cache_sync ON tags_tab_cache(seo_synced_to_shopify, tag_count);
CREATE INDEX idx_tags_cache_no_tags ON tags_tab_cache(id) WHERE tag_status = 'no_tags';
CREATE INDEX idx_tags_cache_enrichment ON tags_tab_cache(enrichment_status, tag_status);
CREATE INDEX idx_tags_cache_imported ON tags_tab_cache(imported_at DESC NULLS LAST);

COMMENT ON MATERIALIZED VIEW tags_tab_cache IS
'Optimized cache for Tags tab. Tag status based on AI enrichment, not just tag presence. Updated logic: no_tags = not enriched, has_tags/pending_sync/synced = enriched.';
