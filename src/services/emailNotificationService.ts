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

export interface NotificationResult {
  success: boolean;
  notificationsSent: number;
  notificationsFailed: number;
  message: string;
}

export class EmailNotificationService {
  /**
   * Send email notifications to all subscribed users about new products/parts
   */
  static async sendNewProductNotifications(notification: NewProductNotification): Promise<NotificationResult> {
    try {
      console.log('Sending new product notifications via Supabase Edge Function...');

      // Call the Supabase Edge Function that handles notifications with proper permissions
      const { data, error } = await supabase.functions.invoke('send-new-product-notifications', {
        body: notification
      });

      if (error) {
        console.error('Error calling notification function:', error);
        throw new Error(`Failed to send notifications: ${error.message}`);
      }

      if (data?.success) {
        console.log(`✅ ${data.message}`);
        
        if (data.notificationsSent > 0) {
          console.log(`📧 Notifications sent to ${data.notificationsSent} users`);
          
          if (data.errors && data.errors.length > 0) {
            console.warn('Some notifications failed:', data.errors);
          }

          // Show success message to the seller
          this.showNotificationSuccess(data.notificationsSent, data.notificationsFailed || 0);
        } else {
          // No subscribers case
          console.log('ℹ️ No email subscribers found - no notifications sent');
          this.showNoSubscribersMessage();
        }

        return {
          success: true,
          notificationsSent: data.notificationsSent || 0,
          notificationsFailed: data.notificationsFailed || 0,
          message: data.message
        };
      } else {
        throw new Error(data?.message || 'Unknown error occurred while sending notifications');
      }

    } catch (error) {
      console.error('Error sending email notifications:', error);
      // Re-throw so the calling code can handle it appropriately
      throw error;
    }
  }

  /**
   * Show success message when notifications are sent
   */
  private static showNotificationSuccess(successCount: number, failureCount: number = 0): void {
    // This could be displayed as a toast/notification in the UI
    if (failureCount > 0) {
      console.log(`✅ Email notifications completed: ${successCount} sent, ${failureCount} failed`);
    } else {
      console.log(`✅ Email notifications sent successfully to ${successCount} subscribers!`);
    }
  }

  /**
   * Show message when no subscribers are found
   */
  private static showNoSubscribersMessage(): void {
    console.log('ℹ️ No email subscribers found. Users can subscribe to notifications in their account settings.');
  }
}