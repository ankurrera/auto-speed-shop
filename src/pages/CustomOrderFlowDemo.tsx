import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Package, 
  FileText, 
  CheckCircle, 
  CreditCard, 
  Upload, 
  ExternalLink,
  Clock,
  AlertCircle,
  DollarSign
} from "lucide-react";

const CustomOrderFlowDemo = () => {
  const [currentView, setCurrentView] = useState<'checkout' | 'orderDetails' | 'adminInvoice'>('checkout');

  const mockOrder = {
    id: "mock-order-123",
    order_number: "ORD-DEMO123",
    status: "invoice_sent",
    subtotal: 150.00,
    shipping_amount: 9.99,
    tax_amount: 13.16,
    total_amount: 173.15,
    convenience_fee: 5.00,
    delivery_charge: 10.00,
    created_at: new Date().toISOString(),
    order_items: [
      { id: "1", product_name: "Brake Pads Set", quantity: 1, unit_price: 75.00, total_price: 75.00 },
      { id: "2", product_name: "Oil Filter", quantity: 2, unit_price: 37.50, total_price: 75.00 }
    ]
  };

  const CheckoutDemo = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Custom Checkout Demo</h1>
        <p className="text-muted-foreground">
          Submit your order request. Our admin will review and send you an invoice.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Shipping Info */}
        <Card>
          <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name</Label>
                <Input value="John" readOnly />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input value="Doe" readOnly />
              </div>
            </div>
            <div>
              <Label>Address</Label>
              <Input value="123 Main Street" readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input value="New York" readOnly />
              </div>
              <div>
                <Label>State</Label>
                <Input value="NY" readOnly />
              </div>
            </div>
            <div>
              <Label>ZIP Code</Label>
              <Input value="10001" readOnly />
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {mockOrder.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <h4 className="font-medium text-sm">{item.product_name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <span className="font-semibold text-sm">${item.total_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${mockOrder.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Shipping:</span>
                <span>${mockOrder.shipping_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>${mockOrder.tax_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Estimated Total:</span>
                <span>${(mockOrder.subtotal + mockOrder.shipping_amount + mockOrder.tax_amount).toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                *Final total may include additional convenience and delivery fees.
              </p>
            </div>

            <Button className="w-full" size="lg">
              <Package className="h-4 w-4 mr-2" />
              Submit Order Request
            </Button>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">What happens next?</h4>
              <ol className="text-sm text-muted-foreground space-y-1">
                <li>1. Admin reviews your order request</li>
                <li>2. You'll receive an invoice with final pricing</li>
                <li>3. Accept the invoice to proceed with payment</li>
                <li>4. Complete payment via PayPal externally</li>
                <li>5. Submit payment confirmation</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const OrderDetailsDemo = () => (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold">Order Details Demo</h1>
          <Badge variant="outline">
            <FileText className="h-3 w-3 mr-1" />
            Invoice Sent
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Order #{mockOrder.order_number} • Created {new Date(mockOrder.created_at).toLocaleDateString()}
        </p>
      </div>

      {/* Order Items */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockOrder.order_items.map((item) => (
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

      {/* Invoice Details */}
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
              <span>${mockOrder.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping:</span>
              <span>${mockOrder.shipping_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Convenience Fee:</span>
              <span>${mockOrder.convenience_fee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge:</span>
              <span>${mockOrder.delivery_charge?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${mockOrder.tax_amount.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${mockOrder.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <h4 className="font-semibold">Action Required</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Please review the invoice above and choose to accept or decline.
            </p>
            <div className="flex gap-3">
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invoice
              </Button>
              <Button variant="destructive">
                Decline Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section (shown after accepting) */}
      <Card>
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
                Send payment of <strong>${mockOrder.total_amount.toFixed(2)}</strong> to:
              </p>
              <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border">
                <span className="font-mono">admin@autospeedshop.com</span>
                <Button size="sm" variant="outline">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open PayPal
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">After Payment, Submit Details Below:</h4>
              
              <div>
                <Label>PayPal Transaction ID</Label>
                <Input placeholder="Enter PayPal transaction ID" />
              </div>

              <div>
                <Label>Payment Amount</Label>
                <Input type="number" placeholder="0.00" />
              </div>

              <div>
                <Label>Payment Screenshot</Label>
                <Input type="file" accept="image/*" />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a screenshot of your PayPal payment confirmation
                </p>
              </div>

              <Button className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Submit Payment Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AdminInvoiceDemo = () => (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Admin Invoice Management Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Demo Order Row */}
            <div className="border rounded-lg p-4">
              <div className="grid grid-cols-6 gap-4 items-center">
                <div>
                  <p className="font-medium">{mockOrder.order_number}</p>
                </div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-xs text-muted-foreground">john@example.com</p>
                </div>
                <div>
                  <p>{new Date().toLocaleDateString()}</p>
                </div>
                <div>
                  <Badge variant="secondary">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Review
                  </Badge>
                </div>
                <div className="text-right">
                  <p>${mockOrder.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <Button size="sm">
                    <FileText className="h-4 w-4 mr-1" />
                    Create Invoice
                  </Button>
                </div>
              </div>
            </div>

            {/* Invoice Creation Form */}
            <div className="border rounded-lg p-6 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold mb-4">Create Invoice for Order #{mockOrder.order_number}</h3>
              
              {/* Order Summary */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">Order Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${mockOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${mockOrder.shipping_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Fee Inputs */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <Label>Convenience Fee ($)</Label>
                  <Input type="number" defaultValue="5.00" />
                </div>
                <div>
                  <Label>Delivery Charge ($)</Label>
                  <Input type="number" defaultValue="10.00" />
                </div>
              </div>

              <div className="mb-6">
                <Label>Notes (Optional)</Label>
                <Textarea placeholder="Additional notes for the customer..." rows={3} />
              </div>

              {/* Final Total */}
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg mb-6">
                <h4 className="font-semibold mb-2">Final Invoice Total</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${mockOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>${mockOrder.shipping_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fee:</span>
                    <span>$5.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>$10.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8.25%):</span>
                    <span>$14.87</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total:</span>
                    <span>$189.86</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline">Cancel</Button>
                <Button>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Send Invoice
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Custom Order Flow Demo</h1>
          <p className="text-muted-foreground text-lg mb-6">
            Interactive demonstration of the new custom order and payment workflow
          </p>
          
          <div className="flex justify-center gap-4 mb-8">
            <Button
              variant={currentView === 'checkout' ? 'default' : 'outline'}
              onClick={() => setCurrentView('checkout')}
            >
              User Checkout
            </Button>
            <Button
              variant={currentView === 'orderDetails' ? 'default' : 'outline'}
              onClick={() => setCurrentView('orderDetails')}
            >
              Order Details
            </Button>
            <Button
              variant={currentView === 'adminInvoice' ? 'default' : 'outline'}
              onClick={() => setCurrentView('adminInvoice')}
            >
              Admin Invoice
            </Button>
          </div>
        </div>

        {currentView === 'checkout' && <CheckoutDemo />}
        {currentView === 'orderDetails' && <OrderDetailsDemo />}
        {currentView === 'adminInvoice' && <AdminInvoiceDemo />}
      </div>
    </div>
  );
};

export default CustomOrderFlowDemo;