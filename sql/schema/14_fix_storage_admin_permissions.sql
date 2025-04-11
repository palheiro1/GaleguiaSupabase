-- Fix storage permissions to allow admin users to upload files

-- First, drop existing policies if they conflict
DROP POLICY IF EXISTS "Course creators can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Course creators can update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Course creators can delete course materials" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage any course materials" ON storage.objects;

-- Allow course creators to upload course materials
CREATE POLICY "Course creators can upload course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials' AND
  (
    -- Either the user is the course creator
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[2] 
      AND courses.created_by = auth.uid()
    )
    OR
    -- Or the user is an admin
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
);

-- Allow course creators or admins to update course materials
CREATE POLICY "Course creators or admins can update course materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[2]
      AND courses.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
)
WITH CHECK (
  bucket_id = 'course-materials' AND
  (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[2]
      AND courses.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
);

-- Allow course creators or admins to delete course materials
CREATE POLICY "Course creators or admins can delete course materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id::text = (storage.foldername(name))[2]
      AND courses.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
);

-- Create a comprehensive admin policy for all storage operations
CREATE POLICY "Admin users have full access to all course materials"
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
