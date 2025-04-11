-- Fix foreign key references to avoid auth.users access issues

-- First drop the existing constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_created_by_fkey' 
  ) THEN
    ALTER TABLE courses DROP CONSTRAINT courses_created_by_fkey;
    RAISE NOTICE 'Dropped existing foreign key constraint on courses.created_by';
  END IF;
END
$$;

-- Add the constraint properly to profiles
ALTER TABLE courses
ADD CONSTRAINT courses_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES profiles(id)
ON DELETE SET NULL;

-- Make sure indexes are correctly set up
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_courses_created_by'
  ) THEN
    CREATE INDEX idx_courses_created_by ON courses(created_by);
    RAISE NOTICE 'Index created on courses.created_by';
  END IF;
END
$$;

-- Make sure our profiles table has correct references
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
