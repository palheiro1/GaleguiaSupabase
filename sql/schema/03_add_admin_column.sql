-- Add is_admin column to profiles table

-- First check if the column already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_admin column to profiles table';
  ELSE
    RAISE NOTICE 'is_admin column already exists in profiles table';
  END IF;
END
$$;

-- Create a function to set a user as admin (needs to be run as superuser)
CREATE OR REPLACE FUNCTION admin_set_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- This function should be executed with an account that has sufficient privileges
  UPDATE profiles
  SET is_admin = true
  WHERE id IN (
    SELECT id FROM auth.users WHERE email = admin_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function (this still requires proper permissions)
SELECT admin_set_admin_user('ugioc@riseup.net');

-- Alternatively, if you know the user ID, you can directly update without joining:
-- UPDATE profiles SET is_admin = true WHERE id = 'specific-user-id-here';
