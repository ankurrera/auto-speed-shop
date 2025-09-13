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
   * Send a single email notification using the API endpoint
   */
  static async sendNotification(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const response = await fetch('/api/sendNotification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          to: to, 
          subject: subject, 
          html: body 
        }),
      });

      if (response.ok) {
        console.log(`✅ Email notification sent to: ${to}`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log(`❌ Failed to send email to: ${to}, ${errorData.message}`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Failed to send email to: ${to}, ${errorMessage}`);
      return false;
    }
  }

  /**
   * Send bulk email notifications to multiple users
   */
  static async sendBulkNotifications(users: Array<{email: string}>, productInfo: NewProductNotification): Promise<{
    totalUsers: number;
    successCount: number;
    failCount: number;
  }> {
    try {
      const response = await fetch('/api/sendBulkNotifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          users: users,
          productInfo: productInfo
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Bulk email summary: ${data.summary.totalUsers} total, ${data.summary.successCount} sent, ${data.summary.failCount} failed`);
        return data.summary;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log(`❌ Failed to send bulk emails: ${errorData.message}`);
        return {
          totalUsers: users.length,
          successCount: 0,
          failCount: users.length
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`❌ Failed to send bulk emails: ${errorMessage}`);
      return {
        totalUsers: users.length,
        successCount: 0,
        failCount: users.length
      };
    }
  }

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

      // Use the bulk notification API for better efficiency
      const result = await this.sendBulkNotifications(subscribedUsers, notification);
      
      // Log results  
      console.log(`✅ Notifications processed: ${result.successCount} sent, ${result.failCount} failed`);
      
      if (result.successCount > 0) {
        console.log(`📧 Notifications sent to ${result.successCount} users`);
        this.showNotificationSuccess(result.successCount, result.failCount);
      }

      if (result.failCount > 0) {
        console.warn(`Some notifications failed: ${result.failCount} out of ${result.totalUsers}`);
      }

      return {
        success: true,
        notificationsSent: result.successCount,
        notificationsFailed: result.failCount,
        message: `Processed ${result.totalUsers} notifications: ${result.successCount} sent, ${result.failCount} failed`
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

// Also export as default for better compatibility
export default EmailNotificationService;