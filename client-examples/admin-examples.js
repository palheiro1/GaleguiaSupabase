// Galeguia Course Admin Examples
// Import the Supabase client from your config file
import supabase from './supabase-config'

// Create a new course
export async function createCourse(courseData) {
  try {
    const userId = (await supabase.auth.getUser()).data.user.id
    
    const { data, error } = await supabase
      .from('courses')
      .insert([{
        ...courseData,
        created_by: userId,
        is_published: false // Default to unpublished
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, course: data }
  } catch (error) {
    console.error('Error creating course:', error.message)
    return { success: false, error: error.message }
  }
}

// Update a course
export async function updateCourse(courseId, updates) {
  try {
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
    console.error('Error updating course:', error.message)
    return { success: false, error: error.message }
  }
}

// Publish or unpublish a course
export async function toggleCoursePublished(courseId, isPublished) {
  try {
    const { data, error } = await supabase
      .from('courses')
      .update({ 
        is_published: isPublished,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, course: data }
  } catch (error) {
    console.error('Error toggling course publish status:', error.message)
    return { success: false, error: error.message }
  }
}

// Delete a course
export async function deleteCourse(courseId) {
  try {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting course:', error.message)
    return { success: false, error: error.message }
  }
}

// Create a module within a course
export async function createModule(courseId, moduleData) {
  try {
    // Get the highest order value for existing modules in this course
    const { data: existingModules, error: fetchError } = await supabase
      .from('modules')
      .select('order')
      .eq('course_id', courseId)
      .order('order', { ascending: false })
      .limit(1)
    
    if (fetchError) throw fetchError
    
    const nextOrder = existingModules.length > 0 ? existingModules[0].order + 1 : 1
    
    const { data, error } = await supabase
      .from('modules')
      .insert([{
        ...moduleData,
        course_id: courseId,
        order: nextOrder
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, module: data }
  } catch (error) {
    console.error('Error creating module:', error.message)
    return { success: false, error: error.message }
  }
}

// Update a module
export async function updateModule(moduleId, updates) {
  try {
    const { data, error } = await supabase
      .from('modules')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', moduleId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, module: data }
  } catch (error) {
    console.error('Error updating module:', error.message)
    return { success: false, error: error.message }
  }
}

// Delete a module
export async function deleteModule(moduleId) {
  try {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', moduleId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting module:', error.message)
    return { success: false, error: error.message }
  }
}

// Reorder modules
export async function reorderModules(courseId, moduleOrder) {
  // moduleOrder should be an array of { id, order } objects
  try {
    const updates = moduleOrder.map(item => ({
      id: item.id,
      order: item.order,
      updated_at: new Date().toISOString()
    }))
    
    const { data, error } = await supabase
      .from('modules')
      .upsert(updates, { onConflict: 'id' })
      .select()
    
    if (error) throw error
    
    return { success: true, modules: data }
  } catch (error) {
    console.error('Error reordering modules:', error.message)
    return { success: false, error: error.message }
  }
}

// Create a lesson within a module
export async function createLesson(moduleId, lessonData) {
  try {
    // Get the highest order value for existing lessons in this module
    const { data: existingLessons, error: fetchError } = await supabase
      .from('lessons')
      .select('order')
      .eq('module_id', moduleId)
      .order('order', { ascending: false })
      .limit(1)
    
    if (fetchError) throw fetchError
    
    const nextOrder = existingLessons.length > 0 ? existingLessons[0].order + 1 : 1
    
    const { data, error } = await supabase
      .from('lessons')
      .insert([{
        ...lessonData,
        module_id: moduleId,
        order: nextOrder
      }])
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, lesson: data }
  } catch (error) {
    console.error('Error creating lesson:', error.message)
    return { success: false, error: error.message }
  }
}

// Update a lesson
export async function updateLesson(lessonId, updates) {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()
    
    if (error) throw error
    
    return { success: true, lesson: data }
  } catch (error) {
    console.error('Error updating lesson:', error.message)
    return { success: false, error: error.message }
  }
}

// Delete a lesson
export async function deleteLesson(lessonId) {
  try {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting lesson:', error.message)
    return { success: false, error: error.message }
  }
}

// Reorder lessons
export async function reorderLessons(moduleId, lessonOrder) {
  // lessonOrder should be an array of { id, order } objects
  try {
    const updates = lessonOrder.map(item => ({
      id: item.id,
      order: item.order,
      updated_at: new Date().toISOString()
    }))
    
    const { data, error } = await supabase
      .from('lessons')
      .upsert(updates, { onConflict: 'id' })
      .select()
    
    if (error) throw error
    
    return { success: true, lessons: data }
  } catch (error) {
    console.error('Error reordering lessons:', error.message)
    return { success: false, error: error.message }
  }
}

// Upload a course cover image
export async function uploadCourseCoverImage(courseId, file) {
  try {
    // Generate a unique file path
    const filePath = `course_covers/${courseId}/${new Date().getTime()}_${file.name}`
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('course-materials') // Changed from course_materials to course-materials
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('course-materials') // Changed from course_materials to course-materials
      .getPublicUrl(filePath)
    
    // Update the course with the new cover image URL
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .update({
        cover_image_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single()
    
    if (courseError) throw courseError
    
    return { success: true, course: courseData, publicUrl }
  } catch (error) {
    console.error('Error uploading course cover image:', error.message)
    return { success: false, error: error.message }
  }
}

// Upload a video for a lesson
export async function uploadLessonVideo(lessonId, file) {
  try {
    // Get module and course info for this lesson
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select(`
        id,
        module_id,
        modules:module_id (
          id,
          course_id
        )
      `)
      .eq('id', lessonId)
      .single()
    
    if (lessonError) throw lessonError
    
    // Generate a unique file path
    const courseId = lesson.modules.course_id
    const moduleId = lesson.module_id
    const filePath = `courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/${new Date().getTime()}_${file.name}`
    
    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('course-materials') // Changed from course_materials to course-materials
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) throw uploadError
    
    // Get the public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('course-materials') // Changed from course_materials to course-materials
      .getPublicUrl(filePath)
    
    // Update the lesson with the new video URL
    const { data: lessonData, error: updateError } = await supabase
      .from('lessons')
      .update({
        video_url: publicUrl,
        type: 'video',
        updated_at: new Date().toISOString()
      })
      .eq('id', lessonId)
      .select()
      .single()
    
    if (updateError) throw updateError
    
    return { success: true, lesson: lessonData, publicUrl }
  } catch (error) {
    console.error('Error uploading lesson video:', error.message)
    return { success: false, error: error.message }
  }
}

// Get all courses created by the current user
export async function getCreatedCourses() {
  try {
    const userId = (await supabase.auth.getUser()).data.user.id
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, 
        title, 
        description, 
        cover_image_url, 
        is_published, 
        created_at,
        modules:modules (count)
      `)
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    return { success: true, courses: data }
  } catch (error) {
    console.error('Error getting created courses:', error.message)
    return { success: false, error: error.message }
  }
}
