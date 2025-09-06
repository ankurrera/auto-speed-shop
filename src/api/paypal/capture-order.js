// Capture the PayPal order and finalize local order state.
// POST body: { paypalOrderId, localOrderId }

import fetch from "node-fetch";
import { supabaseAdmin, getPayPalAccessToken, getPayPalBaseUrl } from "./utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { paypalOrderId, localOrderId } = req.body || {};
    if (!paypalOrderId || !localOrderId) {
      return res.status(400).json({ message: "paypalOrderId and localOrderId required" });
    }

    // Fetch local order
    const { data: localOrder, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", localOrderId)
      .maybeSingle();

    if (orderError || !localOrder) {
      return res.status(404).json({ message: "Local order not found" });
    }

    if (localOrder.payment_status === "completed") {
      return res.status(200).json({ message: "Already captured", localOrder });
    }

    // Capture at PayPal
    const accessToken = await getPayPalAccessToken();
    const captureRes = await fetch(
      `${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const captureJson = await captureRes.json();

    if (!captureRes.ok) {
      console.error("PayPal capture fail:", captureJson);
      return res.status(500).json({ message: "PayPal capture failed", details: captureJson });
    }

    // Basic verification: sum capture amounts
    let paypalGross = 0;
    if (captureJson && captureJson.purchase_units) {
      captureJson.purchase_units.forEach(u => {
        if (u.payments && u.payments.captures) {
          u.payments.captures.forEach(c => {
            if (c.amount && c.amount.value) {
              paypalGross += parseFloat(c.amount.value);
            }
          });
        }
      });
    }

    const totalsMatch = Math.abs(paypalGross - localOrder.total_amount) < 0.01;
    if (!totalsMatch) {
      console.warn("Amount mismatch suspicious:", {
        paypalGross,
        localTotal: localOrder.total_amount,
      });
    }

    // Update local order
    const { error: updateError, data: updated } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: captureJson.status === "COMPLETED" ? "completed" : "captured",
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", localOrderId)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error("Order update error:", updateError);
      return res.status(500).json({ message: "Failed to update local order" });
    }

    return res.status(200).json({
      message: "Capture successful",
      localOrder: updated,
      paypal: captureJson,
    });
  } catch (err) {
    console.error("Capture error:", err);
    return res.status(500).json({ message: err.message || "Internal error" });
  }
}