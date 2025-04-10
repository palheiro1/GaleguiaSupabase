# Galeguia Backend Setup Guide for Cline

This document guides Cline, the AI agent plugin for Visual Studio Code, in setting up the backend and database for Galeguia, an educational app. The goal is to keep everything as simple as possible (KISS) using Supabase for the database, authentication, and backend logic. The app will eventually be built with Expo (mobile and web), but first, a web interface for course editors to create and edit courses will be developed. For now, email & password authentication is sufficient.

## Project Overview
- **Objective**: Create a simple backend and database for an educational app.
- **Tech Stack**: Supabase (PostgreSQL database, authentication, storage, Edge Functions).
- **Frontend Plans**: Expo app (mobile/web) later; a web interface for course editors first.
- **Authentication**: Email & password only at this stage.
- **Guiding Principle**: KISS (Keep It Simple, Stupid).

## General Rules for Cline
- Use Supabase for everything possible: database, authentication, file storage, and custom backend logic.
- Prioritize simplicity in implementation and configuration.
- Avoid overcomplicating the setup with unnecessary features or tools.
- Focus on email & password authentication initially; no social logins unless explicitly requested later.
- Ensure all steps are actionable within the Supabase dashboard or via minimal code using the Supabase client library.

## 10 Practical Steps to Implement the Database, Authentication, and Basic Backend

### Context
We’ll use Supabase to host a PostgreSQL database, manage authentication, store files (if needed), and run custom backend logic (Edge Functions). Interaction will primarily occur from the frontend (mobile/web app) using the Supabase client library.

### Steps

1. **Create the Supabase Project**
   - Go to [supabase.com](https://supabase.com), sign up or log in.
   - Create a new project ("New Project").
     - Choose a project name (e.g., `galeguia`).
     - Generate a secure database password (save it securely!).
     - Select a region closest to your users.
   - After creation (takes a few minutes), go to "Project Settings" -> "API".
   - Save the **Project URL** and **anon key** for frontend use.

2. **Plan the Database Schema**
   - Define the necessary tables:
     - `profiles`: Public user data (e.g., username, avatar). Links to `auth.users` via user ID (foreign key).
     - `courses`: Course info (title, description, cover image).
     - `modules`: Course modules (title, order, `course_id`).
     - `lessons`: Module lessons (title, content, type [video/text], `module_id`).
     - `enrollments`: Tracks user course enrollment (`user_id`, `course_id`).
     - `progress`: Tracks user progress (`user_id`, `lesson_id`, `completed_at`).
   - Specify columns, data types, and relationships (foreign keys).

3. **Implement the Schema in Supabase**
   - In the Supabase dashboard, go to "Table Editor".
   - Create the tables: `profiles`, `courses`, `modules`, `lessons`, `enrollments`, `progress`.
   - Set columns and data types (e.g., `text`, `int`, `timestamp`, `uuid`) and foreign keys (e.g., `modules.course_id` references `courses.id`).
   - Note: `auth.users` is managed automatically by Supabase Auth.

4. **Set Up Authentication (Supabase Auth)**
   - Go to "Authentication" in the dashboard.
   - Under "Providers", ensure "Email" is enabled (default).
   - In "Settings", configure options:
     - Optionally disable signup to control registration.
     - Enable email confirmations if desired.
   - Check "Email Templates" and customize if needed.

5. **Integrate Authentication in the Frontend**
   - Install the Supabase client library: `npm install @supabase/supabase-js`.
   - Initialize the client with the Project URL and anon key from Step 1.
   - Implement:
     - Signup: `supabase.auth.signUp({ email, password })`.
     - Login: `supabase.auth.signInWithPassword({ email, password })`.
     - Logout: `supabase.auth.signOut()`.
   - Manage user session state: `supabase.auth.onAuthStateChange(...)`.

6. **Configure Storage (Supabase Storage) (Optional)**
   - If storing files (e.g., lesson videos, course images, avatars):
     - Go to "Storage" in the dashboard.
     - Create buckets (e.g., `course_materials`, `avatars`).
     - Set access policies (public or private with specific rules).

7. **Implement Security Policies (Row Level Security - RLS)**
   - Go to "Authentication" -> "Policies".
   - Enable RLS for each table (except fully public ones).
   - Define policies:
     - `profiles`: Authenticated users can view all profiles but only update their own (`auth.uid() = user_id`).
     - `courses`: All (or authenticated users) can view; admins only can create/update.
     - `lessons`: Only enrolled users (via `enrollments`) can view lessons.
     - `progress`: Users can only insert/update their own progress (`auth.uid() = user_id`).
   - Start simple, refine later.

8. **Create Custom Backend Logic (Edge Functions) (Optional)**
   - For logic not handled by frontend or RLS (e.g., post-payment enrollment):
     - Install Supabase CLI: `npm install supabase --save-dev`.
     - Log in: `supabase login`.
     - Link project: `supabase link --project-ref YOUR_PROJECT_ID`.
     - Create a function: `supabase functions new your-function-name`.
     - Write function code (TypeScript/Deno) using the Supabase client.
     - Deploy: `supabase functions deploy your-function-name`.

9. **Interact with Data and Files from the Frontend**
   - Use `supabase-js` to:
     - Read: `supabase.from('courses').select('*')` (RLS enforces access).
     - Insert: `supabase.from('progress').insert({ user_id, lesson_id, completed_at: new Date() })`.
     - Update: `supabase.from('profiles').update({ username }).eq('user_id', userId)`.
     - Delete: `supabase.from('enrollments').delete().match({ user_id, course_id })`.
     - Call Edge Functions: `supabase.functions.invoke('your-function-name', { body: { /* payload */ } })`.
     - Upload/Download files: `supabase.storage.from('avatars').upload(...) / download(...)`.

10. **Test Everything Thoroughly**
    - Test authentication flows (signup, login, logout, password recovery).
    - Test data access as different users to ensure RLS works (no unauthorized access).
    - Test Edge Functions if implemented.
    - Check Supabase logs ("Logs" -> "PostgREST", "Auth", "Edge Functions") for debugging.
    - Refine tables, RLS policies, and functions as needed.

## Next Steps
- Build the course editor web interface using the Supabase client.
- Later, develop the Expo app for mobile and web.

Happy coding with Cline!
