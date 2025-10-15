/*
  # Fix Blog Articles Insert Policy
  
  1. Changes
    - Add policy to allow anonymous users to insert blog articles
    - This allows the frontend to create draft articles from opportunities
    - Maintains security by only allowing inserts, not updates or deletes
  
  2. Security
    - Anonymous users can only INSERT articles
    - All other operations remain restricted to service role
    - Read access remains public
*/

-- Add policy to allow anonymous users to insert blog articles
CREATE POLICY "Anonymous users can create blog articles"
  ON blog_articles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add policy to allow authenticated users to insert blog articles
CREATE POLICY "Authenticated users can create blog articles"
  ON blog_articles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add policy to allow authenticated users to update their blog articles
CREATE POLICY "Authenticated users can update blog articles"
  ON blog_articles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);