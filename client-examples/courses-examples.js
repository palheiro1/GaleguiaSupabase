// Galeguia Courses Examples
// Import the Supabase client from your config file
import supabase from './supabase-config'

// Get all published courses
export async function getPublishedCourses() {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, description, cover_image_url, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { success: true, courses: data }
  } catch (error) {
    console.error('Error fetching published courses:', error.message)
    return { success: false, error: error.message }
  }
}

// Get a specific course with its modules and lessons
export async function getCourseWithContent(courseId) {
  try {
    // Get the course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    
    if (courseError) throw courseError
    
    // Get the modules for this course
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order', { ascending: true })
    
    if (modulesError) throw modulesError
    
    // Get the lessons for each module
    const moduleIds = modules.map(module => module.id)
    const { data: lessons, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('order', { ascending: true })
    
    if (lessonsError) throw lessonsError
    
    // Organize lessons by module
    const modulesWithLessons = modules.map(module => ({
      ...module,
      lessons: lessons.filter(lesson => lesson.module_id === module.id)
    }))
    
    return { 
      success: true, 
      course: {
        ...course,
        modules: modulesWithLessons
      }
    }
  } catch (error) {
    console.error('Error fetching course with content:', error.message)
    return { success: false, error: error.message }
  }
}

// Enroll a user in a course
export async function enrollInCourse(courseId) {
  try {
    // Call the Edge Function for enrollment
    const { data, error } = await supabase.functions.invoke('enroll-user', {
      body: { courseId }
    })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error enrolling in course:', error.message)
    return { success: false, error: error.message }
  }
}

// Get courses a user is enrolled in with progress
export async function getUserEnrolledCourses(userId) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_courses_with_progress', { p_user_id: userId })
    
    if (error) throw error
    
    return { success: true, courses: data }
  } catch (error) {
    console.error('Error fetching user enrolled courses:', error.message)
    return { success: false, error: error.message }
  }
}

// Mark a lesson as completed
export async function markLessonAsCompleted(lessonId, lastPosition = null) {
  try {
    const { data, error } = await supabase
      .from('progress')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        last_position: lastPosition
      })
      .select()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error marking lesson as completed:', error.message)
    return { success: false, error: error.message }
  }
}

// Get the next lesson to complete for a user in a course
export async function getNextLesson(courseId) {
  try {
    const userId = (await supabase.auth.getUser()).data.user.id
    
    const { data, error } = await supabase
      .rpc('get_next_lesson_for_user', { 
        p_user_id: userId, 
        p_course_id: courseId 
      })
    
    if (error) throw error
    
    return { success: true, lesson: data[0] }
  } catch (error) {
    console.error('Error getting next lesson:', error.message)
    return { success: false, error: error.message }
  }
}

// Update lesson progress (for video lessons)
export async function updateLessonProgress(lessonId, currentPosition) {
  try {
    const { data, error } = await supabase
      .from('progress')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user.id,
        lesson_id: lessonId,
        last_position: currentPosition,
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating lesson progress:', error.message)
    return { success: false, error: error.message }
  }
}

// Get user progress for a specific course
export async function getCourseProgress(courseId) {
  try {
    const userId = (await supabase.auth.getUser()).data.user.id
    
    const { data: completion, error: completionError } = await supabase
      .rpc('get_course_completion', { 
        course_uuid: courseId, 
        user_uuid: userId 
      })
    
    if (completionError) throw completionError
    
    // Get all lessons progress for the course
    const { data: progress, error: progressError } = await supabase
      .from('progress')
      .select(`
        lesson_id,
        completed,
        completed_at,
        last_position,
        lessons:lesson_id (
          id,
          title,
          module_id,
          modules:module_id (
            id,
            title,
            course_id
          )
        )
      `)
      .eq('user_id', userId)
      .eq('lessons.modules.course_id', courseId)
    
    if (progressError) throw progressError
    
    return { 
      success: true, 
      completion: completion || 0,
      progress
    }
  } catch (error) {
    console.error('Error getting course progress:', error.message)
    return { success: false, error: error.message }
  }
}
