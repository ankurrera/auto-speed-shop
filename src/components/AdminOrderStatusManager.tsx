import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Settings } from "lucide-react";
import { ORDER_STATUS } from "@/types/order";
import OrderProgressTracker from "@/components/OrderProgressTracker";
import { toast } from "sonner";

interface AdminOrderStatusManagerProps {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
  orderNumber: string;
  onStatusUpdate?: (newStatus: string) => void;
  onBack?: () => void;
}

const AdminOrderStatusManager = ({ 
  orderId, 
  currentStatus, 
  paymentStatus, 
  orderNumber,
  onStatusUpdate,
  onBack 
}: AdminOrderStatusManagerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [notes, setNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const statusOptions = [
    { value: ORDER_STATUS.PENDING_ADMIN_REVIEW, label: "Pending Admin Review" },
    { value: ORDER_STATUS.INVOICE_SENT, label: "Invoice Sent" },
    { value: ORDER_STATUS.INVOICE_ACCEPTED, label: "Invoice Accepted" },
    { value: ORDER_STATUS.INVOICE_DECLINED, label: "Invoice Declined" },
    { value: ORDER_STATUS.PAYMENT_PENDING, label: "Payment Pending" },
    { value: ORDER_STATUS.PAYPAL_SHARED, label: "PayPal Credentials Shared" },
    { value: ORDER_STATUS.PAYMENT_SUBMITTED, label: "Payment Submitted" },
    { value: ORDER_STATUS.PAYMENT_VERIFIED, label: "Payment Verified" },
    { value: ORDER_STATUS.CONFIRMED, label: "Order Confirmed" },
    { value: ORDER_STATUS.CANCELLED, label: "Cancelled" },
    { value: ORDER_STATUS.SHIPPED, label: "Shipped" },
    { value: ORDER_STATUS.DELIVERED, label: "Delivered" }
  ];

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus && !notes.trim()) {
      toast.error("No changes to update");
      return;
    }

    setIsUpdating(true);
    
    try {
      // In a real implementation, this would call the API endpoint
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: selectedStatus,
          notes: notes.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      const result = await response.json();
      
      toast.success("Order status updated successfully!");
      
      if (onStatusUpdate) {
        onStatusUpdate(selectedStatus);
      }
      
      setNotes("");
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error("Failed to update order status. This is a demo - in production this would work with the backend API.");
      
      // For demo purposes, still update the UI
      if (onStatusUpdate) {
        onStatusUpdate(selectedStatus);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case ORDER_STATUS.CONFIRMED:
      case ORDER_STATUS.DELIVERED:
      case ORDER_STATUS.PAYMENT_VERIFIED:
        return "default"; // Green
      case ORDER_STATUS.CANCELLED:
      case ORDER_STATUS.INVOICE_DECLINED:
        return "destructive"; // Red
      case ORDER_STATUS.SHIPPED:
        return "secondary"; // Blue
      default:
        return "outline"; // Grey
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Manage Order Status
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Order: {orderNumber}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(currentStatus)}>
              {currentStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                Back
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderProgressTracker 
            currentStatus={currentStatus}
            paymentStatus={paymentStatus}
          />
        </CardContent>
      </Card>

      {/* Status Update Form */}
      <Card>
        <CardHeader>
          <CardTitle>Update Order Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add any notes about this status update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStatus(currentStatus);
                setNotes("");
              }}
            >
              Reset
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOrderStatusManager;