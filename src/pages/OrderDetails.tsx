import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  ExternalLink,
  AlertCircle,
  FileText,
  CreditCard
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getOrderDetails, respondToInvoice, submitPayment } from "@/services/customOrderService";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";

interface OrderDetails {
  id: string;
  order_number: string;
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
  shipping_address?: any;
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [adminPaypalEmail, setAdminPaypalEmail] = useState<string>("");
  
  // Payment submission form state
  const [paymentForm, setPaymentForm] = useState({
    transactionId: "",
    paymentAmount: "",
    screenshotFile: null as File | null
  });

  // Fetch admin PayPal email
  useEffect(() => {
    const fetchAdminPayPalEmail = async () => {
      try {
        const { data, error } = await supabase
          .from("admin_paypal_credentials")
          .select("paypal_email")
          .eq("is_active", true)
          .maybeSingle(); // Use maybeSingle instead of single to handle no results gracefully

        if (error) {
          console.warn("Error fetching admin PayPal email:", error.message);
          setAdminPaypalEmail("admin@autospeedshop.com"); // fallback
        } else if (data) {
          setAdminPaypalEmail(data.paypal_email);
        } else {
          // No active PayPal credentials found
          console.warn("No active admin PayPal credentials found");
          setAdminPaypalEmail("admin@autospeedshop.com"); // fallback
        }
      } catch (error) {
        console.warn("Unexpected error fetching admin PayPal email:", error);
        setAdminPaypalEmail("admin@autospeedshop.com"); // fallback
      }
    };

    fetchAdminPayPalEmail();
  }, []);

  useEffect(() => {
    if (!orderId) {
      navigate("/account/orders");
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/account");
          return;
        }

        const order = await getOrderDetails(orderId);
        
        // Verify user owns this order
        if (order.user_id !== session.user.id) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this order.",
            variant: "destructive"
          });
          navigate("/account/orders");
          return;
        }

        setOrderDetails(order);
      } catch (error: any) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load order details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, navigate, toast]);

  const handleInvoiceResponse = async (accepted: boolean) => {
    if (!orderDetails) return;

    setResponding(true);
    try {
      await respondToInvoice(orderDetails.id, accepted);
      
      // Refresh order details
      const updatedOrder = await getOrderDetails(orderDetails.id);
      setOrderDetails(updatedOrder);

      toast({
        title: accepted ? "Invoice Accepted" : "Invoice Declined",
        description: accepted 
          ? "You can now proceed with payment using the PayPal details below."
          : "The invoice has been declined. The order will be cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to respond to invoice",
        variant: "destructive"
      });
    } finally {
      setResponding(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!orderDetails || !paymentForm.transactionId || !paymentForm.paymentAmount || !paymentForm.screenshotFile) {
      toast({
        title: "Incomplete Payment Information",
        description: "Please fill in all payment details and upload a screenshot.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingPayment(true);
    try {
      // Upload screenshot to Supabase storage
      const fileExt = paymentForm.screenshotFile.name.split('.').pop();
      const fileName = `payment_${orderDetails.id}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentForm.screenshotFile);

      if (uploadError) {
        throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      // Submit payment details
      await submitPayment(orderDetails.id, {
        transaction_id: paymentForm.transactionId,
        payment_screenshot_url: publicUrl,
        payment_amount: parseFloat(paymentForm.paymentAmount),
        submitted_at: new Date().toISOString()
      });

      // Refresh order details
      const updatedOrder = await getOrderDetails(orderDetails.id);
      setOrderDetails(updatedOrder);

      toast({
        title: "Payment Submitted",
        description: "Your payment details have been submitted for admin verification."
      });

      // Reset form
      setPaymentForm({
        transactionId: "",
        paymentAmount: "",
        screenshotFile: null
      });

    } catch (error: any) {
      toast({
        title: "Payment Submission Failed",
        description: error.message || "Failed to submit payment details",
        variant: "destructive"
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case ORDER_STATUS.PENDING_ADMIN_REVIEW:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case ORDER_STATUS.INVOICE_SENT:
        return <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />Invoice Sent</Badge>;
      case ORDER_STATUS.INVOICE_ACCEPTED:
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Invoice Accepted</Badge>;
      case ORDER_STATUS.INVOICE_DECLINED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Invoice Declined</Badge>;
      case ORDER_STATUS.PAYMENT_SUBMITTED:
        return <Badge variant="secondary"><CreditCard className="h-3 w-3 mr-1" />Payment Submitted</Badge>;
      case ORDER_STATUS.CONFIRMED:
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Confirmed</Badge>;
      case ORDER_STATUS.CANCELLED:
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We couldn't find the order you're looking for.
          </p>
          <Button asChild>
            <Link to="/account/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  const hasInvoice = orderDetails.convenience_fee !== undefined || orderDetails.delivery_charge !== undefined;
  const canRespondToInvoice = orderDetails.status === ORDER_STATUS.INVOICE_SENT;
  const canPayment = orderDetails.status === ORDER_STATUS.INVOICE_ACCEPTED;
  const paymentSubmitted = orderDetails.status === ORDER_STATUS.PAYMENT_SUBMITTED;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Order Details</h1>
              {getStatusBadge(orderDetails.status)}
            </div>
            <p className="text-muted-foreground">
              Order #{orderDetails.order_number} • Created {new Date(orderDetails.created_at).toLocaleDateString()}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-semibold">{orderDetails.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  {getStatusBadge(orderDetails.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <span className="capitalize">{orderDetails.payment_status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>{new Date(orderDetails.updated_at).toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                {orderDetails.shipping_address ? (
                  <div className="space-y-1">
                    <p className="font-medium">
                      {orderDetails.shipping_address.first_name} {orderDetails.shipping_address.last_name}
                    </p>
                    <p>{orderDetails.shipping_address.line1}</p>
                    <p>
                      {orderDetails.shipping_address.city}, {orderDetails.shipping_address.state} {orderDetails.shipping_address.postal_code}
                    </p>
                    <p>{orderDetails.shipping_address.country || "US"}</p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No shipping address available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          {orderDetails.order_items && orderDetails.order_items.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderDetails.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div>
                        <h4 className="font-medium">{item.product_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">${item.total_price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Invoice Section */}
          {hasInvoice && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${orderDetails.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${orderDetails.shipping_amount.toFixed(2)}</span>
                  </div>
                  {orderDetails.convenience_fee && (
                    <div className="flex justify-between">
                      <span>Convenience Fee:</span>
                      <span>${orderDetails.convenience_fee.toFixed(2)}</span>
                    </div>
                  )}
                  {orderDetails.delivery_charge && (
                    <div className="flex justify-between">
                      <span>Delivery Charge:</span>
                      <span>${orderDetails.delivery_charge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>${orderDetails.tax_amount.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>${orderDetails.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Invoice Response Actions */}
                {canRespondToInvoice && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-semibold">Action Required</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Please review the invoice above and choose to accept or decline.
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleInvoiceResponse(true)}
                        disabled={responding}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept Invoice
                      </Button>
                      <Button 
                        onClick={() => handleInvoiceResponse(false)}
                        disabled={responding}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Decline Invoice
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* PayPal Payment Section */}
          {canPayment && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold mb-2">Pay via PayPal</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Send payment of <strong>${orderDetails.total_amount.toFixed(2)}</strong> to:
                    </p>
                    <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                      <span className="font-mono">{adminPaypalEmail}</span>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => window.open('https://paypal.com', '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open PayPal
                      </Button>
                    </div>
                  </div>

                  {/* Payment Submission Form */}
                  <div className="space-y-4">
                    <h4 className="font-semibold">After Payment, Submit Details Below:</h4>
                    
                    <div>
                      <Label htmlFor="transactionId">PayPal Transaction ID</Label>
                      <Input
                        id="transactionId"
                        value={paymentForm.transactionId}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, transactionId: e.target.value }))}
                        placeholder="Enter PayPal transaction ID"
                      />
                    </div>

                    <div>
                      <Label htmlFor="paymentAmount">Payment Amount</Label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        step="0.01"
                        value={paymentForm.paymentAmount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentAmount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="screenshot">Payment Screenshot</Label>
                      <Input
                        id="screenshot"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, screenshotFile: e.target.files?.[0] || null }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload a screenshot of your PayPal payment confirmation
                      </p>
                    </div>

                    <Button 
                      onClick={handlePaymentSubmit}
                      disabled={submittingPayment}
                      className="w-full"
                    >
                      {submittingPayment ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting Payment...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Submit Payment Details
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Submitted Status */}
          {paymentSubmitted && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Payment Submitted</h3>
                  <p className="text-muted-foreground">
                    Your payment details have been submitted and are being verified by our admin. 
                    You will be notified once the payment is confirmed.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {orderDetails.notes && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{orderDetails.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" asChild>
              <Link to="/account/orders">Back to Orders</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;