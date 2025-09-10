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

const AdminInvoiceManagement = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
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

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_name,
            quantity,
            unit_price,
            total_price
          )
        `)
        .in("status", [
          ORDER_STATUS.PENDING_ADMIN_REVIEW,
          ORDER_STATUS.INVOICE_SENT,
          ORDER_STATUS.INVOICE_ACCEPTED,
          ORDER_STATUS.PAYMENT_SUBMITTED
        ])
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately since there's no foreign key relationship
      const userIds = [...new Set(ordersData?.map(order => order.user_id).filter(Boolean))];
      let profilesData = [];
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, email, first_name, last_name")
          .in("user_id", userIds);
        
        if (profilesError) {
          console.warn("Failed to fetch profiles:", profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Merge orders with profile data
      const ordersWithProfiles = ordersData?.map(order => ({
        ...order,
        profiles: profilesData.find(profile => profile.user_id === order.user_id) || null
      })) || [];

      setOrders(ordersWithProfiles);
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
      const newTotal = selectedOrder.subtotal + selectedOrder.shipping_amount + convenienceFee + deliveryCharge + newTaxAmount;

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
      case ORDER_STATUS.PAYMENT_SUBMITTED:
        return <Badge variant="secondary"><DollarSign className="h-3 w-3 mr-1" />Payment Submitted</Badge>;
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
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>${order.shipping_amount.toFixed(2)}</span>
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
                      <span>Shipping:</span>
                      <span>${order.shipping_amount.toFixed(2)}</span>
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
                      <span>${(order.subtotal + order.shipping_amount + (parseFloat(invoiceForm.convenience_fee) || 0) + (parseFloat(invoiceForm.delivery_charge) || 0) + ((order.subtotal + (parseFloat(invoiceForm.convenience_fee) || 0) + (parseFloat(invoiceForm.delivery_charge) || 0)) * 0.0825)).toFixed(2)}</span>
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
          <div className="space-y-2">
            {paymentData && (
              <div className="text-xs space-y-1">
                <p><strong>Transaction ID:</strong> {paymentData.transaction_id}</p>
                <p><strong>Amount:</strong> ${paymentData.payment_amount}</p>
                {paymentData.payment_screenshot_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(paymentData.payment_screenshot_url, '_blank')}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Screenshot
                  </Button>
                )}
              </div>
            )}
            <div className="flex gap-1">
              <Button
                size="sm"
                onClick={() => handleVerifyPayment(order.id, true)}
                disabled={isVerifyingPayment}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verify
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleVerifyPayment(order.id, false)}
                disabled={isVerifyingPayment}
              >
                <XCircle className="h-3 w-3 mr-1" />
                Reject
              </Button>
            </div>
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
    <Card className="bg-neutral-900/60 border-neutral-800">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-center">Actions</TableHead>
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
                        <p className="text-xs text-muted-foreground">{order.profiles.email}</p>
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