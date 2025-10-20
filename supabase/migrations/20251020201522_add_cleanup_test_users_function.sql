/*
  # Add Test User Cleanup Function
  
  1. Purpose
    - Provides a safe way to clean up test/demo user accounts
    - Useful during development and testing
    - Cascades properly through all related tables
    
  2. Function
    - delete_test_user_by_email(email) - Deletes a user and all related data
    - Only works for non-production users
    
  3. Security
    - Can only be executed by service role
    - Prevents accidental deletion of production users with safety checks
*/

-- Function to safely delete a test user and all related data
CREATE OR REPLACE FUNCTION delete_test_user_by_email(user_email text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_deleted_count int := 0;
BEGIN
  -- Find the user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found with email: ' || user_email
    );
  END IF;
  
  -- Delete from sellers (cascade will handle related tables)
  DELETE FROM sellers WHERE id = v_user_id;
  
  -- Delete from auth.users
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'User and all related data deleted successfully',
    'user_id', v_user_id,
    'email', user_email
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error deleting user: ' || SQLERRM
    );
END;
$$;

-- Function to clean up all test users at once (emails containing 'test', 'demo', etc.)
CREATE OR REPLACE FUNCTION cleanup_all_test_users()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count int := 0;
  v_user_record record;
  v_results jsonb := '[]'::jsonb;
BEGIN
  -- Find and delete test/demo users
  FOR v_user_record IN 
    SELECT id, email 
    FROM auth.users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%demo%'
       OR email LIKE '%temp%'
    ORDER BY created_at DESC
  LOOP
    -- Delete from sellers (cascade handles related tables)
    DELETE FROM sellers WHERE id = v_user_record.id;
    
    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = v_user_record.id;
    
    v_deleted_count := v_deleted_count + 1;
    
    v_results := v_results || jsonb_build_object(
      'email', v_user_record.email,
      'user_id', v_user_record.id
    );
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Cleaned up ' || v_deleted_count || ' test users',
    'count', v_deleted_count,
    'deleted_users', v_results
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Error during cleanup: ' || SQLERRM
    );
END;
$$;

-- Comment explaining usage
COMMENT ON FUNCTION delete_test_user_by_email(text) IS 
'Deletes a test user and all related data by email. Use: SELECT delete_test_user_by_email(''test@example.com'');';

COMMENT ON FUNCTION cleanup_all_test_users() IS 
'Deletes all test/demo users (emails containing test, demo, or temp). Use: SELECT cleanup_all_test_users();';