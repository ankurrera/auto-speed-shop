import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dkopohqiihhxmbjhzark.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb3BvaHFpaWhoeG1iamh6YXJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NzE2NDMsImV4cCI6MjA3MTI0NzY0M30.6EF5ivhFPmK5B7Y_zLY-FkbN3LHAglvRHW7U0U5LoXA';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Parse the form data - handle both JSON and FormData
    let body;
    if (req.headers['content-type']?.includes('application/json')) {
      body = req.body;
    } else {
      // Handle FormData - for multipart/form-data requests
      body = req.body;
    }
    
    const { name, description, price, stock_quantity, category, specifications } = body;
    
    // Validate required fields
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Missing required fields: name, description, price, category' });
    }

    // Get user from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header required' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Try to get user from token
    let user;
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !authUser) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      user = authUser;
    } catch (authErr) {
      console.error('Auth error:', authErr);
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Get seller ID for the user
    const { data: sellerData, error: sellerError } = await supabase
      .from('sellers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !sellerData) {
      return res.status(404).json({ message: 'Seller account not found. Please create a seller account first.' });
    }

    // Handle image uploads (if any)
    let imageUrls = [];
    if (req.files && req.files.images) {
      // This is a simplified version - in a real app you'd upload to Supabase storage
      // For now, we'll just use empty array since the original code doesn't handle file uploads in the API
      imageUrls = [];
    }

    // Prepare data for database insertion
    const productData = {
      p_name: name,
      p_description: description,
      p_price: parseFloat(price),
      p_stock_quantity: parseInt(stock_quantity) || 0,
      p_category: category,
      p_specifications: specifications || '',
      p_image_urls: imageUrls,
      p_seller_id: sellerData.id,
      p_brand: '', // Default empty - could be extracted from specifications
      p_make: '', // Default empty - could be extracted from specifications  
      p_model: '', // Default empty - could be extracted from specifications
      p_year: '2024' // Default current year
    };

    // Call the appropriate Supabase stored procedure
    const { data, error } = await supabase.rpc('publish_new_product', productData);

    if (error) {
      console.error('Error calling publish_new_product:', error);
      return res.status(500).json({ message: 'Failed to create product', error: error.message });
    }

    res.status(200).json({ 
      message: 'Product created successfully!', 
      productId: data 
    });

  } catch (error) {
    console.error('Error in products API:', error);
    // Ensure we always return valid JSON
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error?.message || 'Unknown error occurred' 
    });
  }
}