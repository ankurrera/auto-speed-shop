import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Hardcoded sample data for order requests
const sampleOrders = [
  {
    id: "ORD-78901",
    status: "Pending",
    items: [
      { name: "Oil Filter", quantity: 2, price: 12.99, total: 25.98 },
      { name: "Spark Plugs (Set of 4)", quantity: 1, price: 59.99, total: 59.99 },
    ],
    total: 85.97,
  },
  {
    id: "ORD-12345",
    status: "Processing",
    items: [
      { name: "Brake Pads - Ceramic", quantity: 1, price: 89.99, total: 89.99 },
      { name: "LED Headlight Kit", quantity: 1, price: 159.99, total: 159.99 },
    ],
    total: 249.98,
  },
  {
    id: "ORD-54321",
    status: "Shipped",
    items: [
      { name: "Radiator - Aluminum", quantity: 1, price: 329.99, total: 329.99 },
    ],
    total: 329.99,
  },
];

const Order = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Requests</h1>

      <div className="grid gap-6">
        {sampleOrders.map((order) => (
          <Dialog key={order.id}>
            <DialogTrigger asChild>
              <Card className="relative cursor-pointer transition-all hover:shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{order.id}</CardTitle>
                    <p className="text-sm text-muted-foreground">{order.items.length} Products</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground flex justify-between">
                    <span>Total:</span>
                    <span className="font-semibold text-foreground">${order.total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Order Details: {order.id}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">Status: {order.status}</p>
                </div>
                <Separator />
                <h4 className="font-semibold">Items</h4>
                <p className="text-sm text-muted-foreground">This order contains a variety of {order.items.length} products with different quantities and prices.</p>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between space-x-2">
                  <Button className="flex-1" variant="outline">Accept</Button>
                  <Button className="flex-1" variant="destructive">Reject</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};

export default Order;