-- Add helper functions to avoid direct auth.users access

-- Function to get courses for a user (either created by them or published)
CREATE OR REPLACE FUNCTION get_user_accessible_courses(p_user_id UUID)
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
    c.is_published = true OR 
    c.created_by = p_user_id OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = p_user_id AND p.is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
