import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdminOrderStatusManager from "@/components/AdminOrderStatusManager";
import { ORDER_STATUS } from "@/types/order";

const AdminStatusDemo = () => {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<string>(ORDER_STATUS.PENDING_ADMIN_REVIEW);

  const sampleOrders = [
    {
      id: "order-1",
      orderNumber: "ORD-2024-001",
      status: ORDER_STATUS.PENDING_ADMIN_REVIEW,
      paymentStatus: "pending",
      customerName: "John Doe",
      total: "$334.73",
      date: "2024-01-30"
    },
    {
      id: "order-2", 
      orderNumber: "ORD-2024-002",
      status: ORDER_STATUS.INVOICE_SENT,
      paymentStatus: "pending",
      customerName: "Jane Smith",
      total: "$189.99",
      date: "2024-01-29"
    },
    {
      id: "order-3",
      orderNumber: "ORD-2024-003", 
      status: ORDER_STATUS.PAYMENT_SUBMITTED,
      paymentStatus: "submitted",
      customerName: "Mike Johnson",
      total: "$549.50",
      date: "2024-01-28"
    }
  ];

  const handleStatusUpdate = (newStatus: string) => {
    setCurrentStatus(newStatus);
  };

  const selectedOrderData = sampleOrders.find(order => order.id === selectedOrder);

  if (selectedOrder && selectedOrderData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <AdminOrderStatusManager
              orderId={selectedOrder}
              currentStatus={currentStatus}
              paymentStatus={selectedOrderData.paymentStatus}
              orderNumber={selectedOrderData.orderNumber}
              onStatusUpdate={handleStatusUpdate}
              onBack={() => setSelectedOrder(null)}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold">Admin Order Status Management Demo</h1>
            <p className="text-muted-foreground mt-2">
              Select an order to manage its status and track progress
            </p>
          </div>

          <div className="grid gap-4">
            {sampleOrders.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
                    <div className="text-right">
                      <p className="font-semibold">{order.total}</p>
                      <p className="text-sm text-muted-foreground">{order.date}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        Status: {order.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                    <Button 
                      onClick={() => {
                        setSelectedOrder(order.id);
                        setCurrentStatus(order.status);
                      }}
                    >
                      Manage Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatusDemo;