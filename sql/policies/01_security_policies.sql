-- Galeguia Security Policies
-- IMPORTANT: Execute this in your Supabase SQL Editor after creating the tables

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "Published courses are viewable by authenticated users" ON courses;
DROP POLICY IF EXISTS "Published courses are viewable by authenticated users or admin" ON courses;
DROP POLICY IF EXISTS "Course creators can update their own courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Course creators can delete their own courses" ON courses;
DROP POLICY IF EXISTS "Modules are viewable if their course is viewable" ON modules;
DROP POLICY IF EXISTS "Course creators can manage their modules" ON modules;
DROP POLICY IF EXISTS "Lessons are viewable if their module is viewable" ON lessons;
DROP POLICY IF EXISTS "Course creators can manage their lessons" ON lessons;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can enroll themselves in published courses" ON enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view their own progress" ON progress;
DROP POLICY IF EXISTS "Users can insert their own progress if enrolled" ON progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON progress;

-- Profiles Policies
-- Any authenticated user can view all profiles
CREATE POLICY "Profiles are viewable by authenticated users"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Users can only update their own profiles
CREATE POLICY "Users can update their own profiles"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users can only insert their own profiles
CREATE POLICY "Users can insert their own profiles"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Courses Policies
-- Drop the problematic policy
DROP POLICY IF EXISTS "Published courses are viewable by authenticated users or admin" ON courses;

-- Replace with a simpler policy that doesn't try to access auth.users
CREATE POLICY "Published courses are viewable by authenticated users"
ON courses FOR SELECT
TO authenticated
USING (
  is_published = true 
  OR auth.uid() = created_by
);

-- Add a new policy for admin users that must be updated by a database function
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

-- Course creators can update their own courses
CREATE POLICY "Course creators can update their own courses"
ON courses FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Authenticated users can create courses
CREATE POLICY "Authenticated users can create courses"
ON courses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Course creators can delete their own courses
CREATE POLICY "Course creators can delete their own courses"
ON courses FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Add a new policy allowing admins to update any course
CREATE POLICY "Admins can update any course"
ON courses FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add a new policy allowing admins to delete any course
CREATE POLICY "Admins can delete any course"
ON courses FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Modules Policies
-- Modules are viewable if their parent course is viewable
CREATE POLICY "Modules are viewable if their course is viewable"
ON modules FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = modules.course_id
        AND (courses.is_published = true OR courses.created_by = auth.uid())
    )
);

-- Course creators can manage modules in their courses
CREATE POLICY "Course creators can manage their modules"
ON modules FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = modules.course_id
        AND courses.created_by = auth.uid()
    )
);

-- Lessons Policies
-- Lessons are viewable if their parent module is viewable
CREATE POLICY "Lessons are viewable if their module is viewable"
ON lessons FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM modules
        JOIN courses ON courses.id = modules.course_id
        WHERE modules.id = lessons.module_id
        AND (courses.is_published = true OR courses.created_by = auth.uid())
    )
);

-- Course creators can manage lessons in their courses
CREATE POLICY "Course creators can manage their lessons"
ON lessons FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM modules
        JOIN courses ON courses.id = modules.course_id
        WHERE modules.id = lessons.module_id
        AND courses.created_by = auth.uid()
    )
);

-- Enrollments Policies
-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments"
ON enrollments FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can enroll themselves in published courses
CREATE POLICY "Users can enroll themselves in published courses"
ON enrollments FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM courses
        WHERE courses.id = enrollments.course_id
        AND courses.is_published = true
    )
);

-- Users can delete their own enrollments
CREATE POLICY "Users can delete their own enrollments"
ON enrollments FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Progress Policies
-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
ON progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert/update their own progress if enrolled in the course
CREATE POLICY "Users can insert their own progress if enrolled"
ON progress FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM lessons
        JOIN modules ON modules.id = lessons.module_id
        JOIN courses ON courses.id = modules.course_id
        JOIN enrollments ON enrollments.course_id = courses.id
        WHERE lessons.id = progress.lesson_id
        AND enrollments.user_id = auth.uid()
    )
);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
ON progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
