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

const TAX_RATE = 0.0825;

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleShippingChange = (e) => {
    const { id, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [id]: value }));
  };

  const isShippingInfoValid = useCallback(() => {
    return Object.values(shippingInfo).every(field => field.trim() !== "");
  }, [shippingInfo]);

  useEffect(() => {
    setIsFormValid(isShippingInfoValid());
  }, [shippingInfo, isShippingInfoValid]);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 75 ? 0 : 9.99;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const handleApprove = (details) => {
    console.log("Payment successful:", details);
    setIsPaymentProcessing(false);
    clearCart();
    toast({
      title: "Order Placed!",
      description: "Thank you for your purchase. Your order has been successfully placed.",
    });
    navigate("/");
  };

  const createOrder = (data, actions) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: total.toFixed(2),
            currency_code: "USD",
          },
        },
      ],
    });
  };

  const onApprove = (data, actions) => {
    setIsPaymentProcessing(true);
    return actions.order.capture().then((details) => {
      handleApprove(details);
    });
  };

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
      {/* Added pt-24 to fix the header overlap issue */}
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" value={shippingInfo.firstName} onChange={handleShippingChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" value={shippingInfo.lastName} onChange={handleShippingChange} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" value={shippingInfo.address} onChange={handleShippingChange} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Anytown" value={shippingInfo.city} onChange={handleShippingChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="CA" value={shippingInfo.state} onChange={handleShippingChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="12345" value={shippingInfo.zip} onChange={handleShippingChange} />
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
                      Click the button below to pay using PayPal or a Credit/Debit Card.
                    </p>
                    <PayPalButtons
                      style={{ layout: "horizontal" }}
                      createOrder={createOrder}
                      onApprove={onApprove}
                      disabled={isPaymentProcessing}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Please fill out all shipping details to enable payment.</p>
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
                  {cartItems.length > 0 ? (
                    cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-muted-foreground">{item.quantity} x</span>
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground">Your cart is empty.</p>
                  )}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span className="font-medium">${shipping.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center text-sm text-muted-foreground mt-4">
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Secure checkout with SSL encryption</span>
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