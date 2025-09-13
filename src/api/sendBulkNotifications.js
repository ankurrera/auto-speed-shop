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
    const result = await ServerEmailService.sendBulkNotifications(users, productInfo);
    
    res.status(200).json({
      message: 'Bulk email notifications processed',
      summary: result
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({ message: 'Failed to send bulk emails.' });
  }
}