// Galeguia Supabase Configuration
// IMPORTANT: Replace these values with your actual Supabase project credentials

// Supabase URL and Anon Key
const SUPABASE_URL = 'https://xiujciwvqzryorlsdoyx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWpjaXd2cXpyeW9ybHNkb3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTUzMTQsImV4cCI6MjA1OTg3MTMxNH0.2SJSMeQREvjvfcTf7FLS0b_TJPJQKFNZEsWQkD2QyWA';

// Initialize the Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Log initialization for debugging
console.log('Supabase client initialized');
