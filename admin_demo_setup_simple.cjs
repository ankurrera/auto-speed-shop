#!/usr/bin/env node

/**
 * Demo setup script for admin account and product upload
 * Creates admin user with specified credentials and uploads a demo product
 * Tests email notification functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Admin credentials from requirements
const ADMIN_EMAIL = 'ankurr.era@gmail.com';
const ADMIN_PASS = '700028';

// Supabase configuration
const supabaseUrl = "https://dkopohqiihhxmbjhzark.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb3BvaHFpaWhoeG1iamh6YXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzE2NDMsImV4cCI6MjA3MTI0NzY0M30.6EF5ivhFPmK5B7Y_zLY-FkbN3LHAglvRHW7U0U5LoXA";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🚗 Auto Speed Shop - Admin Demo Setup');
console.log('='.repeat(50));

async function checkAdminExists() {
  console.log('\n📋 Checking if admin already exists...');
  
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('is_admin', { count: 'exact' })
      .eq('is_admin', true);
      
    if (error) {
      console.error('❌ Error checking admin existence:', error.message);
      return false;
    }
    
    const adminExists = (count || 0) > 0;
    console.log(`🔍 Admin exists: ${adminExists ? 'Yes' : 'No'} (${count || 0} admin(s) found)`);
    return adminExists;
  } catch (error) {
    console.error('❌ Error checking admin:', error.message);
    return false;
  }
}

async function createAdminUser() {
  console.log('\n👤 Creating admin user...');
  console.log(`📧 Email: ${ADMIN_EMAIL}`);
  console.log(`🔑 Password: ${ADMIN_PASS}`);
  
  try {
    // Step 1: Sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      options: {
        emailRedirectTo: 'http://localhost:8080/',
        data: { 
          first_name: 'Admin', 
          last_name: 'User',
          phone: '555-0123'
        },
      },
    });
    
    if (signUpError) {
      if (signUpError.message && signUpError.message.includes("User already registered")) {
        console.log('ℹ️ User already exists, attempting to sign in...');
        return await signInAdmin();
      } else {
        throw signUpError;
      }
    }
    
    if (!signUpData.user) {
      throw new Error('No user data returned from sign up');
    }
    
    console.log('✅ User account created successfully');
    
    // Step 2: Create profile with admin privileges
    await createAdminProfile(signUpData.user.id);
    
    return signUpData.user;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

async function signInAdmin() {
  console.log('\n🔐 Signing in admin user...');
  
  try {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
    });
    
    if (signInError) {
      throw signInError;
    }
    
    console.log('✅ Admin signed in successfully');
    return signInData.user;
    
  } catch (error) {
    console.error('❌ Error signing in admin:', error.message);
    throw error;
  }
}

async function createAdminProfile(userId) {
  console.log('\n📝 Creating admin profile...');
  
  try {
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        user_id: userId,
        first_name: 'Admin',
        last_name: 'User',
        email: ADMIN_EMAIL,
        phone: '555-0123',
        is_admin: true,
        is_seller: true, // Admin can also be a seller to upload products
        role: 'admin',
      },
      { onConflict: 'user_id' }
    );
    
    if (profileError) {
      throw profileError;
    }
    
    console.log('✅ Admin profile created successfully');
    
  } catch (error) {
    console.error('❌ Error creating admin profile:', error.message);
    throw error;
  }
}

async function createDemoProduct(userId) {
  console.log('\n🛠️ Creating demo product...');
  
  const demoProduct = {
    name: 'Performance Exhaust System - Demo',
    description: 'High-performance stainless steel exhaust system for improved sound and power. This is a demo product to test email notifications.',
    price: 299.99,
    category: 'Exhaust',
    brand: 'SpeedPro',
    compatibility: 'Universal fit for most vehicles',
    image_url: 'https://via.placeholder.com/300x200/333/fff?text=Demo+Exhaust+System',
    stock_quantity: 10,
    seller_id: userId,
    sku: `DEMO-EXH-${Date.now()}`,
    weight: 25.5,
    dimensions: '48" x 6" x 6"',
    material: 'Stainless Steel',
    warranty: '2 years',
    installation_difficulty: 'Moderate',
    is_featured: true,
  };
  
  try {
    const { data: productData, error: productError } = await supabase
      .from('products')
      .insert([demoProduct])
      .select()
      .single();
    
    if (productError) {
      throw productError;
    }
    
    console.log('✅ Demo product created successfully:');
    console.log(`   📦 Name: ${productData.name}`);
    console.log(`   💰 Price: $${productData.price}`);
    console.log(`   🏷️ SKU: ${productData.sku}`);
    console.log(`   🆔 Product ID: ${productData.id}`);
    
    return productData;
    
  } catch (error) {
    console.error('❌ Error creating demo product:', error.message);
    throw error;
  }
}

async function createDemoPart(userId) {
  console.log('\n⚙️ Creating demo part...');
  
  const demoPart = {
    name: 'High-Performance Air Filter - Demo',
    description: 'Cotton gauze air filter for increased airflow and engine performance. This is a demo part to test email notifications.',
    price: 49.99,
    category: 'Engine',
    brand: 'FilterMax',
    part_number: `DEMO-AF-${Date.now()}`,
    compatibility: 'Honda Civic 2016-2023, Accord 2018-2023',
    image_url: 'https://via.placeholder.com/300x200/666/fff?text=Demo+Air+Filter',
    stock_quantity: 25,
    seller_id: userId,
    weight: 1.2,
    dimensions: '12" x 8" x 2"',
    material: 'Cotton Gauze',
    warranty: '1 year',
    is_oem: false,
    condition: 'new',
  };
  
  try {
    const { data: partData, error: partError } = await supabase
      .from('parts')
      .insert([demoPart])
      .select()
      .single();
    
    if (partError) {
      throw partError;
    }
    
    console.log('✅ Demo part created successfully:');
    console.log(`   🔧 Name: ${partData.name}`);
    console.log(`   💰 Price: $${partData.price}`);
    console.log(`   🏷️ Part Number: ${partData.part_number}`);
    console.log(`   🆔 Part ID: ${partData.id}`);
    
    return partData;
    
  } catch (error) {
    console.error('❌ Error creating demo part:', error.message);
    throw error;
  }
}

async function createDemoSubscriber() {
  console.log('\n📬 Creating demo email subscriber...');
  
  try {
    const { error: subscriberError } = await supabase
      .from('email_subscriptions')
      .insert([{
        user_id: null, // Can be null for guest subscriptions
        email: 'demo.subscriber@example.com',
        subscribed_to_new_products: true,
        subscribed_to_promotions: true,
        created_at: new Date().toISOString(),
      }]);
    
    if (subscriberError) {
      throw subscriberError;
    }
    
    console.log('✅ Demo email subscriber created: demo.subscriber@example.com');
    
  } catch (error) {
    console.error('❌ Error creating demo subscriber:', error.message);
  }
}

async function testEmailNotifications(product, part) {
  console.log('\n📧 Testing email notifications...');
  
  try {
    // Check if we have email subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('email_subscriptions')
      .select('*')
      .eq('subscribed_to_new_products', true);
    
    if (subscribersError) {
      console.error('❌ Error fetching subscribers:', subscribersError.message);
      return;
    }
    
    console.log(`📬 Found ${subscribers?.length || 0} email subscribers`);
    
    if (!subscribers || subscribers.length === 0) {
      console.log('ℹ️ No email subscribers found. Adding a demo subscriber...');
      await createDemoSubscriber();
    }
    
    console.log('✅ Email notification test data prepared');
    console.log('ℹ️ To fully test email notifications, run the app and observe the email service in action');
    
  } catch (error) {
    console.error('❌ Error testing email notifications:', error.message);
  }
}

async function main() {
  try {
    // Step 1: Check if admin exists
    const adminExists = await checkAdminExists();
    
    let adminUser;
    
    if (adminExists) {
      console.log('ℹ️ Admin already exists, signing in...');
      adminUser = await signInAdmin();
    } else {
      console.log('ℹ️ No admin found, creating new admin...');
      adminUser = await createAdminUser();
    }
    
    if (!adminUser) {
      throw new Error('Failed to get admin user');
    }
    
    // Step 2: Create demo product and part
    const demoProduct = await createDemoProduct(adminUser.id);
    const demoPart = await createDemoPart(adminUser.id);
    
    // Step 3: Test email notifications
    await testEmailNotifications(demoProduct, demoPart);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Admin Demo Setup Complete!');
    console.log('='.repeat(50));
    console.log('\n📋 Summary:');
    console.log(`✅ Admin User: ${ADMIN_EMAIL}`);
    console.log(`✅ Demo Product: ${demoProduct.name} (ID: ${demoProduct.id})`);
    console.log(`✅ Demo Part: ${demoPart.name} (ID: ${demoPart.id})`);
    console.log('✅ Email notification testing prepared');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Open the application: http://localhost:8080');
    console.log('2. Click the User icon to access Account page');
    console.log('3. Use Admin Login with the credentials above');
    console.log('4. Navigate to Admin Dashboard to see the demo products');
    console.log('5. Try creating another product to test email notifications');
    
    console.log('\n📧 Email Testing:');
    console.log('- Demo products will stay in the database as requested');
    console.log('- Email notifications will be triggered for new products');
    console.log('- Check console logs and email delivery for verification');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
main();