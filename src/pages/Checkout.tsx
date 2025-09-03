import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Lock } from "lucide-react";

const TAX_RATE = 0.08; // Standardized Tax Rate

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setShippingInfo((prev) => ({ ...prev, [id]: value }));
  };

  const validateShippingInfo = () => {
    const newErrors: { [key: string]: string } = {};
    if (!shippingInfo.firstName) newErrors.firstName = "First name is required.";
    if (!shippingInfo.lastName) newErrors.lastName = "Last name is required.";
    if (!shippingInfo.address) newErrors.address = "Address is required.";
    if (!shippingInfo.city) newErrors.city = "City is required.";
    if (!shippingInfo.state) newErrors.state = "State is required.";
    if (!shippingInfo.zip) newErrors.zip = "ZIP code is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 275 ? 0 : 9.99;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;

  const handlePlaceOrder = () => {
    const isFormValid = validateShippingInfo();
    if (!isFormValid) {
        toast({
            title: "Incomplete Information",
            description: "Please fill out all required shipping fields.",
            variant: "destructive",
        });
        return;
    }

    setIsLoading(true);
    // Simulate API call for placing order
    setTimeout(() => {
      setIsLoading(false);
      clearCart();
      toast({
        title: "Order Placed!",
        description: "Thank you for your purchase. Your order has been successfully placed.",
      });
      navigate("/");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Shipping and Payment Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" placeholder="John" value={shippingInfo.firstName} onChange={handleShippingChange} className={errors.firstName ? 'border-red-500' : ''} />
                    {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" placeholder="Doe" value={shippingInfo.lastName} onChange={handleShippingChange} className={errors.lastName ? 'border-red-500' : ''} />
                    {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" placeholder="123 Main St" value={shippingInfo.address} onChange={handleShippingChange} className={errors.address ? 'border-red-500' : ''} />
                  {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Anytown" value={shippingInfo.city} onChange={handleShippingChange} className={errors.city ? 'border-red-500' : ''} />
                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input id="state" placeholder="CA" value={shippingInfo.state} onChange={handleShippingChange} className={errors.state ? 'border-red-500' : ''} />
                    {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input id="zip" placeholder="12345" value={shippingInfo.zip} onChange={handleShippingChange} className={errors.zip ? 'border-red-500' : ''} />
                    {errors.zip && <p className="text-sm text-red-500">{errors.zip}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <div className="relative">
                    <Input id="card-number" placeholder="**** **** **** ****" />
                    <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry-date">Expiry Date</Label>
                    <Input id="expiry-date" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {cartItems.map((item) => (
                    <li key={item.id} className="flex justify-between">
                      <span>
                        {item.name} (x{item.quantity})
                      </span>
                      <span>
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>
                <Separator />
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8.%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Place Order Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={isLoading || cartItems.length === 0}
            >
              {isLoading ? "Placing Order..." : "Place Order"}
            </Button>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <Lock className="h-4 w-4 mr-2" />
              <span>Secure checkout with SSL encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
