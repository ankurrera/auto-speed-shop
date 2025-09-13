#!/usr/bin/env node

/**
 * Simple test script to verify email configuration
 * Run this to test if your email setup is working correctly
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

async function testEmailAPI() {
  console.log('🧪 Testing Email API Configuration...\n');
  
  // Check environment variables
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
    console.error('❌ Missing environment variables:');
    console.error('   GMAIL_USER:', process.env.GMAIL_USER ? '✅ Set' : '❌ Not set');
    console.error('   GMAIL_PASSWORD:', process.env.GMAIL_PASSWORD ? '✅ Set' : '❌ Not set');
    console.error('\n📋 Please create a .env file with your Gmail credentials.');
    console.error('   See EMAIL_SETUP_GUIDE.md for instructions.');
    return;
  }

  console.log('✅ Environment variables found');
  console.log('📧 Testing email to:', TEST_EMAIL);
  
  const testEmailData = {
    to: TEST_EMAIL,
    subject: 'Test Email - Auto Speed Shop Notifications',
    html: `
      <h2>Email Test Successful! 🎉</h2>
      <p>This is a test email to verify that your Auto Speed Shop email notification system is working correctly.</p>
      <p><strong>Configuration verified:</strong></p>
      <ul>
        <li>SMTP connection established</li>
        <li>Email authentication successful</li>
        <li>Email delivery working</li>
      </ul>
      <p>Your users will now receive notifications when new products/parts are added!</p>
      <hr>
      <small>Auto Speed Shop Email System</small>
    `
  };

  try {
    // Test the API endpoint locally
    const response = await fetch('http://localhost:8080/api/sendNotification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmailData),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Email API test successful!');
      console.log('📊 Response:', result);
      console.log('\n🎉 Email notifications are now working correctly!');
      console.log('   Users will receive emails when new products are added.');
    } else {
      console.error('❌ Email API test failed');
      console.error('📊 Error response:', result);
      console.error('\n🔧 Check your email configuration and try again.');
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to email API:', error.message);
    console.error('\n🔧 Make sure your development server is running:');
    console.error('   npm run dev');
  }
}

// Run the test
testEmailAPI();