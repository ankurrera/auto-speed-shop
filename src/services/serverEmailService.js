import nodemailer from 'nodemailer';

/**
 * Server-side Email Service using Nodemailer directly
 * This service is intended for use in API routes and server-side contexts
 */
export class ServerEmailService {
  static transporter = null;

  /**
   * Validate email service configuration
   */
  static validateConfiguration() {
    const errors = [];
    
    if (!process.env.GMAIL_USER) {
      errors.push('GMAIL_USER environment variable is missing');
    }
    
    if (!process.env.GMAIL_PASSWORD) {
      errors.push('GMAIL_PASSWORD environment variable is missing');
    }
    
    if (errors.length > 0) {
      console.error('❌ Email service configuration errors:');
      errors.forEach(error => console.error(`   - ${error}`));
      return false;
    }
    
    console.log('✅ Email service configuration is valid');
    return true;
  }

  /**
   * Get or create nodemailer transporter
   */
  static getTransporter() {
    if (!this.transporter) {
      // Validate environment variables
      if (!process.env.GMAIL_USER) {
        throw new Error('GMAIL_USER environment variable is not set');
      }
      if (!process.env.GMAIL_PASSWORD) {
        throw new Error('GMAIL_PASSWORD environment variable is not set');
      }

      console.log('🔧 Creating nodemailer transporter with Gmail service');
      
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
        // Add timeout and retry settings
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        socketTimeout: 30000,
        connectionTimeout: 30000,
      });

      // Test the connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ SMTP connection verification failed:', error.message);
        } else {
          console.log('✅ SMTP server is ready to take our messages');
        }
      });
    }
    return this.transporter;
  }

  /**
   * Send a single email notification
   */
  static async sendNotification(to, subject, body) {
    try {
      console.log(`📧 Attempting to send email to: ${to}`);
      
      const transporter = this.getTransporter();
      
      const mailOptions = {
        from: process.env.GMAIL_USER,
        to: to,
        subject: subject,
        html: body,
      };

      console.log(`📤 Sending email with subject: "${subject}"`);
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email notification sent to: ${to}, MessageID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Failed to send email to: ${to}`);
      console.error(`❌ Error details: ${errorMessage}`);
      
      // Log specific error types for better debugging
      if (error.code) {
        console.error(`❌ Error code: ${error.code}`);
      }
      if (error.response) {
        console.error(`❌ SMTP response: ${error.response}`);
      }
      if (error.responseCode) {
        console.error(`❌ SMTP response code: ${error.responseCode}`);
      }
      
      return { 
        success: false, 
        error: {
          message: errorMessage,
          code: error.code,
          response: error.response,
          responseCode: error.responseCode
        }
      };
    }
  }

  /**
   * Send bulk email notifications to multiple users
   */
  static async sendBulkNotifications(users, productInfo) {
    console.log(`📊 Starting bulk email process for ${users.length} users`);
    
    // Validate configuration first
    if (!this.validateConfiguration()) {
      console.error('❌ Email configuration invalid, aborting bulk send');
      return {
        totalUsers: users.length,
        successCount: 0,
        failCount: users.length,
        errors: [{ error: 'Email configuration invalid - missing GMAIL_USER or GMAIL_PASSWORD environment variables' }]
      };
    }

    const totalUsers = users.length;
    let successCount = 0;
    let failCount = 0;
    const errors = [];
    const successDetails = [];

    const subject = `New Product Launched: ${productInfo.productName}`;
    const body = this.createEnhancedEmailTemplate(productInfo);

    console.log(`📧 Sending emails with subject: "${subject}"`);

    // Send emails sequentially to avoid overwhelming the SMTP server
    for (const user of users) {
      console.log(`📧 Processing email for user: ${user.email}`);
      const result = await this.sendNotification(user.email, subject, body);
      
      if (result.success) {
        successCount++;
        successDetails.push({
          email: user.email,
          messageId: result.messageId
        });
        console.log(`✅ Email sent successfully to: ${user.email}`);
      } else {
        failCount++;
        const errorDetail = {
          email: user.email,
          error: result.error
        };
        errors.push(errorDetail);
        console.error(`❌ Email failed for: ${user.email}`, result.error);
      }
      
      // Add a small delay between emails to be respectful to the SMTP server
      if (users.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`📊 Bulk email summary: ${totalUsers} total, ${successCount} sent, ${failCount} failed`);
    
    if (failCount > 0) {
      console.error(`❌ Failed notifications details:`, errors);
    }

    return {
      totalUsers,
      successCount,
      failCount,
      errors,
      successDetails
    };
  }

  /**
   * Create an enhanced email template for new product notifications
   */
  static createEnhancedEmailTemplate(productInfo) {
    const unsubscribeUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/account?unsubscribe=true` : '#';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New ${productInfo.productType || 'Product'} Available</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  
  <table style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px;">
    <tr>
      <td>
        <h1 style="color: #333; margin-bottom: 20px;">New ${productInfo.productType || 'Product'} Available!</h1>
        
        <h2 style="color: #0066cc; margin-bottom: 15px;">${productInfo.productName}</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">
          ${productInfo.productDescription || `Hi, we've just launched a new product: ${productInfo.productName}. Check it out on our website!`}
        </p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 5px 0;"><strong>Price:</strong> $${productInfo.price || 'Contact us for pricing'}</p>
          ${productInfo.sellerName ? `<p style="margin: 5px 0;"><strong>Seller:</strong> ${productInfo.sellerName}</p>` : ''}
          ${productInfo.productType ? `<p style="margin: 5px 0;"><strong>Type:</strong> ${productInfo.productType}</p>` : ''}
        </div>
        
        ${productInfo.imageUrl ? `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${productInfo.imageUrl}" alt="${productInfo.productName}" style="max-width: 300px; height: auto; border-radius: 5px;">
        </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || '#'}/products" 
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
   * Create a simple email template for new product notifications
   */
  static createSimpleEmailTemplate(productInfo) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>New Product Launched: ${productInfo.productName}</h2>
          <p>Hi,</p>
          <p>We've just launched a new product: <strong>${productInfo.productName}</strong>. Check it out on our website!</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Product:</strong> ${productInfo.productName}</p>
            <p><strong>Description:</strong> ${productInfo.productDescription || 'Check out our latest addition!'}</p>
            <p><strong>Price:</strong> $${productInfo.price || 'Contact us for pricing'}</p>
          </div>
          
          <p>Visit our website to learn more and make a purchase.</p>
          
          <p>Best regards,<br>Auto Speed Shop Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            You're receiving this email because you subscribed to new product notifications.
            You can manage your email preferences in your account settings.
          </p>
        </body>
      </html>
    `;
  }
}

export default ServerEmailService;