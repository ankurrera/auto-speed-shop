# Email Notification Setup Guide

## Problem
Users report that email notifications show as "sent" in the console logs but emails are not actually received.

## Root Cause
The issue occurs because:
1. Environment variables for email authentication are not configured
2. Gmail SMTP requires App Passwords for authentication (not regular passwords)
3. Missing error handling was hiding authentication failures

## Solution

### 1. Environment Variables Setup
Create a `.env` file in the project root with the following variables:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_PASSWORD=your-app-password-here
```

### 2. Gmail App Password Setup
Since Gmail requires App Passwords for SMTP authentication:

1. **Enable 2-Factor Authentication**:
   - Go to your Google Account settings
   - Enable 2-factor authentication if not already enabled

2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" as the app and "Other" as the device
   - Generate a 16-character app password
   - Use this app password as `GMAIL_PASSWORD` (not your regular Gmail password)

### 3. Alternative Email Providers
If you prefer not to use Gmail, you can configure other SMTP providers:

**SendGrid:**
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

**Outlook/Hotmail:**
```javascript
const transporter = nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASSWORD
  }
});
```

### 4. Testing
After setting up environment variables, test the email functionality:

```bash
# Start the development server
npm run dev

# In another terminal, test email notifications
# (This will happen automatically when new products are added)
```

### 5. Production Deployment
For production (Vercel), add environment variables in the Vercel dashboard:
- Go to your project → Settings → Environment Variables
- Add `GMAIL_USER` and `GMAIL_PASSWORD`

## Verification
- Console logs should show successful email sending with message IDs
- Users should receive actual emails in their inbox
- Failed emails will now show detailed error messages in the console

## Security Notes
- Never commit `.env` files to version control
- Use App Passwords instead of regular passwords for Gmail
- Consider using dedicated email services like SendGrid for production