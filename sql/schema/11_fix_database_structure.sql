-- Fix the database structure to eliminate auth.users dependency issues

-- Create new intermediary tables to avoid direct auth.users references
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  last_position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Function to help move progress data to the new structure
CREATE OR REPLACE FUNCTION copy_progress_data()
RETURNS void AS $$
BEGIN
  -- Copy data from old progress table to new one
  INSERT INTO user_progress (user_id, lesson_id, completed, completed_at, last_position, created_at, updated_at)
  SELECT user_id, lesson_id, completed, completed_at, last_position, created_at, updated_at
  FROM progress
  ON CONFLICT (user_id, lesson_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create user_enrollments table
CREATE TABLE IF NOT EXISTS user_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Function to help move enrollment data to the new structure
CREATE OR REPLACE FUNCTION copy_enrollment_data()
RETURNS void AS $$
BEGIN
  -- Copy data from old enrollments table to new one
  INSERT INTO user_enrollments (user_id, course_id, enrolled_at)
  SELECT user_id, course_id, enrolled_at
  FROM enrollments
  ON CONFLICT (user_id, course_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create a foundation for a comprehensive solution (will require data migration)
CREATE OR REPLACE FUNCTION get_course_with_modules_and_lessons(
  p_course_id UUID, 
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_course JSONB;
  v_modules JSONB;
BEGIN
  -- Get course data
  SELECT jsonb_build_object(
    'id', c.id,
    'title', c.title,
    'description', c.description,
    'cover_image_url', c.cover_image_url,
    'is_published', c.is_published,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'created_by', c.created_by
  ) INTO v_course
  FROM courses c
  WHERE c.id = p_course_id
  AND (
    c.is_published = true OR 
    c.created_by = p_user_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND is_admin = true)
  );

  IF v_course IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get modules with lessons
  SELECT jsonb_agg(module_with_lessons)
  INTO v_modules
  FROM (
    SELECT 
      jsonb_build_object(
        'id', m.id,
        'title', m.title,
        'description', m.description,
        'order', m."order",
        'lessons', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', l.id,
                'title', l.title,
                'type', l.type,
                'content', l.content,
                'video_url', l.video_url,
                'order', l."order"
              )
              ORDER BY l."order"
            )
            FROM lessons l
            WHERE l.module_id = m.id
          ),
          '[]'::jsonb
        )
      ) AS module_with_lessons
    FROM modules m
    WHERE m.course_id = p_course_id
    ORDER BY m."order"
  ) subq;

  -- Add modules to course
  v_course = v_course || jsonb_build_object('modules', COALESCE(v_modules, '[]'::jsonb));
  
  RETURN v_course;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
