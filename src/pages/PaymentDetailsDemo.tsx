import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Download, Eye, Clock } from "lucide-react";

// Demo data for payment details
const demoPaymentData = {
  transaction_id: "TXN-2024-001234",
  payment_amount: 299.99,
  payment_screenshot_url: "https://via.placeholder.com/400x600/4f46e5/ffffff?text=Payment+Screenshot",
  submitted_at: new Date().toISOString(),
};

const demoOrderData = {
  id: "order-123",
  order_number: "ORD-2024-001",
  status: "payment_submitted",
  payment_status: "submitted",
  profiles: {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com"
  }
};

const PaymentDetailsDemo = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending"); // pending, accepted, rejected

  // Helper function to determine if payment is pending
  const isPaymentPending = () => {
    return paymentStatus === "pending";
  };

  // Helper function to determine if payment has been processed
  const isPaymentProcessed = () => {
    return paymentStatus === "accepted" || paymentStatus === "rejected";
  };

  // Helper function to get payment status badge
  const getPaymentStatusBadge = () => {
    if (paymentStatus === "accepted") {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-2" />Verified</Badge>;
    } else if (paymentStatus === "rejected") {
      return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-2" />Rejected</Badge>;
    } else {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending Review</Badge>;
    }
  };

  // Handle payment acceptance
  const handleAcceptPayment = async () => {
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPaymentStatus("accepted");
      toast({
        title: "Payment Accepted",
        description: "Payment has been verified and the order has been confirmed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setPaymentStatus("rejected");
      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected and the customer has been notified.",
      });

      // Reset rejection dialog state
      setShowRejectDialog(false);
      setRejectionReason("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setPaymentStatus("pending");
    setRejectionReason("");
    setShowRejectDialog(false);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice Management
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payment Details - DEMO</h1>
              <p className="text-muted-foreground">
                Order #{demoOrderData.order_number}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleReset}>
            Reset Demo
          </Button>
        </div>

        {/* Accept/Reject Actions for Pending Payments */}
        {isPaymentPending() && !isPaymentProcessed() && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Payment Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-yellow-700 mb-4">
                This payment is awaiting admin verification. Please review the payment details and take appropriate action.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleAcceptPayment}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isProcessing ? "Processing..." : "Accept Payment"}
                </Button>
                
                <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={isProcessing}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Payment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Payment</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejecting this payment. This reason will be shared with the customer.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="rejection-reason">Rejection Reason</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder="e.g., Payment amount doesn't match order total, invalid transaction details, etc."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="mt-2"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRejectDialog(false);
                            setRejectionReason("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleRejectPayment}
                          disabled={isProcessing || !rejectionReason.trim()}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {isProcessing ? "Rejecting..." : "Reject Payment"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Status</span>
                  <div>
                    {getPaymentStatusBadge()}
                  </div>
                </div>

                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-sm bg-muted px-3 py-1 rounded">
                    {demoPaymentData.transaction_id}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Payment Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    ${demoPaymentData.payment_amount.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Submitted At</span>
                  <span className="text-sm">
                    {new Date(demoPaymentData.submitted_at).toLocaleString()}
                  </span>
                </div>

                {/* Show accept/reject timestamp if payment has been processed */}
                {isPaymentProcessed() && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium text-muted-foreground">
                      {paymentStatus === "accepted" ? "Accepted At" : "Rejected At"}
                    </span>
                    <span className="text-sm">
                      {new Date().toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium text-muted-foreground">Customer</span>
                  <div className="text-right">
                    <p className="font-medium">
                      {demoOrderData.profiles.first_name} {demoOrderData.profiles.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {demoOrderData.profiles.email}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Screenshot */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Screenshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-muted/50">
                  <img
                    src={demoPaymentData.payment_screenshot_url}
                    alt="Payment Screenshot"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open(demoPaymentData.payment_screenshot_url, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Size
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => toast({ title: "Download", description: "PDF receipt would be downloaded in real implementation" })}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demo explanation */}
        <Card className="mt-8 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Demo Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-blue-700 space-y-2">
              <p className="font-medium">This is a demonstration of the fixed Payment Details page.</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Accept/Reject buttons are now visible for pending payments</li>
                <li>Accept button verifies the payment and updates status</li>
                <li>Reject button opens a dialog to enter rejection reason</li>
                <li>Buttons only appear when payment status is "Pending Review"</li>
                <li>After processing, appropriate timestamps are shown</li>
                <li>Click "Reset Demo" to test the functionality again</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentDetailsDemo;