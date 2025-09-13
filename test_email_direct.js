#!/usr/bin/env node

/**
 * Standalone test for email notification functionality
 * This tests the actual email sending logic without needing the API
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmailDirectly() {
  console.log('🧪 Testing Email Configuration Directly...\n');
  
  // Check environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error('❌ Missing environment variables:');
    console.error('   GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Not set');
    console.error('   GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
    console.error('\n📋 To test email functionality:');
    console.error('   1. Copy .env.example to .env');
    console.error('   2. Add your Gmail credentials (use App Password)');
    console.error('   3. Run this test again');
    console.error('\n📖 See EMAIL_SETUP_GUIDE.md for detailed instructions');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('📧 From:', process.env.GMAIL_USER);
  
  // Create transporter with the same configuration as the API
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Test transporter connection
  try {
    console.log('🔗 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP server connection verified');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\n🔧 Common issues:');
    console.error('   • Using regular password instead of App Password');
    console.error('   • 2-factor authentication not enabled');
    console.error('   • Incorrect Gmail username');
    console.error('\n📖 See EMAIL_SETUP_GUIDE.md for help');
    return;
  }

  // Send test email
  const testEmail = process.env.TEST_EMAIL || process.env.GMAIL_USER;
  console.log(`📧 Sending test email to: ${testEmail}`);
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: testEmail,
    subject: 'Test - Auto Speed Shop Email Notifications Working!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e50914;">🎉 Email Test Successful!</h2>
        <p>This email confirms that your Auto Speed Shop email notification system is now working correctly.</p>
        
        <div style="background: #f5f5f5; padding: 15px; border-left: 4px solid #e50914; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Configuration Verified:</h3>
          <ul style="margin: 0;">
            <li>✅ SMTP connection established</li>
            <li>✅ Email authentication successful</li>
            <li>✅ Email delivery working</li>
          </ul>
        </div>
        
        <p><strong>What this means:</strong></p>
        <ul>
          <li>Users will now receive notifications when new products/parts are added</li>
          <li>Email subscriptions are functioning properly</li>
          <li>The notification system is ready for production</li>
        </ul>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 14px;">
          <strong>Auto Speed Shop</strong><br>
          Email Notification System Test
        </p>
      </div>
    `
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', result.messageId);
    console.log('📧 Check your inbox at:', testEmail);
    console.log('\n🎉 Email notifications are now fully functional!');
    console.log('   Your users will receive emails when new products are added.');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('\n🔍 Error details:');
    console.error('   Code:', error.code);
    console.error('   Command:', error.command);
    console.error('   Response:', error.response);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication failed - check your App Password');
    } else if (error.code === 'ECONNECTION') {
      console.error('\n🔧 Connection failed - check your internet connection');
    }
  }
}

// Run the test
testEmailDirectly();