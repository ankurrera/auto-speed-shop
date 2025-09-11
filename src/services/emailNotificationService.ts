import { supabase } from "@/integrations/supabase/client";
import { EmailSubscriptionService } from "./emailSubscriptionService";

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
      console.log('Sending new product notifications...');

      // Get all subscribed users
      const subscribedUsers = await EmailSubscriptionService.getSubscribedUsers();
      
      if (subscribedUsers.length === 0) {
        console.log('ℹ️ No email subscribers found - no notifications sent');
        this.showNoSubscribersMessage();
        return {
          success: true,
          notificationsSent: 0,
          notificationsFailed: 0,
          message: 'No subscribers found'
        };
      }

      console.log(`Found ${subscribedUsers.length} subscribed users`);

      // Create email content
      const emailContent = this.createEmailTemplate(notification);
      const subject = `New ${notification.productType === 'part' ? 'Part' : 'Product'} Available: ${notification.productName}`;

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Send emails to all subscribers
      for (const user of subscribedUsers) {
        try {
          const response = await fetch('/api/sendNotification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: user.email,
              subject: subject,
              html: emailContent,
            }),
          });

          if (response.ok) {
            successCount++;
            console.log(`📧 Email notification sent to: ${user.email}`);
          } else {
            failureCount++;
            const errorData = await response.json();
            const errorMsg = `Failed to send email to ${user.email}: ${errorData.message}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        } catch (error) {
          failureCount++;
          const errorMsg = `Error sending email to ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      // Log results
      console.log(`✅ Notifications processed: ${successCount} sent, ${failureCount} failed`);
      if (successCount > 0) {
        console.log(`📧 Notifications sent to ${successCount} users`);
        this.showNotificationSuccess(successCount, failureCount);
      }

      if (errors.length > 0) {
        console.warn('Some notifications failed:', errors);
      }

      return {
        success: true,
        notificationsSent: successCount,
        notificationsFailed: failureCount,
        message: `Processed ${subscribedUsers.length} notifications: ${successCount} sent, ${failureCount} failed`
      };

    } catch (error) {
      console.error('Error sending email notifications:', error);
      // Re-throw so the calling code can handle it appropriately
      throw error;
    }
  }

  /**
   * Create HTML email template for new product notifications
   */
  private static createEmailTemplate(notification: NewProductNotification): string {
    const { productName, productDescription, price, sellerName, productType, imageUrl } = notification;
    
    // Get base URL - fallback to a default if window is not available (server-side)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auto-speed-shop.vercel.app';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>New ${productType === 'part' ? 'Part' : 'Product'} Available</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🚗 Auto Speed Shop</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">New ${productType === 'part' ? 'Part' : 'Product'} Alert!</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            ${imageUrl ? `
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="${imageUrl}" alt="${productName}" style="max-width: 300px; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
              </div>
            ` : ''}
            
            <h2 style="color: #667eea; margin-bottom: 15px; font-size: 24px;">${productName}</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 15px 0; font-size: 16px; color: #666;">${productDescription}</p>
              
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                  <span style="font-size: 24px; font-weight: bold; color: #28a745;">$${price.toFixed(2)}</span>
                </div>
                <div style="text-align: right;">
                  <p style="margin: 0; color: #666; font-size: 14px;">Listed by</p>
                  <p style="margin: 0; font-weight: bold; color: #333;">${sellerName}</p>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${baseUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; transition: background 0.3s;">
                View on Auto Speed Shop →
              </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center;">
              <p style="margin: 0; color: #666; font-size: 12px;">
                You're receiving this because you're subscribed to new ${productType} notifications.
                <br>
                <a href="${baseUrl}/account" style="color: #667eea;">Manage your email preferences</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
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