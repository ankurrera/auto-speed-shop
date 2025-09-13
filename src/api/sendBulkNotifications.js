import { ServerEmailService } from '../services/serverEmailService.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { users, productInfo } = req.body;

  if (!users || !Array.isArray(users) || !productInfo) {
    return res.status(400).json({ 
      message: 'Missing required fields: users (array), productInfo (object)' 
    });
  }

  if (users.length === 0) {
    return res.status(400).json({ message: 'Users array cannot be empty' });
  }

  try {
    console.log(`🚀 Bulk notification request received for ${users.length} users`);
    
    // Validate email service configuration first
    if (!ServerEmailService.validateConfiguration()) {
      return res.status(500).json({ 
        message: 'Email service configuration error. Please check server environment variables.',
        error: 'Missing required GMAIL_USER or GMAIL_PASSWORD environment variables'
      });
    }
    
    const result = await ServerEmailService.sendBulkNotifications(users, productInfo);
    
    const responseMessage = result.failCount > 0 
      ? `Bulk emails partially completed: ${result.successCount} sent, ${result.failCount} failed`
      : `All ${result.successCount} bulk emails sent successfully`;
    
    const statusCode = result.failCount > 0 ? 207 : 200; // 207 = Multi-Status for partial success
    
    res.status(statusCode).json({
      message: responseMessage,
      summary: result
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({ 
      message: 'Failed to send bulk emails.',
      error: error.message || 'Unknown error occurred'
    });
  }
}