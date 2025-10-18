/*
  # Ajouter les paramètres d'interface du Chat IA

  1. Nouvelles colonnes dans `shopify_stores`
    - `chat_enabled` (boolean) - Active/désactive le chat IA
    - `chat_welcome_message` (text) - Message d'accueil personnalisé
    - `chat_tone` (text) - Ton de conversation (amical, professionnel, décontracté)
    - `chat_response_length` (text) - Longueur des réponses (court, équilibré, détaillé)

  2. Sécurité
    - Pas de changement RLS nécessaire (colonnes ajoutées à table existante)
*/

-- Ajouter les colonnes de paramètres UI du chat
ALTER TABLE shopify_stores
  ADD COLUMN IF NOT EXISTS chat_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS chat_welcome_message text DEFAULT 'Bonjour ! Comment puis-je vous aider aujourd''hui ?',
  ADD COLUMN IF NOT EXISTS chat_tone text DEFAULT 'amical',
  ADD COLUMN IF NOT EXISTS chat_response_length text DEFAULT 'equilibre';

-- Ajouter un commentaire sur les colonnes
COMMENT ON COLUMN shopify_stores.chat_enabled IS 'Active ou désactive le chat IA sur le site';
COMMENT ON COLUMN shopify_stores.chat_welcome_message IS 'Message d''accueil affiché aux visiteurs';
COMMENT ON COLUMN shopify_stores.chat_tone IS 'Ton de conversation: amical, professionnel, decontracte';
COMMENT ON COLUMN shopify_stores.chat_response_length IS 'Longueur des réponses: court, equilibre, detaille';
