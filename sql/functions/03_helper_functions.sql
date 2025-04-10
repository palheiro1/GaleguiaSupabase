-- Galeguia Helper Functions
-- IMPORTANT: Execute this in your Supabase SQL Editor

-- Function to check if a user is enrolled in the course that contains a specific lesson
CREATE OR REPLACE FUNCTION is_user_enrolled_in_lesson(p_user_id UUID, p_lesson_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  enrolled BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM enrollments e
    JOIN modules m ON e.course_id = m.course_id
    JOIN lessons l ON m.id = l.module_id
    WHERE 
      l.id = p_lesson_id AND
      e.user_id = p_user_id
  ) INTO enrolled;
  
  RETURN enrolled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all courses with progress for a specific user
CREATE OR REPLACE FUNCTION get_user_courses_with_progress(p_user_id UUID)
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  course_description TEXT,
  cover_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  progress_percentage FLOAT,
  total_lessons INT,
  completed_lessons INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.title as course_title,
    c.description as course_description,
    c.cover_image_url,
    c.created_at,
    COALESCE(
      (SELECT get_course_completion(c.id, p_user_id)),
      0
    ) as progress_percentage,
    (
      SELECT COUNT(*)::INT
      FROM lessons l
      JOIN modules m ON m.id = l.module_id
      WHERE m.course_id = c.id
    ) as total_lessons,
    (
      SELECT COUNT(*)::INT
      FROM progress p
      JOIN lessons l ON l.id = p.lesson_id
      JOIN modules m ON m.id = l.module_id
      WHERE 
        m.course_id = c.id AND
        p.user_id = p_user_id AND
        p.completed = true
    ) as completed_lessons
  FROM 
    courses c
  JOIN 
    enrollments e ON c.id = e.course_id
  WHERE 
    e.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get the next lesson to watch/read for a user in a course
CREATE OR REPLACE FUNCTION get_next_lesson_for_user(p_user_id UUID, p_course_id UUID)
RETURNS TABLE (
  lesson_id UUID,
  lesson_title TEXT,
  module_id UUID,
  module_title TEXT,
  lesson_type TEXT,
  video_url TEXT,
  content TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH completed_lessons AS (
    SELECT lesson_id
    FROM progress
    WHERE user_id = p_user_id AND completed = true
  ),
  all_lessons AS (
    SELECT 
      l.id,
      l.title,
      l.module_id,
      m.title as module_title,
      l.type,
      l.video_url,
      l.content,
      m."order" as module_order,
      l."order" as lesson_order
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.course_id = p_course_id
    ORDER BY m."order", l."order"
  )
  SELECT 
    al.id as lesson_id,
    al.title as lesson_title,
    al.module_id,
    al.module_title,
    al.type as lesson_type,
    al.video_url,
    al.content
  FROM all_lessons al
  WHERE al.id NOT IN (SELECT lesson_id FROM completed_lessons)
  ORDER BY al.module_order, al.lesson_order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
