import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Send
} from "lucide-react";

interface InvoiceOrder {
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

interface InvoiceTableProps {
  orders: InvoiceOrder[];
  loading: boolean;
  onCreateInvoice: (orderId: string, invoiceData: {
    convenience_fee: number;
    delivery_charge: number;
    notes: string;
  }) => Promise<void>;
  isCreatingInvoice: boolean;
}

export const InvoiceTable = ({ 
  orders, 
  loading, 
  onCreateInvoice,
  isCreatingInvoice 
}: InvoiceTableProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_admin_review':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'invoice_sent':
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Invoice Sent</Badge>;
      case 'invoice_accepted':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'invoice_declined':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>;
      case 'payment_pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Payment Pending</Badge>;
      case 'payment_submitted':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Payment Submitted</Badge>;
      case 'payment_verified':
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'shipped':
        return <Badge variant="default"><Package className="h-3 w-3 mr-1" />Shipped</Badge>;
      case 'delivered':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Delivered</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const InvoiceCreateDialog = ({ order }: { order: InvoiceOrder }) => {
    const [invoiceForm, setInvoiceForm] = useState({
      convenience_fee: "",
      delivery_charge: "",
      notes: ""
    });

    const handleSubmit = async () => {
      const convenienceFee = parseFloat(invoiceForm.convenience_fee) || 0;
      const deliveryCharge = parseFloat(invoiceForm.delivery_charge) || 0;

      await onCreateInvoice(order.id, {
        convenience_fee: convenienceFee,
        delivery_charge: deliveryCharge,
        notes: invoiceForm.notes
      });

      // Reset form
      setInvoiceForm({ convenience_fee: "", delivery_charge: "", notes: "" });
    };

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm">
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
              <DialogTrigger asChild>
                <Button variant="outline">Cancel</Button>
              </DialogTrigger>
              <Button 
                onClick={handleSubmit}
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
  };

  const getActionButton = (order: InvoiceOrder) => {
    switch (order.status) {
      case 'pending_admin_review':
        return <InvoiceCreateDialog order={order} />;
      case 'payment_submitted':
        return (
          <div className="text-center text-sm text-muted-foreground">
            Payment submitted - check Payout Management for verification
          </div>
        );
      default:
        return <span className="text-muted-foreground text-sm">No action needed</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Invoice Management
        </CardTitle>
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
              There are currently no orders requiring invoice actions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};