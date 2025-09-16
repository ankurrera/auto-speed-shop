import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Package, Truck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TrackOrderTimeline from "@/components/TrackOrderTimeline";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";
import { subscribeToOrderStatusUpdates, OrderStatusUpdate } from "@/services/orderStatusService";
import { getOrderDetails } from "@/services/customOrderService";

interface OrderDetails {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
  shipped_at?: string;
  delivered_at?: string;
  shipping_address: any;
  user_id?: string;
  order_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderDetails = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/account");
        return;
      }

      // Use the same service as OrderDetails page for consistency
      const order = await getOrderDetails(orderId!);
      
      // Verify user owns this order
      if (order.user_id !== session.user.id) {
        setError("You don't have permission to view this order.");
        return;
      }

      setOrderDetails(order);
    } catch (err: any) {
      console.error("Error fetching order details:", err);
      setError("Failed to load order details");
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate]);

  const handleStatusUpdate = useCallback((update: OrderStatusUpdate) => {
    console.log('[OrderTracking] Received real-time status update:', update);
    setOrderDetails(prev => {
      if (!prev || prev.id !== update.order_id) return prev;
      
      return {
        ...prev,
        status: update.status,
        payment_status: update.payment_status || prev.payment_status
      };
    });
  }, []);

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    fetchOrderDetails();

    // Set up real-time subscription for order status updates
    const unsubscribe = subscribeToOrderStatusUpdates(orderId, handleStatusUpdate);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [orderId, fetchOrderDetails, handleStatusUpdate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order tracking...</p>
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-8">
            {error || "We couldn't find the order you're looking for."}
          </p>
          <div className="space-x-4">
            <Button asChild>
              <Link to="/account/orders">View Orders</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Generate tracking events based on order status and dates
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "default";
      case "shipped":
      case "in transit":
        return "secondary";
      case "confirmed":
        return "default";
      case "cancelled":
      case "invoice_declined":
        return "destructive";
      case "failed":
        return "destructive";
      case "processing":
      case "pending_admin_review":
      case "payment_pending":
      case "payment_submitted":
        return "outline";
      default:
        return "outline";
    }
  };

  const getDisplayStatus = (status: string, paymentStatus?: string) => {
    // Prioritize payment status for display if it provides more specific information
    const statusToDisplay = paymentStatus || status;
    
    switch (statusToDisplay) {
      case ORDER_STATUS.CANCELLED:
        return "Cancelled";
      case ORDER_STATUS.INVOICE_DECLINED:
        return "Declined";
      case PAYMENT_STATUS.FAILED:
        return "Payment Rejected";
      case ORDER_STATUS.CONFIRMED:
        return "Confirmed";
      case ORDER_STATUS.SHIPPED:
        return "Shipped";
      case ORDER_STATUS.DELIVERED:
        return "Delivered";
      case ORDER_STATUS.PAYMENT_SUBMITTED:
        return "Payment Submitted";
      case ORDER_STATUS.PAYMENT_VERIFIED:
      case PAYMENT_STATUS.VERIFIED:
        return "Payment Verified";
      case ORDER_STATUS.PENDING_ADMIN_REVIEW:
        return "Pending Review";
      case PAYMENT_STATUS.SUBMITTED:
        return "Payment Submitted";
      default:
        return statusToDisplay.charAt(0).toUpperCase() + statusToDisplay.slice(1).replace(/_/g, ' ');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Order Tracking</h1>
              <Badge variant={getStatusBadgeVariant(orderDetails.payment_status || orderDetails.status)}>
                {getDisplayStatus(orderDetails.status, orderDetails.payment_status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Track your order: <span className="font-semibold">{orderDetails.order_number}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Track Order Progress */}
            <div className="md:col-span-2">
              <TrackOrderTimeline 
                orderStatus={orderDetails.status} 
              />
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span className="font-medium">{orderDetails.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant={orderDetails.payment_status === "completed" ? "default" : "secondary"}>
                      {orderDetails.payment_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold">${orderDetails.total_amount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent>
                  {orderDetails.shipping_address ? (
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">
                        {orderDetails.shipping_address.first_name} {orderDetails.shipping_address.last_name}
                      </p>
                      <p>{orderDetails.shipping_address.line1}</p>
                      {orderDetails.shipping_address.line2 && <p>{orderDetails.shipping_address.line2}</p>}
                      <p>
                        {orderDetails.shipping_address.city}, {orderDetails.shipping_address.state} {orderDetails.shipping_address.postal_code}
                      </p>
                      <p>{orderDetails.shipping_address.country || "US"}</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No shipping address available</p>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              {orderDetails.order_items && orderDetails.order_items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {orderDetails.order_items.map((item, index) => (
                        <div key={index} className="text-sm">
                          <div className="font-medium">{item.product_name}</div>
                          <div className="text-muted-foreground">
                            Qty: {item.quantity} × ${item.unit_price.toFixed(2)} = ${item.total_price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Post-Payment Cancellation Guidance */}
              {(orderDetails.status === "payment_submitted" || 
                orderDetails.status === "payment_verified" || 
                orderDetails.status === "confirmed" ||
                orderDetails.status === "shipped" ||
                orderDetails.status === "delivered") && (
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                  <CardHeader>
                    <CardTitle className="text-blue-700 dark:text-blue-300 text-sm">
                      Need to Cancel or Update Your Order?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">
                      For cancellations or updates after payment confirmation, please contact Customer Care Services.
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/account/orders">View All Orders</Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;