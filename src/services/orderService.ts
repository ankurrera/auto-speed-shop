// Client-side helper to talk to backend endpoints.

export async function createServerOrder(cartItems, shippingAddress, userId?: string) {
  const res = await fetch("/api/paypal/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cartItems, shippingAddress, userId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || "Failed to create server order");
  }
  return res.json();
}

export async function captureServerOrder(paypalOrderId, localOrderId) {
  const res = await fetch("/api/paypal/capture-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paypalOrderId, localOrderId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.message || "Failed to capture order");
  }
  return res.json();
}