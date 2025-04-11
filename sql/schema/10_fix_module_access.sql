-- Fix module access and user references

-- Create a more comprehensive function to get course modules safely
CREATE OR REPLACE FUNCTION get_all_modules_for_courses(p_course_ids UUID[])
RETURNS TABLE (
  id UUID,
  course_id UUID,
  title TEXT,
  description TEXT,
  "order" INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.course_id,
    m.title,
    m.description,
    m."order",
    m.created_at,
    m.updated_at
  FROM 
    modules m
  WHERE 
    m.course_id = ANY(p_course_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced course update function
CREATE OR REPLACE FUNCTION update_course(
  p_course_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_is_published BOOLEAN
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  cover_image_url TEXT,
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
DECLARE
  can_edit BOOLEAN;
BEGIN
  -- Check if user can edit this course (creator or admin)
  SELECT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = p_course_id AND (
      c.created_by = p_user_id OR
      EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND is_admin = true)
    )
  ) INTO can_edit;
  
  IF NOT can_edit THEN
    RAISE EXCEPTION 'Not authorized to edit this course';
  END IF;

  -- Update the course
  UPDATE courses
  SET 
    title = p_title,
    description = p_description,
    is_published = p_is_published,
    updated_at = NOW()
  WHERE id = p_course_id;
  
  -- Return the updated course
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.cover_image_url,
    c.is_published,
    c.created_at,
    c.updated_at,
    c.created_by
  FROM 
    courses c
  WHERE 
    c.id = p_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix security policy for storage
DROP POLICY IF EXISTS "Course materials are viewable by authenticated users" ON storage.objects;
CREATE POLICY "Course materials are viewable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-materials');

-- Make admin policies for modules more robust 
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

-- Fix structural issues for course modules
DROP POLICY IF EXISTS "Modules are viewable if their course is viewable" ON modules;
CREATE POLICY "Modules are viewable if their course is viewable"
ON modules FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = modules.course_id
    AND (
      courses.is_published = true OR 
      courses.created_by = auth.uid()
    )
  )
);

-- Storage policy for admins
DROP POLICY IF EXISTS "Admins can manage any course materials" ON storage.objects;
CREATE POLICY "Admins can manage any course materials"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);
