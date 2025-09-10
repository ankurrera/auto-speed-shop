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
    const shipping = subtotal > 75 ? 0 : 9.99;
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
        shipping_amount: shipping,
        tax_amount: tax,
        total_amount: subtotal + shipping + tax, // Initial total, will be updated when admin adds fees
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
    // First check if the order exists
    const { data: existingOrder, error: checkError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .maybeSingle();

    if (checkError) {
      throw new Error(`Failed to check order existence: ${checkError.message}`);
    }

    if (!existingOrder) {
      throw new Error(`Order with ID ${orderId} not found`);
    }

    // Update the order with invoice details
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        convenience_fee: invoice.convenience_fee,
        delivery_charge: invoice.delivery_charge,
        tax_amount: invoice.tax_amount,
        total_amount: invoice.total_amount,
        status: ORDER_STATUS.INVOICE_SENT,
        notes: invoice.notes || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create invoice: ${error.message}`);
    }

    if (!order) {
      throw new Error(`Failed to update order ${orderId} - no order returned`);
    }

    return order;
  } catch (error) {
    console.error("Create invoice error:", error);
    throw error;
  }
}

export async function respondToInvoice(orderId: string, accepted: boolean) {
  try {
    const newStatus = accepted ? ORDER_STATUS.INVOICE_ACCEPTED : ORDER_STATUS.INVOICE_DECLINED;
    const paymentStatus = accepted ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.FAILED;

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to respond to invoice: ${error.message}`);
    }

    return order;
  } catch (error) {
    console.error("Respond to invoice error:", error);
    throw error;
  }
}

export async function submitPayment(orderId: string, paymentData: PaymentSubmission) {
  try {
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: ORDER_STATUS.PAYMENT_SUBMITTED,
        payment_status: PAYMENT_STATUS.SUBMITTED,
        notes: JSON.stringify({
          transaction_id: paymentData.transaction_id,
          payment_screenshot_url: paymentData.payment_screenshot_url,
          payment_amount: paymentData.payment_amount,
          submitted_at: paymentData.submitted_at
        }),
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit payment: ${error.message}`);
    }

    return order;
  } catch (error) {
    console.error("Submit payment error:", error);
    throw error;
  }
}

export async function verifyPayment(orderId: string, verified: boolean) {
  try {
    const newStatus = verified ? ORDER_STATUS.CONFIRMED : ORDER_STATUS.PAYMENT_PENDING;
    const paymentStatus = verified ? PAYMENT_STATUS.VERIFIED : PAYMENT_STATUS.FAILED;

    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to verify payment: ${error.message}`);
    }

    return order;
  } catch (error) {
    console.error("Verify payment error:", error);
    throw error;
  }
}

export async function getOrderDetails(orderId: string) {
  try {
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
      .single();

    if (orderError) {
      throw new Error(`Failed to get order details: ${orderError.message}`);
    }

    return order;
  } catch (error) {
    console.error("Get order details error:", error);
    throw error;
  }
}