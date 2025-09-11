import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { ORDER_STATUS } from "@/types/order";

// Mock order data for different statuses
const mockOrders = [
  {
    id: "order-1",
    orderNumber: "ORD-001",
    date: "Jan 15, 2025",
    status: ORDER_STATUS.INVOICE_SENT,
    total: 199.99
  },
  {
    id: "order-2", 
    orderNumber: "ORD-002",
    date: "Jan 14, 2025",
    status: ORDER_STATUS.INVOICE_ACCEPTED,
    total: 299.99
  },
  {
    id: "order-3",
    orderNumber: "ORD-003", 
    date: "Jan 13, 2025",
    status: ORDER_STATUS.PAYMENT_PENDING,
    total: 149.99
  },
  {
    id: "order-4",
    orderNumber: "ORD-004",
    date: "Jan 12, 2025", 
    status: ORDER_STATUS.PAYMENT_SUBMITTED,
    total: 399.99
  },
  {
    id: "order-5",
    orderNumber: "ORD-005",
    date: "Jan 11, 2025",
    status: ORDER_STATUS.CONFIRMED,
    total: 249.99
  },
  {
    id: "order-6",
    orderNumber: "ORD-006",
    date: "Jan 10, 2025",
    status: ORDER_STATUS.INVOICE_DECLINED,
    total: 179.99
  },
  {
    id: "order-7",
    orderNumber: "ORD-007",
    date: "Jan 9, 2025",
    status: ORDER_STATUS.CANCELLED,
    total: 89.99
  }
];

const getUserDisplayStatus = (status: string) => {
  if (status === ORDER_STATUS.INVOICE_SENT) {
    return "Invoice Received";
  }
  return status;
};

const ShowInvoiceButtonDemo = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">Show Invoice Button Fix Demo</h1>
            <p className="text-muted-foreground">
              This demo shows how the "Show Invoice" button now appears for all relevant order statuses, 
              not just when status is "invoice_sent". The fix ensures users can always access their invoices 
              throughout the order lifecycle.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📦 Order History - After Fix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {mockOrders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium">{order.orderNumber}</span>
                        <span className="text-sm text-muted-foreground">
                          {order.date}
                        </span>
                        <Badge variant="outline">
                          {getUserDisplayStatus(order.status)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${order.total.toFixed(2)}</p>
                      <div className="flex gap-2 mt-2">
                        {/* NEW LOGIC - Shows button for all relevant statuses */}
                        {(order.status === ORDER_STATUS.INVOICE_SENT || 
                          order.status === ORDER_STATUS.INVOICE_ACCEPTED ||
                          order.status === ORDER_STATUS.PAYMENT_PENDING ||
                          order.status === ORDER_STATUS.PAYMENT_SUBMITTED ||
                          order.status === ORDER_STATUS.PAYMENT_VERIFIED ||
                          order.status === ORDER_STATUS.CONFIRMED ||
                          order.status === ORDER_STATUS.SHIPPED ||
                          order.status === ORDER_STATUS.DELIVERED) && (
                          <Button variant="default" size="sm">
                            <FileText className="h-3 w-3 mr-1" />
                            Show Invoice
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          Track Order
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="text-red-700 dark:text-red-300">
                  ❌ Before Fix (Old Behavior)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Previously, the "Show Invoice" button only appeared when status was "invoice_sent". 
                  Once the user accepted the invoice (status changed to "invoice_accepted"), 
                  the button would disappear and users couldn't access their invoice anymore.
                </p>
                <div className="bg-white dark:bg-gray-900 p-4 rounded border">
                  <code className="text-sm">
                    {`{order.status === ORDER_STATUS.INVOICE_SENT && (`}<br/>
                    &nbsp;&nbsp;{`<Button>Show Invoice</Button>`}<br/>
                    {`)}`}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <Card className="border-green-200 bg-green-50 dark:bg-green-950">
              <CardHeader>
                <CardTitle className="text-green-700 dark:text-green-300">
                  ✅ After Fix (New Behavior)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600 dark:text-green-400 mb-4">
                  Now the "Show Invoice" button appears for all relevant order statuses where an invoice exists.
                  It's only hidden for statuses that indicate problems (declined, cancelled) or when no invoice exists yet.
                </p>
                <div className="bg-white dark:bg-gray-900 p-4 rounded border">
                  <code className="text-sm">
                    {`{(order.status === ORDER_STATUS.INVOICE_SENT ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.INVOICE_ACCEPTED ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.PAYMENT_PENDING ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.PAYMENT_SUBMITTED ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.PAYMENT_VERIFIED ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.CONFIRMED ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.SHIPPED ||`}<br/>
                    &nbsp;{`order.status === ORDER_STATUS.DELIVERED) && (`}<br/>
                    &nbsp;&nbsp;{`<Button>Show Invoice</Button>`}<br/>
                    {`)}`}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Key Benefits of This Fix:
            </h3>
            <ul className="text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Users can always access their invoices after accepting them</li>
              <li>• Button remains visible throughout the order lifecycle</li>
              <li>• No more disappearing invoice access when navigating between pages</li>
              <li>• Only hidden when there are actual problems (declined/cancelled orders)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowInvoiceButtonDemo;