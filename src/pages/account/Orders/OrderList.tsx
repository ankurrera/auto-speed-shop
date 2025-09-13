import { Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ORDER_STATUS } from "@/types/order";

interface OrderListProps {
  orders: any[];
}

// Helper function to transform order status for user display
const getUserDisplayStatus = (status: string) => {
  if (status === ORDER_STATUS.INVOICE_SENT) {
    return "Invoice Received";
  }
  return status;
};

const OrderList = ({ orders }: OrderListProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Order History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <div className="divide-y">
            {orders.map((order, i) => (
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
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        order.status === "delivered"
                          ? "bg-green-200 text-green-800"
                          : order.status === "shipped"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {getUserDisplayStatus(order.status)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${order.total.toFixed(2)}</p>
                  <div className="flex gap-2 mt-2">
                    {(order.status === ORDER_STATUS.INVOICE_SENT || 
                      order.status === ORDER_STATUS.INVOICE_ACCEPTED ||
                      order.status === ORDER_STATUS.PAYMENT_PENDING ||
                      order.status === ORDER_STATUS.PAYMENT_SUBMITTED ||
                      order.status === ORDER_STATUS.PAYMENT_VERIFIED ||
                      order.status === ORDER_STATUS.CONFIRMED ||
                      order.status === ORDER_STATUS.SHIPPED ||
                      order.status === ORDER_STATUS.DELIVERED) && (
                      <Button variant="default" size="sm" asChild>
                        <Link to={`/order/${order.id}`}>
                          <FileText className="h-3 w-3 mr-1" />
                          Show Invoice
                        </Link>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orders/${order.id}/tracking`}>
                        Track Order
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No orders yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderList;