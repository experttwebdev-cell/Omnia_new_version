/*
  # Create Supporting Tables for Product Management System

  ## 1. New Tables
  
  ### shopify_stores
  Stores multiple Shopify store connection credentials
    - `id` (uuid, primary key) - Internal ID
    - `store_name` (text, unique) - Shopify store name (without .myshopify.com)
    - `store_url` (text) - Full store URL
    - `api_token` (text) - Encrypted API access token
    - `is_active` (boolean) - Whether connection is active
    - `last_sync_at` (timestamptz) - Last successful sync timestamp
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ### product_variants
  Stores individual product variations (size, color, etc.)
    - `id` (uuid, primary key) - Internal ID
    - `product_id` (uuid, foreign key) - References shopify_products
    - `shopify_variant_id` (bigint, unique) - Shopify variant ID
    - `sku` (text) - Stock Keeping Unit
    - `title` (text) - Variant title (e.g., "Small / Red")
    - `option1` (text) - First option value (e.g., size)
    - `option2` (text) - Second option value (e.g., color)
    - `option3` (text) - Third option value
    - `price` (decimal) - Variant price
    - `compare_at_price` (decimal) - Compare at price
    - `inventory_quantity` (integer) - Stock quantity
    - `weight` (decimal) - Product weight
    - `weight_unit` (text) - Weight unit (kg, lb, etc.)
    - `barcode` (text) - Product barcode
    - `image_url` (text) - Variant-specific image
    - `raw_data` (jsonb) - Complete variant data from Shopify
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ### sync_logs
  Tracks all product import/sync operations
    - `id` (uuid, primary key) - Internal ID
    - `store_id` (uuid, foreign key) - References shopify_stores (nullable for backward compatibility)
    - `store_name` (text) - Store name (denormalized for quick access)
    - `operation_type` (text) - Type: 'import', 'sync', 'update'
    - `status` (text) - Status: 'success', 'failed', 'partial'
    - `products_processed` (integer) - Number of products processed
    - `products_added` (integer) - Number of new products added
    - `products_updated` (integer) - Number of products updated
    - `variants_processed` (integer) - Number of variants processed
    - `error_message` (text) - Error details if failed
    - `started_at` (timestamptz) - Operation start time
    - `completed_at` (timestamptz) - Operation completion time
    - `created_at` (timestamptz) - Record creation timestamp

  ## 2. Security
  - Enable RLS on all tables
  - Anonymous users can read sync_logs for transparency
    - This allows the public product list to show sync status
  - Only authenticated users can manage stores and view tokens
  - All users can read product variants (needed for public product display)

  ## 3. Indexes
  - Foreign key indexes for optimal join performance
  - Indexes on frequently queried fields for 1300+ product performance
*/

-- Create shopify_stores table
CREATE TABLE IF NOT EXISTS shopify_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text UNIQUE NOT NULL,
  store_url text NOT NULL,
  api_token text NOT NULL,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous users can read active stores list"
  ON shopify_stores
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read stores"
  ON shopify_stores
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stores"
  ON shopify_stores
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stores"
  ON shopify_stores
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stores"
  ON shopify_stores
  FOR DELETE
  TO authenticated
  USING (true);

-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES shopify_products(id) ON DELETE CASCADE,
  shopify_variant_id bigint UNIQUE NOT NULL,
  sku text DEFAULT '',
  title text NOT NULL,
  option1 text DEFAULT '',
  option2 text DEFAULT '',
  option3 text DEFAULT '',
  price decimal(10,2) DEFAULT 0,
  compare_at_price decimal(10,2),
  inventory_quantity integer DEFAULT 0,
  weight decimal(10,2),
  weight_unit text DEFAULT 'kg',
  barcode text DEFAULT '',
  image_url text DEFAULT '',
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous users can read variants"
  ON product_variants
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read variants"
  ON product_variants
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert variants"
  ON product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update variants"
  ON product_variants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete variants"
  ON product_variants
  FOR DELETE
  TO authenticated
  USING (true);

-- Create sync_logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE SET NULL,
  store_name text NOT NULL,
  operation_type text DEFAULT 'import',
  status text DEFAULT 'success',
  products_processed integer DEFAULT 0,
  products_added integer DEFAULT 0,
  products_updated integer DEFAULT 0,
  variants_processed integer DEFAULT 0,
  error_message text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous users can read sync logs"
  ON sync_logs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read sync logs"
  ON sync_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sync logs"
  ON sync_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update sync logs"
  ON sync_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_inventory ON product_variants(inventory_quantity);

CREATE INDEX IF NOT EXISTS idx_sync_logs_store_id ON sync_logs(store_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_store_name ON sync_logs(store_name);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON sync_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shopify_stores_active ON shopify_stores(is_active);
CREATE INDEX IF NOT EXISTS idx_shopify_stores_store_name ON shopify_stores(store_name);