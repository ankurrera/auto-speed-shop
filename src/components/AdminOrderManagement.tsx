// src/components/AdminOrderManagement.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Package, X, RefreshCw } from "lucide-react";
import { Database } from "@/database.types";

type Order = Database['public']['Tables']['orders']['Row'];

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
    }
  ];
  return sampleOrders;
};

const AdminOrderManagement = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const queryClient = useQueryClient();

  const { data: fetchedOrders, isLoading, error, refetch } = useQuery<Order[]>({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('AdminOrderManagement Supabase error:', error);
          // In development mode, return sample orders if database query fails
          const isDevelopment = import.meta.env.DEV;
          if (isDevelopment) {
            console.log('AdminOrderManagement: Using sample orders in development mode');
            return getSampleOrders();
          }
          throw error;
        }
        
        // Debug logging to understand what orders are being fetched
        console.log('AdminOrderManagement fetched orders:', data);
        console.log('Orders count:', data?.length || 0);
        console.log('Order statuses:', data?.map(order => order.status) || []);
        
        // If no orders found in development, return sample orders
        const isDevelopment = import.meta.env.DEV;
        if (isDevelopment && (!data || data.length === 0)) {
          console.log('AdminOrderManagement: No orders found, using sample orders in development mode');
          return getSampleOrders();
        }
        
        return data || [];
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
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          All Orders
        </CardTitle>
        <div className="flex gap-2">
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
        {orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${
                        order.status === "delivered" ? "bg-green-500/10 text-green-400"
                          : order.status === "shipped" ? "bg-blue-500/10 text-blue-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">${order.total_amount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No orders found.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default AdminOrderManagement;