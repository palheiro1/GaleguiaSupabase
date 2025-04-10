# How to Implement Galeguia Backend with Supabase

This guide will walk you through implementing the Galeguia backend using the code and files we've prepared. You'll need to create a Supabase project and execute a few setup steps.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Create a new project:
   - Choose a name (such as "galeguia")
   - Set a strong database password (save it securely)
   - Select the region closest to your users
3. Wait for project creation to complete (usually takes a few minutes)
4. Once created, go to Project Settings > API
5. Copy your **Project URL** and **anon key** - you'll need these for configuration

## Step 2: Set Up the Database

1. In your Supabase dashboard, navigate to the SQL Editor
2. Execute each of these SQL files in order (copy/paste their content):
   - `sql/schema/01_initial_schema.sql` (creates the tables)
   - `sql/functions/01_auth_functions.sql` (authentication triggers)
   - `sql/functions/03_helper_functions.sql` (utility functions)
   - `sql/policies/01_security_policies.sql` (security policies)
   - `sql/storage/01_storage_setup.sql` (storage configuration)

## Step 3: Configure Storage Buckets

1. Go to Storage in your Supabase dashboard
2. Create two buckets:
   - `avatars` - for user profile pictures
   - `course_materials` - for course-related files (images, videos, etc.)
3. The security policies for these buckets were already applied in Step 2

## Step 4: Deploy Edge Functions (Optional)

If you want to use the Edge Functions for more complex operations:

1. Install the Supabase CLI: `npm install -g supabase`
2. Log in: `supabase login`
3. Link to your project: `supabase link --project-ref <your-project-ref>`
4. Create the function deployment structure:
   ```
   mkdir -p supabase/functions/enroll-user
   mkdir -p supabase/functions/complete-lesson
   ```
5. Create function files based on the code in `sql/functions/02_edge_functions.ts`
6. Deploy: `supabase functions deploy`

## Step 5: Configure the Web Admin Interface

1. Open `web-admin/js/config.js` in your editor
2. Replace the placeholder values with your actual Supabase details:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

## Step 6: Run the Web Admin Interface Locally

1. Start a local server in the project directory:
   ```
   npx http-server
   ```
2. Open your browser and navigate to: `http://localhost:8080/web-admin/`
3. You can now register an account and start creating courses!

## Next Steps

1. **Student Interface**: Use the client examples to build a student-facing interface
2. **Mobile App**: Develop an Expo app using the provided code examples
3. **Customization**: Extend the database and functionality as needed for your specific requirements

## Troubleshooting

- If you encounter issues with authentication, check your email configuration in the Supabase Authentication settings
- For database errors, review the logs in your Supabase Dashboard
- For storage issues, verify bucket permissions and policies

Refer to the detailed `README-implementation.md` for more information about the implementation.
