// Galeguia Authentication Examples
// Import the Supabase client from your config file
import supabase from './supabase-config'

// Sign up a new user
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error signing up:', error.message)
    return { success: false, error: error.message }
  }
}

// Sign in a user
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error signing in:', error.message)
    return { success: false, error: error.message }
  }
}

// Sign out a user
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) throw error
    
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error.message)
    return { success: false, error: error.message }
  }
}

// Get the current user (if signed in)
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) throw error
    
    return { success: true, user }
  } catch (error) {
    console.error('Error getting current user:', error.message)
    return { success: false, error: error.message }
  }
}

// Update user profile
export async function updateProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating profile:', error.message)
    return { success: false, error: error.message }
  }
}

// Get user profile
export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error getting profile:', error.message)
    return { success: false, error: error.message }
  }
}

// Reset password (send reset email)
export async function resetPassword(email) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://yourdomain.com/reset-password', // Replace with your actual reset password URL
    })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error resetting password:', error.message)
    return { success: false, error: error.message }
  }
}

// Update password (after reset)
export async function updatePassword(newPassword) {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Error updating password:', error.message)
    return { success: false, error: error.message }
  }
}
