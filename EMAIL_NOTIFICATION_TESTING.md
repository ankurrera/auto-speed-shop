# Email Notification System Testing Guide

This document provides instructions for testing the fixed email notification system.

## What Was Fixed

The original issue was that email notifications showed "success" but no emails were actually sent. The root cause was:

1. **RLS Policy Conflict**: The frontend was trying to read `email_subscriptions` directly, but Row Level Security policies only allow:
   - Users to read their own subscriptions 
   - Admins to read all subscriptions (when `is_admin = true` in profiles table)

2. **Missing Server-Side Processing**: Email notifications need elevated permissions to read all subscribed users, which requires server-side processing.

## Solution Implemented

1. **Created Supabase Edge Function**: `send-new-product-notifications`
   - Uses service role key to bypass RLS and read all email subscriptions
   - Validates seller ownership before sending notifications  
   - Handles email sending with proper error reporting

2. **Updated Frontend Services**: 
   - `EmailNotificationService` now calls the Edge Function instead of reading subscriptions directly
   - Better error handling and user feedback

## Testing the Fix

### Prerequisites
- Supabase project with Edge Functions enabled
- Gmail credentials configured (optional for testing)
- At least one email subscription in the database

### Manual Testing Steps

1. **Deploy the Edge Function** (if using Supabase CLI):
   ```bash
   supabase functions deploy send-new-product-notifications
   ```

2. **Add Test Email Subscription** (via Supabase dashboard or SQL):
   ```sql
   INSERT INTO public.email_subscriptions (user_id, email, subscribed_to_new_products)
   VALUES ('your-user-id', 'test@example.com', true);
   ```

3. **Create a New Product/Part**:
   - Log into the application as a seller
   - Go to Account page → Manage Products
   - Add a new product or part
   - Watch for notification success/error messages

4. **Check Logs**:
   - **Browser Console**: Look for notification-related logs
   - **Supabase Logs**: Check Edge Function logs for email processing
   - **Email Service**: Check if emails were actually sent (if credentials configured)

### Expected Behavior

**With Email Credentials Configured**:
- ✅ Success toast: "Email notifications have been sent to subscribed users!"
- ✅ Console logs showing emails sent to each subscriber
- ✅ Actual emails delivered to subscribers

**Without Email Credentials**:
- ✅ Success toast: "Email notifications have been sent to subscribed users!"  
- ✅ Console logs showing simulated email sending
- ℹ️ Note in logs about missing Gmail credentials

**On Error**:
- ⚠️ Warning toast: "Product listed successfully, but there was an issue sending email notifications"
- ❌ Error details in console logs

### Environment Variables

For actual email sending, configure these in your Supabase project:

```
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password
SITE_URL=https://your-app-domain.com
```

### Debugging Common Issues

1. **"No subscribed users found"**: 
   - Check that email_subscriptions table has records with `subscribed_to_new_products = true`
   - Verify RLS policies allow the Edge Function to read subscriptions

2. **"Unauthorized: You can only send notifications for your own products"**:
   - Ensure the `sellerId` in the notification matches a seller owned by the current user

3. **"Failed to send email"**:
   - Check Gmail credentials are correctly configured
   - Verify the `/api/sendNotification` endpoint is accessible
   - Check email service logs for delivery issues

## Database Schema Validation

Ensure your email_subscriptions table matches the expected schema:

```sql
-- Check table structure
\d public.email_subscriptions;

-- Check RLS policies  
SELECT * FROM pg_policies WHERE tablename = 'email_subscriptions';

-- Check sample data
SELECT COUNT(*) FROM public.email_subscriptions WHERE subscribed_to_new_products = true;
```

## Files Modified

- `supabase/functions/send-new-product-notifications/index.ts` (new)
- `src/services/emailNotificationService.ts` (updated)  
- `src/pages/Account.tsx` (updated)