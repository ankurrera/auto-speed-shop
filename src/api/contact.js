// src/api/contact.js

import nodemailer from 'nodemailer';

// This is the handler for your API endpoint.
// It will be triggered by a POST request from the frontend.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { firstName, lastName, email, phone, subject, message } = req.body;

  // Use Nodemailer to create a transporter with your email service provider details.
  // For production, consider using a dedicated service like SendGrid, Mailgun, etc.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER, // Your secondary email from .env.local
      pass: process.env.GMAIL_PASSWORD, // Your App Password from .env.local
    },
  });

  // Set up the email data.
  const mailOptions = {
    from: process.env.GMAIL_USER, // The sender address
    to: process.env.OFFICIAL_EMAIL, // The recipient address
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <p><strong>Name:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  };

  try {
    // Send the email and wait for the result.
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ message: 'Failed to send email.' });
  }
}