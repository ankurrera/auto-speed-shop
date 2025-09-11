// Client-side helper to talk to backend endpoints for custom order flow.

// Development mode detection
const isDevelopment = import.meta.env.DEV;

// Mock responses for development
const mockCreateOrderResponse = {
  localOrderId: 'mock-local-order-id-' + Math.random().toString(36).substring(7),
  orderNumber: 'ORD-' + Date.now().toString(36).toUpperCase(),
  status: 'pending_admin_review',
  message: 'Order created successfully. Awaiting admin review.'
};

export async function createServerOrder(cartItems, shippingAddress, userId?: string) {
  // In development mode, return mock response to avoid API errors
  if (isDevelopment) {
    console.warn("Development mode: Using mock custom order creation");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockCreateOrderResponse;
  }

  const res = await fetch("/api/orders/create-order", {
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