import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ message: 'Missing required fields: to, subject, html' });
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASSWORD, // This should be an App Password, not the actual Gmail password
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter connection
  try {
    await transporter.verify();
    console.log('📧 SMTP server connection verified');
  } catch (verifyError) {
    console.error('❌ SMTP server connection failed:', verifyError);
    return res.status(500).json({ 
      message: 'Email service connection failed',
      error: verifyError.message
    });
  }

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: to,
    subject: subject,
    html: html,
  };

  try {
    // Check if environment variables are set
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASSWORD) {
      console.error('Missing environment variables: GMAIL_USER or GMAIL_PASSWORD not set');
      return res.status(500).json({ 
        message: 'Email service not configured - missing environment variables' 
      });
    }

    console.log(`📧 Attempting to send email to: ${to}`);
    console.log(`📧 From: ${process.env.GMAIL_USER}`);
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}:`, result.messageId);
    
    res.status(200).json({ 
      message: 'Email sent successfully!', 
      messageId: result.messageId 
    });
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    
    res.status(500).json({ 
      message: 'Failed to send email',
      error: error.message,
      code: error.code
    });
  }
}