// Custom order flow types and constants

export const ORDER_STATUS = {
  PENDING_ADMIN_REVIEW: 'pending_admin_review',
  INVOICE_SENT: 'invoice_sent', 
  INVOICE_ACCEPTED: 'invoice_accepted',
  INVOICE_DECLINED: 'invoice_declined',
  PAYMENT_PENDING: 'payment_pending',
  PAYMENT_SUBMITTED: 'payment_submitted',
  PAYMENT_VERIFIED: 'payment_verified',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered'
} as const;

export const PAYMENT_STATUS = {
  INITIATED: 'initiated',
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  VERIFIED: 'verified',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

export interface OrderInvoice {
  subtotal: number;
  convenience_fee: number;
  delivery_charge: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
}

export interface PaymentSubmission {
  transaction_id: string;
  payment_screenshot_url: string;
  payment_amount: number;
  submitted_at: string;
}

export interface ExtendedOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  subtotal: number;

  tax_amount: number;
  total_amount: number;
  convenience_fee?: number;
  delivery_charge?: number;
  invoice?: OrderInvoice;
  payment_submission?: PaymentSubmission;
  admin_payment_email?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}