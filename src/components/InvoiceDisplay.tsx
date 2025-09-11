import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Download, CheckCircle, XCircle } from "lucide-react";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface OrderDetails {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  convenience_fee?: number;
  delivery_charge?: number;
  created_at: string;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    line1?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  order_items?: OrderItem[];
}

interface InvoiceDisplayProps {
  orderDetails: OrderDetails;
  onAccept: () => void;
  onDecline: () => void;
  isResponding: boolean;
}

const InvoiceDisplay: React.FC<InvoiceDisplayProps> = ({
  orderDetails,
  onAccept,
  onDecline,
  isResponding
}) => {
  const generatePDF = () => {
    // Create a printable version
    const printContent = document.getElementById('invoice-content');
    if (printContent) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Invoice #${orderDetails.order_number}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 20px; 
                  line-height: 1.6; 
                }
                .header { 
                  text-align: center; 
                  margin-bottom: 30px; 
                  border-bottom: 2px solid #333; 
                  padding-bottom: 20px; 
                }
                .company-name { 
                  font-size: 28px; 
                  font-weight: bold; 
                  color: #333; 
                  margin-bottom: 10px; 
                }
                .invoice-title { 
                  font-size: 24px; 
                  color: #666; 
                }
                .invoice-info { 
                  display: flex; 
                  justify-content: space-between; 
                  margin-bottom: 30px; 
                }
                .invoice-details, .billing-address { 
                  width: 48%; 
                }
                .invoice-details h3, .billing-address h3 { 
                  color: #333; 
                  border-bottom: 1px solid #ccc; 
                  padding-bottom: 5px; 
                }
                .items-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin-bottom: 30px; 
                }
                .items-table th, .items-table td { 
                  border: 1px solid #ddd; 
                  padding: 12px; 
                  text-align: left; 
                }
                .items-table th { 
                  background-color: #f5f5f5; 
                  font-weight: bold; 
                }
                .items-table tr:nth-child(even) { 
                  background-color: #f9f9f9; 
                }
                .totals { 
                  float: right; 
                  width: 300px; 
                }
                .totals table { 
                  width: 100%; 
                  border-collapse: collapse; 
                }
                .totals td { 
                  padding: 8px 12px; 
                  border-bottom: 1px solid #ddd; 
                }
                .totals .total-row { 
                  font-weight: bold; 
                  font-size: 18px; 
                  background-color: #f5f5f5; 
                }
                .footer { 
                  margin-top: 50px; 
                  text-align: center; 
                  color: #666; 
                  font-size: 14px; 
                }
                @media print { 
                  body { margin: 0; } 
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
              <div class="footer">
                <p>Thank you for your business!</p>
                <p>Auto Speed Shop - Your Trusted Auto Parts Partner</p>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
        newWindow.print();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Formal Invoice Display */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader className="text-center border-b">
          <div id="invoice-content">
            <div className="company-name text-3xl font-bold text-gray-800 mb-2">
              Auto Speed Shop
            </div>
            <CardTitle className="invoice-title text-xl text-gray-600">
              INVOICE
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          <div id="invoice-content">
            {/* Invoice Header Information */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="invoice-details">
                <h3 className="font-semibold text-lg mb-4 border-b pb-2">Invoice Details</h3>
                <div className="space-y-2">
                  <p><strong>Invoice Number:</strong> {orderDetails.order_number}</p>
                  <p><strong>Invoice Date:</strong> {new Date(orderDetails.created_at).toLocaleDateString()}</p>
                  <p><strong>Due Date:</strong> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="billing-address">
                <h3 className="font-semibold text-lg mb-4 border-b pb-2">Bill To</h3>
                {orderDetails.shipping_address ? (
                  <div className="space-y-1">
                    <p className="font-medium">
                      {orderDetails.shipping_address.first_name} {orderDetails.shipping_address.last_name}
                    </p>
                    <p>{orderDetails.shipping_address.line1}</p>
                    <p>
                      {orderDetails.shipping_address.city}, {orderDetails.shipping_address.state} {orderDetails.shipping_address.postal_code}
                    </p>
                    <p>{orderDetails.shipping_address.country || "US"}</p>
                  </div>
                ) : (
                  <p className="text-gray-500">No billing address available</p>
                )}
              </div>
            </div>

            {/* Items Table */}
            {orderDetails.order_items && orderDetails.order_items.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-4">Items</h3>
                <div className="overflow-x-auto">
                  <table className="items-table w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-3 text-left">Description</th>
                        <th className="border border-gray-300 p-3 text-center">Quantity</th>
                        <th className="border border-gray-300 p-3 text-right">Unit Price</th>
                        <th className="border border-gray-300 p-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.order_items.map((item) => (
                        <tr key={item.id} className="even:bg-gray-50">
                          <td className="border border-gray-300 p-3">{item.product_name}</td>
                          <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                          <td className="border border-gray-300 p-3 text-right">${item.unit_price.toFixed(2)}</td>
                          <td className="border border-gray-300 p-3 text-right">${item.total_price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="totals w-80">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="py-2 px-4 text-right">Subtotal:</td>
                      <td className="py-2 px-4 text-right">${orderDetails.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 text-right">Shipping:</td>
                      <td className="py-2 px-4 text-right">${orderDetails.shipping_amount.toFixed(2)}</td>
                    </tr>
                    {orderDetails.convenience_fee && (
                      <tr>
                        <td className="py-2 px-4 text-right">Convenience Fee:</td>
                        <td className="py-2 px-4 text-right">${orderDetails.convenience_fee.toFixed(2)}</td>
                      </tr>
                    )}
                    {orderDetails.delivery_charge && (
                      <tr>
                        <td className="py-2 px-4 text-right">Delivery Charge:</td>
                        <td className="py-2 px-4 text-right">${orderDetails.delivery_charge.toFixed(2)}</td>
                      </tr>
                    )}
                    <tr>
                      <td className="py-2 px-4 text-right">Tax:</td>
                      <td className="py-2 px-4 text-right">${orderDetails.tax_amount.toFixed(2)}</td>
                    </tr>
                    <tr className="total-row border-t-2 border-gray-400 bg-gray-50">
                      <td className="py-3 px-4 text-right font-bold text-lg">Total Amount:</td>
                      <td className="py-3 px-4 text-right font-bold text-lg">${orderDetails.total_amount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={generatePDF}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      {/* Accept/Decline Actions */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Invoice Confirmation</h3>
            <p className="text-gray-600">
              Please review the invoice above and choose your action:
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={onAccept}
                disabled={isResponding}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Invoice
              </Button>
              <Button 
                onClick={onDecline}
                disabled={isResponding}
                variant="destructive"
                className="px-8 py-2"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Decline Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDisplay;