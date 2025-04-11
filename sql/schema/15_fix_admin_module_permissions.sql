-- Fix module and course creation permissions for admins

-- First, check for any functions that might reference auth.users directly
-- Drop and recreate them using references to profiles instead

-- Drop existing module-related functions if they exist
DROP FUNCTION IF EXISTS create_module(uuid, uuid, text, text, integer);
DROP FUNCTION IF EXISTS update_module(uuid, uuid, text, text, integer);

-- Create safer function for module creation that avoids auth.users references
CREATE OR REPLACE FUNCTION create_module(
  p_user_id UUID,
  p_course_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_order INTEGER DEFAULT NULL
) RETURNS SETOF modules AS $$
DECLARE
  v_max_order INTEGER;
  v_is_admin BOOLEAN;
  v_is_creator BOOLEAN;
BEGIN
  -- Check if user is admin
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = p_user_id;
  
  -- Check if user is the course creator
  SELECT (created_by = p_user_id) INTO v_is_creator FROM courses WHERE id = p_course_id;
  
  -- Only allow if user is admin or course creator
  IF v_is_admin = true OR v_is_creator = true THEN
    -- Handle order
    IF p_order IS NULL THEN
      SELECT COALESCE(MAX("order") + 1, 1) INTO v_max_order FROM modules WHERE course_id = p_course_id;
    ELSE
      v_max_order := p_order;
    END IF;

    -- Insert the module
    RETURN QUERY
    INSERT INTO modules (course_id, title, description, "order", created_at, updated_at)
    VALUES (p_course_id, p_title, p_description, v_max_order, NOW(), NOW())
    RETURNING *;
  ELSE
    RAISE EXCEPTION 'Permission denied: User is neither admin nor course creator';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure module policies are correctly set up for admins
-- Drop and recreate the admin module policies for clarity
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

-- Ensure the module insertion policy is properly configured
DROP POLICY IF EXISTS "Course creators can insert modules" ON modules;
CREATE POLICY "Course creators can insert modules" 
ON modules FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = modules.course_id
    AND courses.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Update module RLS to make sure it's enabled
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Create a specific trigger function for modules that avoids auth.users references
CREATE OR REPLACE FUNCTION handle_module_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp for any updates
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS set_modules_timestamps ON modules;
CREATE TRIGGER set_modules_timestamps
BEFORE UPDATE ON modules
FOR EACH ROW
EXECUTE FUNCTION handle_module_operations();

-- FIX COURSE CREATION FOR ADMINS

-- Drop existing course-related functions if they reference auth.users
DROP FUNCTION IF EXISTS create_course(uuid, text, text, boolean);
DROP FUNCTION IF EXISTS update_course(uuid, uuid, text, text, boolean);

-- Create safer function for course creation that avoids auth.users references
CREATE OR REPLACE FUNCTION create_course(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_is_published BOOLEAN DEFAULT false
) RETURNS SETOF courses AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if user is admin (no reference to auth.users)
  SELECT is_admin INTO v_is_admin FROM profiles WHERE id = p_user_id;
  
  -- Insert the course
  RETURN QUERY
  INSERT INTO courses (
    title, 
    description, 
    is_published, 
    created_by, 
    created_at, 
    updated_at
  )
  VALUES (
    p_title, 
    p_description, 
    p_is_published, 
    p_user_id, 
    NOW(), 
    NOW()
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure course policies are correctly set up for admins
-- Ensure the course insertion policy is properly configured
DROP POLICY IF EXISTS "Users can create courses" ON courses;
CREATE POLICY "Users can create courses" 
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by 
  OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

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

-- Create a specific trigger function for courses that avoids auth.users references
CREATE OR REPLACE FUNCTION handle_course_operations()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp for any updates
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the trigger
DROP TRIGGER IF EXISTS set_courses_timestamps ON courses;
CREATE TRIGGER set_courses_timestamps
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION handle_course_operations();
