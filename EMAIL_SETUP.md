# Email Service Configuration

This document explains how to configure the email notification service for the Auto Speed Shop application.

## Required Environment Variables

The email service requires the following environment variables to be set:

### GMAIL_USER
- **Description**: Your Gmail email address
- **Example**: `your-email@gmail.com`
- **Required**: Yes

### GMAIL_PASSWORD  
- **Description**: Your Gmail app password (NOT your regular Gmail password)
- **Example**: `abcd efgh ijkl mnop` (16-character app password)
- **Required**: Yes

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" as the app
   - Copy the generated 16-character password
   - Use this password in the `GMAIL_PASSWORD` environment variable

3. **Set Environment Variables**
   
   For local development, create a `.env` file in your project root:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_PASSWORD=your-16-char-app-password
   FRONTEND_URL=http://localhost:8080
   ```

   For Vercel deployment, set these in your Vercel dashboard under Environment Variables.

## Testing the Configuration

You can test if your email configuration is working by:

1. Checking the server logs for configuration validation messages
2. Looking for SMTP connection verification messages in the logs
3. Testing with a single notification first before bulk notifications

## Common Issues

### "GMAIL_USER environment variable is not set"
- Make sure you've set the `GMAIL_USER` environment variable
- For Vercel: Check your project's Environment Variables settings

### "GMAIL_PASSWORD environment variable is not set"  
- Make sure you've set the `GMAIL_PASSWORD` environment variable
- Use an app password, not your regular Gmail password

### "SMTP connection verification failed"
- Check that your Gmail app password is correct
- Ensure 2-factor authentication is enabled on your Google account
- Verify the app password was generated correctly

### "Authentication failed"
- Double-check that you're using an app password, not your regular password
- Make sure the Gmail address and app password match

## Security Notes

- Never commit your `.env` file to version control
- Use app passwords instead of regular passwords for better security
- Consider using OAuth2 for production environments for enhanced security