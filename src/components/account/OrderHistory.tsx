import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Order } from "@/types/account";

interface OrderHistoryProps {
  orders: Order[];
}

const OrderHistory = ({ orders }: OrderHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Order History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.length > 0 ? (
            orders.map((order, index) => (
              <div key={order.id}>
                <div className="flex items-center justify-between py-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-4">
                      <span className="font-medium">{order.orderNumber}</span>
                      <span className="text-sm text-muted-foreground">{order.date}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        order.status === 'delivered' ? 'bg-green-200 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-200 text-blue-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${order.total.toFixed(2)}</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
                {index < orders.length - 1 && <Separator />}
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              You have no orders yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderHistory;