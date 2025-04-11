-- Helper functions for admin course management

-- Function to get a specific course securely
CREATE OR REPLACE FUNCTION get_course_by_id(p_course_id UUID, p_user_id UUID)
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
    c.id = p_course_id AND
    (
      c.is_published = true OR 
      c.created_by = p_user_id OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = p_user_id AND p.is_admin = true
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get modules for a course securely
CREATE OR REPLACE FUNCTION get_course_modules(p_course_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  course_id UUID,
  "order" INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Check if user has access to this course
  IF EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = p_course_id AND
    (
      c.is_published = true OR 
      c.created_by = p_user_id OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = p_user_id AND p.is_admin = true
      )
    )
  ) THEN
    RETURN QUERY
    SELECT 
      m.id,
      m.title,
      m.description,
      m.course_id,
      m."order",
      m.created_at,
      m.updated_at
    FROM 
      modules m
    WHERE 
      m.course_id = p_course_id
    ORDER BY 
      m."order";
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get lessons for a module securely
CREATE OR REPLACE FUNCTION get_module_lessons(p_module_id UUID, p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  video_url TEXT,
  duration INTEGER,
  module_id UUID,
  "order" INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
DECLARE
  v_course_id UUID;
BEGIN
  -- Get the course_id for this module
  SELECT course_id INTO v_course_id FROM modules WHERE id = p_module_id;
  
  -- Check if user has access to this course
  IF EXISTS (
    SELECT 1 FROM courses c 
    WHERE c.id = v_course_id AND
    (
      c.is_published = true OR 
      c.created_by = p_user_id OR
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = p_user_id AND p.is_admin = true
      )
    )
  ) THEN
    RETURN QUERY
    SELECT 
      l.id,
      l.title,
      l.content,
      l.type,
      l.video_url,
      l.duration,
      l.module_id,
      l."order",
      l.created_at,
      l.updated_at
    FROM 
      lessons l
    WHERE 
      l.module_id = p_module_id
    ORDER BY 
      l."order";
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
