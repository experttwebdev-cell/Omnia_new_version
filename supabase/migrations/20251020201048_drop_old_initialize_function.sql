/*
  # Drop Old Initialize Function
  
  1. Problem
    - initialize_seller_usage function still references s.subscription_plan_id
    - This column doesn't exist anymore
    - We already have create_subscription_usage_for_new_seller doing this job
    
  2. Solution
    - Drop the old function and its trigger
    - The new function already handles everything correctly
*/

-- Drop the old function and any triggers using it
DROP TRIGGER IF EXISTS initialize_usage_on_seller_insert ON sellers;
DROP FUNCTION IF EXISTS initialize_seller_usage() CASCADE;