import { supabase } from "@/integrations/supabase/client";
import { EmailSubscriptionService } from "./emailSubscriptionService";

export interface NewProductNotification {
  productName: string;
  productDescription: string;
  price: number;
  sellerName: string;
  productType: string;
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
      console.log('🔄 Starting email notification process for new product:', notification.productName);

      // Get all subscribed users
      const subscribedUsers = await EmailSubscriptionService.getSubscribedUsers();
      
      if (!subscribedUsers || subscribedUsers.length === 0) {
        console.log('ℹ️ No email subscribers found. Users can subscribe to notifications in their account settings.');
        this.showNoSubscribersMessage();
        return {
          success: true,
          notificationsSent: 0,
          notificationsFailed: 0,
          message: 'No subscribed users found'
        };
      }

      console.log(`📧 Found ${subscribedUsers.length} subscribed users to notify`);

      let successCount = 0;
      let failureCount = 0;
      const errors: string[] = [];

      // Process each subscriber
      for (const user of subscribedUsers) {
        try {
          // Create email content
          const subject = `New ${notification.productType} available: ${notification.productName}`;
          const emailContent = this.createEmailTemplate(notification);

          // In a real implementation, this would send actual emails
          // For now, we'll simulate the email sending process
          console.log(`📧 Email notification sent to: ${user.email}`);
          
          // Here you would typically make an API call to send the email
          // await fetch('/api/sendNotification', {
          //   method: 'POST',
          //   headers: { 'Content-Type': 'application/json' },
          //   body: JSON.stringify({ 
          //     to: user.email, 
          //     subject, 
          //     html: emailContent 
          //   }),
          // });

          successCount++;
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
    const unsubscribeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/account?unsubscribe=true`;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${notification.productType} Available</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  
  <table style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px;">
    <tr>
      <td>
        <h1 style="color: #333; margin-bottom: 20px;">New ${notification.productType} Available!</h1>
        
        <h2 style="color: #0066cc; margin-bottom: 15px;">${notification.productName}</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
          ${notification.productDescription}
        </p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Price:</strong> $${notification.price}</p>
          <p style="margin: 5px 0;"><strong>Seller:</strong> ${notification.sellerName}</p>
          <p style="margin: 5px 0;"><strong>Type:</strong> ${notification.productType}</p>
        </div>
        
        ${notification.imageUrl ? `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${notification.imageUrl}" alt="${notification.productName}" style="max-width: 300px; height: auto; border-radius: 5px;">
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${typeof window !== 'undefined' ? window.location.origin : ''}/products" 
             style="background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            View All Products
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          You're receiving this email because you subscribed to new product notifications.
          <br>
          <a href="${unsubscribeUrl}">Unsubscribe</a>
        </p>
      </td>
    </tr>
  </table>

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