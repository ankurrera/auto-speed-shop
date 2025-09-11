#!/usr/bin/env node

/**
 * Simple test script to verify email notification functionality
 * This tests the EmailNotificationService without needing a full UI setup
 */

import { EmailNotificationService } from './src/services/emailNotificationService.js';

// Mock notification data
const testNotification = {
  productName: "Test Performance Exhaust",
  productDescription: "High-performance exhaust system for improved sound and power",
  price: 299.99,
  sellerName: "Test Seller",
  productType: "part",
  imageUrl: "https://example.com/test-image.jpg",
  sellerId: "test-seller-id",
};

async function testEmailNotifications() {
  console.log('🧪 Testing Email Notification Service...\n');
  
  try {
    console.log('📋 Test notification data:');
    console.log(JSON.stringify(testNotification, null, 2));
    console.log('\n⏳ Calling sendNewProductNotifications...\n');
    
    const result = await EmailNotificationService.sendNewProductNotifications(testNotification);
    
    console.log('✅ Test completed successfully!');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    
    if (result.notificationsSent > 0) {
      console.log(`\n🎉 SUCCESS: ${result.notificationsSent} email(s) would be sent to subscribers!`);
    } else {
      console.log('\n📬 No subscribers found, but the service is working correctly.');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    console.error('\n🔍 Full error:', error);
  }
}

// Run the test
testEmailNotifications();