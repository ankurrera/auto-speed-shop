// src/components/AdminOrderManagement.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, X, RefreshCw, Filter } from "lucide-react";
import { Database } from "@/database.types";

type Order = Database['public']['Tables']['orders']['Row'] & {
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

// Sample orders for development mode when database is not available
const getSampleOrders = (): Order[] => {
  const sampleOrders: Order[] = [
    {
      id: 'sample-order-1',
      order_number: 'ORD-DEV-001',
      user_id: 'sample-user-1',
      status: 'pending_admin_review',
      payment_status: 'pending',
      payment_method: 'custom_external',
      subtotal: 299.99,
      shipping_amount: 9.99,
      tax_amount: 24.75,
      total_amount: 334.73,
      convenience_fee: null,
      delivery_charge: null,
      currency: 'USD',
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
      billing_address: null,
      created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      updated_at: new Date(Date.now() - 86400000).toISOString(),
      shipped_at: null,
      delivered_at: null
    },
    {
      id: 'sample-order-2',
      order_number: 'ORD-DEV-002',
      user_id: 'sample-user-2',
      status: 'pending_admin_review',
      payment_status: 'pending',
      payment_method: 'custom_external',
      subtotal: 159.99,
      shipping_amount: 0,
      tax_amount: 13.20,
      total_amount: 173.19,
      convenience_fee: null,
      delivery_charge: null,
      currency: 'USD',
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
      billing_address: null,
      created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      updated_at: new Date(Date.now() - 43200000).toISOString(),
      shipped_at: null,
      delivered_at: null
    },
    {
      id: 'sample-order-3',
      order_number: 'ORD-DEV-003',
      user_id: 'sample-user-3',
      status: 'shipped',
      payment_status: 'verified',
      payment_method: 'custom_external',
      subtotal: 89.99,
      shipping_amount: 9.99,
      tax_amount: 7.43,
      total_amount: 107.41,
      convenience_fee: 5.00,
      delivery_charge: 15.00,
      currency: 'USD',
      notes: null,
      shipping_address: {
        first_name: 'Mike',
        last_name: 'Johnson',
        line1: '789 Pine Rd',
        city: 'Houston',
        state: 'TX',
        postal_code: '77001',
        country: 'US'
      },
      billing_address: null,
      created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
      updated_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      shipped_at: new Date(Date.now() - 172800000).toISOString(),
      delivered_at: null
    },
    {
      id: 'sample-order-4',
      order_number: 'ORD-DEV-004',
      user_id: 'sample-user-4',
      status: 'payment_submitted',
      payment_status: 'submitted',
      payment_method: 'custom_external',
      subtotal: 199.99,
      shipping_amount: 9.99,
      tax_amount: 17.32,
      total_amount: 227.30,
      convenience_fee: 8.00,
      delivery_charge: 12.00,
      currency: 'USD',
      notes: '{"transaction_id":"TXN123456","payment_amount":227.30,"payment_screenshot_url":"https://example.com/screenshot.jpg","submitted_at":"2025-01-12T10:30:00Z"}',
      shipping_address: {
        first_name: 'Sarah',
        last_name: 'Wilson',
        line1: '789 Pine St',
        city: 'Houston',
        state: 'TX',
        postal_code: '77001',
        country: 'US'
      },
      billing_address: null,
      created_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      shipped_at: null,
      delivered_at: null
    },
    {
      id: 'sample-order-5',
      order_number: 'ORD-DEV-005',
      user_id: 'sample-user-5',
      status: 'payment_rejected',
      payment_status: 'rejected',
      payment_method: 'custom_external',
      subtotal: 149.99,
      shipping_amount: 9.99,
      tax_amount: 13.19,
      total_amount: 173.17,
      convenience_fee: 5.00,
      delivery_charge: 10.00,
      currency: 'USD',
      notes: 'Payment rejected due to insufficient funds verification. Customer notified to resubmit payment.',
      shipping_address: {
        first_name: 'Robert',
        last_name: 'Brown',
        line1: '321 Cedar Ave',
        city: 'San Antonio',
        state: 'TX',
        postal_code: '78201',
        country: 'US'
      },
      billing_address: null,
      created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      shipped_at: null,
      delivered_at: null
    }
  ];
  
  // Populate profiles for sample orders
  sampleOrders.forEach(order => {
    if (order.shipping_address) {
      (order as any).profiles = {
        first_name: order.shipping_address.first_name,
        last_name: order.shipping_address.last_name,
        email: `${order.shipping_address.first_name?.toLowerCase()}.${order.shipping_address.last_name?.toLowerCase()}@example.com`
      };
    }
  });
  return sampleOrders;
};

const AdminOrderManagement = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const queryClient = useQueryClient();

  const { data: fetchedOrders, isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Use the admin function to get all orders
        const { data, error } = await supabase
          .rpc('get_all_orders_for_admin', {
            requesting_user_id: user.id
          });

        if (error) {
          console.warn('AdminOrderManagement Supabase RPC error:', error);
          // In development mode, return sample orders if database query fails
          const isDevelopment = import.meta.env.DEV;
          if (isDevelopment) {
            console.log('AdminOrderManagement: Using sample orders in development mode');
            return getSampleOrders();
          }
          throw error;
        }
        
        // Transform the data to match our expected format
        const transformedOrders = data?.map((order: {
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
        }) => ({
          ...order,
          profiles: order.customer_first_name || order.customer_last_name || order.customer_email ? {
            first_name: order.customer_first_name,
            last_name: order.customer_last_name,
            email: order.customer_email
          } : null
        })) || [];
        
        // Debug logging to understand what orders are being fetched
        console.log('AdminOrderManagement fetched orders:', transformedOrders);
        console.log('Orders count:', transformedOrders?.length || 0);
        console.log('Order statuses:', transformedOrders?.map(order => order.status) || []);
        console.log('Order user_ids:', transformedOrders?.map(order => order.user_id) || []);
        
        // If no orders found in development, return sample orders
        const isDevelopment = import.meta.env.DEV;
        if (isDevelopment && (!transformedOrders || transformedOrders.length === 0)) {
          console.log('AdminOrderManagement: No orders found, using sample orders in development mode');
          return getSampleOrders();
        }
        
        return transformedOrders;
      } catch (err) {
        console.error('AdminOrderManagement query error:', err);
        // In development mode, return sample orders if any error occurs
        const isDevelopment = import.meta.env.DEV;
        if (isDevelopment) {
          console.log('AdminOrderManagement: Using sample orders due to error in development mode');
          return getSampleOrders();
        }
        throw err;
      }
    },
  });

  useEffect(() => {
    if (fetchedOrders) {
      setOrders(fetchedOrders);
    }
  }, [fetchedOrders]);

  // Filter orders based on payment status
  const filteredOrders = orders.filter(order => {
    if (paymentFilter === "all") return true;
    if (paymentFilter === "paid") {
      return order.payment_status === "verified" || order.status === "confirmed" || order.status === "shipped" || order.status === "delivered";
    }
    if (paymentFilter === "unpaid") {
      return order.payment_status === "pending" || order.payment_status === "submitted" || order.payment_status === "rejected" || order.payment_status === "failed";
    }
    return true;
  });

  const handleRefresh = async () => {
    await refetch();
  };

  if (isLoading) {
    return <p>Loading orders...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error loading orders: {error.message}</p>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          All Orders ({filteredOrders.length})
        </CardTitle>
        <div className="flex gap-2">
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="paid">Paid Orders</SelectItem>
              <SelectItem value="unpaid">Unpaid Orders</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {filteredOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    {order.profiles ? (
                      <div>
                        <p className="font-medium">{order.profiles.first_name} {order.profiles.last_name}</p>
                        <p className="text-xs text-muted-foreground">{order.profiles.email}</p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unknown Customer</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                          order.status === "delivered" ? "bg-green-500/10 text-green-400"
                            : order.status === "shipped" ? "bg-blue-500/10 text-blue-400"
                            : order.status === "confirmed" ? "bg-green-500/10 text-green-400"
                            : order.status === "payment_verified" ? "bg-green-500/10 text-green-400"
                            : order.status === "payment_rejected" ? "bg-red-500/10 text-red-400"
                            : order.status === "payment_submitted" ? "bg-purple-500/10 text-purple-400"
                            : order.status === "invoice_sent" ? "bg-blue-500/10 text-blue-400"
                            : order.status === "cancelled" ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-xs px-1 py-0.5 rounded capitalize ${
                          order.payment_status === "verified" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : order.payment_status === "rejected" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                            : order.payment_status === "submitted" ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        Payment: {order.payment_status}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">${order.total_amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {paymentFilter === "all" ? "No orders found." : `No ${paymentFilter} orders found.`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default AdminOrderManagement;