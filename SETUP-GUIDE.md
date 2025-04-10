# Galeguia Setup Guide

This guide will walk you through setting up the Galeguia educational app backend on Supabase.

## 1. Database Setup

### Option A: Using Supabase SQL Editor (Recommended)

1. Log in to your Supabase dashboard at [https://app.supabase.com/](https://app.supabase.com/)
2. Go to the SQL Editor section
3. Create a new query
4. Execute each SQL file in the following order by copying its contents into the SQL Editor:
   - `sql/schema/01_initial_schema.sql`
   - `sql/functions/01_auth_functions.sql`
   - `sql/functions/03_helper_functions.sql`
   - `sql/policies/01_security_policies.sql`
   - `sql/storage/01_storage_setup.sql`

### Option B: Using the Setup Script (Advanced)

You can also use the provided setup script, but you may need to handle Node.js dependencies:

```bash
# Install dependencies
npm install @supabase/supabase-js

# Run the setup script
node setup-database.js
```

## 2. Storage Bucket Setup

1. Go to the Storage section in your Supabase dashboard
2. Create two new buckets:
   - `avatars` - for user profile pictures
   - `course_materials` - for course-related files (images, videos, etc.)
3. The security policies for these buckets were already applied in the database setup

## 3. Authentication Setup

1. Go to the Authentication section in your Supabase dashboard
2. Under Settings > Auth Providers, ensure Email provider is enabled
3. Customize email templates if desired
4. Configure additional settings according to your preferences

## 4. Web Admin Interface

### Accessing the Public Web Admin Interface

The web admin interface is now deployed and publicly accessible at:

```
https://palheiro1.github.io/GaleguiaSupabase/docs/
```

You can access the GitHub repository at: [https://github.com/palheiro1/GaleguiaSupabase](https://github.com/palheiro1/GaleguiaSupabase)

Note: GitHub Pages deployment may take a few minutes after the initial push. You can check the deployment status in the repository settings under 'Pages'.

This interface connects to your Supabase project with the credentials configured in `web-admin/js/config.js`.

### Running Locally (Optional)

You can also run the web admin interface locally:

```bash
# Start a local web server
npx http-server

# Access the web admin interface at
# http://localhost:8080/public/
```

## 5. Edge Functions (Optional)

To deploy the Edge Functions:

1. Install Supabase CLI following the [official instructions](https://supabase.com/docs/guides/cli)
2. Log in: `supabase login`
3. Link to your project: `supabase link --project-ref xiujciwvqzryorlsdoyx`
4. Deploy the functions:
   ```bash
   mkdir -p supabase/functions/enroll-user
   cp sql/functions/02_edge_functions.ts supabase/functions/enroll-user/index.ts
   supabase functions deploy enroll-user
   ```

## 6. Testing Your Implementation

1. Register a new account in the web admin interface
2. Create a course with modules and lessons
3. Publish the course
4. Create another account to test student enrollment
5. Verify that security policies are working as expected (e.g., only course creators can edit their courses)

## 7. Troubleshooting

If you encounter issues:

- Check the Supabase logs in the dashboard
- Ensure all SQL files were executed successfully
- Verify that storage buckets were created with proper permissions
- Check browser console for any client-side errors

## Next Steps

1. Build a student-facing interface using the provided client examples
2. Develop an Expo app for mobile access
3. Extend the database schema and functionality as needed

For detailed implementation information, refer to `README-implementation.md`.
