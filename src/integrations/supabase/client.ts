import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and/or Anon Key not found in environment variables.");
  throw new Error("Supabase URL and/or Anon Key not found.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);