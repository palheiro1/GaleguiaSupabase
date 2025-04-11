// Galeguia Admin Dashboard Functions
import supabase from './supabase-config'

// Check if current user is admin
export async function isCurrentUserAdmin() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    // Check the is_admin flag in profiles
    if (user) {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (profileError) throw profileError
      
      return data?.is_admin || false
    }
    
    return false
  } catch (error) {
    console.error('Error checking admin status:', error.message)
    return false
  }
}

// Get all courses (admin only)
export async function getAllCourses() {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized access. Admin privileges required.' }
    }
    
    // Fetch all courses with creator information
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        is_published,
        created_at,
        updated_at,
        created_by,
        creator:created_by(id, email, username),
        modules:modules(count)
      `)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { success: true, courses: data }
  } catch (error) {
    console.error('Error fetching all courses:', error.message)
    return { success: false, error: error.message }
  }
}

// Get user statistics (admin only)
export async function getUserStatistics() {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized access. Admin privileges required.' }
    }
    
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (usersError) throw usersError
    
    // Get total courses count
    const { count: totalCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
    
    if (coursesError) throw coursesError
    
    // Get published courses count
    const { count: publishedCourses, error: publishedError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
    
    if (publishedError) throw publishedError
    
    // Get total enrollments
    const { count: totalEnrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('*', { count: 'exact', head: true })
    
    if (enrollmentsError) throw enrollmentsError
    
    return { 
      success: true, 
      stats: {
        totalUsers,
        totalCourses,
        publishedCourses,
        totalEnrollments
      }
    }
  } catch (error) {
    console.error('Error fetching user statistics:', error.message)
    return { success: false, error: error.message }
  }
}

// Get course details with all enrolled users (admin only)
export async function getCourseWithEnrolledUsers(courseId) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized access. Admin privileges required.' }
    }
    
    // Get course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        cover_image_url,
        is_published,
        created_at,
        updated_at,
        created_by,
        creator:created_by(id, email, username)
      `)
      .eq('id', courseId)
      .single()
    
    if (courseError) throw courseError
    
    // Get enrolled users
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select(`
        id,
        enrolled_at,
        user:user_id(
          id,
          email,
          username,
          full_name
        )
      `)
      .eq('course_id', courseId)
    
    if (enrollmentsError) throw enrollmentsError
    
    return { 
      success: true, 
      course: {
        ...course,
        enrollments
      }
    }
  } catch (error) {
    console.error('Error fetching course with enrolled users:', error.message)
    return { success: false, error: error.message }
  }
}

// Update any course (admin only)
export async function updateAnyCourse(courseId, updates) {
  try {
    // Check if user is admin
    const isAdmin = await isCurrentUserAdmin()
    if (!isAdmin) {
      return { success: false, error: 'Unauthorized access. Admin privileges required.' }
    }
    
    const { data, error } = await supabase
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, course: data }
  } catch (error) {
    console.error('Error updating course as admin:', error.message)
    return { success: false, error: error.message }
  }
}
