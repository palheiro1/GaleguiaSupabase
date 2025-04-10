// Galeguia Database Setup Script
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase credentials
const supabaseUrl = 'https://xiujciwvqzryorlsdoyx.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWpjaXd2cXpyeW9ybHNkb3l4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDI5NTMxNCwiZXhwIjoyMDU5ODcxMzE0fQ.FRT-zHK7cL8I738UNbMqu2XZwZG7lZJNmohMKfQqQpM';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL files to execute in order
const sqlFiles = [
  'sql/schema/01_initial_schema.sql',
  'sql/functions/01_auth_functions.sql',
  'sql/functions/03_helper_functions.sql',
  'sql/policies/01_security_policies.sql',
  'sql/storage/01_storage_setup.sql'
];

// Function to read and execute SQL files
async function executeSqlFile(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
    
    console.log(`Executing SQL from ${filePath}...`);
    // Use the Supabase client to execute the SQL
    const { data, error } = await supabase.rpc('postgres_execute', { sql });
    
    if (error) {
      console.error(`Error executing ${filePath}:`, error);
      // Fall back to SQL HTTP API
      try {
        console.log('Falling back to HTTP API...');
        const response = await fetch(`${supabaseUrl}/rest/v1/sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ query: sql })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`SQL execution failed: ${errorText}`);
        }
        
        console.log(`Successfully executed ${filePath} using HTTP API`);
        return true;
      } catch (httpError) {
        console.error('HTTP API error:', httpError);
        return false;
      }
    }
    
    console.log(`Successfully executed ${filePath}`);
    return true;
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
    return false;
  }
}

// Main function to set up database
async function setupDatabase() {
  console.log('Starting database setup...');
  
  // Execute SQL files in order
  for (const file of sqlFiles) {
    const success = await executeSqlFile(file);
    if (!success) {
      console.error(`Failed to execute ${file}. Stopping process.`);
      break;
    }
  }
  
  console.log('Database setup completed. Check logs for any errors.');
}

// Run the setup
setupDatabase()
  .catch(err => {
    console.error('Unhandled error:', err);
  });
