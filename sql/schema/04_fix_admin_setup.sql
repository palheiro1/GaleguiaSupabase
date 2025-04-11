-- Fix admin user setup

-- Make sure is_admin column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END
$$;

-- Drop the problematic function that references auth.users
DROP FUNCTION IF EXISTS admin_set_admin_user(TEXT);

-- Instead, directly set the admin flag for a specific user ID
-- You need to know the UUID of the admin user
-- This UUID should be the ID of the user with email 'ugioc@riseup.net'
-- Please replace 'YOUR-ADMIN-UUID-HERE' with the actual UUID

-- You can find this UUID by querying profiles in the Table Editor in Supabase dashboard
UPDATE profiles SET is_admin = true WHERE id = '03ba673b-dba8-482e-bb84-5d151115e7d6';

-- Also update any other RLS-related issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
