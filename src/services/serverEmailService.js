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
   * Uses the specified placeholder format: ${productName}, ${productDescription}, ${price}, ${sellerName}, ${imageUrl}, ${baseUrl}, ${unsubscribeUrl}
   */
  static createEnhancedEmailTemplate(productInfo) {
    const baseUrl = process.env.FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const unsubscribeUrl = baseUrl ? `${baseUrl}/account?unsubscribe=true` : '#';
    
    // Use the specified placeholder format for the template
    const templateData = {
      productName: productInfo.productName || 'New Product',
      productDescription: productInfo.productDescription || `Check out our latest addition: ${productInfo.productName || 'New Product'}!`,
      price: productInfo.price || 'Contact us for pricing',
      sellerName: productInfo.sellerName || 'AutoParts Pro',
      imageUrl: productInfo.imageUrl || '',
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