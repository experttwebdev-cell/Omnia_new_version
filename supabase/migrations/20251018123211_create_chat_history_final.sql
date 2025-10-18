/*
  # Create Chat History Table

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to shopify_stores)
      - `title` (text) - Auto-generated title from first message
      - `messages` (jsonb) - Array of messages with role, content, timestamp
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `message_count` (integer) - Number of messages in conversation
      - `last_message_at` (timestamptz) - Timestamp of last message
      - `is_pinned` (boolean) - Whether conversation is pinned
      - `tags` (text[]) - Array of tags for categorization

  2. Security
    - Enable RLS on `chat_conversations` table
    - Add policy for anonymous users to read/write their conversations

  3. Indexes
    - Index on store_id for fast lookups
    - Index on created_at for sorting
    - Index on last_message_at for recent conversations
*/

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS chat_conversations CASCADE;

-- Create chat_conversations table
CREATE TABLE chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nouvelle Conversation',
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  message_count integer DEFAULT 0,
  last_message_at timestamptz DEFAULT now(),
  is_pinned boolean DEFAULT false,
  tags text[] DEFAULT ARRAY[]::text[]
);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous access
CREATE POLICY "Anyone can view conversations"
  ON chat_conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert conversations"
  ON chat_conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update conversations"
  ON chat_conversations FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete conversations"
  ON chat_conversations FOR DELETE
  TO anon, authenticated
  USING (true);

-- Indexes for performance
CREATE INDEX idx_chat_conversations_store_id 
  ON chat_conversations(store_id);

CREATE INDEX idx_chat_conversations_created_at 
  ON chat_conversations(created_at DESC);

CREATE INDEX idx_chat_conversations_last_message_at 
  ON chat_conversations(last_message_at DESC);

CREATE INDEX idx_chat_conversations_pinned 
  ON chat_conversations(is_pinned, last_message_at DESC) 
  WHERE is_pinned = true;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_chat_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_chat_conversations_timestamp
  BEFORE UPDATE ON chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_conversation_timestamp();

-- Comments
COMMENT ON TABLE chat_conversations IS 'Stores AI chat conversation history';
COMMENT ON COLUMN chat_conversations.messages IS 'JSONB array of message objects';
COMMENT ON COLUMN chat_conversations.title IS 'Conversation title';
COMMENT ON COLUMN chat_conversations.message_count IS 'Cached message count';
COMMENT ON COLUMN chat_conversations.is_pinned IS 'Pinned conversations';
