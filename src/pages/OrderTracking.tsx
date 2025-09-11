import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Package, Truck, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import TrackOrderTimeline from "@/components/TrackOrderTimeline";

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
  order_items?: Array<{
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

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/account");
          return;
        }

        // Fetch order details
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select(`
            id,
            order_number,
            total_amount,
            status,
            payment_status,
            created_at,
            shipped_at,
            delivered_at,
            shipping_address
          `)
          .eq("id", orderId)
          .eq("user_id", session.user.id)
          .single();

        if (orderError) throw orderError;

        // Fetch order items
        const { data: items, error: itemsError } = await supabase
          .from("order_items")
          .select("product_name, quantity, unit_price, total_price")
          .eq("order_id", orderId);

        if (itemsError) throw itemsError;

        setOrderDetails({
          ...order,
          order_items: items || []
        });
      } catch (err: any) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, navigate]);

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
      case "processing":
        return "outline";
      default:
        return "outline";
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
              <Badge variant={getStatusBadgeVariant(orderDetails.status)}>
                {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Track your order: <span className="font-semibold">{orderDetails.order_number}</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Track Order Progress */}
            <div className="md:col-span-2">
              <TrackOrderTimeline orderStatus={orderDetails.status} />
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