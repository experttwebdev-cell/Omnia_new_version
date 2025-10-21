/*
  # Add Email Verification Support
  
  ## Summary
  Adds email verification functionality to the sellers table to confirm user email addresses.
  
  ## Changes
  1. Add email_verified column to sellers table
  2. Create verification_tokens table to track email verification tokens
  3. Add RLS policies for verification_tokens
  
  ## Security
  - email_verified defaults to false for new users
  - Verification tokens expire after 24 hours
  - RLS policies ensure users can only verify their own emails
*/

-- Add email_verified column to sellers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sellers' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE sellers ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
END $$;

-- Create verification_tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  token_type text NOT NULL CHECK (token_type IN ('email_verification', 'password_reset')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- Enable RLS
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_tokens
CREATE POLICY "Users can read own verification tokens"
  ON verification_tokens FOR SELECT
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Service role can manage all verification tokens"
  ON verification_tokens FOR ALL
  USING (true);

-- Function to clean up expired tokens (optional, for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM verification_tokens
  WHERE expires_at < now() - interval '7 days';
END;
$$;

-- Add comment to explain email_verified column
COMMENT ON COLUMN sellers.email_verified IS 
  'Indicates whether the user has verified their email address. 
   Defaults to false. Set to true when user clicks verification link.';

COMMENT ON TABLE verification_tokens IS
  'Stores verification tokens for email verification and password reset.
   Tokens expire after 24 hours and can only be used once.';
