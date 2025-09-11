# Admin Demo Setup & Email Testing Guide

This guide demonstrates how to set up an admin account with the specified credentials and test email notifications for product uploads.

## 📋 Requirements Implementation

- **Admin Email**: `ankurr.era@gmail.com`
- **Admin Password**: `700028`
- **Task**: Upload demo project from admin account to test email notifications
- **Requirement**: Keep demo products in database (do not remove)

## 🚀 Quick Start

### Step 1: Admin Account Setup

The admin account uses the following credentials:
- **Email**: `ankurr.era@gmail.com`
- **Password**: `700028`
- **Role**: Admin with seller privileges
- **Name**: Admin User

### Step 2: Admin Signup Process

1. Navigate to: `http://localhost:8080/account`
2. Click "Sign up" to switch to registration mode
3. Select "Admin Signup" tab
4. Fill in the form:
   - First Name: `Admin`
   - Last Name: `User`
   - Email: `ankurr.era@gmail.com`
   - Phone: `555-0123`
   - Password: `700028`
5. Click "Sign Up"

![Admin Signup Form](https://github.com/user-attachments/assets/36ef3920-8ba1-4014-96ec-682e57af1c2f)

### Step 3: Admin Login Process

1. After signup, switch to "Admin Login" mode
2. Enter credentials:
   - Email: `ankurr.era@gmail.com`
   - Password: `700028`
3. Click "Login"
4. System will redirect to admin dashboard

## 🛠️ Demo Product Upload

### Products to be Created

#### 1. Performance Exhaust System (Product)
```json
{
  "name": "Performance Exhaust System - Demo",
  "description": "High-performance stainless steel exhaust system for improved sound and power. This is a demo product to test email notifications.",
  "price": 299.99,
  "category": "Exhaust",
  "brand": "SpeedPro",
  "compatibility": "Universal fit for most vehicles",
  "image_url": "https://via.placeholder.com/300x200/333/fff?text=Demo+Exhaust+System",
  "stock_quantity": 10,
  "sku": "DEMO-EXH-{timestamp}",
  "weight": 25.5,
  "dimensions": "48\" x 6\" x 6\"",
  "material": "Stainless Steel",
  "warranty": "2 years",
  "installation_difficulty": "Moderate",
  "is_featured": true
}
```

#### 2. High-Performance Air Filter (Part)
```json
{
  "name": "High-Performance Air Filter - Demo",
  "description": "Cotton gauze air filter for increased airflow and engine performance. This is a demo part to test email notifications.",
  "price": 49.99,
  "category": "Engine",
  "brand": "FilterMax",
  "part_number": "DEMO-AF-{timestamp}",
  "compatibility": "Honda Civic 2016-2023, Accord 2018-2023",
  "image_url": "https://via.placeholder.com/300x200/666/fff?text=Demo+Air+Filter",
  "stock_quantity": 25,
  "weight": 1.2,
  "dimensions": "12\" x 8\" x 2\"",
  "material": "Cotton Gauze",
  "warranty": "1 year",
  "is_oem": false,
  "condition": "new"
}
```

## 📧 Email Notification Testing

### Email Subscription Setup

Demo email subscriber will be created:
```json
{
  "email": "demo.subscriber@example.com",
  "subscribed_to_new_products": true,
  "subscribed_to_promotions": true
}
```

### Email Notification Flow

1. **Product Creation**: When admin creates a new product/part
2. **Subscriber Lookup**: System finds all users subscribed to new product notifications
3. **Email Generation**: Creates HTML email with product details
4. **Email Delivery**: Sends via configured email service (Gmail SMTP)
5. **Logging**: Records success/failure in console and logs

### Email Template Preview

```html
Subject: New Part Available: Performance Exhaust System

<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">🚗 Auto Speed Shop - New Part Alert!</h1>
  
  <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
    <img src="product-image-url" alt="Product Image" style="width: 100%; max-width: 300px;">
    
    <h2>Performance Exhaust System</h2>
    <p>High-performance exhaust for improved sound and power</p>
    
    <p><strong>Price:</strong> $299.99</p>
    <p><strong>Listed by:</strong> Admin User</p>
    
    <a href="product-url" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      View on Auto Speed Shop →
    </a>
  </div>
  
  <p><small>Manage email preferences: <a href="/account">Account Settings</a></small></p>
</div>
```

## 🔧 Technical Implementation

### Database Tables Used

1. **profiles**: Admin user information
2. **products**: Demo product storage
3. **parts**: Demo parts storage
4. **email_subscriptions**: Email notification subscribers

### Email Service Integration

- **Service**: Gmail SMTP via Nodemailer
- **Configuration**: Environment variables for credentials
- **Edge Function**: Supabase function for email processing
- **API Endpoint**: `/api/sendNotification` for email delivery

### Admin Dashboard Features

- **Product Management**: Create, edit, delete products/parts
- **User Management**: View and manage user accounts
- **Order Management**: Track and manage orders
- **Analytics**: Sales and performance metrics
- **Email Testing**: Send test notifications

## 🧪 Testing Procedure

### Manual Testing Steps

1. **Setup Admin Account** (as shown above)
2. **Login as Admin** with provided credentials
3. **Navigate to Admin Dashboard**
4. **Click "Manage Products"**
5. **Add New Product** with demo data
6. **Observe Email Notifications**:
   - Check browser console for notification logs
   - Verify email subscriber lookup
   - Confirm email sending attempts
   - Monitor for success/error messages

### Expected Results

✅ **With Email Configuration**:
- Admin account created successfully
- Demo products saved to database
- Email notifications sent to subscribers
- Console shows: "Email notifications sent to X users"
- Actual emails delivered (if SMTP configured)

✅ **Without Email Configuration**:
- Admin account created successfully
- Demo products saved to database
- Console shows: "Simulating email send (no SMTP configured)"
- Success message displayed to user

### Verification Checklist

- [ ] Admin user exists in profiles table with `is_admin = true`
- [ ] Demo products exist in products/parts tables
- [ ] Email subscribers exist in email_subscriptions table
- [ ] Product creation triggers email notification flow
- [ ] Console logs show email processing steps
- [ ] Products remain in database (not deleted)

## 🚨 Important Notes

1. **Demo Data Persistence**: All demo products will remain in the database as requested
2. **Email Credentials**: Configure Gmail credentials in environment variables for actual email sending
3. **Network Requirements**: Ensure Supabase connection is available for full functionality
4. **Testing Environment**: This setup works in both development and production environments

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify network connectivity to Supabase
3. Confirm email configuration (if testing email delivery)
4. Review the EMAIL_NOTIFICATION_TESTING.md file for additional troubleshooting

---

**Demo Products Status**: Products will remain in the database for ongoing testing and verification. 🚗✨