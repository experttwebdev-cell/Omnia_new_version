/*
  # Chat Conversations Persistence

  1. New Tables
    - `chat_conversations`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key to shopify_stores)
      - `session_id` (text, unique identifier for the session)
      - `started_at` (timestamptz, when the conversation started)
      - `last_message_at` (timestamptz, last message timestamp)
      - `message_count` (integer, number of messages)
      - `metadata` (jsonb, additional info like user agent, etc.)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to chat_conversations)
      - `role` (text, 'user' or 'assistant')
      - `content` (text, message content)
      - `products` (jsonb, array of products shown)
      - `mode` (text, 'conversation' or 'product_show')
      - `search_filters` (jsonb, search filters used)
      - `sector` (text, detected sector)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated access
    - Allow public read for demo purposes

  3. Indexes
    - Index on conversation_id for fast message lookup
    - Index on session_id for conversation retrieval
    - Index on store_id for analytics
*/

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES shopify_stores(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  message_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  products jsonb DEFAULT '[]'::jsonb,
  mode text DEFAULT 'conversation',
  search_filters jsonb,
  sector text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_store ON chat_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_last_message ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Enable RLS
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_conversations (allow public read/write for demo)
CREATE POLICY "Allow public read conversations"
  ON chat_conversations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert conversations"
  ON chat_conversations FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update conversations"
  ON chat_conversations FOR UPDATE
  TO anon
  USING (true);

-- Policies for chat_messages (allow public read/write for demo)
CREATE POLICY "Allow public read messages"
  ON chat_messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert messages"
  ON chat_messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policies for authenticated users
CREATE POLICY "Authenticated users can read all conversations"
  ON chat_conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert conversations"
  ON chat_conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversations"
  ON chat_conversations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read all messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to update last_message_at and message_count
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_conversations
  SET 
    last_message_at = NEW.created_at,
    message_count = message_count + 1,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation stats
DROP TRIGGER IF EXISTS trigger_update_conversation_stats ON chat_messages;
CREATE TRIGGER trigger_update_conversation_stats
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();
