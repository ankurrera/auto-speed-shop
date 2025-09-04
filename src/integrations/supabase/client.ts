import { createClient } from "@supabase/supabase-js";

// Ensure a fallback for environments where Vercel might not inject the variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This error will be visible in the Vercel deployment logs
  console.error("Supabase URL and/or Anon Key not found in environment variables.");
  throw new Error("Supabase credentials not found. Please check your Vercel environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);