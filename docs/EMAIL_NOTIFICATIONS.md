# Email Notification System Setup

## Overview

This system automatically sends beautiful HTML email notifications to subscribed users when new products or parts are added to the inventory.

## Features

- ✅ **Simple Checkbox**: Users can subscribe/unsubscribe in Account settings
- ✅ **Beautiful HTML Emails**: Professional email templates with product images and details
- ✅ **Easy Unsubscribe**: Toggle off in account settings
- ✅ **Zero Additional Work**: Notifications are automatic when products are created
- ✅ **Product Creation Unchanged**: Existing workflow remains the same
- ✅ **Increased Visibility**: Automatic notifications to interested customers
- ✅ **Row Level Security**: Users only access their own subscription data
- ✅ **Server-side Processing**: Email credentials kept secure
- ✅ **Async Processing**: Email sending doesn't block product creation
- ✅ **Bulk Email Processing**: Efficient processing for multiple subscribers

## Database Changes

### 1. Notification Preferences
- Added `email_notifications` boolean field to `profiles` table
- Defaults to `false` (opt-in system)
- Protected by Row Level Security

### 2. Notification Tracking
- `product_notifications` table tracks sent emails
- Prevents duplicate notifications
- Provides audit trail

### 3. Async Queue System
- `product_notification_queue` table for background processing
- Database triggers automatically queue notifications
- Separate processing function handles email sending

## Frontend Changes

### Account Settings
- Added notification preference checkbox in profile section
- Clear description of what users will receive
- Instant save with confirmation message
- Preferences persist across sessions

## Backend Architecture

### Edge Functions

#### send-notification
- Processes email notification requests
- Beautiful HTML email templates
- Handles user preference checking
- Records sent notifications

#### process-queue
- Background processor for notification queue
- Retry logic for failed emails
- Bulk processing capabilities

### Database Functions

#### notify_new_product()
- Trigger function for new products/parts
- Automatically queues notifications
- Non-blocking product creation

#### process_notification_queue()
- Processes pending notifications
- Can be called periodically via cron

## Setup Instructions

### 1. Environment Variables

Add these to your Supabase Edge Function environment:

```bash
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FROM_EMAIL=noreply@autoparts.com
```

### 2. Deploy Edge Functions

```bash
# Deploy notification functions
supabase functions deploy send-notification
supabase functions deploy process-queue
```

### 3. Run Database Migrations

```bash
# Apply notification system migrations
supabase db push
```

### 4. Set up Periodic Processing (Optional)

For automatic queue processing, set up a cron job to call the process-queue function:

```bash
# Example: Process queue every 5 minutes
*/5 * * * * curl -X POST https://your-project.supabase.co/functions/v1/process-queue \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

## Email Template Features

- **Responsive Design**: Works on desktop and mobile
- **Product Images**: Primary image displayed prominently
- **Professional Styling**: Gradient headers and modern typography
- **Clear Call-to-Action**: "Shop Now" button
- **Easy Unsubscribe**: Link to account settings
- **Brand Consistency**: Auto Speed Shop branding

## Testing

### 1. Test Notification Preferences

1. Create user account
2. Navigate to Account settings
3. Check "Notify me about new products and parts"
4. Save changes
5. Verify confirmation message appears

### 2. Test Email Notifications

1. Ensure user has notifications enabled
2. Create new product/part as admin
3. Check notification queue: `SELECT * FROM product_notification_queue;`
4. Manually trigger queue processing or wait for cron job
5. Verify email was recorded: `SELECT * FROM product_notifications;`

### 3. Test Unsubscribe

1. Uncheck notification preference
2. Create new product/part
3. Verify no new notifications are queued for that user

## Security Features

- **Row Level Security**: All notification tables protected
- **Server-side Credentials**: SMTP settings stored securely
- **User Consent**: Opt-in only system
- **Audit Trail**: All sent notifications logged
- **Rate Limiting**: Queue processing limits prevent spam

## Performance Optimizations

- **Async Processing**: Product creation not blocked by email sending
- **Batch Processing**: Multiple notifications processed together
- **Indexed Queries**: Efficient database queries for subscribers
- **Retry Logic**: Failed emails automatically retried
- **Queue Limits**: Prevents overwhelming email servers

## Monitoring

### Key Metrics to Monitor

- Notification subscription rate
- Email delivery success rate
- Queue processing time
- Failed notification retry attempts

### Useful Queries

```sql
-- Check subscription rates
SELECT 
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_notifications = true) as subscribed_users,
  ROUND(COUNT(*) FILTER (WHERE email_notifications = true) * 100.0 / COUNT(*), 2) as subscription_rate
FROM profiles;

-- Check recent notifications
SELECT 
  COUNT(*) as notifications_sent,
  DATE(sent_at) as date
FROM product_notifications 
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- Check queue status
SELECT 
  status,
  COUNT(*) as count
FROM product_notification_queue
GROUP BY status;
```

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check SMTP configuration
   - Verify Edge Function deployment
   - Check notification queue for errors

2. **Users not receiving emails**
   - Verify user has notifications enabled
   - Check if user email is valid
   - Look for failed notifications in queue

3. **Duplicate notifications**
   - Check product_notifications table for existing records
   - Verify trigger logic

### Debug Commands

```sql
-- Check failed notifications
SELECT * FROM product_notification_queue WHERE status = 'failed';

-- Reset failed notifications for retry
UPDATE product_notification_queue 
SET status = 'pending', retry_count = 0 
WHERE status = 'failed';

-- Check user notification settings
SELECT user_id, email, email_notifications 
FROM profiles 
WHERE email_notifications = true;
```