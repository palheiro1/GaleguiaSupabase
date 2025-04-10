# Galeguia Backend Implementation Guide

This document outlines the implementation of the Galeguia backend using Supabase, as specified in the requirements. This implementation provides a complete solution for managing educational content, including authentication, database structure, security policies, and a basic web admin interface for content creators.

## Project Structure

```
/
├── sql/                           # SQL files for Supabase setup
│   ├── schema/                    # Database table definitions
│   │   └── 01_initial_schema.sql  # Core database tables
│   ├── policies/                  # Security policies
│   │   └── 01_security_policies.sql # Row Level Security (RLS) policies
│   ├── functions/                 # Database functions and triggers
│   │   ├── 01_auth_functions.sql  # Authentication-related functions
│   │   ├── 02_edge_functions.ts   # Supabase Edge Functions
│   │   └── 03_helper_functions.sql # Utility functions
│   └── storage/                   # Storage configuration
│       └── 01_storage_setup.sql   # Bucket definitions and policies
├── client-examples/               # Client-side integration examples
│   ├── supabase-config.js         # Supabase client configuration
│   ├── auth-examples.js           # Authentication functions
│   ├── courses-examples.js        # Course data operations
│   └── admin-examples.js          # Administrative operations
└── web-admin/                     # Basic web interface for course management
    ├── index.html                 # Web admin interface
    └── js/                        # JavaScript files
        ├── config.js              # Configuration
        ├── auth.js                # Authentication handling
        ├── courses.js             # Course management
        └── app.js                 # Main application
```

## Step-by-Step Implementation Guide

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Create a new project:
   - Choose a project name (e.g., `galeguia`)
   - Set a strong database password
   - Select a region close to your users
3. Wait for the project to be created (takes a few minutes)
4. In Project Settings > API, copy your Project URL and anon key for later use

### 2. Database Setup

Execute the SQL files in the Supabase SQL Editor in the following order:

1. `sql/schema/01_initial_schema.sql` to create the basic tables
2. `sql/functions/01_auth_functions.sql` to add authentication triggers and functions
3. `sql/functions/03_helper_functions.sql` to add utility functions
4. `sql/policies/01_security_policies.sql` to set up Row Level Security policies
5. `sql/storage/01_storage_setup.sql` to configure storage buckets

Note: SQL files should be executed in the Supabase SQL Editor (Dashboard > SQL Editor)

### 3. Storage Setup

After running the storage SQL script, create the required buckets manually:

1. Go to Storage in your Supabase dashboard
2. Create two buckets:
   - `avatars` - for user profile pictures
   - `course_materials` - for course-related files (images, videos, etc.)

### 4. Edge Functions (Optional)

If you need to use the Edge Functions:

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in: `supabase login`
3. Link to your project: `supabase link --project-ref <your-project-ref>`
4. Create deployment folders for each function:
   - `mkdir -p supabase/functions/enroll-user`
   - `mkdir -p supabase/functions/complete-lesson`
5. Copy the code from `sql/functions/02_edge_functions.ts` to appropriate files
6. Deploy: `supabase functions deploy`

### 5. Web Admin Interface Setup

The web admin interface is a simple HTML/JS application for course creators:

1. Update `web-admin/js/config.js` with your Supabase project URL and anon key
2. Host the files in a web server or locally for testing
3. Users can register, login, and create/manage courses

## Authentication

The implementation uses Supabase Auth with email/password authentication. Additional features:

- Automatic profile creation when a user signs up
- Profile management functions
- Secure password reset flow

## Database Design

The database consists of several key tables:

- `profiles` - Stores user profile information, linked to auth.users
- `courses` - Stores course metadata (title, description, etc.)
- `modules` - Groups lessons within a course
- `lessons` - Individual content pieces (text, video, quiz)
- `enrollments` - Tracks which users are enrolled in which courses
- `progress` - Tracks user progress through lessons

## Security Model

Row Level Security (RLS) policies ensure:

- Users can only view published courses (unless they created them)
- Users can only edit their own courses
- Users can only view their own progress
- Users can only enroll in published courses

## Using the Client Libraries

The `client-examples` directory contains reusable code for frontend integration:

1. Copy `supabase-config.js` to your project and update with your credentials
2. Import the other scripts as needed
3. Call the provided functions to interact with Supabase

Example:
```javascript
import { signUp, signIn } from './auth-examples.js';
import { getPublishedCourses, enrollInCourse } from './courses-examples.js';

// Sign up a new user
await signUp('user@example.com', 'password123');

// Get all published courses
const { courses } = await getPublishedCourses();
```

## Web Admin Interface

A simple course management interface is provided in the `web-admin` directory:

1. Allows course creators to log in and create courses
2. Supports creating, editing, and deleting courses
3. Manages modules and lessons within courses
4. Handles file uploads (cover images, videos)

To use:
1. Update `web-admin/js/config.js` with your Supabase credentials
2. Open `index.html` in a browser
3. Register and start creating courses

## Next Steps

1. Develop the student-facing interface using the client examples
2. Create mobile applications with Expo using the same Supabase integration
3. Add more advanced features like quizzes, certificates, or social learning elements

## Troubleshooting

- **Database Errors**: Check the Supabase Dashboard > Database > Logs
- **Auth Issues**: Verify email templates and settings in Supabase Dashboard > Authentication
- **Storage Problems**: Check bucket permissions in Supabase Dashboard > Storage

For more detailed help, refer to the [Supabase documentation](https://supabase.com/docs).
