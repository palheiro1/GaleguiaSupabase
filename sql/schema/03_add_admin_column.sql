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

-- Set specific email as admin
UPDATE profiles 
SET is_admin = true 
FROM auth.users
WHERE profiles.id = auth.users.id AND auth.users.email = 'ugioc@riseup.net';
