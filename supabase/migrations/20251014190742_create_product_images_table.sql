/*
  # Create Product Images Table

  ## 1. New Tables
  
  ### product_images
  Stores all images for each product (not just the first one)
    - `id` (uuid, primary key) - Internal ID
    - `product_id` (uuid, foreign key) - References shopify_products
    - `shopify_image_id` (bigint, unique) - Shopify image ID
    - `src` (text) - Image URL
    - `position` (integer) - Sort order (1 = primary image)
    - `alt_text` (text) - Alternative text for accessibility
    - `width` (integer) - Image width in pixels
    - `height` (integer) - Image height in pixels
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Record update timestamp

  ## 2. Security
  - Enable RLS on product_images table
  - Anonymous users can read all images (needed for public product display)
  - Authenticated users have full CRUD access for management

  ## 3. Indexes
  - Foreign key index on product_id for optimal join performance
  - Index on position for sorted queries
  - Unique index on shopify_image_id to prevent duplicates

  ## 4. Notes
  - Position field allows proper ordering of images (main image = position 1)
  - Stores complete image metadata from Shopify API
  - ON DELETE CASCADE ensures images are removed when product is deleted
*/

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES shopify_products(id) ON DELETE CASCADE,
  shopify_image_id bigint UNIQUE NOT NULL,
  src text NOT NULL,
  position integer DEFAULT 1,
  alt_text text DEFAULT '',
  width integer,
  height integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous users can read images"
  ON product_images
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read images"
  ON product_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert images"
  ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update images"
  ON product_images
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete images"
  ON product_images
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON product_images(position);
CREATE INDEX IF NOT EXISTS idx_product_images_shopify_id ON product_images(shopify_image_id);