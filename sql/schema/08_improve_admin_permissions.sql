-- Improved admin permissions to allow full course management

-- MODULE POLICIES
-- Allow admins to view all modules (regardless of course ownership)
DROP POLICY IF EXISTS "Admin users can view all modules" ON modules;
CREATE POLICY "Admin users can view all modules" 
ON modules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to manage (create/update/delete) any modules
DROP POLICY IF EXISTS "Admin users can manage all modules" ON modules;
CREATE POLICY "Admin users can manage all modules" 
ON modules FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- LESSON POLICIES
-- Allow admins to view all lessons
DROP POLICY IF EXISTS "Admin users can view all lessons" ON lessons;
CREATE POLICY "Admin users can view all lessons" 
ON lessons FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow admins to manage (create/update/delete) any lessons
DROP POLICY IF EXISTS "Admin users can manage all lessons" ON lessons;
CREATE POLICY "Admin users can manage all lessons" 
ON lessons FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Fix Course policies to clearly separate SELECT from other operations
-- These policies supersede the ones in 07_fix_security_policies.sql
DROP POLICY IF EXISTS "Admin users can view all courses" ON courses;
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

-- Make sure course update policy for admins works well
DROP POLICY IF EXISTS "Admins can update any course" ON courses;
CREATE POLICY "Admins can update any course" 
ON courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Create a specific policy for admin course inserts
DROP POLICY IF EXISTS "Admins can create any course" ON courses;
CREATE POLICY "Admins can create any course" 
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
