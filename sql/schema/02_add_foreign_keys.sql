-- Add foreign key constraint between courses.created_by and profiles.id

-- First check if the constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_created_by_fkey' 
    AND conrelid = 'courses'::regclass::oid
  ) THEN
    -- Add the constraint if it doesn't exist
    ALTER TABLE courses
    ADD CONSTRAINT courses_created_by_fkey
    FOREIGN KEY (created_by)
    REFERENCES profiles(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Foreign key constraint added between courses.created_by and profiles.id';
  ELSE
    RAISE NOTICE 'Foreign key constraint between courses.created_by and profiles.id already exists';
  END IF;
END
$$;

-- Create an index on created_by for better performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_courses_created_by'
  ) THEN
    CREATE INDEX idx_courses_created_by ON courses(created_by);
    RAISE NOTICE 'Index created on courses.created_by';
  ELSE
    RAISE NOTICE 'Index on courses.created_by already exists';
  END IF;
END
$$;
