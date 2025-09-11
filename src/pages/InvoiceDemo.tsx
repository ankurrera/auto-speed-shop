import React, { useState } from "react";
import InvoiceDisplay from "@/components/InvoiceDisplay";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS } from "@/types/order";

// Sample order data for testing the invoice display
const sampleOrderData = {
  id: "sample-invoice-order-1",
  order_number: "ORD-INV-001",
  subtotal: 199.99,
  shipping_amount: 9.99,
  tax_amount: 16.50,
  total_amount: 226.48,
  convenience_fee: 5.00,
  delivery_charge: 15.00,
  created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  shipping_address: {
    first_name: "John",
    last_name: "Doe",
    line1: "123 Main St",
    city: "Austin",
    state: "TX",
    postal_code: "78701",
    country: "US"
  },
  order_items: [
    {
      id: "item-1",
      product_name: "High Performance Brake Pads",
      quantity: 2,
      unit_price: 89.99,
      total_price: 179.98
    },
    {
      id: "item-2",  
      product_name: "Oil Filter Premium",
      quantity: 1,
      unit_price: 19.99,
      total_price: 19.99
    }
  ]
};

const InvoiceDemo = () => {
  const [isResponding, setIsResponding] = useState(false);
  const [responseStatus, setResponseStatus] = useState<string | null>(null);

  const handleAccept = async () => {
    setIsResponding(true);
    try {
      // Simulate the invoice response
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResponseStatus("accepted");
      console.log("Invoice accepted successfully");
    } catch (error) {
      console.error("Error accepting invoice:", error);
    } finally {
      setIsResponding(false);
    }
  };

  const handleDecline = async () => {
    setIsResponding(true);
    try {
      // Simulate the invoice response
      await new Promise(resolve => setTimeout(resolve, 1000));
      setResponseStatus("declined");
      console.log("Invoice declined successfully");
    } catch (error) {
      console.error("Error declining invoice:", error);
    } finally {
      setIsResponding(false);
    }
  };

  const resetDemo = () => {
    setResponseStatus(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Demo Header */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center">Invoice Display Demo</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                This demo showcases the invoice display component with both light and dark theme support.
                The duplicate text issue has been fixed and colors now properly adapt to the theme.
              </p>
              
              {responseStatus && (
                <div className="space-y-2">
                  <Badge variant={responseStatus === "accepted" ? "default" : "destructive"}>
                    Invoice {responseStatus === "accepted" ? "Accepted" : "Declined"}
                  </Badge>
                  <div>
                    <Button onClick={resetDemo} variant="outline" size="sm">
                      Reset Demo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice Display */}
          {!responseStatus && (
            <InvoiceDisplay
              orderDetails={sampleOrderData}
              onAccept={handleAccept}
              onDecline={handleDecline}
              isResponding={isResponding}
            />
          )}

          {/* Response Status */}
          {responseStatus && (
            <Card className="max-w-2xl mx-auto">
              <CardContent className="pt-6 text-center">
                <div className={`p-6 rounded-lg ${
                  responseStatus === "accepted" 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-red-50 dark:bg-red-900/20"
                }`}>
                  <h3 className="text-lg font-semibold mb-2">
                    {responseStatus === "accepted" ? "Invoice Accepted!" : "Invoice Declined"}
                  </h3>
                  <p className="text-muted-foreground">
                    {responseStatus === "accepted" 
                      ? "The order would now proceed to the payment stage where the customer can submit PayPal payment details."
                      : "The order would be cancelled and the customer would be notified."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button variant="outline" onClick={() => window.history.back()}>
              Back
            </Button>
            <Button onClick={() => window.location.reload()}>
              Refresh Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDemo;