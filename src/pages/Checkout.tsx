import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Lock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createServerOrder, captureServerOrder } from "@/services/orderService";

const TAX_RATE = 0.0825; // still used for local pre-display only (server is authoritative)

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      // In development mode, bypass authentication for testing
      if (import.meta.env.DEV) {
        console.warn("Development mode: Bypassing authentication for checkout testing");
        setIsAuthenticated(true);
        return;
      }
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with checkout.",
          variant: "destructive"
        });
        navigate("/account");
        return;
      }
    };
    
    checkAuth();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!import.meta.env.DEV) {
        setIsAuthenticated(!!session);
        if (!session && event !== 'INITIAL_SESSION') {
          navigate("/account");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  const [isFormValid, setIsFormValid] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [localOrderId, setLocalOrderId] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);

  const fetchUserAddresses = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error.message);
    } else {
      setAddresses(data);
      const defaultAddress = data.find((addr: any) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id);
        setShippingInfo({
          firstName: defaultAddress.first_name || "",
            lastName: defaultAddress.last_name || "",
            address: defaultAddress.address_line_1 || "",
            city: defaultAddress.city || "",
            state: defaultAddress.state || "",
            zip: defaultAddress.postal_code || "",
        });
      }
    }
  }, []);

  useEffect(() => { fetchUserAddresses(); }, [fetchUserAddresses]);

  const handleAddressSelect = (id: string) => {
    setSelectedAddress(id);
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setShippingInfo({
        firstName: addr.first_name || "",
        lastName: addr.last_name || "",
        address: addr.address_line_1 || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.postal_code || "",
      });
    }
  };

  const handleShippingChange = (e: any) => {
    const { id, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [id]: value }));
  };

  const isShippingInfoValid = useCallback(() => {
    return Object.values(shippingInfo).every(field => field.trim() !== "");
  }, [shippingInfo]);

  useEffect(() => {
    setIsFormValid(isShippingInfoValid());
  }, [shippingInfo, isShippingInfoValid]);

  // Client-side display only (server recomputes authoritative totals)
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 75 ? 0 : 9.99;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const resetAfterSuccess = (orderData?: any) => {
    clearCart();
    setPaypalOrderId(null);
    setLocalOrderId(null);
    toast({
      title: "Order Placed!",
      description: "Thank you for your purchase. Your order has been successfully placed.",
    });
    
    // Redirect to order confirmation page with order ID
    if (orderData?.localOrder?.id) {
      navigate(`/order-confirmation?order_id=${orderData.localOrder.id}`);
    } else if (localOrderId) {
      navigate(`/order-confirmation?order_id=${localOrderId}`);
    } else {
      navigate("/");
    }
  };

  // PayPal Buttons integration (Server-Driven)
  const createOrder = async () => {
    if (cartItems.length === 0) {
      toast({ title: "Cart empty", variant: "destructive" });
      throw new Error("Empty cart");
    }
    setIsPaymentProcessing(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const serverResp = await createServerOrder(
        cartItems.map(ci => ({ id: ci.id, quantity: ci.quantity })),
        {
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
          line1: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zip,
          country: "US",
        },
        userId
      );

      setLocalOrderId(serverResp.localOrderId);
      setPaypalOrderId(serverResp.paypalOrderId);
      return serverResp.paypalOrderId; // PayPal Buttons expects this string
    } catch (err: any) {
      console.error(err);
      toast({ title: "Order Error", description: err.message, variant: "destructive" });
      setIsPaymentProcessing(false);
      throw err;
    }
  };

  const onApprove = async (data: any, actions: any) => {
    // With server-based capture we do NOT call actions.order.capture()
    // Instead we call our capture endpoint
    setIsPaymentProcessing(true);
    try {
      if (!paypalOrderId || !localOrderId) {
        throw new Error("Order IDs missing");
      }
      const captureResult = await captureServerOrder(paypalOrderId, localOrderId);
      if (captureResult?.localOrder?.payment_status === "completed") {
        resetAfterSuccess(captureResult);
      } else {
        toast({
          title: "Capture Warning",
          description: "Order captured but payment status not completed.",
        });
        // Still redirect to confirmation even if status is not completed
        resetAfterSuccess(captureResult);
      }
    } catch (err: any) {
      console.error("Capture error:", err);
      toast({
        title: "Payment Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const onCancel = () => {
    setIsPaymentProcessing(false);
    toast({ title: "Payment Cancelled", description: "You cancelled the PayPal approval." });
  };

  const onError = (err: any) => {
    console.error("PayPal button error:", err);
    setIsPaymentProcessing(false);
    toast({
      title: "Payment Error",
      description: "Something went wrong initializing PayPal.",
      variant: "destructive",
    });
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect handled in useEffect, but show message just in case
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-8">Please log in to continue with checkout.</p>
          <Button asChild>
            <Link to="/account">Log In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-8">
              Start adding some amazing auto parts to your cart!
            </p>
            <Button asChild>
              <Link to="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="saved-addresses">Select a saved address</Label>
                    <Select onValueChange={handleAddressSelect} value={selectedAddress || ""}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an address" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            {address.address_line_1}, {address.city} {address.is_default && "(Default)"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={shippingInfo.firstName} onChange={handleShippingChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={shippingInfo.lastName} onChange={handleShippingChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" value={shippingInfo.address} onChange={handleShippingChange} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={shippingInfo.city} onChange={handleShippingChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" value={shippingInfo.state} onChange={handleShippingChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input id="zip" value={shippingInfo.zip} onChange={handleShippingChange} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isFormValid ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      Click below to pay using PayPal or a linked card.
                    </p>
                    <PayPalButtons
                      style={{ layout: "vertical" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      onCancel={onCancel}
                      onError={onError}
                      disabled={isPaymentProcessing}
                      forceReRender={[JSON.stringify(shippingInfo), cartItems.length]}
                    />
                    {isPaymentProcessing && (
                      <p className="text-sm text-muted-foreground">Processing payment...</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      Please complete all shipping details to enable payment.
                    </p>
                    <Button className="w-full" disabled>
                      Pay with PayPal
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className={cn("md:sticky md:top-20 md:h-fit")}>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">{item.quantity} x</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (est.)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>Secure checkout with SSL encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Checkout;