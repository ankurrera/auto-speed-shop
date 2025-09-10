// Serverless endpoint to create a custom order.
// POST body: { cartItems: [{ id, quantity }], shippingAddress: {...}, userId: string (optional) }

import { supabaseAdmin, computePricing, generateOrderNumber } from "./utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { cartItems, shippingAddress, userId } = req.body || {};
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "cartItems array required" });
    }

    // Fetch product details for cart items to ensure we have current pricing
    const productIds = cartItems.map(ci => ci.id);
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productsError) {
      console.error("Products fetch error:", productsError);
      return res.status(500).json({ message: "Failed to fetch product details" });
    }

    // Enrich cart items with current product data
    const enriched = cartItems.map(ci => {
      const product = products.find(p => p.id === ci.id);
      if (!product) {
        throw new Error(`Product ${ci.id} not found`);
      }
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: ci.quantity,
      };
    });

    // Compute pricing
    const { subtotal, shipping, tax, total } = computePricing(enriched);
    const orderNumber = generateOrderNumber();

    // Create local order record first
    const { data: orderInsert, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert([{
        order_number: orderNumber,
        user_id: userId || null,
        subtotal,
        shipping_amount: shipping,
        tax_amount: tax,
        total_amount: total,
        currency: "USD",
        status: "pending_admin_review", // Use custom order status
        payment_status: "pending",
        payment_method: "custom_external",
        shipping_address: shippingAddress || null,
      }])
      .select()
      .single();

    if (insertError) {
      console.error("Order insert error:", insertError);
      return res.status(500).json({ message: "Failed to create local order record" });
    }

    // Create order items
    const orderItems = enriched.map(item => ({
      order_id: orderInsert.id,
      product_id: item.id,
      product_name: item.name,
      product_sku: item.sku,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      return res.status(500).json({ message: "Failed to create order items: " + itemsError.message });
    }

    // Return success response
    return res.status(200).json({
      localOrderId: orderInsert.id,
      orderNumber,
      status: orderInsert.status,
      message: "Order created successfully. Awaiting admin review."
    });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ message: err.message || "Internal error" });
  }
}