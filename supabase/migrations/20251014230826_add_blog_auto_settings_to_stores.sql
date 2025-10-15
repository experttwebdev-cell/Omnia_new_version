/*
  # Add Blog Auto Writer Settings to Stores

  1. Changes
    - Add `blog_auto_settings` JSONB column to `shopify_stores` table
    - This will store the AI Blog Auto Writer configuration including:
      - Generation mode (manual/automatic)
      - Frequency settings (daily, weekly, monthly, etc.)
      - Content settings (word count, format, language)
      - Internal linking preferences
      - Auto-publish settings
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'blog_auto_settings'
  ) THEN
    ALTER TABLE shopify_stores ADD COLUMN blog_auto_settings JSONB DEFAULT '{
      "mode": "automatic",
      "frequency": "daily",
      "schedule_hour": 9,
      "word_count_min": 700,
      "word_count_max": 900,
      "output_format": "html",
      "language": "fr",
      "auto_publish": false,
      "internal_linking": true,
      "max_internal_links": 5
    }'::JSONB;
  END IF;
END $$;
