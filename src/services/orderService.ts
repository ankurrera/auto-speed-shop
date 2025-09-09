// Client-side helper to talk to backend endpoints.

// Development mode detection
const isDevelopment = import.meta.env.DEV;

// Mock responses for development
const mockCreateOrderResponse = {
  paypalOrderId: 'mock-paypal-order-id-' + Math.random().toString(36).substring(7),
  localOrderId: 'mock-local-order-id-' + Math.random().toString(36).substring(7),
  orderNumber: 'ORD-' + Date.now().toString(36).toUpperCase()
};

const mockCaptureResponse = {
  message: "Capture successful",
  localOrder: {
    id: 'mock-local-order-id',
    payment_status: "completed",
    status: "processing"
  },
  paypal: {
    status: "COMPLETED"
  }
};

export async function createServerOrder(cartItems, shippingAddress, userId?: string) {
  // In development mode, return mock response to avoid API errors
  if (isDevelopment) {
    console.warn("Development mode: Using mock PayPal order creation");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockCreateOrderResponse;
  }

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
  // In development mode, return mock response to avoid API errors
  if (isDevelopment) {
    console.warn("Development mode: Using mock PayPal order capture");
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return mockCaptureResponse;
  }

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