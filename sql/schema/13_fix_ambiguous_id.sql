-- Fix ambiguous 'id' column references in SQL functions

-- Fix the admin_update_course function
CREATE OR REPLACE FUNCTION admin_update_course(
  p_course_id UUID,
  p_title TEXT,
  p_description TEXT, 
  p_is_published BOOLEAN,
  p_admin_id UUID
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
BEGIN
  -- Check if user is admin - explicitly specify 'profiles.id'
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = p_admin_id 
    AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;

  -- Update the course - explicitly specify 'courses.id'
  UPDATE courses
  SET
    title = p_title,
    description = p_description,
    is_published = p_is_published,
    updated_at = NOW()
  WHERE 
    courses.id = p_course_id;

  -- Return updated course
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

-- Fix the update_course function to avoid ambiguous id references
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
  -- Check if user can edit this course (creator or admin) - fixed ambiguous id
  SELECT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = p_course_id AND (
      c.created_by = p_user_id OR
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = p_user_id AND p.is_admin = true)
    )
  ) INTO can_edit;
  
  IF NOT can_edit THEN
    RAISE EXCEPTION 'Not authorized to edit this course';
  END IF;

  -- Update the course - fixed ambiguous id
  UPDATE courses
  SET 
    title = p_title,
    description = p_description,
    is_published = p_is_published,
    updated_at = NOW()
  WHERE courses.id = p_course_id;
  
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
