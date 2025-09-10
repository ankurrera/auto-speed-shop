import { supabase } from '@/integrations/supabase/client';

// Interface for product notification data
interface ProductNotificationData {
  productName: string;
  productDescription?: string;
  productPrice: number;
  productCategory?: string;
  productType: 'product' | 'part';
  sellerName?: string;
}

// Send notification to all subscribed users
export const sendNewProductNotifications = async (productData: ProductNotificationData) => {
  try {
    // Get all users subscribed to newsletter (assuming they want new product notifications)
    const { data: subscriptions, error } = await supabase
      .from('subscribers')
      .select('email');

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No subscribers found for new product notifications');
      return;
    }

    // Extract emails
    const subscriberEmails = subscriptions.map(sub => sub.email);

    // Call the API endpoint to send emails
    const response = await fetch('/api/productNotifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productData,
        subscriberEmails,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send notifications: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Successfully sent notifications to ${result.emailsSent} subscribers`);

  } catch (error) {
    console.error('Error sending product notifications:', error);
    throw error;
  }
};

// Utility function to get seller name by ID
export const getSellerName = async (sellerId: string): Promise<string | undefined> => {
  try {
    const { data, error } = await supabase
      .from('sellers')
      .select('name')
      .eq('id', sellerId)
      .single();
    
    if (error || !data) {
      console.warn('Could not fetch seller name:', error);
      return undefined;
    }
    
    return data.name;
  } catch (error) {
    console.warn('Error fetching seller name:', error);
    return undefined;
  }
};