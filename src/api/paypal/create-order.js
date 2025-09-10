// Serverless endpoint to create a PayPal order securely.
// POST body: { cartItems: [{ id, quantity }], shippingAddress: {...}, userId: string (optional, we can also derive from auth if implemented) }

import fetch from "node-fetch";
import { supabaseAdmin, getPayPalAccessToken, getPayPalBaseUrl, computePricing, generateOrderNumber } from "./utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { cartItems, shippingAddress, userId } = req.body || {};

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "cartItems empty or invalid" });
    }

    // Fetch authoritative product pricing from DB (prevent tampering)
    const productIds = cartItems.map(ci => ci.id);
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("id, price, name")
      .in("id", productIds);

    if (error) {
      console.error("DB fetch error:", error);
      return res.status(500).json({ message: "Failed to fetch products" });
    }

    // Merge price data into line items
    const enriched = cartItems.map(ci => {
      const prod = products.find(p => p.id === ci.id);
      if (!prod) {
        throw new Error("Product not found: " + ci.id);
      }
      return {
        id: ci.id,
        quantity: ci.quantity,
        name: prod.name,
        price: prod.price,
      };
    });

    const { subtotal, shipping, tax, total } = computePricing(enriched);

    const orderNumber = generateOrderNumber();

    // Create pending order record in DB
    const { error: insertError, data: orderInsert } = await supabaseAdmin
      .from("orders")
      .insert([{
        order_number: orderNumber,
        user_id: userId || null, // you can enforce auth later
        subtotal,
        shipping_amount: shipping,
        tax_amount: tax,
        total_amount: total,
        currency: "USD",
        status: "pending",
        payment_status: "initiated",
        payment_method: "paypal",
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

    // Build PayPal purchase unit
    const purchaseUnit = {
      reference_id: orderInsert.id,
      amount: {
        currency_code: "USD",
        value: total.toFixed(2),
        breakdown: {
          item_total: { currency_code: "USD", value: subtotal.toFixed(2) },
          shipping: { currency_code: "USD", value: shipping.toFixed(2) },
          tax_total: { currency_code: "USD", value: tax.toFixed(2) },
        },
      },
      items: enriched.map(li => ({
        name: li.name.substring(0, 127),
        quantity: li.quantity.toString(),
        unit_amount: {
          currency_code: "USD",
          value: li.price.toFixed(2),
        },
      })),
    };

    const accessToken = await getPayPalAccessToken();

    const ppRes = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [purchaseUnit],
      }),
    });

    const ppJson = await ppRes.json();
    if (!ppRes.ok) {
      console.error("PayPal create order failure:", ppJson);
      return res.status(500).json({ message: "PayPal create order failed", details: ppJson });
    }

    // Return PayPal order ID so client can approve
    return res.status(200).json({
      paypalOrderId: ppJson.id,
      localOrderId: orderInsert.id,
      orderNumber,
    });
  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ message: err.message || "Internal error" });
  }
}