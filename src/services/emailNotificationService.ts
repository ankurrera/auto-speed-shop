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
            let errorMsg = `Failed to send email to ${user.email}`;
            
            try {
              // Check if response is JSON before parsing
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json();
                errorMsg = `Failed to send email to ${user.email}: ${errorData.message || 'Unknown error'}`;
              } else {
                // For non-JSON responses (like HTML error pages), get the text
                const errorText = await response.text();
                errorMsg = `Failed to send email to ${user.email}: HTTP ${response.status} - ${errorText.substring(0, 100)}...`;
              }
            } catch (parseError) {
              // If we can't parse the response at all, use a generic error message
              errorMsg = `Failed to send email to ${user.email}: HTTP ${response.status} - Unable to parse error response`;
            }
            
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
    const { productName, price, sellerName, productType, imageUrl } = notification;
    // Get base URL - fallback to a default if window is not available (server-side)
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://auto-speed-shop.vercel.app';
    const unsubscribeUrl = `${baseUrl}/account`; // Adjust if you have a dedicated unsubscribe link

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Product Alert - Auto Speed Shop</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #111;
      color: #fff;
    }
    table {
      border-collapse: collapse;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #111;
      color: #fff;
    }
    .headline {
      font-size: 28px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: center;
      padding: 40px 20px 10px;
      line-height: 1.3;
    }
    .subline {
      text-align: center;
      font-size: 15px;
      color: #ccc;
      padding: 0 20px 30px;
    }
    .cta-button {
      background: #e50914;
      color: #fff !important;
      text-decoration: none;
      padding: 14px 32px;
      font-size: 16px;
      font-weight: 600;
      display: inline-block;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      background: #f4f4f4;
      color: #333;
      text-align: center;
      padding: 25px;
      font-size: 13px;
      line-height: 1.6;
    }
    .footer a {
      color: #e50914;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .headline { font-size: 22px !important; }
      .cta-button {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box;
        text-align: center !important;
      }
    }
  </style>
</head>
<body>

  <table class="container" width="100%" cellpadding="0" cellspacing="0">

    <!-- Header -->
    <tr>
      <td align="center" style="padding: 20px; font-size:14px; letter-spacing:1px; text-transform:uppercase; color:#aaa;">
        Auto Speed Shop • New Part Alert
      </td>
    </tr>

    <!-- Headline -->
    <tr>
      <td class="headline">
        New Auto Part<br> Just For You
      </td>
    </tr>
    <tr>
      <td class="subline">
        Upgrade your ride with our latest arrival – precision built and performance ready.
      </td>
    </tr>

    <!-- Product Image -->
    <tr>
      <td align="center">
        <img src="${imageUrl || ''}" alt="${productName}">
      </td>
    </tr>

    <!-- Product Info -->
    <tr>
      <td style="padding:30px 20px; text-align:center; color:#fff;">
        <h2 style="margin:0; font-size:20px; font-weight:700;">${productName}</h2>
        <p style="margin:6px 0; font-size:15px; color:#bbb;">Listed by <b>${sellerName}</b></p>
        <p style="margin:10px 0 20px; font-size:22px; font-weight:800; color:#e50914;">$${price.toFixed(2)}</p>
        <a href="${baseUrl}" class="cta-button">Shop Now</a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td class="footer">
        Auto Speed Shop<br>
        support@autospeedshop.com | +123-456-7890<br>
        <a href="${unsubscribeUrl}">Unsubscribe</a>
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