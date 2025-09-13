import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/database.types";

type EmailSubscription = Database['public']['Tables']['email_subscriptions']['Row'];
type EmailSubscriptionInsert = Database['public']['Tables']['email_subscriptions']['Insert'];
type EmailSubscriptionUpdate = Database['public']['Tables']['email_subscriptions']['Update'];

export class EmailSubscriptionService {
  /**
   * Get user's email subscription preferences
   */
  static async getUserSubscription(userId: string): Promise<EmailSubscription | null> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching email subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create or update user's email subscription preferences
   */
  static async upsertSubscription(
    userId: string, 
    email: string, 
    subscribed: boolean
  ): Promise<EmailSubscription> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .upsert({
        user_id: userId,
        email: email,
        subscribed_to_new_products: subscribed,
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting email subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update subscription preference
   */
  static async updateSubscription(
    userId: string, 
    subscribed: boolean
  ): Promise<EmailSubscription> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .update({ subscribed_to_new_products: subscribed })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating email subscription:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get all subscribed users for sending notifications
   */
  static async getSubscribedUsers(): Promise<EmailSubscription[]> {
    const { data, error } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('subscribed_to_new_products', true);

    if (error) {
      console.error('Error fetching subscribed users:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Unsubscribe user from notifications
   */
  static async unsubscribe(userId: string): Promise<void> {
    const { error } = await supabase
      .from('email_subscriptions')
      .update({ subscribed_to_new_products: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Error unsubscribing user:', error);
      throw error;
    }
  }
}