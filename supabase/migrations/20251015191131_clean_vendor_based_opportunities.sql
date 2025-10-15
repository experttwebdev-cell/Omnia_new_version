/*
  # Clean Vendor-Based Opportunities from Database

  1. Purpose
    - Remove all SEO opportunities that were generated based on vendor/brand names
    - Clean up opportunities with titles or keywords containing vendor/brand information
    - This cleanup is necessary after removing vendor-based opportunity generation from the codebase
  
  2. Changes
    - Delete blog opportunities that appear to be vendor-focused (e.g., "CALEN : Produits Phares et Avis")
    - Remove opportunities where title contains common vendor patterns
    - Clean up opportunities of type 'product-spotlight' that were vendor-based
  
  3. Notes
    - This is a one-time cleanup migration
    - Future opportunity generation will focus only on categories, product titles, and features
    - Legitimate product-spotlight opportunities based on categories will be preserved
*/

-- Delete opportunities that appear to be vendor-based
-- Pattern: Single word in all caps followed by colon and "Produits Phares et Avis" or similar
DELETE FROM blog_opportunities
WHERE title ~ '^[A-Z]{3,}\s*:.*Produits.*Avis'
   OR title ~ '^[A-Z]{3,}.*Brand Spotlight'
   OR title ~ '^[A-Z]{3,}.*Produits Phares';

-- Clean up any remaining opportunities that might be vendor-focused
-- Look for opportunities with very generic brand-like names in target keywords
DELETE FROM blog_opportunities
WHERE type = 'product-spotlight'
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements_text(target_keywords) AS keyword
    WHERE keyword ~ '^[a-z]{4,12}\s+(produits|products|avis|review)$'
      AND keyword NOT IN ('mobilier produits', 'meubles produits', 'furniture products', 'home products')
  );

-- Log the cleanup
DO $$
DECLARE
  deleted_count integer;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Vendor-based opportunities cleanup completed. Rows affected: %', deleted_count;
END $$;
