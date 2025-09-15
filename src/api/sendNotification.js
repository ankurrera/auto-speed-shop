import { ServerEmailService } from '../services/serverEmailService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, html' });
  }

  try {
    console.log(`📧 Single notification request received for: ${to}`);
    
    // Validate email service configuration first
    if (!ServerEmailService.validateConfiguration()) {
      return res.status(500).json({ 
        message: 'Email service configuration error. Please check server environment variables.',
        error: 'Missing required GMAIL_USER or GMAIL_PASSWORD environment variables'
      });
    }
    
    const success = await ServerEmailService.sendNotification(to, subject, html);
    if (success) {
      res.status(200).json({ message: 'Email sent successfully!' });
    } else {
      res.status(500).json({ 
        message: 'Failed to send email.',
        error: 'Email sending failed - check server logs for details'
      });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      message: 'Failed to send email.',
      error: error.message || 'Unknown error occurred'
    });
  }
}