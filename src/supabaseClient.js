import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace 'YOUR_SUPABASE_URL' and 'YOUR_SUPABASE_ANON_KEY'
// with your actual Supabase project URL and public anon key.
// You can find these in your Supabase project settings -> API.
const supabaseUrl = 'https://mtcgsdwxyfkkzglwhlbw.supabase.co'; // e.g., https://your-project-id.supabase.co
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Y2dzZHd4eWZra3pnbHdobGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTc0OTEsImV4cCI6MjA2NTQ5MzQ5MX0.rN84b4pKbzAp50hBn0nQZRuNbNWYpUjm4bnJpl9Nlr8'; // e.g., eyJhbGciOiJIUzI1Ni...

// Create a single Supabase client instance for convenience.
// This client will be used throughout your application to interact with Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);