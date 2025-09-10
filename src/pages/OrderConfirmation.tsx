import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, Clock, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface OrderDetails {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
  order_items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get("order_id");

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
            created_at,
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
          <p className="text-muted-foreground">Loading order details...</p>
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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "delivered":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "shipped":
      case "in_transit":
        return <Truck className="h-6 w-6 text-blue-500" />;
      case "processing":
        return <Package className="h-6 w-6 text-orange-500" />;
      default:
        return <Clock className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "delivered":
        return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "shipped":
      case "in_transit":
        return "text-blue-600 bg-blue-50 dark:bg-blue-900/20";
      case "processing":
        return "text-orange-600 bg-orange-50 dark:bg-orange-900/20";
      default:
        return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your purchase. Your order has been successfully placed.
            </p>
          </div>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                  <span className="text-muted-foreground">Order Date:</span>
                  <span>{new Date(orderDetails.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(orderDetails.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderDetails.status)}`}>
                      {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg">${orderDetails.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

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
                    {orderDetails.shipping_address.line2 && <p>{orderDetails.shipping_address.line2}</p>}
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
                  {orderDetails.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link to={`/orders/${orderDetails.id}/tracking`}>
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/account/orders">View All Orders</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;