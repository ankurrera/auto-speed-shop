import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/database.types";

type Address = Database['public']['Tables']['addresses']['Row'];

export const addressService = {
  // Fetch all addresses for a user
  async getUserAddresses(userId: string): Promise<Address[]> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false }) // Default address first
      .order('created_at', { ascending: false }); // Then by newest

    if (error) {
      console.error('Error fetching user addresses:', error);
      throw error;
    }

    return data || [];
  },

  // Get the default address for a user
  async getDefaultAddress(userId: string): Promise<Address | null> {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching default address:', error);
      throw error;
    }

    return data || null;
  }
};