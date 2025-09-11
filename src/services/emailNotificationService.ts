import { EmailSubscriptionService } from './emailSubscriptionService';

export interface NewProductNotification {
  productName: string;
  productDescription: string;
  price: number;
  sellerName: string;
  productType: 'product' | 'part';
  imageUrl?: string;
}

export class EmailNotificationService {
  /**
   * Send email notifications to all subscribed users about new products/parts
   */
  static async sendNewProductNotifications(notification: NewProductNotification): Promise<void> {
    try {
      // Get all subscribed users
      const subscribedUsers = await EmailSubscriptionService.getSubscribedUsers();
      
      if (subscribedUsers.length === 0) {
        console.log('No subscribed users found for notifications');
        return;
      }

      console.log(`Sending notifications to ${subscribedUsers.length} subscribed users`);

      // In a real implementation, you would use a service like:
      // - Supabase Edge Functions
      // - SendGrid
      // - AWS SES
      // - Nodemailer with SMTP
      
      // For now, we'll log the notifications that would be sent
      const emailContent = this.generateEmailContent(notification);
      
      for (const user of subscribedUsers) {
        try {
          // Send actual email via API endpoint
          const response = await fetch('/api/sendNotification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: user.email,
              subject: `New ${notification.productType} available - ${notification.productName}`,
              html: emailContent
            }),
          });

          if (response.ok) {
            console.log(`📧 Email notification sent to: ${user.email}`);
          } else {
            console.error(`Failed to send email to ${user.email}:`, await response.text());
          }
        } catch (error) {
          console.error(`Error sending email to ${user.email}:`, error);
        }
      }

      // Show success message to the seller
      this.showNotificationSuccess(subscribedUsers.length);

    } catch (error) {
      console.error('Error sending email notifications:', error);
    }
  }

  /**
   * Generate HTML email content for new product notifications
   */
  private static generateEmailContent(notification: NewProductNotification): string {
    // Use a fallback URL for server-side rendering
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8080';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New ${notification.productType} Available!</h2>
        
        <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
          ${notification.imageUrl ? `<img src="${notification.imageUrl}" alt="${notification.productName}" style="max-width: 200px; height: auto; border-radius: 4px;">` : ''}
          
          <h3 style="color: #0066cc; margin: 10px 0;">${notification.productName}</h3>
          
          <p style="color: #666; line-height: 1.6;">${notification.productDescription}</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
            <p style="margin: 5px 0;"><strong>Price:</strong> $${notification.price.toFixed(2)}</p>
            <p style="margin: 5px 0;"><strong>Seller:</strong> ${notification.sellerName}</p>
            <p style="margin: 5px 0;"><strong>Type:</strong> ${notification.productType}</p>
          </div>
          
          <a href="${baseUrl}/shop" 
             style="display: inline-block; background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
            View in Shop
          </a>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px;">
          <p>You're receiving this email because you're subscribed to new product notifications.</p>
          <p>To unsubscribe, visit your <a href="${baseUrl}/account">account settings</a>.</p>
        </div>
      </div>
    `;
  }

  /**
   * Show success message when notifications are sent
   */
  private static showNotificationSuccess(subscriberCount: number): void {
    // This could be displayed as a toast/notification in the UI
    console.log(`✅ Email notifications sent to ${subscriberCount} subscribers!`);
  }
}