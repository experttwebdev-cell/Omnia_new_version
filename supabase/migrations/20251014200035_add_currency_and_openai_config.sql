/*
  # Add currency support and OpenAI configuration

  1. Schema Changes
    - Add `currency` column to `shopify_products` table (default: 'USD')
    - Add `currency` column to `product_variants` table (default: 'USD')
    - Add `currency` column to `shopify_stores` table (default: 'USD')
    - Add `openai_api_key` column to a new `app_settings` table for secure storage

  2. New Tables
    - `app_settings`
      - `id` (uuid, primary key)
      - `key` (text, unique) - Setting key name
      - `value` (text) - Setting value (encrypted for sensitive data)
      - `is_encrypted` (boolean) - Whether the value is encrypted
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  3. Security
    - Enable RLS on `app_settings` table
    - Add policies for service role only access to sensitive settings

  4. Data Migration
    - Update existing records to have USD as default currency
*/

-- Add currency column to shopify_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_products' AND column_name = 'currency'
  ) THEN
    ALTER TABLE shopify_products ADD COLUMN currency text DEFAULT 'USD';
    
    -- Update existing records
    UPDATE shopify_products SET currency = 'USD' WHERE currency IS NULL;
  END IF;
END $$;

-- Add currency column to product_variants
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variants' AND column_name = 'currency'
  ) THEN
    ALTER TABLE product_variants ADD COLUMN currency text DEFAULT 'USD';
    
    -- Update existing records
    UPDATE product_variants SET currency = 'USD' WHERE currency IS NULL;
  END IF;
END $$;

-- Add currency column to shopify_stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'currency'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN currency text DEFAULT 'USD';
    
    -- Update existing records
    UPDATE shopify_stores SET currency = 'USD' WHERE currency IS NULL;
  END IF;
END $$;

-- Create app_settings table for configuration
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  description text DEFAULT '',
  is_encrypted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage all settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert OpenAI API key as initial setting (this will be updated via edge function)
INSERT INTO app_settings (key, value, description, is_encrypted)
VALUES ('openai_api_key', '', 'OpenAI API key for AI features', true)
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Create updated_at trigger for app_settings
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_app_settings_timestamp'
  ) THEN
    CREATE TRIGGER update_app_settings_timestamp
      BEFORE UPDATE ON app_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_app_settings_updated_at();
  END IF;
END $$;
