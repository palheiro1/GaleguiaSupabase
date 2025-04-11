-- Additional fixes for security policies

-- Drop existing policies that might reference auth.users
DROP POLICY IF EXISTS "Admin users can view all courses" ON courses;

-- Create a safer admin policy that doesn't reference auth.users
CREATE POLICY "Admin users can view all courses" 
ON courses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Make all security policies simpler for profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policy for profiles
DROP POLICY IF EXISTS "Allow users to read profiles" ON profiles;
CREATE POLICY "Allow users to read profiles" 
ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Similarly simplify the courses policy
DROP POLICY IF EXISTS "Published courses are viewable by authenticated users" ON courses;

-- Create a simpler policy without joins
CREATE POLICY "Published courses are viewable by authenticated users"
ON courses FOR SELECT
TO authenticated
USING (
  is_published = true 
  OR created_by = auth.uid()
);
