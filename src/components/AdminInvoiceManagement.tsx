import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  FileText,
  DollarSign,
  Package,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { createInvoice, verifyPayment } from "@/services/customOrderService";
import { ORDER_STATUS, PAYMENT_STATUS, type OrderInvoice } from "@/types/order";

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
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    convenience_fee: "",
    delivery_charge: "",
    notes: ""
  });
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

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

  const handleCreateInvoice = async () => {
    if (!selectedOrder) return;

    const convenienceFee = parseFloat(invoiceForm.convenience_fee) || 0;
    const deliveryCharge = parseFloat(invoiceForm.delivery_charge) || 0;

    if (convenienceFee < 0 || deliveryCharge < 0) {
      toast({
        title: "Invalid Fees",
        description: "Fees must be non-negative values",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const newTaxAmount = +((selectedOrder.subtotal + convenienceFee + deliveryCharge) * 0.0825).toFixed(2);
      const newTotal = selectedOrder.subtotal + convenienceFee + deliveryCharge + newTaxAmount;

      const invoice: OrderInvoice = {
        subtotal: selectedOrder.subtotal,
        convenience_fee: convenienceFee,
        delivery_charge: deliveryCharge,
        tax_amount: newTaxAmount,
        total_amount: newTotal,
        notes: invoiceForm.notes
      };

      await createInvoice(selectedOrder.id, invoice);

      toast({
        title: "Invoice Created",
        description: "Invoice has been sent to the customer for review"
      });

      // Reset form and refresh orders
      setInvoiceForm({ convenience_fee: "", delivery_charge: "", notes: "" });
      setSelectedOrder(null);
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

  const handleVerifyPayment = async (orderId: string, verified: boolean) => {
    setIsVerifyingPayment(true);
    try {
      await verifyPayment(orderId, verified);

      toast({
        title: verified ? "Payment Verified" : "Payment Rejected",
        description: verified 
          ? "Order has been confirmed and customer notified"
          : "Payment verification failed, customer will be notified"
      });

      fetchOrders();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING_ADMIN_REVIEW:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case ORDER_STATUS.INVOICE_SENT:
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Invoice Sent</Badge>;
      case ORDER_STATUS.INVOICE_ACCEPTED:
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case ORDER_STATUS.INVOICE_DECLINED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Invoice Declined</Badge>;
      case ORDER_STATUS.PAYMENT_PENDING:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case ORDER_STATUS.PAYMENT_SUBMITTED:
        return <Badge variant="secondary"><DollarSign className="h-3 w-3 mr-1" />Payment Submitted</Badge>;
      case ORDER_STATUS.PAYMENT_VERIFIED:
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Payment Verified</Badge>;
      case ORDER_STATUS.CONFIRMED:
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case ORDER_STATUS.CANCELLED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case ORDER_STATUS.SHIPPED:
        return <Badge variant="default"><Package className="h-3 w-3 mr-1" />Shipped</Badge>;
      case ORDER_STATUS.DELIVERED:
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getActionButton = (order: Order) => {
    switch (order.status) {
      case ORDER_STATUS.PENDING_ADMIN_REVIEW:
        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                onClick={() => setSelectedOrder(order)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Invoice for Order #{order.order_number}</DialogTitle>
                <DialogDescription>
                  Add convenience fee and delivery charges to generate the final invoice.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Order Summary */}
                <div>
                  <h4 className="font-semibold mb-3">Order Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Fee Inputs */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="convenience_fee">Convenience Fee ($)</Label>
                    <Input
                      id="convenience_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.convenience_fee}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, convenience_fee: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery_charge">Delivery Charge ($)</Label>
                    <Input
                      id="delivery_charge"
                      type="number"
                      step="0.01"
                      min="0"
                      value={invoiceForm.delivery_charge}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, delivery_charge: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={invoiceForm.notes}
                      onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="Additional notes for the customer..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Final Total Preview */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-semibold mb-2">Final Invoice Total</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Convenience Fee:</span>
                      <span>${(parseFloat(invoiceForm.convenience_fee) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span>${(parseFloat(invoiceForm.delivery_charge) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8.25%):</span>
                      <span>${(((order.subtotal + (parseFloat(invoiceForm.convenience_fee) || 0) + (parseFloat(invoiceForm.delivery_charge) || 0)) * 0.0825)).toFixed(2)}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>${(order.subtotal + (parseFloat(invoiceForm.convenience_fee) || 0) + (parseFloat(invoiceForm.delivery_charge) || 0) + ((order.subtotal + (parseFloat(invoiceForm.convenience_fee) || 0) + (parseFloat(invoiceForm.delivery_charge) || 0)) * 0.0825)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedOrder(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateInvoice}
                    disabled={isCreatingInvoice}
                  >
                    {isCreatingInvoice ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invoice
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );

      case ORDER_STATUS.PAYMENT_SUBMITTED: {
        const paymentData = order.notes ? JSON.parse(order.notes) : null;
        return (
          <div className="space-y-3 min-w-[200px]">
            {paymentData && (
              <div className="text-center">
                <Button
                  size="sm"
                  onClick={() => navigate(`/admin/view-payment/${order.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Payment
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Payment submitted: ${paymentData.payment_amount}
                </p>
              </div>
            )}
          </div>
        );
      }

      default:
        return <span className="text-muted-foreground text-sm">No action needed</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Invoice Management
        </CardTitle>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Order #</TableHead>
                  <TableHead className="min-w-[180px]">Customer</TableHead>
                  <TableHead className="min-w-[100px]">Date</TableHead>
                  <TableHead className="min-w-[140px]">Status</TableHead>
                  <TableHead className="text-right min-w-[100px]">Total</TableHead>
                  <TableHead className="text-center min-w-[300px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>
                      {order.profiles ? (
                        <div>
                          <p className="font-medium">{order.profiles.first_name} {order.profiles.last_name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{order.profiles.email}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">${order.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      {getActionButton(order)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Orders Pending</h3>
            <p className="text-muted-foreground">
              There are currently no orders requiring admin action.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminInvoiceManagement;