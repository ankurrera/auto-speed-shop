import { supabase } from "@/integrations/supabase/client";

export interface NewProductNotification {
  productName: string;
  productDescription: string;
  price: number;
  sellerName: string;
  productType: 'product' | 'part';
  imageUrl?: string;
  sellerId: string;
}

export class EmailNotificationService {
  /**
   * Send email notifications to all subscribed users about new products/parts
   */
  static async sendNewProductNotifications(notification: NewProductNotification): Promise<void> {
    try {
      console.log('Sending new product notifications via Supabase Edge Function...');

      // Call the Supabase Edge Function that handles notifications with proper permissions
      const { data, error } = await supabase.functions.invoke('send-new-product-notifications', {
        body: notification
      });

      if (error) {
        console.error('Error calling notification function:', error);
        throw error;
      }

      if (data?.success) {
        console.log(`✅ ${data.message}`);
        console.log(`📧 Notifications sent to ${data.notificationsSent} users`);
        
        if (data.errors && data.errors.length > 0) {
          console.warn('Some notifications failed:', data.errors);
        }

        // Show success message to the seller
        this.showNotificationSuccess(data.notificationsSent);
      } else {
        throw new Error(data?.message || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Error sending email notifications:', error);
      throw error;
    }
  }

  /**
   * Show success message when notifications are sent
   */
  private static showNotificationSuccess(subscriberCount: number): void {
    // This could be displayed as a toast/notification in the UI
    console.log(`✅ Email notifications sent to ${subscriberCount} subscribers!`);
  }
}