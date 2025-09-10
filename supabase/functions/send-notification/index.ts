import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface EmailRequest {
  type: 'new_product' | 'new_part';
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_urls?: string[];
    category?: string;
    brand?: string;
  };
}

interface NotificationUser {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { type, item }: EmailRequest = await req.json();

    if (!type || !item) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: type and item' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all users who have opted in for email notifications
    const { data: usersToNotify, error: usersError } = await supabase
      .from('profiles')
      .select('user_id, email, first_name, last_name')
      .eq('email_notifications', true)
      .not('email', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch notification users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!usersToNotify || usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No users to notify', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check which users have already been notified about this item
    const { data: existingNotifications, error: notificationError } = await supabase
      .from('product_notifications')
      .select('user_id')
      .eq(type === 'new_product' ? 'product_id' : 'part_id', item.id);

    if (notificationError) {
      console.error('Error checking existing notifications:', notificationError);
    }

    const notifiedUserIds = new Set(
      existingNotifications?.map(n => n.user_id) || []
    );

    // Filter out users who have already been notified
    const usersToEmail = usersToNotify.filter(
      user => !notifiedUserIds.has(user.user_id)
    );

    if (usersToEmail.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All eligible users already notified', sent: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Email configuration
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '587');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS');
    const fromEmail = Deno.env.get('FROM_EMAIL') || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('Missing SMTP configuration');
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate HTML email template
    const generateEmailHTML = (user: NotificationUser, item: any, type: string) => {
      const firstName = user.first_name || 'Valued Customer';
      const itemType = type === 'new_product' ? 'Product' : 'Part';
      const primaryImage = item.image_urls && item.image_urls.length > 0 
        ? item.image_urls[0] 
        : 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=500';

      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New ${itemType} Available - Auto Speed Shop</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px 20px;
        }
        .product-card {
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            overflow: hidden;
            margin: 20px 0;
        }
        .product-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
        }
        .product-info {
            padding: 20px;
        }
        .product-name {
            font-size: 20px;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 10px 0;
        }
        .product-price {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
            margin: 10px 0;
        }
        .product-description {
            color: #4a5568;
            margin: 10px 0;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }
        .btn:hover {
            transform: translateY(-2px);
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .unsubscribe {
            color: #6c757d;
            text-decoration: underline;
            font-size: 12px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 0;
            }
            .content {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Auto Speed Shop</h1>
            <p>New ${itemType} Alert</p>
        </div>
        
        <div class="content">
            <h2>Hi ${firstName}!</h2>
            <p>Great news! A new ${itemType.toLowerCase()} has just been added to our inventory that we think you'll love.</p>
            
            <div class="product-card">
                <img src="${primaryImage}" alt="${item.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${item.name}</h3>
                    <div class="product-price">$${item.price.toFixed(2)}</div>
                    ${item.category ? `<p><strong>Category:</strong> ${item.category}</p>` : ''}
                    ${item.brand ? `<p><strong>Brand:</strong> ${item.brand}</p>` : ''}
                    <p class="product-description">${item.description}</p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="${supabaseUrl.replace('supabase.co', 'vercel.app')}/shop" class="btn">
                    Shop Now
                </a>
            </div>
            
            <p>Don't wait too long - popular items sell fast!</p>
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you opted in to receive notifications about new products and parts.</p>
            <p>
                <a href="${supabaseUrl.replace('supabase.co', 'vercel.app')}/account" class="unsubscribe">
                    Manage your notification preferences
                </a>
            </p>
            <p>&copy; 2025 Auto Speed Shop. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
    };

    // Send emails using fetch to a third-party email service or SMTP
    const emailPromises = usersToEmail.map(async (user) => {
      try {
        const htmlContent = generateEmailHTML(user, item, type);
        const subject = `🚗 New ${type === 'new_product' ? 'Product' : 'Part'} Available: ${item.name}`;

        // Using a simple SMTP approach via fetch to an email service
        // For production, you might want to use a service like SendGrid, Postmark, etc.
        const emailData = {
          from: fromEmail,
          to: user.email,
          subject: subject,
          html: htmlContent,
          text: `Hi ${user.first_name || 'Valued Customer'}!\n\nA new ${type === 'new_product' ? 'product' : 'part'} is now available: ${item.name}\nPrice: $${item.price.toFixed(2)}\n\n${item.description}\n\nVisit our shop to learn more!\n\nAuto Speed Shop Team`
        };

        // Here you would integrate with your preferred email service
        // For now, we'll simulate sending and just log the email
        console.log(`Email would be sent to ${user.email}:`, subject);

        // Record the notification in the database
        const { error: insertError } = await supabase
          .from('product_notifications')
          .insert({
            user_id: user.user_id,
            [type === 'new_product' ? 'product_id' : 'part_id']: item.id,
            email_type: type,
            sent_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Error recording notification:', insertError);
          throw insertError;
        }

        return { success: true, user_id: user.user_id, email: user.email };
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
        return { success: false, user_id: user.user_id, email: user.email, error: error.message };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    return new Response(
      JSON.stringify({ 
        message: 'Email notifications processed',
        sent: successful,
        failed: failed,
        total_eligible: usersToEmail.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-notification function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});