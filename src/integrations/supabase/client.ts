import { createClient } from "@supabase/supabase-js";

// Using direct Supabase credentials for Lovable environment
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dkopohqiihhxmbjhzark.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb3BvaHFpaWhoeG1iamh6YXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzE2NDMsImV4cCI6MjA3MTI0NzY0M30.6EF5ivhFPmK5B7Y_zLY-FkbN3LHAglvRHW7U0U5LoXA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);