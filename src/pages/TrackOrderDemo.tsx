import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TrackOrderTimeline from "@/components/TrackOrderTimeline";
import { ORDER_STATUS } from "@/types/order";

const TrackOrderDemo = () => {
  const [currentStatus, setCurrentStatus] = useState(ORDER_STATUS.PENDING_ADMIN_REVIEW);

  const statusOptions = [
    { value: ORDER_STATUS.PENDING_ADMIN_REVIEW, label: "Pending Admin Review" },
    { value: ORDER_STATUS.INVOICE_SENT, label: "Invoice Sent" },
    { value: ORDER_STATUS.INVOICE_ACCEPTED, label: "Invoice Accepted" },
    { value: ORDER_STATUS.INVOICE_DECLINED, label: "Invoice Declined" },
    { value: ORDER_STATUS.PAYMENT_PENDING, label: "Payment Pending" },
    { value: ORDER_STATUS.PAYMENT_SUBMITTED, label: "Payment Submitted" },
    { value: ORDER_STATUS.PAYMENT_VERIFIED, label: "Payment Verified" },
    { value: ORDER_STATUS.CONFIRMED, label: "Order Confirmed" },
    { value: ORDER_STATUS.CANCELLED, label: "Order Cancelled" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">Track Order Demo</h1>
              <Badge variant="secondary">Demo Mode</Badge>
            </div>
            <p className="text-muted-foreground">
              Interactive demo of the Track Order feature with different order statuses
            </p>
          </div>

          {/* Status Selector */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Select Order Status to Demo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {statusOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={currentStatus === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentStatus(option.value)}
                    className="text-sm"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Current Status:</strong> {statusOptions.find(opt => opt.value === currentStatus)?.label}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demo Order Info */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Demo Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number:</span>
                  <span className="font-semibold">ORD-DEMO-123456</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold">$249.99</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">✅ 7-step progress tracking</p>
                <p className="text-sm">✅ Visual status indicators (Green/Grey/Red)</p>
                <p className="text-sm">✅ Responsive design for mobile & desktop</p>
                <p className="text-sm">✅ Real-time status updates</p>
                <p className="text-sm">✅ Clear timeline progression</p>
              </CardContent>
            </Card>
          </div>

          {/* Track Order Timeline - The Main Feature */}
          <TrackOrderTimeline 
            orderStatus={currentStatus} 
            className="mb-8"
          />

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-blue-700 dark:text-blue-300">
                How to Use Track Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-blue-600 dark:text-blue-400 text-sm">
                <p>• Click different status buttons above to see how the timeline changes</p>
                <p>• Green indicators show completed steps</p>
                <p>• Blue indicators show current step in progress</p>
                <p>• Red indicators show cancelled/declined steps</p>
                <p>• Grey indicators show pending future steps</p>
                <p>• The timeline automatically handles cancellation scenarios</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderDemo;