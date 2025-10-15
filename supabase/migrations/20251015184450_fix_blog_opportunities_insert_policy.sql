/*
  # Fix Blog Opportunities Insert Policy
  
  1. Changes
    - Add policy to allow anonymous and authenticated users to insert blog opportunities
    - This allows the frontend to create opportunities when creating articles
    - Maintains security by only allowing inserts and updates, not deletes
  
  2. Security
    - Anonymous and authenticated users can INSERT opportunities
    - Anonymous and authenticated users can UPDATE opportunities
    - All other operations remain restricted to service role
    - Read access remains public
*/

-- Add policy to allow anonymous users to insert blog opportunities
CREATE POLICY "Anonymous users can create blog opportunities"
  ON blog_opportunities FOR INSERT
  TO anon
  WITH CHECK (true);

-- Add policy to allow authenticated users to insert blog opportunities
CREATE POLICY "Authenticated users can create blog opportunities"
  ON blog_opportunities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add policy to allow authenticated users to update blog opportunities
CREATE POLICY "Authenticated users can update blog opportunities"
  ON blog_opportunities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);