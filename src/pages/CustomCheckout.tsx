import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Package, Clock, MapPin, Edit } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCustomOrder } from "@/services/customOrderService";

const TAX_RATE = 0.0825;

interface Address {
  id: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  type: string;
  is_default: boolean;
}

const CustomCheckout = () => {
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Address management state
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [useManualEntry, setUseManualEntry] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(true);
  
  const [shippingInfo, setShippingInfo] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    zip: "",
  });

  // Fetch user addresses
  const fetchUserAddresses = useCallback(async (userId: string) => {
    try {
      setAddressesLoading(true);
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        setAddresses(data);
        
        // Auto-select default address if exists and no manual entry preference
        const defaultAddress = data.find((addr) => addr.is_default);
        if (defaultAddress && !useManualEntry) {
          setSelectedAddressId(defaultAddress.id);
          populateFromAddress(defaultAddress);
        } else if (data.length === 0) {
          // No saved addresses, enable manual entry
          setUseManualEntry(true);
        }
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setUseManualEntry(true); // Fallback to manual entry
    } finally {
      setAddressesLoading(false);
    }
  }, [useManualEntry]);

  // Populate shipping info from selected address
  const populateFromAddress = (address: Address) => {
    setShippingInfo({
      firstName: address.first_name,
      lastName: address.last_name,
      address: address.address_line_1 + (address.address_line_2 ? ` ${address.address_line_2}` : ""),
      city: address.city,
      state: address.state,
      zip: address.postal_code,
    });
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to continue with checkout.",
          variant: "destructive"
        });
        navigate("/account");
      } else {
        // Fetch user addresses after authentication
        fetchUserAddresses(session.user.id);
      }
    };
    
    checkAuth();
  }, [navigate, toast, fetchUserAddresses]);

  // Check if form is valid (either selected address or complete manual entry)
  const isFormValid = useManualEntry 
    ? Object.values(shippingInfo).every(value => value.trim() !== "")
    : selectedAddressId !== "" || Object.values(shippingInfo).every(value => value.trim() !== "");

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const handleInputChange = (field: string, value: string) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSelection = (addressId: string) => {
    if (addressId === "manual") {
      setUseManualEntry(true);
      setSelectedAddressId("");
      // Clear form for manual entry
      setShippingInfo({
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        zip: "",
      });
    } else {
      setUseManualEntry(false);
      setSelectedAddressId(addressId);
      const selectedAddress = addresses.find(addr => addr.id === addressId);
      if (selectedAddress) {
        populateFromAddress(selectedAddress);
      }
    }
  };

  const getSelectedAddress = () => {
    return addresses.find(addr => addr.id === selectedAddressId);
  };

  const handleSubmitOrder = async () => {
    if (!isFormValid) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all shipping details.",
        variant: "destructive"
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Your cart is empty.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const shippingAddress = {
        first_name: shippingInfo.firstName,
        last_name: shippingInfo.lastName,
        line1: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.zip,
        country: "US",
      };

      const result = await createCustomOrder(cartItems, shippingAddress, userId);

      // Clear cart and show success message
      clearCart();
      
      // Invalidate admin orders cache so AdminOrderManagement shows the new order
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      
      toast({
        title: "Order Request Submitted!",
        description: `Your order ${result.orderNumber} has been submitted for admin review. You will receive an invoice soon.`,
      });

      // Navigate to order details page
      navigate(`/order/${result.orderId}`);
      
    } catch (error: unknown) {
      console.error("Order submission error:", error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to submit order request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <Link to="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-4">Checkout</h1>
            <p className="text-muted-foreground">
              Submit your order request. Our admin will review and send you an invoice.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address Selection */}
                {!addressesLoading && addresses.length > 0 && (
                  <div className="space-y-3">
                    <Label>Choose Address</Label>
                    <Select 
                      value={useManualEntry ? "manual" : selectedAddressId} 
                      onValueChange={handleAddressSelection}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a saved address or enter manually" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id}>
                            <div className="flex items-center gap-2">
                              {address.is_default && (
                                <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                              <span>
                                {address.first_name} {address.last_name} - {address.address_line_1}, {address.city}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        <SelectItem value="manual">
                          <div className="flex items-center gap-2">
                            <Edit className="h-4 w-4" />
                            Enter new address manually
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Address Preview for Selected Address */}
                {!useManualEntry && selectedAddressId && getSelectedAddress() && (
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Selected Address Preview
                      </h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddressSelection("manual")}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit for this order
                      </Button>
                    </div>
                    {(() => {
                      const addr = getSelectedAddress()!;
                      return (
                        <div className="text-sm space-y-1">
                          <p className="font-medium">{addr.first_name} {addr.last_name}</p>
                          <p>{addr.address_line_1}</p>
                          {addr.address_line_2 && <p>{addr.address_line_2}</p>}
                          <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                          <p>{addr.country}</p>
                          {addr.phone && <p className="text-muted-foreground">{addr.phone}</p>}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Manual Entry Form */}
                {(useManualEntry || addresses.length === 0) && (
                  <>
                    {addresses.length === 0 && !addressesLoading && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          No saved addresses found. Please enter your shipping details below.
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={shippingInfo.firstName}
                          onChange={(e) => handleInputChange("firstName", e.target.value)}
                          placeholder="John"
                          disabled={!useManualEntry && selectedAddressId !== ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={shippingInfo.lastName}
                          onChange={(e) => handleInputChange("lastName", e.target.value)}
                          placeholder="Doe"
                          disabled={!useManualEntry && selectedAddressId !== ""}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={shippingInfo.address}
                        onChange={(e) => handleInputChange("address", e.target.value)}
                        placeholder="123 Main Street"
                        disabled={!useManualEntry && selectedAddressId !== ""}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={shippingInfo.city}
                          onChange={(e) => handleInputChange("city", e.target.value)}
                          placeholder="New York"
                          disabled={!useManualEntry && selectedAddressId !== ""}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Select 
                          onValueChange={(value) => handleInputChange("state", value)}
                          value={shippingInfo.state}
                          disabled={!useManualEntry && selectedAddressId !== ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AL">Alabama</SelectItem>
                            <SelectItem value="CA">California</SelectItem>
                            <SelectItem value="FL">Florida</SelectItem>
                            <SelectItem value="NY">New York</SelectItem>
                            <SelectItem value="TX">Texas</SelectItem>
                            {/* Add more states as needed */}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={shippingInfo.zip}
                        onChange={(e) => handleInputChange("zip", e.target.value)}
                        placeholder="10001"
                        disabled={!useManualEntry && selectedAddressId !== ""}
                      />
                    </div>
                  </>
                )}

                {/* Loading State */}
                {addressesLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-2 text-muted-foreground">Loading addresses...</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity} × ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-semibold text-sm">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Estimated Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    *Final total may include additional convenience and delivery fees as determined by admin.
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={!isFormValid || isSubmitting}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Submitting Order Request...
                      </>
                    ) : (
                      <>
                        <Package className="h-4 w-4 mr-2" />
                        Submit Order Request
                      </>
                    )}
                  </Button>
                  
                  {!isFormValid && (
                    <p className="text-sm text-muted-foreground mt-2 text-center">
                      Please complete all shipping details above
                    </p>
                  )}
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mt-4">
                  <h4 className="font-semibold text-sm mb-2">What happens next?</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Admin reviews your order request</li>
                    <li>2. You'll receive an invoice with final pricing</li>
                    <li>3. Accept the invoice to proceed with payment</li>
                    <li>4. Complete payment via external payment method</li>
                    <li>5. Submit payment confirmation</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomCheckout;