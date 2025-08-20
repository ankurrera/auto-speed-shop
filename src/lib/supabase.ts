import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Replace the process.env lines with your actual keys
const supabaseUrl = "https://<your-project-id>.supabase.co";
const supabaseAnonKey = "your_long_public_key_string...";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Key are required in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);