/*
  # Create Shopify Products Table

  1. New Tables
    - `shopify_products`
      - `id` (uuid, primary key) - Internal ID
      - `shopify_id` (bigint, unique) - Shopify product ID
      - `title` (text) - Product title
      - `description` (text) - Product description
      - `vendor` (text) - Product vendor
      - `product_type` (text) - Product type
      - `handle` (text) - Product URL handle
      - `status` (text) - Product status (active, draft, archived)
      - `tags` (text) - Product tags
      - `image_url` (text) - Main product image URL
      - `price` (decimal) - Product price
      - `compare_at_price` (decimal) - Compare at price
      - `inventory_quantity` (integer) - Stock quantity
      - `raw_data` (jsonb) - Full product data from Shopify
      - `shop_name` (text) - Store name for tracking
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp
      - `imported_at` (timestamptz) - Import timestamp

  2. Security
    - Enable RLS on `shopify_products` table
    - Add policy for authenticated users to read all products
    - Add policy for authenticated users to insert products
    - Add policy for authenticated users to update products
    - Add policy for authenticated users to delete products

  3. Notes
    - Uses jsonb to store complete product data for flexibility
    - Tracks shop_name to support multiple stores
    - Uses Shopify ID for uniqueness to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS shopify_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_id bigint UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  vendor text DEFAULT '',
  product_type text DEFAULT '',
  handle text DEFAULT '',
  status text DEFAULT 'active',
  tags text DEFAULT '',
  image_url text DEFAULT '',
  price decimal(10,2) DEFAULT 0,
  compare_at_price decimal(10,2),
  inventory_quantity integer DEFAULT 0,
  raw_data jsonb,
  shop_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  imported_at timestamptz DEFAULT now()
);

ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read products"
  ON shopify_products
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON shopify_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON shopify_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON shopify_products
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_shopify_products_shop_name ON shopify_products(shop_name);
CREATE INDEX IF NOT EXISTS idx_shopify_products_status ON shopify_products(status);
CREATE INDEX IF NOT EXISTS idx_shopify_products_imported_at ON shopify_products(imported_at DESC);