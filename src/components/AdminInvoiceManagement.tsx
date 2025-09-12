import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { createInvoice } from "@/services/customOrderService";
import { ORDER_STATUS, PAYMENT_STATUS, type OrderInvoice } from "@/types/order";
import { InvoiceTable } from "./InvoiceTable";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  convenience_fee?: number;
  delivery_charge?: number;
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
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

// Sample orders for development mode when database is not available
const getSampleInvoiceOrders = (): Order[] => {
  const sampleOrders: Order[] = [
    {
      id: 'sample-invoice-order-1',
      order_number: 'ORD-INV-001',
      user_id: 'sample-user-1',
      status: ORDER_STATUS.PENDING_ADMIN_REVIEW,
      payment_status: PAYMENT_STATUS.PENDING,
      subtotal: 199.99,
      shipping_amount: 9.99,
      tax_amount: 16.50,
      total_amount: 226.48,
      convenience_fee: null,
      delivery_charge: null,
      currency: 'USD',
      payment_method: 'custom_external',
      billing_address: null,
      shipped_at: null,
      delivered_at: null,
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      notes: null,
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        line1: '123 Main St',
        city: 'Austin',
        state: 'TX',
        postal_code: '78701',
        country: 'US'
      },
      order_items: [
        {
          id: 'sample-item-1',
          product_name: 'High Performance Brake Pads',
          quantity: 2,
          unit_price: 89.99,
          total_price: 179.98,
          is_part: false
        }
      ],
      profiles: {
        email: 'john.doe@example.com',
        first_name: 'John',
        last_name: 'Doe'
      }
    },
    {
      id: 'sample-invoice-order-2',
      order_number: 'ORD-INV-002',
      user_id: 'sample-user-2',
      status: ORDER_STATUS.PENDING_ADMIN_REVIEW,
      payment_status: PAYMENT_STATUS.PENDING,
      subtotal: 349.99,
      shipping_amount: 0,
      tax_amount: 28.87,
      total_amount: 378.86,
      convenience_fee: null,
      delivery_charge: null,
      currency: 'USD',
      payment_method: 'custom_external',
      billing_address: null,
      shipped_at: null,
      delivered_at: null,
      created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      updated_at: new Date(Date.now() - 43200000).toISOString(),
      notes: null,
      shipping_address: {
        first_name: 'Jane',
        last_name: 'Smith',
        line1: '456 Oak Ave',
        city: 'Dallas',
        state: 'TX',
        postal_code: '75201',
        country: 'US'
      },
      order_items: [
        {
          id: 'sample-item-2',
          product_name: 'Cold Air Intake System',
          quantity: 1,
          unit_price: 249.99,
          total_price: 249.99,
          is_part: false
        },
        {
          id: 'sample-item-3',
          product_name: 'LED Headlight Kit',
          quantity: 1,
          unit_price: 99.99,
          total_price: 99.99,
          is_part: true
        }
      ],
      profiles: {
        email: 'jane.smith@example.com',
        first_name: 'Jane',
        last_name: 'Smith'
      }
    },
    {
      id: 'sample-invoice-order-3',
      order_number: 'ORD-INV-003',
      user_id: 'sample-user-3',
      status: ORDER_STATUS.PAYMENT_SUBMITTED,
      payment_status: PAYMENT_STATUS.SUBMITTED,
      subtotal: 129.99,
      shipping_amount: 9.99,
      tax_amount: 10.74,
      total_amount: 160.72,
      convenience_fee: 5.00,
      delivery_charge: 5.00,
      currency: 'USD',
      payment_method: 'custom_external',
      billing_address: null,
      shipped_at: null,
      delivered_at: null,
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      notes: JSON.stringify({
        transaction_id: 'TXN-DEV-12345',
        payment_amount: 160.72,
        payment_screenshot_url: '#'
      }),
      shipping_address: {
        first_name: 'Mike',
        last_name: 'Johnson',
        line1: '789 Pine Rd',
        city: 'Houston',
        state: 'TX',
        postal_code: '77001',
        country: 'US'
      },
      order_items: [
        {
          id: 'sample-item-4',
          product_name: 'Performance Oil Filter',
          quantity: 3,
          unit_price: 39.99,
          total_price: 119.97,
          is_part: false
        }
      ],
      profiles: {
        email: 'mike.johnson@example.com',
        first_name: 'Mike',
        last_name: 'Johnson'
      }
    }
  ];
  return sampleOrders;
};

const AdminInvoiceManagement = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Use the admin function to get orders requiring invoice management
        const { data: ordersData, error } = await supabase
          .rpc('get_invoice_orders_for_admin', {
            requesting_user_id: user.id
          });

        if (error) {
          console.warn('AdminInvoiceManagement Supabase RPC error:', error);
          // In development mode, return sample orders if database query fails
          const isDevelopment = import.meta.env.DEV;
          if (isDevelopment) {
            console.log('AdminInvoiceManagement: Using sample orders in development mode');
            setOrders(getSampleInvoiceOrders());
            return;
          }
          throw error;
        }

        // Transform and get order items for each order
        const ordersWithItems = await Promise.all(
          (ordersData || []).map(async (order: {
            id: string;
            order_number: string;
            user_id: string;
            status: string;
            payment_status: string;
            payment_method: string;
            subtotal: number;
            shipping_amount: number;
            tax_amount: number;
            total_amount: number;
            convenience_fee: number;
            delivery_charge: number;
            currency: string;
            notes: string;
            shipping_address: unknown;
            billing_address: unknown;
            created_at: string;
            updated_at: string;
            shipped_at: string;
            delivered_at: string;
            customer_first_name: string;
            customer_last_name: string;
            customer_email: string;
          }) => {
            // Get order items for this specific order
            const { data: orderItems, error: itemsError } = await supabase
              .rpc('get_order_items_for_admin', {
                requesting_user_id: user.id,
                target_order_id: order.id
              });

            if (itemsError) {
              console.warn(`Failed to fetch order items for order ${order.id}:`, itemsError);
            }

            return {
              ...order,
              order_items: orderItems || [],
              profiles: order.customer_first_name || order.customer_last_name || order.customer_email ? {
                first_name: order.customer_first_name,
                last_name: order.customer_last_name,
                email: order.customer_email
              } : null
            };
          })
        );

        // Debug logging to understand what orders are being fetched
        console.log('AdminInvoiceManagement fetched orders:', ordersWithItems);
        console.log('Invoice orders count:', ordersWithItems?.length || 0);
        console.log('Invoice order statuses:', ordersWithItems?.map(order => order.status) || []);
        console.log('Invoice order user_ids:', ordersWithItems?.map(order => order.user_id) || []);

        // If no orders found in development, return sample orders
        const isDevelopment = import.meta.env.DEV;
        if (isDevelopment && (!ordersWithItems || ordersWithItems.length === 0)) {
          console.log('AdminInvoiceManagement: No orders found, using sample orders in development mode');
          setOrders(getSampleInvoiceOrders());
          return;
        }

        setOrders(ordersWithItems || []);
      } catch (dbError) {
        console.error("Database error in AdminInvoiceManagement:", dbError);
        // In development mode, return sample orders if any error occurs
        const isDevelopment = import.meta.env.DEV;
        if (isDevelopment) {
          console.log('AdminInvoiceManagement: Using sample orders due to error in development mode');
          setOrders(getSampleInvoiceOrders());
          return;
        }
        throw dbError;
      }
    } catch (error: unknown) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCreateInvoice = async (orderId: string, invoiceData: {
    convenience_fee: number;
    delivery_charge: number;
    notes: string;
  }) => {
    const { convenience_fee, delivery_charge, notes } = invoiceData;

    if (convenience_fee < 0 || delivery_charge < 0) {
      toast({
        title: "Invalid Fees",
        description: "Fees must be non-negative values",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }

      const newTaxAmount = +((order.subtotal + convenience_fee + delivery_charge) * 0.0825).toFixed(2);
      const newTotal = order.subtotal + convenience_fee + delivery_charge + newTaxAmount;

      const invoice: OrderInvoice = {
        subtotal: order.subtotal,
        convenience_fee,
        delivery_charge,
        tax_amount: newTaxAmount,
        total_amount: newTotal,
        notes
      };

      await createInvoice(orderId, invoice);

      toast({
        title: "Invoice Created",
        description: "Invoice has been sent to the customer for review"
      });

      fetchOrders();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create invoice";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const getStatusBadge = (status: string) => {
    // This function is no longer used but kept for compatibility
    return status;
  };

  const getActionButton = (order: Order) => {
    // This function is no longer used but kept for compatibility
    return null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Invoice Management</h2>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
      
      <InvoiceTable
        orders={orders}
        loading={loading}
        onCreateInvoice={handleCreateInvoice}
        isCreatingInvoice={isCreatingInvoice}
      />
    </div>
  );
};

export default AdminInvoiceManagement;