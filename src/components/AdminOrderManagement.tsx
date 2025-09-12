// src/components/AdminOrderManagement.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, X, RefreshCw, Search, Filter, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";
import { Database } from "@/database.types";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";

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
    }
  ];
  return sampleOrders;
};

const AdminOrderManagement = ({ onBack }: { onBack: () => void }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  useEffect(() => {
    if (fetchedOrders) {
      setOrders(fetchedOrders);
    }
  }, [fetchedOrders]);

  // Filter orders based on search and filters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm || 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${order.profiles?.first_name} ${order.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;

    const matchesPayment = paymentFilter === "all" ||
      (paymentFilter === "paid" && (order.payment_status === PAYMENT_STATUS.VERIFIED || order.status === ORDER_STATUS.CONFIRMED)) ||
      (paymentFilter === "unpaid" && (order.payment_status !== PAYMENT_STATUS.VERIFIED && order.status !== ORDER_STATUS.CONFIRMED));

    return matchesSearch && matchesStatus && matchesPayment;
  });

  // Get payment status badge
  const getPaymentStatusBadge = (order: Order) => {
    if (order.payment_status === PAYMENT_STATUS.VERIFIED || order.status === ORDER_STATUS.CONFIRMED) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
    } else if (order.payment_status === PAYMENT_STATUS.FAILED) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
    } else if (order.payment_status === PAYMENT_STATUS.SUBMITTED || order.status === ORDER_STATUS.PAYMENT_SUBMITTED) {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    return <Badge variant="secondary">Unpaid</Badge>;
  };

  // Get order status badge
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case ORDER_STATUS.CONFIRMED:
        return <Badge variant="default" className="bg-green-100 text-green-800">Confirmed</Badge>;
      case ORDER_STATUS.SHIPPED:
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Shipped</Badge>;
      case ORDER_STATUS.DELIVERED:
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Delivered</Badge>;
      case ORDER_STATUS.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      case ORDER_STATUS.PAYMENT_SUBMITTED:
        return <Badge variant="outline">Payment Submitted</Badge>;
      case ORDER_STATUS.PAYMENT_VERIFIED:
        return <Badge variant="default" className="bg-green-100 text-green-800">Payment Verified</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

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
          Orders Management
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
      <CardContent className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value={ORDER_STATUS.PENDING_ADMIN_REVIEW}>Pending Review</SelectItem>
                <SelectItem value={ORDER_STATUS.INVOICE_SENT}>Invoice Sent</SelectItem>
                <SelectItem value={ORDER_STATUS.PAYMENT_SUBMITTED}>Payment Submitted</SelectItem>
                <SelectItem value={ORDER_STATUS.CONFIRMED}>Confirmed</SelectItem>
                <SelectItem value={ORDER_STATUS.SHIPPED}>Shipped</SelectItem>
                <SelectItem value={ORDER_STATUS.DELIVERED}>Delivered</SelectItem>
                <SelectItem value={ORDER_STATUS.CANCELLED}>Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid Orders</SelectItem>
                <SelectItem value="unpaid">Unpaid Orders</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Orders</p>
                  <p className="text-2xl font-bold">{filteredOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Paid Orders</p>
                  <p className="text-2xl font-bold">
                    {filteredOrders.filter(o => o.payment_status === PAYMENT_STATUS.VERIFIED || o.status === ORDER_STATUS.CONFIRMED).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Unpaid Orders</p>
                  <p className="text-2xl font-bold">
                    {filteredOrders.filter(o => o.payment_status !== PAYMENT_STATUS.VERIFIED && o.status !== ORDER_STATUS.CONFIRMED).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Revenue</p>
                  <p className="text-2xl font-bold">
                    ${filteredOrders.filter(o => o.payment_status === PAYMENT_STATUS.VERIFIED || o.status === ORDER_STATUS.CONFIRMED)
                      .reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Orders Table */}
        {filteredOrders.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>Payment Status</TableHead>
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
                      {getOrderStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order)}
                    </TableCell>
                    <TableCell className="text-right">${order.total_amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm || statusFilter !== "all" || paymentFilter !== "all" 
              ? "No orders found matching your criteria." 
              : "No orders found."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
export default AdminOrderManagement;