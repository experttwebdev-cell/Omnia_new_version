/*
  # Add store_id column to shopify_products table

  ## 1. Changes
  - Add `store_id` column to link products to their source store
  - Foreign key references shopify_stores(id)
  - SET NULL on delete to preserve products even if store connection is removed
  - Nullable to support existing products that don't have a store_id yet

  ## 2. Indexes
  - Create index on store_id for filtering products by store

  ## 3. Notes
  - Existing products will have NULL store_id (backward compatible)
  - New imports will include store_id for proper tracking
  - Allows filtering and managing products by store
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN store_id uuid REFERENCES shopify_stores(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_shopify_products_store_id ON shopify_products(store_id);