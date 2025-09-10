import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { productData, subscriberEmails } = req.body;

  if (!productData || !subscriberEmails || !Array.isArray(subscriberEmails)) {
    return res.status(400).json({ message: 'Invalid request data' });
  }

  const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

  const { productName, productDescription, productPrice, productCategory, productType, sellerName } = productData;

  const subject = `New ${productType === 'part' ? 'Auto Part' : 'Product'} Available: ${productName}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px;">
        🚗 New ${productType === 'part' ? 'Auto Part' : 'Product'} Listed!
      </h2>
      
      <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">${productName}</h3>
        
        ${productCategory ? `<p><strong>Category:</strong> ${productCategory}</p>` : ''}
        
        ${productDescription ? `
          <p><strong>Description:</strong></p>
          <p style="color: #555; line-height: 1.6;">${productDescription}</p>
        ` : ''}
        
        <p style="font-size: 24px; color: #27ae60; font-weight: bold; margin: 15px 0;">
          $${productPrice.toFixed(2)}
        </p>
        
        ${sellerName ? `<p><strong>Seller:</strong> ${sellerName}</p>` : ''}
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/shop" 
           style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          View in Shop
        </a>
      </div>
      
      <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; color: #666; font-size: 12px;">
        <p>You're receiving this email because you've subscribed to new product notifications.</p>
        <p>To unsubscribe, please log into your account and update your notification preferences.</p>
      </div>
    </div>
  `;

  try {
    const emailPromises = subscriberEmails.map(email => 
      transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: email,
        subject: subject,
        html: htmlContent,
      })
    );

    await Promise.all(emailPromises);
    
    res.status(200).json({ 
      message: 'Notifications sent successfully',
      emailsSent: subscriberEmails.length 
    });
  } catch (error) {
    console.error('Error sending notification emails:', error);
    res.status(500).json({ message: 'Failed to send notification emails' });
  }
}
