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
        
        // Log detailed error information if available
        if (data.errors && data.errors.length > 0) {
          console.error('❌ Detailed notification errors:');
          data.errors.forEach((errorDetail: { email: string; error: { message: string; code?: string; response?: string; responseCode?: string } }, index: number) => {
            console.error(`  ${index + 1}. Email: ${errorDetail.email}`);
            console.error(`     Error: ${errorDetail.error.message}`);
            if (errorDetail.error.code) {
              console.error(`     Code: ${errorDetail.error.code}`);
            }
            if (errorDetail.error.response) {
              console.error(`     SMTP Response: ${errorDetail.error.response}`);
            }
            if (errorDetail.error.responseCode) {
              console.error(`     SMTP Response Code: ${errorDetail.error.responseCode}`);
            }
          });
        }
        
        // Log success details if available
        if (data.successDetails && data.successDetails.length > 0) {
          console.log('✅ Successful notifications:');
          data.successDetails.forEach((successDetail: { email: string; messageId: string }, index: number) => {
            console.log(`  ${index + 1}. Email: ${successDetail.email} (MessageID: ${successDetail.messageId})`);
          });
        }
        
        return data.summary;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.log(`❌ Failed to send bulk emails: ${errorData.message}`);
        
        // Log additional error details if available
        if (errorData.error) {
          console.error(`❌ Additional error details: ${errorData.error}`);
        }
        
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
      console.log(`📧 Subscriber emails: ${subscribedUsers.map(u => u.email).join(', ')}`);

      // Use the bulk notification API for better efficiency
      const result = await this.sendBulkNotifications(subscribedUsers, notification);
      
      // Log results  
      console.log(`✅ Notifications processed: ${result.successCount} sent, ${result.failCount} failed`);
      
      if (result.successCount > 0) {
        console.log(`📧 Notifications sent to ${result.successCount} users`);
        this.showNotificationSuccess(result.successCount, result.failCount);
      }

      if (result.failCount > 0) {
        console.warn(`⚠️ Some notifications failed: ${result.failCount} out of ${result.totalUsers}`);
        console.warn(`⚠️ This usually indicates email configuration issues or invalid email addresses.`);
        console.warn(`⚠️ Check the detailed error logs above for specific failure reasons.`);
        console.warn(`⚠️ Common causes: missing GMAIL_USER/GMAIL_PASSWORD environment variables, Gmail authentication issues, or network problems.`);
      }

      return {
        success: true,
        notificationsSent: result.successCount,
        notificationsFailed: result.failCount,
        message: `Processed ${result.totalUsers} notifications: ${result.successCount} sent, ${result.failCount} failed`
      };

    } catch (error) {
      console.error('❌ Error sending email notifications:', error);
      console.error('❌ This error occurred in the notification sending process. Check the logs above for detailed error information.');
      
      // Log additional context about the error
      if (error instanceof Error) {
        console.error(`❌ Error name: ${error.name}`);
        console.error(`❌ Error message: ${error.message}`);
        console.error(`❌ Error stack: ${error.stack}`);
      }
      
      // Re-throw so the calling code can handle it appropriately
      throw error;
    }
  }

  /**
   * Create HTML email template for new product notifications
   * Uses the specified placeholder format: ${productName}, ${productDescription}, ${price}, ${sellerName}, ${imageUrl}, ${baseUrl}, ${unsubscribeUrl}
   */
  private static createEmailTemplate(notification: NewProductNotification): string {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const unsubscribeUrl = `${baseUrl}/account?unsubscribe=true`;
    
    // Use the specified placeholder format for the template
    const templateData = {
      productName: notification.productName || 'New Product',
      productDescription: notification.productDescription || `Check out our latest addition: ${notification.productName || 'New Product'}!`,
      price: notification.price || 'Contact us for pricing',
      sellerName: notification.sellerName || 'AutoParts Pro',
      imageUrl: notification.imageUrl || '',
      baseUrl: baseUrl,
      unsubscribeUrl: unsubscribeUrl
    };
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>NEW ARRIVALS JUST FOR YOU - ${templateData.productName}</title>
  <style>
    /* Reset styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; display: block; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    
    /* Responsive styles */
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; }
      .content { padding: 20px !important; }
      .hero-text { font-size: 28px !important; line-height: 32px !important; }
      .product-image { max-width: 280px !important; }
      .cta-button { padding: 15px 25px !important; font-size: 16px !important; }
      .contact-info { font-size: 12px !important; }
    }
    
    @media only screen and (max-width: 480px) {
      .hero-text { font-size: 24px !important; line-height: 28px !important; }
      .product-image { max-width: 240px !important; }
      .overlay-text { font-size: 14px !important; padding: 8px 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif; line-height: 1.6;">
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="max-width: 600px; background-color: #000000; border-radius: 12px; overflow: hidden;">
          
          <!-- Hero Section -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 30px; text-align: center;">
              <div class="content">
                <h1 style="color: #ffffff; font-size: 36px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;" class="hero-text">
                  NEW ARRIVALS JUST FOR YOU
                </h1>
                <p style="color: #fecaca; font-size: 16px; margin: 0; font-weight: 300;">
                  Premium Auto Parts &amp; Accessories
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Product Section -->
          <tr>
            <td style="background-color: #111111; padding: 30px;">
              <div class="content">
                
                <!-- Product Name -->
                <h2 style="color: #ffffff; font-size: 24px; font-weight: bold; margin: 0 0 15px 0; text-align: center;">
                  ${templateData.productName}
                </h2>
                
                <!-- Product Image with Overlay -->
                ${templateData.imageUrl ? `
                <div style="position: relative; text-align: center; margin: 20px 0;">
                  <img src="${templateData.imageUrl}" alt="${templateData.productName}" 
                       style="max-width: 350px; width: 100%; height: auto; border-radius: 8px; border: 2px solid #dc2626;" 
                       class="product-image">
                  <div style="position: absolute; top: 15px; left: 15px; background: rgba(220, 38, 38, 0.95); color: #ffffff; padding: 10px 15px; border-radius: 6px; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px;" class="overlay-text">
                    NEW ARRIVAL
                  </div>
                </div>
                ` : ''}
                
                <!-- Product Description -->
                <div style="background: linear-gradient(135deg, #1f1f1f 0%, #0f0f0f 100%); padding: 25px; border-radius: 8px; margin: 20px 0; border: 1px solid #333333;">
                  <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; text-align: center;">
                    ${templateData.productDescription}
                  </p>
                  
                  <!-- Product Details -->
                  <div style="background-color: #dc2626; padding: 20px; border-radius: 6px; text-align: center;">
                    <p style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0 0 8px 0;">
                      $${templateData.price}
                    </p>
                    <p style="color: #fecaca; font-size: 14px; margin: 0; font-weight: 500;">
                      Seller: ${templateData.sellerName}
                    </p>
                  </div>
                </div>
                
                <!-- Call to Action -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${templateData.baseUrl}/products" 
                     style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; border: 2px solid #dc2626; transition: all 0.3s ease;"
                     class="cta-button">
                    🛒 SHOP NOW
                  </a>
                </div>
                
              </div>
            </td>
          </tr>
          
          <!-- Contact Info & Footer -->
          <tr>
            <td style="background: linear-gradient(135deg, #1f1f1f 0%, #0f0f0f 100%); padding: 30px; border-top: 2px solid #dc2626;">
              <div class="content">
                
                <!-- Contact Information -->
                <div style="text-align: center; margin-bottom: 25px;">
                  <h3 style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 0 0 15px 0; text-transform: uppercase;">
                    Contact Us
                  </h3>
                  <div style="color: #cccccc; font-size: 14px; line-height: 1.8;" class="contact-info">
                    <p style="margin: 5px 0;">📞 <strong>Phone:</strong> +91 9874139807</p>
                    <p style="margin: 5px 0;">✉️ <strong>Email:</strong> sunvisiontech@gmail.com</p>
                    <p style="margin: 5px 0;">📍 <strong>Address:</strong> EN-9, SALTLAKE, SECTOR-5 KOLKATA-700091</p>
                    <p style="margin: 5px 0;">🕒 <strong>Hours:</strong> Mon-Fri 8AM-6PM, Sat 9AM-4PM</p>
                  </div>
                </div>
                
                <!-- Social Media Links -->
                <div style="text-align: center; margin: 20px 0;">
                  <a href="https://www.facebook.com/share/1HWqypCZvo/" style="display: inline-block; margin: 0 10px; color: #dc2626; text-decoration: none; font-size: 14px;">Facebook</a>
                  <a href="https://www.instagram.com/digital_indian16?igsh=cDZ3NWliNGZyZDRp" style="display: inline-block; margin: 0 10px; color: #dc2626; text-decoration: none; font-size: 14px;">Instagram</a>
                  <a href="https://youtube.com/@digitalindianbusinesssolut108?si=pBt6rFSYOWIU4jEt" style="display: inline-block; margin: 0 10px; color: #dc2626; text-decoration: none; font-size: 14px;">YouTube</a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #333333; margin: 25px 0;">
                
                <!-- Unsubscribe Section -->
                <div style="text-align: center;">
                  <p style="color: #888888; font-size: 12px; margin: 0 0 10px 0;">
                    You're receiving this email because you subscribed to new product notifications.
                  </p>
                  <p style="color: #888888; font-size: 12px; margin: 0;">
                    <a href="${templateData.unsubscribeUrl}" style="color: #dc2626; text-decoration: underline;">Unsubscribe</a> | 
                    <a href="${templateData.baseUrl}/privacy" style="color: #dc2626; text-decoration: underline;">Privacy Policy</a> | 
                    <a href="${templateData.baseUrl}/contact" style="color: #dc2626; text-decoration: underline;">Contact Support</a>
                  </p>
                </div>
                
                <!-- Copyright -->
                <div style="text-align: center; margin-top: 20px;">
                  <p style="color: #666666; font-size: 11px; margin: 0;">
                    © 2024 AutoParts Pro. All rights reserved.
                  </p>
                </div>
                
              </div>
            </td>
          </tr>
          
        </table>
        
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