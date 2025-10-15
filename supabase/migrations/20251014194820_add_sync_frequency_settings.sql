/*
  # Add Auto/Manual Sync Frequency Settings to Stores

  ## Changes
  
  1. New Columns to shopify_stores
    - `sync_mode` (text) - Mode: 'manual' or 'auto'
    - `sync_frequency` (text) - Frequency: 'hourly', 'daily', 'weekly', 'monthly'
    - `sync_hour` (integer) - Hour of day for daily sync (0-23)
    - `sync_day` (integer) - Day of week for weekly sync (0-6, 0=Sunday)
    - `sync_date` (integer) - Day of month for monthly sync (1-31)
    - `next_sync_at` (timestamptz) - Next scheduled sync time
    
  ## Purpose
  Allows users to configure automatic product syncing at specified intervals
  or keep manual-only syncing for full control.
*/

-- Add sync frequency columns to shopify_stores
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_stores' AND column_name = 'sync_mode'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN sync_mode text DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_stores' AND column_name = 'sync_frequency'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN sync_frequency text DEFAULT 'daily';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_stores' AND column_name = 'sync_hour'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN sync_hour integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_stores' AND column_name = 'sync_day'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN sync_day integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_stores' AND column_name = 'sync_date'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN sync_date integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shopify_stores' AND column_name = 'next_sync_at'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN next_sync_at timestamptz;
  END IF;
END $$;