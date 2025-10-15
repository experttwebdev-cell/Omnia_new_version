/*
  # Fix Campaign Execution Log RLS Policies

  ## Problem
  The campaign_execution_log table has restrictive RLS policies that may
  prevent the edge function from logging execution results.

  ## Solution
  Update the RLS policies to be more permissive.

  ## Changes
  1. Drop existing restrictive policies
  2. Create new permissive policies
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own campaign logs" ON campaign_execution_log;

-- Create new permissive policies

-- Policy: Allow anyone to view logs
CREATE POLICY "Allow public read access to logs"
  ON campaign_execution_log FOR SELECT
  USING (true);

-- Policy: Allow anyone to insert logs
CREATE POLICY "Allow public insert access to logs"
  ON campaign_execution_log FOR INSERT
  WITH CHECK (true);
