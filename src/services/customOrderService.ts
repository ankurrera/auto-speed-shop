// Custom order service for the new order flow
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS, PAYMENT_STATUS, type OrderInvoice, type PaymentSubmission } from "@/types/order";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku?: string;
  is_part: boolean;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export async function createCustomOrder(cartItems: CartItem[], shippingAddress: ShippingAddress, userId?: string) {
  try {
    // Include both products and parts in the order
    if (cartItems.length === 0) {
      throw new Error("No items found in cart.");
    }

    // Calculate basic pricing (before admin adds fees) - include all items
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = +(subtotal * 0.0825).toFixed(2);
    
    // Generate order number
    const orderNumber = "ORD-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    // Create order record with pending admin review status
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([{
        order_number: orderNumber,
        user_id: userId || null,
        subtotal,
        tax_amount: tax,
        total_amount: subtotal + tax, // Initial total, will be updated when admin adds fees
        currency: "USD",
        status: ORDER_STATUS.PENDING_ADMIN_REVIEW,
        payment_status: PAYMENT_STATUS.PENDING,
        payment_method: "custom_external",
        shipping_address: shippingAddress || null,
      }])
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Create order items - handle both products and parts
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.is_part ? null : item.id, // Only set product_id for products
      part_id: item.is_part ? item.id : null, // Add part_id field for parts
      product_name: item.name,
      product_sku: item.sku || null,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      is_part: item.is_part // Track if this is a part or product
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    return {
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status
    };
  } catch (error) {
    console.error("Create custom order error:", error);
    throw error;
  }
}

export async function createInvoice(orderId: string, invoice: OrderInvoice) {
  try {
    // Handle development mode with sample orders
    const isDevelopment = import.meta.env.DEV;
    const isSampleOrder = orderId.startsWith('sample-');
    
    if (isDevelopment && isSampleOrder) {
      // For sample orders in development mode, simulate successful invoice creation
      console.log(`[DEV MODE] Simulating invoice creation for sample order: ${orderId}`, invoice);
      return {
        id: orderId,
        order_number: `ORD-SAMPLE-${Date.now()}`,
        status: 'invoice_sent',
        convenience_fee: invoice.convenience_fee,
        delivery_charge: invoice.delivery_charge,
        tax_amount: invoice.tax_amount,
        total_amount: invoice.total_amount,
        notes: invoice.notes,
        updated_at: new Date().toISOString()
      };
    }

    // Get current user for admin function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use admin function to update the order with invoice details
    const { data: orders, error } = await supabase
      .rpc('admin_update_order_for_invoice', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        convenience_fee_param: invoice.convenience_fee,
        delivery_charge_param: invoice.delivery_charge,
        tax_amount_param: invoice.tax_amount,
        total_amount_param: invoice.total_amount,
        notes_param: invoice.notes || null
      });

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    if (!orders || orders.length === 0) {
      throw new Error(`Failed to update order ${orderId} - no order returned`);
    }

    return orders[0];
  } catch (error) {
    console.error("Create invoice error:", error);
    throw error;
  }
}

export async function respondToInvoice(orderId: string, accepted: boolean) {
  try {
    // Handle development mode with sample orders
    const isDevelopment = import.meta.env.DEV;
    const isSampleOrder = orderId.startsWith('sample-');
    
    if (isDevelopment && isSampleOrder) {
      // For sample orders in development mode, simulate successful response
      const newStatus = accepted ? ORDER_STATUS.INVOICE_ACCEPTED : ORDER_STATUS.CANCELLED;
      console.log(`[DEV MODE] Simulating invoice response for sample order: ${orderId}, accepted: ${accepted}`);
      return {
        id: orderId,
        status: newStatus,
        payment_status: accepted ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.FAILED,
        updated_at: new Date().toISOString()
      };
    }

    // Get current user for admin function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use admin function to respond to the invoice
    const { data: orders, error } = await supabase
      .rpc('admin_respond_to_invoice', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        accepted: accepted
      });

    if (error) {
      throw new Error(`Failed to respond to invoice: ${error.message}`);
    }

    if (!orders || orders.length === 0) {
      throw new Error(`Order ${orderId} not found or could not be updated`);
    }

    return orders[0];
  } catch (error) {
    console.error("Respond to invoice error:", error);
    throw error;
  }
}

export async function submitPayment(orderId: string, paymentData: PaymentSubmission) {
  try {
    // Handle development mode with sample orders
    const isDevelopment = import.meta.env.DEV;
    const isSampleOrder = orderId.startsWith('sample-');
    
    if (isDevelopment && isSampleOrder) {
      // For sample orders in development mode, simulate successful payment submission
      console.log(`[DEV MODE] Simulating payment submission for sample order: ${orderId}`, paymentData);
      return {
        id: orderId,
        status: ORDER_STATUS.PAYMENT_SUBMITTED,
        payment_status: PAYMENT_STATUS.SUBMITTED,
        notes: JSON.stringify({
          transaction_id: paymentData.transaction_id,
          payment_screenshot_url: paymentData.payment_screenshot_url,
          payment_amount: paymentData.payment_amount,
          submitted_at: paymentData.submitted_at
        }),
        updated_at: new Date().toISOString()
      };
    }

    // Get current user for admin function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Prepare payment notes as JSON
    const paymentNotes = JSON.stringify({
      transaction_id: paymentData.transaction_id,
      payment_screenshot_url: paymentData.payment_screenshot_url,
      payment_amount: paymentData.payment_amount,
      submitted_at: paymentData.submitted_at
    });

    // Use admin function to submit payment
    const { data: orders, error } = await supabase
      .rpc('admin_submit_payment', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        payment_notes: paymentNotes
      });

    if (error) {
      throw new Error(`Failed to submit payment: ${error.message}`);
    }

    if (!orders || orders.length === 0) {
      throw new Error(`Order ${orderId} not found or could not be updated`);
    }

    return orders[0];
  } catch (error) {
    console.error("Submit payment error:", error);
    throw error;
  }
}

export async function verifyPayment(orderId: string, verified: boolean) {
  try {
    // Handle development mode with sample orders
    const isDevelopment = import.meta.env.DEV;
    const isSampleOrder = orderId.startsWith('sample-');
    
    if (isDevelopment && isSampleOrder) {
      // For sample orders in development mode, simulate successful payment verification
      const newStatus = verified ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PAYMENT_PENDING;
      const paymentStatus = verified ? PAYMENT_STATUS.VERIFIED : PAYMENT_STATUS.FAILED;
      console.log(`[DEV MODE] Simulating payment verification for sample order: ${orderId}, verified: ${verified}`);
      return {
        id: orderId,
        status: newStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      };
    }

    // Get current user for admin function
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Use admin function to verify payment
    const { data: orders, error } = await supabase
      .rpc('admin_verify_payment', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        verified: verified
      });

    if (error) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }

    if (!orders || orders.length === 0) {
      throw new Error(`Order ${orderId} not found or could not be updated`);
    }

    return orders[0];
  } catch (error) {
    console.error("Verify payment error:", error);
    throw error;
  }
}

export async function getOrderDetails(orderId: string) {
  try {
    // Handle development mode with sample orders
    const isDevelopment = import.meta.env.DEV;
    const isSampleOrder = orderId.startsWith('sample-');
    
    if (isDevelopment && isSampleOrder) {
      // For sample orders in development mode, return mock order details
      console.log(`[DEV MODE] Returning mock order details for sample order: ${orderId}`);
      return {
        id: orderId,
        order_number: `ORD-SAMPLE-${orderId.split('-').pop()}`,
        status: ORDER_STATUS.PENDING_ADMIN_REVIEW,
        payment_status: PAYMENT_STATUS.PENDING,
        subtotal: 199.99,
        tax_amount: 16.50,
        total_amount: 216.49,
        order_items: [
          {
            id: `${orderId}-item-1`,
            product_id: null,
            part_id: null,
            product_name: 'Sample Product',
            quantity: 1,
            unit_price: 199.99,
            total_price: 199.99,
            is_part: false
          }
        ]
      };
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id,
          product_id,
          part_id,
          product_name,
          quantity,
          unit_price,
          total_price,
          is_part
        )
      `)
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      throw new Error(`Failed to get order details: ${orderError.message}`);
    }

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return order;
  } catch (error) {
    console.error("Get order details error:", error);
    throw error;
  }
}