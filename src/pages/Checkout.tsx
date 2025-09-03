import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ChevronRight } from "lucide-react";

// Mocking external dependencies to make the component runnable in a single file environment.
// In a real application, you would install these libraries and configure your build process.

// Mock useToast hook
const useToast = () => {
  const toast = ({ title, description, variant }) => {
    console.log(`[Toast] ${variant}: ${title} - ${description}`);
  };
  return { toast };
};

// Mock useCart hook and data
const useCart = () => {
  const [cartItems, setCartItems] = useState([
    { id: "1", name: "Spark Plugs", price: 12.50, quantity: 2 },
    { id: "2", name: "Brake Pads", price: 45.00, quantity: 1 },
    { id: "3", name: "Air Filter", price: 20.00, quantity: 1 },
  ]);

  const clearCart = () => {
    setCartItems([]);
  };

  return { cartItems, clearCart };
};

// Mock useNavigate hook
const useNavigate = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
  };
  return navigate;
};

// Mock data for shipping options
const shippingOptions = [
  { id: "standard", name: "Standard Shipping", cost: 5.00 },
  { id: "express", name: "Express Shipping", cost: 15.00 },
];

const TAX_RATE = 0.0825; // 8.25%

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
  const [isFormValid, setIsFormValid] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const taxAmount = subtotal * TAX_RATE;
  const shippingCost = selectedShipping.cost;
  const total = subtotal + shippingCost + taxAmount;

  // Function to validate the form fields and update state
  const validateForm = useCallback(() => {
    const isValid = customerInfo.firstName && customerInfo.lastName && customerInfo.email &&
                    shippingAddress.addressLine1 && shippingAddress.city && shippingAddress.state && shippingAddress.postalCode;
    setIsFormValid(!!isValid);
    return isValid;
  }, [customerInfo, shippingAddress]);

  const handleApprove = (orderID) => {
    console.log("Payment successful for order ID:", orderID);
    clearCart();
    toast({
      title: "Payment Successful!",
      description: "Your order has been placed and will be shipped shortly.",
      variant: "default",
    });
    navigate("/");
  };

  const handleCustomerInfoChange = (e) => {
    setCustomerInfo({ ...customerInfo, [e.target.id]: e.target.value });
  };

  const handleShippingAddressChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.id]: e.target.value });
  };

  // Mock function for handling the payment.
  const handlePayment = () => {
    // In a real app, this would trigger a payment gateway.
    // Here, we just simulate a successful payment.
    if (isFormValid) {
      handleApprove("MOCK-ORDER-ID-12345");
    }
  };

  useEffect(() => {
    validateForm();
  }, [customerInfo, shippingAddress, validateForm]);

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
                    onChange={handleCustomerInfoChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={customerInfo.lastName} 
                    onChange={handleCustomerInfoChange}
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
                  onChange={handleCustomerInfoChange}
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
                    onChange={handleShippingAddressChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="addressLine2" 
                    value={shippingAddress.addressLine2} 
                    onChange={handleShippingAddressChange}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      value={shippingAddress.city} 
                      onChange={handleShippingAddressChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input 
                      id="state" 
                      value={shippingAddress.state} 
                      onChange={handleShippingAddressChange}
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
                      onChange={handleShippingAddressChange}
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

          {/* Payment Details - with mock button */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Complete your order.
                </p>
                <div className="mt-4">
                  <Button className="w-full" disabled={!isFormValid} onClick={handlePayment}>
                    {isFormValid ? "Pay Now" : "Fill in details to pay"}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
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
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <Button onClick={() => {}} className="w-full mt-6" disabled={!isFormValid}>
                {isFormValid ? "Ready to Pay" : "Fill in Details to Pay"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
