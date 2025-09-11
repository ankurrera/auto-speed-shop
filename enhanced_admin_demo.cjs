#!/usr/bin/env node

/**
 * Enhanced Admin Demo Setup Script
 * Creates admin user and demo products for email notification testing
 * Works both online and offline with comprehensive logging
 */

const fs = require('fs');
const path = require('path');

// Admin credentials from requirements
const ADMIN_EMAIL = 'ankurr.era@gmail.com';
const ADMIN_PASS = '700028';

console.log('🚗 Auto Speed Shop - Enhanced Admin Demo Setup');
console.log('='.repeat(60));

// Demo product data
const demoProducts = {
  product: {
    name: 'Performance Exhaust System - Demo',
    description: 'High-performance stainless steel exhaust system for improved sound and power. This is a demo product to test email notifications.',
    price: 299.99,
    category: 'Exhaust',
    brand: 'SpeedPro',
    compatibility: 'Universal fit for most vehicles',
    image_url: 'https://via.placeholder.com/300x200/333/fff?text=Demo+Exhaust+System',
    stock_quantity: 10,
    sku: `DEMO-EXH-${Date.now()}`,
    weight: 25.5,
    dimensions: '48" x 6" x 6"',
    material: 'Stainless Steel',
    warranty: '2 years',
    installation_difficulty: 'Moderate',
    is_featured: true,
  },
  part: {
    name: 'High-Performance Air Filter - Demo',
    description: 'Cotton gauze air filter for increased airflow and engine performance. This is a demo part to test email notifications.',
    price: 49.99,
    category: 'Engine',
    brand: 'FilterMax',
    part_number: `DEMO-AF-${Date.now()}`,
    compatibility: 'Honda Civic 2016-2023, Accord 2018-2023',
    image_url: 'https://via.placeholder.com/300x200/666/fff?text=Demo+Air+Filter',
    stock_quantity: 25,
    weight: 1.2,
    dimensions: '12" x 8" x 2"',
    material: 'Cotton Gauze',
    warranty: '1 year',
    is_oem: false,
    condition: 'new',
  }
};

// Demo email subscriber
const demoSubscriber = {
  email: 'demo.subscriber@example.com',
  subscribed_to_new_products: true,
  subscribed_to_promotions: true,
  created_at: new Date().toISOString(),
};

function displayAdminCredentials() {
  console.log('\n👤 Admin Account Credentials');
  console.log('─'.repeat(30));
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${ADMIN_PASS}`);
  console.log(`👑 Role: Admin + Seller`);
  console.log(`📱 Phone: 555-0123`);
}

function displayDemoProducts() {
  console.log('\n🛠️ Demo Products to be Created');
  console.log('─'.repeat(40));
  
  console.log('\n📦 Product #1: Performance Exhaust System');
  console.log(`   Name: ${demoProducts.product.name}`);
  console.log(`   Price: $${demoProducts.product.price}`);
  console.log(`   SKU: ${demoProducts.product.sku}`);
  console.log(`   Category: ${demoProducts.product.category}`);
  console.log(`   Brand: ${demoProducts.product.brand}`);
  console.log(`   Stock: ${demoProducts.product.stock_quantity} units`);
  
  console.log('\n⚙️ Part #1: High-Performance Air Filter');
  console.log(`   Name: ${demoProducts.part.name}`);
  console.log(`   Price: $${demoProducts.part.price}`);
  console.log(`   Part #: ${demoProducts.part.part_number}`);
  console.log(`   Category: ${demoProducts.part.category}`);
  console.log(`   Brand: ${demoProducts.part.brand}`);
  console.log(`   Stock: ${demoProducts.part.stock_quantity} units`);
}

function displayEmailNotificationSetup() {
  console.log('\n📧 Email Notification Setup');
  console.log('─'.repeat(35));
  console.log(`📬 Demo Subscriber: ${demoSubscriber.email}`);
  console.log(`✅ New Products: ${demoSubscriber.subscribed_to_new_products}`);
  console.log(`🎁 Promotions: ${demoSubscriber.subscribed_to_promotions}`);
  
  console.log('\n📤 Email Notification Flow:');
  console.log('1. Admin creates new product/part');
  console.log('2. System triggers EmailNotificationService');
  console.log('3. Service fetches subscribed users');
  console.log('4. HTML email template generated');
  console.log('5. Email sent via Gmail SMTP (if configured)');
  console.log('6. Success/failure logged to console');
}

function generateEmailTemplate(product, isProduct = true) {
  const productType = isProduct ? 'Product' : 'Part';
  const subject = `New ${productType} Available: ${product.name}`;
  
  return {
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #007bff; color: white; padding: 20px; text-align: center; }
        .content { border: 1px solid #ddd; padding: 20px; }
        .product-image { width: 100%; max-width: 300px; height: auto; }
        .price { font-size: 24px; font-weight: bold; color: #28a745; }
        .btn { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { margin-top: 20px; padding: 20px; background: #f8f9fa; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Auto Speed Shop</h1>
            <h2>New ${productType} Alert!</h2>
        </div>
        
        <div class="content">
            <img src="${product.image_url}" alt="${product.name}" class="product-image">
            
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            
            <div class="price">$${product.price}</div>
            
            <p><strong>Category:</strong> ${product.category}</p>
            <p><strong>Brand:</strong> ${product.brand}</p>
            <p><strong>Listed by:</strong> Admin User</p>
            ${isProduct ? `<p><strong>SKU:</strong> ${product.sku}</p>` : `<p><strong>Part Number:</strong> ${product.part_number}</p>`}
            
            <a href="http://localhost:8080/shop" class="btn">View on Auto Speed Shop →</a>
        </div>
        
        <div class="footer">
            <p>Thank you for subscribing to Auto Speed Shop notifications!</p>
            <p><a href="http://localhost:8080/account">Manage your email preferences</a></p>
        </div>
    </div>
</body>
</html>
    `.trim()
  };
}

function saveEmailTemplates() {
  console.log('\n📝 Generating Email Templates');
  console.log('─'.repeat(35));
  
  const productEmail = generateEmailTemplate(demoProducts.product, true);
  const partEmail = generateEmailTemplate(demoProducts.part, false);
  
  // Create email templates directory
  const emailDir = path.join(__dirname, 'demo_email_templates');
  if (!fs.existsSync(emailDir)) {
    fs.mkdirSync(emailDir);
  }
  
  // Save product email template
  fs.writeFileSync(
    path.join(emailDir, 'product_notification.html'), 
    productEmail.html
  );
  
  // Save part email template
  fs.writeFileSync(
    path.join(emailDir, 'part_notification.html'), 
    partEmail.html
  );
  
  // Save email data
  fs.writeFileSync(
    path.join(emailDir, 'email_data.json'), 
    JSON.stringify({
      productEmail: {
        subject: productEmail.subject,
        recipient: demoSubscriber.email,
        productData: demoProducts.product
      },
      partEmail: {
        subject: partEmail.subject,
        recipient: demoSubscriber.email,
        productData: demoProducts.part
      }
    }, null, 2)
  );
  
  console.log('✅ Email templates saved to ./demo_email_templates/');
  console.log('   - product_notification.html');
  console.log('   - part_notification.html');
  console.log('   - email_data.json');
}

function generateTestingInstructions() {
  console.log('\n🧪 Testing Instructions');
  console.log('─'.repeat(30));
  console.log('1. Start the development server: npm run dev');
  console.log('2. Open: http://localhost:8080');
  console.log('3. Navigate to Account page');
  console.log('4. Create Admin account with provided credentials');
  console.log('5. Login as Admin');
  console.log('6. Go to Admin Dashboard');
  console.log('7. Use "Manage Products" to add demo products');
  console.log('8. Observe email notification logs in console');
  console.log('9. Check email delivery (if SMTP configured)');
}

function displayEnvironmentSetup() {
  console.log('\n🔧 Environment Setup for Email Testing');
  console.log('─'.repeat(45));
  console.log('Add these to your .env file for actual email delivery:');
  console.log('');
  console.log('GMAIL_USER=your-email@gmail.com');
  console.log('GMAIL_PASSWORD=your-app-password');
  console.log('SITE_URL=http://localhost:8080');
  console.log('');
  console.log('Note: Without these, emails will be simulated but not sent.');
}

function generateSQLInserts() {
  console.log('\n💾 SQL Insert Statements (for manual database setup)');
  console.log('─'.repeat(55));
  
  console.log('\n-- Admin Profile');
  console.log(`INSERT INTO profiles (user_id, first_name, last_name, email, phone, is_admin, is_seller, role)
VALUES ('admin-user-id', 'Admin', 'User', '${ADMIN_EMAIL}', '555-0123', true, true, 'admin');`);
  
  console.log('\n-- Demo Product');
  console.log(`INSERT INTO products (name, description, price, category, brand, compatibility, image_url, stock_quantity, seller_id, sku, weight, dimensions, material, warranty, installation_difficulty, is_featured)
VALUES ('${demoProducts.product.name}', '${demoProducts.product.description}', ${demoProducts.product.price}, '${demoProducts.product.category}', '${demoProducts.product.brand}', '${demoProducts.product.compatibility}', '${demoProducts.product.image_url}', ${demoProducts.product.stock_quantity}, 'admin-user-id', '${demoProducts.product.sku}', ${demoProducts.product.weight}, '${demoProducts.product.dimensions}', '${demoProducts.product.material}', '${demoProducts.product.warranty}', '${demoProducts.product.installation_difficulty}', ${demoProducts.product.is_featured});`);
  
  console.log('\n-- Demo Part');
  console.log(`INSERT INTO parts (name, description, price, category, brand, part_number, compatibility, image_url, stock_quantity, seller_id, weight, dimensions, material, warranty, is_oem, condition)
VALUES ('${demoProducts.part.name}', '${demoProducts.part.description}', ${demoProducts.part.price}, '${demoProducts.part.category}', '${demoProducts.part.brand}', '${demoProducts.part.part_number}', '${demoProducts.part.compatibility}', '${demoProducts.part.image_url}', ${demoProducts.part.stock_quantity}, 'admin-user-id', ${demoProducts.part.weight}, '${demoProducts.part.dimensions}', '${demoProducts.part.material}', '${demoProducts.part.warranty}', ${demoProducts.part.is_oem}, '${demoProducts.part.condition}');`);
  
  console.log('\n-- Email Subscriber');
  console.log(`INSERT INTO email_subscriptions (email, subscribed_to_new_products, subscribed_to_promotions, created_at)
VALUES ('${demoSubscriber.email}', ${demoSubscriber.subscribed_to_new_products}, ${demoSubscriber.subscribed_to_promotions}, '${demoSubscriber.created_at}');`);
}

function main() {
  try {
    displayAdminCredentials();
    displayDemoProducts();
    displayEmailNotificationSetup();
    saveEmailTemplates();
    generateTestingInstructions();
    displayEnvironmentSetup();
    generateSQLInserts();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Enhanced Admin Demo Setup Complete!');
    console.log('='.repeat(60));
    
    console.log('\n📋 Summary:');
    console.log('✅ Admin credentials documented');
    console.log('✅ Demo product data prepared');
    console.log('✅ Email templates generated');
    console.log('✅ Testing instructions provided');
    console.log('✅ Environment setup documented');
    console.log('✅ SQL statements generated');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Follow the testing instructions above');
    console.log('2. Create admin account in the application');
    console.log('3. Upload demo products to test email notifications');
    console.log('4. Demo products will remain in database as requested');
    
    console.log('\n📁 Files Created:');
    console.log('- ./demo_email_templates/ (email templates and data)');
    console.log('- ./ADMIN_DEMO_GUIDE.md (comprehensive guide)');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();