/*
  # Add Chat Settings to Stores

  1. New Columns
    - `chat_welcome_message` (text) - Message d'accueil personnalisé pour le chat
    - `chat_tone` (text) - Ton du chat : 'professional', 'friendly', 'enthusiastic', 'casual'
    - `chat_response_length` (text) - Longueur des réponses : 'concise', 'balanced', 'detailed'
    - `chat_enabled` (boolean) - Active/désactive le chat
  
  2. Default Values
    - chat_welcome_message: "Bonjour ! Comment puis-je vous aider aujourd'hui ?"
    - chat_tone: 'friendly'
    - chat_response_length: 'balanced'
    - chat_enabled: true
  
  3. Notes
    - Ces paramètres permettent de personnaliser le comportement de l'IA
    - Le ton affecte le style de réponse de DeepSeek
    - La longueur contrôle les max_tokens
*/

DO $$
BEGIN
  -- Add chat_welcome_message if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'chat_welcome_message'
  ) THEN
    ALTER TABLE shopify_stores 
    ADD COLUMN chat_welcome_message text DEFAULT 'Bonjour ! Comment puis-je vous aider aujourd''hui ?';
  END IF;

  -- Add chat_tone if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'chat_tone'
  ) THEN
    ALTER TABLE shopify_stores 
    ADD COLUMN chat_tone text DEFAULT 'friendly';
  END IF;

  -- Add chat_response_length if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'chat_response_length'
  ) THEN
    ALTER TABLE shopify_stores 
    ADD COLUMN chat_response_length text DEFAULT 'balanced';
  END IF;

  -- Add chat_enabled if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shopify_stores' AND column_name = 'chat_enabled'
  ) THEN
    ALTER TABLE shopify_stores 
    ADD COLUMN chat_enabled boolean DEFAULT true;
  END IF;
END $$;
