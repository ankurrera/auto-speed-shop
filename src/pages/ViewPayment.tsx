import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";
import { subscribeToOrderStatusUpdates, OrderStatusUpdate } from "@/services/orderStatusService";
import jsPDF from 'jspdf';

interface PaymentData {
  transaction_id: string;
  payment_amount: number;
  payment_screenshot_url: string;
  submitted_at: string;
}

interface PaymentRecord {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  customer_first_name?: string;
  customer_last_name?: string;
  customer_email?: string;
  payment_data?: {
    transaction_id: string;
    payment_amount: number;
    payment_screenshot_url: string;
    submitted_at: string;
  };
  rejection_reason?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  notes?: string;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

const ViewPayment = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<PaymentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Check if payment data was passed from AdminPaymentManagement
  const passedPaymentRecord = location.state?.paymentRecord as PaymentRecord;

  // Helper function to determine if payment is pending and needs action
  const isPaymentPending = () => {
    const paymentStatus = paymentRecord?.payment_status || order?.status;
    
    // Payment is pending if it's submitted but not yet verified or rejected
    return paymentStatus === PAYMENT_STATUS.SUBMITTED || 
           paymentStatus === ORDER_STATUS.PAYMENT_SUBMITTED;
  };

  // Helper function to determine if payment has been processed (accepted or rejected)
  const isPaymentProcessed = () => {
    const paymentStatus = paymentRecord?.payment_status || order?.status;
    
    // Payment is processed if it's verified (accepted) or failed (rejected)
    return paymentStatus === PAYMENT_STATUS.VERIFIED || 
           paymentStatus === PAYMENT_STATUS.FAILED ||
           paymentStatus === ORDER_STATUS.CONFIRMED;
  };

  // Helper function to get payment status badge
  const getPaymentStatusBadge = () => {
    const paymentStatus = paymentRecord?.payment_status || order?.status;
    
    if (paymentStatus === PAYMENT_STATUS.VERIFIED || paymentStatus === ORDER_STATUS.CONFIRMED) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-4 h-4 mr-2" />Verified</Badge>;
    } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
      return <Badge variant="destructive"><XCircle className="w-4 h-4 mr-2" />Rejected</Badge>;
    } else if (paymentStatus === PAYMENT_STATUS.SUBMITTED || paymentStatus === ORDER_STATUS.PAYMENT_SUBMITTED) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending Review</Badge>;
    }
    return <Badge variant="secondary">Unknown Status</Badge>;
  };

  const fetchOrderDetails = useCallback(async () => {
    try {
      // If we have payment data passed from AdminPaymentManagement, use it
      if (passedPaymentRecord) {
        setPaymentRecord(passedPaymentRecord);
        if (passedPaymentRecord.payment_data) {
          setPaymentData(passedPaymentRecord.payment_data);
        }
        
        // Try to create a basic order object from payment record
        const basicOrder: Order = {
          id: passedPaymentRecord.id,
          order_number: passedPaymentRecord.order_number,
          status: passedPaymentRecord.status,
          notes: passedPaymentRecord.notes,
          profiles: passedPaymentRecord.customer_first_name || passedPaymentRecord.customer_last_name || passedPaymentRecord.customer_email ? {
            email: passedPaymentRecord.customer_email || '',
            first_name: passedPaymentRecord.customer_first_name || '',
            last_name: passedPaymentRecord.customer_last_name || ''
          } : undefined
        };
        setOrder(basicOrder);
        setLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get order details using admin function
      const { data: orderData, error } = await supabase
        .rpc('get_invoice_orders_for_admin', {
          requesting_user_id: user.id
        });

      if (error) {
        throw new Error(`Failed to fetch order: ${error.message}`);
      }

      const targetOrder = orderData?.find((o: { id: string }) => o.id === orderId);
      
      if (!targetOrder) {
        throw new Error('Order not found');
      }

      const orderWithProfile = {
        ...targetOrder,
        profiles: targetOrder.customer_first_name || targetOrder.customer_last_name || targetOrder.customer_email ? {
          first_name: targetOrder.customer_first_name,
          last_name: targetOrder.customer_last_name,
          email: targetOrder.customer_email
        } : null
      };

      setOrder(orderWithProfile);

      // Parse payment data from notes
      if (targetOrder.notes) {
        try {
          const parsedPaymentData = JSON.parse(targetOrder.notes);
          setPaymentData(parsedPaymentData);
        } catch (parseError) {
          console.error('Failed to parse payment data:', parseError);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      
      // If we have payment record data but order fetch failed, still show payment details
      if (passedPaymentRecord && passedPaymentRecord.payment_data) {
        console.log('Order fetch failed but we have payment data from passed record, continuing...');
        setPaymentRecord(passedPaymentRecord);
        setPaymentData(passedPaymentRecord.payment_data);
        
        // Create a minimal order object for display
        const minimalOrder: Order = {
          id: passedPaymentRecord.id,
          order_number: passedPaymentRecord.order_number,
          status: passedPaymentRecord.status,
          notes: passedPaymentRecord.notes,
          profiles: passedPaymentRecord.customer_first_name || passedPaymentRecord.customer_last_name || passedPaymentRecord.customer_email ? {
            email: passedPaymentRecord.customer_email || '',
            first_name: passedPaymentRecord.customer_first_name || '',
            last_name: passedPaymentRecord.customer_last_name || ''
          } : undefined
        };
        setOrder(minimalOrder);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch order details";
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
        navigate(-1);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate, toast, passedPaymentRecord]);

  // Handle real-time status updates
  const handleStatusUpdate = useCallback((update: OrderStatusUpdate) => {
    console.log('[ViewPayment] Received real-time payment status update:', update);
    
    // Update order state
    setOrder(prev => {
      if (!prev || prev.id !== update.order_id) return prev;
      return {
        ...prev,
        status: update.status,
      };
    });

    // Update payment record state if applicable
    setPaymentRecord(prev => {
      if (!prev || prev.id !== update.order_id) return prev;
      return {
        ...prev,
        status: update.status,
        payment_status: update.payment_status || prev.payment_status,
        updated_at: update.updated_at
      };
    });
  }, []);

  useEffect(() => {
    if (!orderId) {
      navigate(-1);
      return;
    }
    
    fetchOrderDetails();

    // Set up real-time subscription for payment status updates
    const unsubscribe = subscribeToOrderStatusUpdates(orderId, handleStatusUpdate);

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [orderId, navigate, fetchOrderDetails, handleStatusUpdate]);

  const handleDownloadPDFReceipt = async () => {
    const orderNumber = activeOrder?.order_number || paymentRecord?.order_number || 'payment-receipt';
    if (!activePaymentData?.payment_screenshot_url || !orderNumber) {
      toast({
        title: "Error",
        description: "Transaction details not available for download",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create PDF with jsPDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      
      // Add header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transaction Receipt', pageWidth / 2, 30, { align: 'center' });
      
      // Add order details
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      let yPosition = 50;
      
      const addLine = (label: string, value: string) => {
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${label}:`, margin, yPosition);
        pdf.setFont('helvetica', 'normal');
        pdf.text(value, margin + 40, yPosition);
        yPosition += 8;
      };
      
      // Transaction details
      addLine('Order Number', orderNumber);
      addLine('Transaction ID', activePaymentData.transaction_id);
      addLine('Payment Amount', `$${activePaymentData.payment_amount.toFixed(2)}`);
      addLine('Payment Status', getPaymentStatusText());
      addLine('Submitted At', new Date(activePaymentData.submitted_at).toLocaleString());
      
      // Add accept/reject timestamp if available
      if (isPaymentProcessed() && (paymentRecord?.updated_at || order?.updated_at)) {
        const statusText = paymentRecord?.payment_status === PAYMENT_STATUS.VERIFIED || order?.status === ORDER_STATUS.CONFIRMED 
          ? "Accepted At" : "Rejected At";
        addLine(statusText, new Date(paymentRecord?.updated_at || order?.updated_at || '').toLocaleString());
      }
      
      yPosition += 5;
      
      // Customer details
      const customerName = activeOrder?.profiles 
        ? `${activeOrder.profiles.first_name} ${activeOrder.profiles.last_name}`
        : paymentRecord 
        ? `${paymentRecord.customer_first_name} ${paymentRecord.customer_last_name}`
        : 'Unknown Customer';
      
      const customerEmail = activeOrder?.profiles?.email || paymentRecord?.customer_email || 'No email';
      
      addLine('Customer Name', customerName);
      addLine('Customer Email', customerEmail);
      
      yPosition += 10;
      
      // Screenshot section
      if (activePaymentData.payment_screenshot_url) {
        try {
          const response = await fetch(activePaymentData.payment_screenshot_url);
          if (response.ok) {
            const blob = await response.blob();
            const img = new Image();
            
            const imageLoadPromise = new Promise<void>((resolve, reject) => {
              img.onload = () => resolve();
              img.onerror = () => reject(new Error('Failed to load image'));
            });
            
            img.src = URL.createObjectURL(blob);
            await imageLoadPromise;
            
            // Add screenshot section header
            pdf.setFont('helvetica', 'bold');
            pdf.text('Payment Screenshot:', margin, yPosition);
            yPosition += 10;
            
            // Calculate image dimensions to fit on page
            const maxWidth = pageWidth - (2 * margin);
            const maxHeight = pageHeight - yPosition - 30; // Leave space for footer
            
            let imgWidth = img.width * 0.264583; // Convert pixels to mm
            let imgHeight = img.height * 0.264583;
            
            // Scale down if too large
            if (imgWidth > maxWidth) {
              const ratio = maxWidth / imgWidth;
              imgWidth = maxWidth;
              imgHeight = imgHeight * ratio;
            }
            
            if (imgHeight > maxHeight) {
              const ratio = maxHeight / imgHeight;
              imgHeight = maxHeight;
              imgWidth = imgWidth * ratio;
            }
            
            // Center the image
            const x = (pageWidth - imgWidth) / 2;
            
            // Add the image
            pdf.addImage(img.src, 'JPEG', x, yPosition, imgWidth, imgHeight);
            
            // Cleanup
            URL.revokeObjectURL(img.src);
          }
        } catch (imageError) {
          console.warn('Could not include screenshot in PDF:', imageError);
          pdf.setFont('helvetica', 'italic');
          pdf.text('Screenshot unavailable', margin, yPosition);
        }
      }
      
      // Add footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 10);
      
      // Save the PDF
      pdf.save(`${orderNumber}-receipt.pdf`);
      
      toast({
        title: "Download Complete",
        description: `Transaction receipt saved as ${orderNumber}-receipt.pdf`
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to generate PDF receipt. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper function to get payment status as text
  const getPaymentStatusText = () => {
    const paymentStatus = paymentRecord?.payment_status || order?.status;
    
    if (paymentStatus === PAYMENT_STATUS.VERIFIED || paymentStatus === ORDER_STATUS.CONFIRMED) {
      return "Verified";
    } else if (paymentStatus === PAYMENT_STATUS.FAILED) {
      return "Rejected";
    } else if (paymentStatus === PAYMENT_STATUS.SUBMITTED || paymentStatus === ORDER_STATUS.PAYMENT_SUBMITTED) {
      return "Pending Review";
    }
    return "Unknown";
  };

  // Handle payment acceptance
  const handleAcceptPayment = async () => {
    if (!orderId) return;
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.rpc('admin_verify_payment', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        verified: true
      });

      if (error) throw error;

      // Immediately update local state to reflect the change
      const now = new Date().toISOString();
      setOrder(prev => prev ? { ...prev, status: ORDER_STATUS.CONFIRMED } : null);
      setPaymentRecord(prev => prev ? {
        ...prev,
        payment_status: PAYMENT_STATUS.VERIFIED,
        status: ORDER_STATUS.CONFIRMED,
        updated_at: now
      } : null);

      toast({
        title: "Payment Accepted",
        description: "Payment has been verified and the order has been confirmed.",
      });

      // Refresh the payment data to ensure consistency
      await fetchOrderDetails();
      
      
    } catch (error) {
      console.error('Error accepting payment:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to accept payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment rejection
  const handleRejectPayment = async () => {
    if (!orderId || !rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.rpc('admin_verify_payment', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        verified: false,
        rejection_reason: rejectionReason
      });

      if (error) throw error;

      // Immediately update local state to reflect the change
      const now = new Date().toISOString();
      setOrder(prev => prev ? { ...prev, status: ORDER_STATUS.CANCELLED } : null);
      setPaymentRecord(prev => prev ? {
        ...prev,
        payment_status: PAYMENT_STATUS.FAILED,
        status: ORDER_STATUS.CANCELLED,
        updated_at: now,
        rejection_reason: rejectionReason
      } : null);

      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected and the customer has been notified.",
      });

      // Reset rejection dialog state
      setShowRejectDialog(false);
      setRejectionReason("");
      
      // Refresh the payment data to ensure consistency
      await fetchOrderDetails();
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to reject payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show error if we have no payment data at all
  if (!loading && !paymentData && !paymentRecord?.payment_data) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Payment Details Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The payment details for this order could not be loaded.
            </p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use payment data from either source
  const activePaymentData = paymentData || paymentRecord?.payment_data;
  const activeOrder = order;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice Management
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Payment Details</h1>
              <p className="text-muted-foreground">
                {activeOrder?.order_number ? `Order #${activeOrder.order_number}` : 'Payment Record'}
              </p>
            </div>
          </div>
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
                    {activePaymentData!.transaction_id}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Payment Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    ${activePaymentData!.payment_amount.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Submitted At</span>
                  <span className="text-sm">
                    {new Date(activePaymentData!.submitted_at).toLocaleString()}
                  </span>
                </div>

                {/* Show accept/reject timestamp if payment has been processed */}
                {isPaymentProcessed() && (paymentRecord?.updated_at || order?.updated_at) && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="font-medium text-muted-foreground">
                      {paymentRecord?.payment_status === PAYMENT_STATUS.VERIFIED || order?.status === ORDER_STATUS.CONFIRMED 
                        ? "Accepted At" 
                        : "Rejected At"}
                    </span>
                    <span className="text-sm">
                      {new Date(paymentRecord?.updated_at || order?.updated_at || '').toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium text-muted-foreground">Customer</span>
                  <div className="text-right">
                    {activeOrder?.profiles ? (
                      <>
                        <p className="font-medium">
                          {activeOrder.profiles.first_name} {activeOrder.profiles.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activeOrder.profiles.email}
                        </p>
                      </>
                    ) : paymentRecord ? (
                      <>
                        <p className="font-medium">
                          {paymentRecord.customer_first_name} {paymentRecord.customer_last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentRecord.customer_email}
                        </p>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unknown Customer</span>
                    )}
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
              {activePaymentData?.payment_screenshot_url ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-muted/50">
                    <img
                      src={activePaymentData.payment_screenshot_url}
                      alt="Payment Screenshot"
                      className="w-full h-auto max-h-96 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.style.display = 'block';
                      }}
                    />
                    <div className="hidden p-8 text-center text-muted-foreground">
                      <p>Unable to load screenshot</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => window.open(activePaymentData.payment_screenshot_url, '_blank')}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Size
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleDownloadPDFReceipt}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No screenshot available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewPayment;