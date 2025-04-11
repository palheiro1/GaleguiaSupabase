-- Galeguia Storage Setup
-- IMPORTANT: Execute these commands in your Supabase SQL Editor 
-- after creating the tables and before setting up Storage buckets in the Supabase dashboard

-- Enable the Storage extension (should already be enabled by default in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- SQL helper to setup Supabase storage buckets and policies
-- Note: You can also create these via the Supabase Dashboard under Storage

-- 1. Create storage buckets
-- You'll need to create these buckets in the Supabase Dashboard:
-- - 'avatars' - for user profile pictures
-- - 'course-materials' - for course-related files (images, videos, etc.)

-- 2. First drop existing policies if they exist
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Course materials are viewable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Course creators can upload course materials" ON storage.objects;
DROP POLICY IF EXISTS "Course creators can update course materials" ON storage.objects;
DROP POLICY IF EXISTS "Course creators can delete course materials" ON storage.objects;

-- 3. Create new policies

-- Avatars bucket policies
-- Allow users to view their own and others' avatars (public)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Course materials bucket policies
-- Allow authenticated users to view course materials
CREATE POLICY "Course materials are viewable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'course-materials');

-- Allow course creators to upload course materials
CREATE POLICY "Course creators can upload course materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id::text = (storage.foldername(name))[2] -- Assuming path is course_covers/{courseId}/...
    AND courses.created_by = auth.uid()
  )
);

-- Allow course creators to update course materials
CREATE POLICY "Course creators can update course materials"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id::text = (storage.foldername(name))[2] -- Assuming path is course_covers/{courseId}/...
    AND courses.created_by = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id::text = (storage.foldername(name))[2] -- Assuming path is course_covers/{courseId}/...
    AND courses.created_by = auth.uid()
  )
);

-- Allow course creators to delete course materials
CREATE POLICY "Course creators can delete course materials"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials' AND
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id::text = (storage.foldername(name))[2] -- Assuming path is course_covers/{courseId}/...
    AND courses.created_by = auth.uid()
  )
);
