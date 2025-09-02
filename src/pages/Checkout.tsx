import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { ChevronRight } from "lucide-react";

// Mock data for shipping options
const shippingOptions = [
  { id: "standard", name: "Standard Shipping", cost: 5.00 },
  { id: "express", name: "Express Shipping", cost: 15.00 },
];

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  const [shippingAddress, setShippingAddress] = useState({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US",
  });

  const [selectedShipping, setSelectedShipping] = useState(shippingOptions[0]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost = selectedShipping.cost;
  const total = subtotal + shippingCost;

  // Function to validate the form fields
  const validateForm = () => {
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email) {
      toast({
        title: "Validation Error",
        description: "Please fill out all customer information fields.",
        variant: "destructive",
      });
      return false;
    }
    if (!shippingAddress.addressLine1 || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      toast({
        title: "Validation Error",
        description: "Please fill out all required shipping address fields.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handlePlaceOrder = (e: FormEvent) => {
    e.preventDefault();
    
    // Check if cart is empty first
    if (cartItems.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty. Please add items to your cart before checking out.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate the form before proceeding
    if (!validateForm()) {
      return;
    }

    // Simulate order placement
    console.log("Placing order with details:", { customerInfo, shippingAddress, total });

    // Clear the cart after a successful order
    clearCart();

    // Show a success toast and navigate to a confirmation page or home
    toast({
      title: "Order Placed!",
      description: "Thank you for your purchase. Your order is being processed.",
      variant: "default",
    });

    navigate("/"); // Redirect to home or a dedicated thank you page
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {/* Checkout Form Section */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={customerInfo.firstName} 
                    onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={customerInfo.lastName} 
                    onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={customerInfo.email} 
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input 
                    id="addressLine1" 
                    value={shippingAddress.addressLine1} 
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine1: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="addressLine2" 
                    value={shippingAddress.addressLine2} 
                    onChange={(e) => setShippingAddress({ ...shippingAddress, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={shippingAddress.city} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input 
                      id="state" 
                      value={shippingAddress.state} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input 
                      id="postalCode" 
                      value={shippingAddress.postalCode} 
                      onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input 
                      id="country" 
                      value={shippingAddress.country} 
                      disabled 
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Method */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shippingOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={option.id}
                      name="shippingMethod"
                      value={option.id}
                      checked={selectedShipping.id === option.id}
                      onChange={() => setSelectedShipping(option)}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <label htmlFor={option.id} className="flex-1 text-sm font-medium">
                      {option.name}
                    </label>
                    <span className="text-sm font-semibold">${option.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Details - Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  This section would contain a payment form (e.g., Stripe Elements) to securely
                  collect credit card information. For now, clicking "Place Order" will simulate a successful payment.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input id="card-number" placeholder="XXXX-XXXX-XXXX-XXXX" />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiration">Expiration</Label>
                    <Input id="expiration" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="CVC" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip-code">Zip Code</Label>
                    <Input id="zip-code" placeholder="XXXXX" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Section */}
        <div className="md:sticky md:top-20 md:h-fit">
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
                  <span className="font-medium">${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={handlePlaceOrder} className="w-full mt-6">
                Place Order
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
