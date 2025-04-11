// Galeguia Supabase Configuration
// IMPORTANT: Replace these values with your actual Supabase project credentials

// Replace with your actual Supabase URL and anon/public key from your Supabase dashboard
const supabaseUrl = 'https://xiujciwvqzryorlsdoyx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpdWpjaXd2cXpyeW9ybHNkb3l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTUzMTQsImV4cCI6MjA1OTg3MTMxNH0.L3jz3jf-vQYn9RDlRTb8g54tMfhk9fqYj4VDRO3Aidw';

// Initialize Supabase client
// Corrigido para usar window.supabase ao invés de referenciar a própria variável
const supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
console.log('Supabase client initialized');
