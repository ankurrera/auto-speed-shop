import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { verifyPayment } from "@/services/customOrderService";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";
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
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Check if payment data was passed from AdminPaymentManagement
  const passedPaymentRecord = location.state?.paymentRecord as PaymentRecord;

  // Helper function to determine if payment is pending and needs action
  const isPaymentPending = () => {
    const paymentStatus = paymentRecord?.payment_status || order?.status;
    
    // Payment is pending if it's submitted but not yet verified or rejected
    return paymentStatus === PAYMENT_STATUS.SUBMITTED || 
           paymentStatus === ORDER_STATUS.PAYMENT_SUBMITTED;
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

  useEffect(() => {
    if (!orderId) {
      navigate(-1);
      return;
    }
    
    fetchOrderDetails();
  }, [orderId, navigate, fetchOrderDetails]);

  const handleVerifyPayment = async (verified: boolean) => {
    if (!orderId) return;
    
    setIsVerifyingPayment(true);
    try {
      await verifyPayment(orderId, verified);
      
      toast({
        title: verified ? "Payment Verified" : "Payment Rejected",
        description: verified 
          ? "Order has been confirmed and customer notified"
          : "Payment verification failed, customer will be notified"
      });
      
      // Navigate back to invoice management
      navigate(-1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to verify payment";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const handleDownloadScreenshot = async () => {
    const orderNumber = activeOrder?.order_number || paymentRecord?.order_number || 'payment-receipt';
    if (!activePaymentData?.payment_screenshot_url || !orderNumber) {
      toast({
        title: "Error",
        description: "Screenshot or Order ID not available",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch the image
      const response = await fetch(activePaymentData.payment_screenshot_url);
      if (!response.ok) {
        throw new Error('Failed to fetch screenshot');
      }
      
      const blob = await response.blob();
      
      // Create an image element to get dimensions
      const img = new Image();
      const imageLoadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });
      
      img.src = URL.createObjectURL(blob);
      await imageLoadPromise;
      
      // Create PDF with jsPDF
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit the image on the page
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20; // 20mm margin
      
      const maxWidth = pageWidth - (2 * margin);
      const maxHeight = pageHeight - (2 * margin);
      
      let imgWidth = img.width * 0.264583; // Convert pixels to mm (assuming 96 DPI)
      let imgHeight = img.height * 0.264583;
      
      // Scale down if image is too large
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
      
      // Center the image on the page
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      
      // Add the image to PDF
      pdf.addImage(img.src, 'JPEG', x, y, imgWidth, imgHeight);
      
      // Add header text
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Payment Screenshot - Order ${orderNumber}`, pageWidth / 2, 15, { align: 'center' });
      
      // Add transaction ID if available
      if (activePaymentData.transaction_id) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Transaction ID: ${activePaymentData.transaction_id}`, margin, pageHeight - 10);
      }
      
      // Save the PDF with Order ID as filename
      pdf.save(`${orderNumber}.pdf`);
      
      // Cleanup
      URL.revokeObjectURL(img.src);
      
      toast({
        title: "Download Complete",
        description: `Payment screenshot saved as ${orderNumber}.pdf`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Unable to download screenshot as PDF. Please try again.",
        variant: "destructive"
      });
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
                      onClick={handleDownloadScreenshot}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download as PDF
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

        {/* Action Buttons */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isPaymentPending() 
                  ? "Review the payment details above and verify or reject the payment."
                  : "This payment has already been processed."
                }
              </p>
            </CardHeader>
            <CardContent>
              {isPaymentPending() ? (
                /* Show action buttons for pending payments */
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button
                      size="lg"
                      onClick={() => handleVerifyPayment(true)}
                      disabled={isVerifyingPayment}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Verify Payment
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={() => handleVerifyPayment(false)}
                      disabled={isVerifyingPayment}
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      Reject Payment
                    </Button>
                  </div>
                  
                  {isVerifyingPayment && (
                    <div className="text-center text-sm text-muted-foreground">
                      Processing payment verification...
                    </div>
                  )}
                </div>
              ) : (
                /* Show status for already processed payments */
                <div className="space-y-4">
                  <div className="flex items-center justify-center p-6 border-2 border-dashed rounded-lg">
                    <div className="text-center space-y-3">
                      <div className="flex justify-center">
                        {getPaymentStatusBadge()}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {paymentRecord?.payment_status === PAYMENT_STATUS.VERIFIED || order?.status === ORDER_STATUS.CONFIRMED
                          ? "This payment has been verified and the order is confirmed."
                          : paymentRecord?.payment_status === PAYMENT_STATUS.FAILED
                          ? "This payment has been rejected."
                          : "Payment processing is complete."
                        }
                      </p>
                      {paymentRecord?.rejection_reason && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                          <p className="text-sm text-red-700 mt-1">{paymentRecord.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
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