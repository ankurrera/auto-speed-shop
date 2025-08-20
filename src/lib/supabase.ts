import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Use a conditional check to ensure 'process' is available
const supabaseUrl = typeof process !== 'undefined' 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL 
  : ''; // Or provide a fallback value

const supabaseAnonKey = typeof process !== 'undefined'
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  : ''; // Or provide a fallback value

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Key are required in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);