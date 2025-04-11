-- Complete fix for auth.users permission issues

-- Step 1: Create replacement tables with profile references instead of auth.users
-- This is a more thorough approach than the previous fixes

-- Create user_enrollments table (completely replacing enrollments)
DROP TABLE IF EXISTS user_enrollments CASCADE;
CREATE TABLE user_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create user_progress table (completely replacing progress)
DROP TABLE IF EXISTS user_progress CASCADE;
CREATE TABLE user_progress (
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

-- Step 2: Create necessary indexes for new tables
CREATE INDEX idx_user_enrollments_user_id ON user_enrollments(user_id);
CREATE INDEX idx_user_enrollments_course_id ON user_enrollments(course_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson_id ON user_progress(lesson_id);

-- Step 3: Migrate data from old tables to new ones (if they exist)
DO $$
BEGIN
  -- Check if old tables exist and migrate data
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    INSERT INTO user_enrollments (user_id, course_id, enrolled_at)
    SELECT user_id, course_id, enrolled_at FROM enrollments
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'progress') THEN
    INSERT INTO user_progress (user_id, lesson_id, completed, completed_at, last_position, created_at, updated_at)
    SELECT user_id, lesson_id, completed, completed_at, last_position, created_at, updated_at FROM progress
    ON CONFLICT (user_id, lesson_id) DO NOTHING;
  END IF;
END
$$;

-- Step 4: Apply security policies to new tables
ALTER TABLE user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- User enrollments policies
CREATE POLICY "Users can view their own enrollments" 
ON user_enrollments FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can enroll themselves in published courses" 
ON user_enrollments FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_id
    AND courses.is_published = true
  )
);

CREATE POLICY "Users can delete their own enrollments" 
ON user_enrollments FOR DELETE 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all enrollments"
ON user_enrollments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- User progress policies
CREATE POLICY "Users can view their own progress" 
ON user_progress FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress" 
ON user_progress FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" 
ON user_progress FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all progress"
ON user_progress FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Step 5: Create or replace module functions to avoid any auth.users references
CREATE OR REPLACE FUNCTION get_modules_by_course_id(p_course_id UUID)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle course updates without auth.users references
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
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = p_admin_id 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;

  -- Update the course
  UPDATE courses
  SET
    title = p_title,
    description = p_description,
    is_published = p_is_published,
    updated_at = NOW()
  WHERE 
    id = p_course_id;

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
