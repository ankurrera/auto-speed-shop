import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

const SUPABASE_URL = "https://dkopohqiihhxmbjhzark.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb3BvaHFpaWhoeG1iamh6YXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzE2NDMsImV4cCI6MjA3MTI0NzY0M30.6EF5ivhFPmK5B7Y_zLY-FkbN3LHAglvRHW7U0U5LoXA";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});