import { createClient } from '@supabase/supabase-js';
import { Database } from '../database.types';

// Access the variables via process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Key are required in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);