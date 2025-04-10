// Galeguia Edge Functions for Supabase
// IMPORTANT: Deploy these using Supabase CLI after project creation

// Example edge function to handle course enrollments
// Path: /functions/enroll-user/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface EnrollmentRequest {
  courseId: string
}

serve(async (req) => {
  // Create a Supabase client with the Auth context of the logged in user
  const supabaseClient = createClient(
    // Get these from your Supabase project settings > API
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    }
  )

  // Get the current logged in user
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { 'Content-Type': 'application/json' }, status: 401 }
    )
  }

  // Get the request body
  const { courseId } = await req.json() as EnrollmentRequest
  
  if (!courseId) {
    return new Response(
      JSON.stringify({ error: 'Course ID is required' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  // Check if the course exists and is published
  const { data: course, error: courseError } = await supabaseClient
    .from('courses')
    .select('id, is_published')
    .eq('id', courseId)
    .single()
  
  if (courseError || !course) {
    return new Response(
      JSON.stringify({ error: 'Course not found' }),
      { headers: { 'Content-Type': 'application/json' }, status: 404 }
    )
  }

  if (!course.is_published) {
    return new Response(
      JSON.stringify({ error: 'Course is not published' }),
      { headers: { 'Content-Type': 'application/json' }, status: 403 }
    )
  }

  // Check if the user is already enrolled
  const { data: existingEnrollment, error: enrollmentError } = await supabaseClient
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle()
  
  if (existingEnrollment) {
    return new Response(
      JSON.stringify({ message: 'User already enrolled', enrollment: existingEnrollment }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  }

  // Create a new enrollment
  const { data: newEnrollment, error: enrollError } = await supabaseClient
    .from('enrollments')
    .insert([
      { user_id: user.id, course_id: courseId }
    ])
    .select()
    .single()
  
  if (enrollError) {
    return new Response(
      JSON.stringify({ error: 'Failed to enroll user', details: enrollError }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }

  return new Response(
    JSON.stringify({ 
      message: 'User enrolled successfully', 
      enrollment: newEnrollment 
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 201 }
  )
})

// Example edge function to mark lesson completion
// Path: /functions/complete-lesson/index.ts
/*
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CompleteLessonRequest {
  lessonId: string
  lastPosition?: number
}

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! }
      }
    }
  )

  const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { headers: { 'Content-Type': 'application/json' }, status: 401 }
    )
  }

  const { lessonId, lastPosition } = await req.json() as CompleteLessonRequest
  
  if (!lessonId) {
    return new Response(
      JSON.stringify({ error: 'Lesson ID is required' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  // Check if the user is enrolled in the course containing this lesson
  const { data: enrollmentCheck, error: enrollmentError } = await supabaseClient
    .rpc('is_user_enrolled_in_lesson', {
      p_user_id: user.id,
      p_lesson_id: lessonId
    })
    .single()
  
  if (enrollmentError || !enrollmentCheck) {
    return new Response(
      JSON.stringify({ error: 'User is not enrolled in this course' }),
      { headers: { 'Content-Type': 'application/json' }, status: 403 }
    )
  }

  // Upsert the progress record
  const { data: progress, error: progressError } = await supabaseClient
    .from('progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      completed: true,
      completed_at: new Date().toISOString(),
      last_position: lastPosition
    })
    .select()
    .single()
  
  if (progressError) {
    return new Response(
      JSON.stringify({ error: 'Failed to update progress', details: progressError }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }

  return new Response(
    JSON.stringify({ 
      message: 'Lesson completed successfully', 
      progress 
    }),
    { headers: { 'Content-Type': 'application/json' }, status: 200 }
  )
})
*/
