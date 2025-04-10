-- Galeguia Auth Functions
-- IMPORTANT: Execute this in your Supabase SQL Editor

-- Create a trigger function to create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email, -- Using email as default username, can be updated later
    NEW.raw_user_meta_data->>'full_name', -- Extract from metadata if available
    NEW.raw_user_meta_data->>'avatar_url' -- Extract from metadata if available
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on auth.users to call the function when a new user is created
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get course completion percentage for a user
CREATE OR REPLACE FUNCTION get_course_completion(course_uuid UUID, user_uuid UUID)
RETURNS FLOAT AS $$
DECLARE
  total_lessons INT;
  completed_lessons INT;
BEGIN
  -- Count total lessons in the course
  SELECT COUNT(*)
  INTO total_lessons
  FROM lessons
  JOIN modules ON modules.id = lessons.module_id
  WHERE modules.course_id = course_uuid;
  
  -- Count completed lessons by the user
  SELECT COUNT(*)
  INTO completed_lessons
  FROM progress
  JOIN lessons ON lessons.id = progress.lesson_id
  JOIN modules ON modules.id = lessons.module_id
  WHERE 
    modules.course_id = course_uuid AND
    progress.user_id = user_uuid AND
    progress.completed = true;
  
  -- Calculate and return the percentage
  IF total_lessons = 0 THEN
    RETURN 0;
  ELSE
    RETURN (completed_lessons::FLOAT / total_lessons::FLOAT) * 100;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
