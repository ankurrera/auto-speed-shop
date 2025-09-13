import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, Download, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { verifyPayment } from "@/services/customOrderService";
import { jsPDF } from 'jspdf';

interface PaymentData {
  transaction_id: string;
  payment_amount: number;
  payment_screenshot_url: string;
  submitted_at: string;
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
  const { toast } = useToast();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  const fetchOrderDetails = useCallback(async () => {
    try {
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
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch order details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  }, [orderId, navigate, toast]);

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
    if (!paymentData?.payment_screenshot_url || !order?.order_number) {
      toast({
        title: "Error",
        description: "Screenshot or Order ID not available",
        variant: "destructive"
      });
      return;
    }

    try {
      // Fetch the image
      const response = await fetch(paymentData.payment_screenshot_url);
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
      pdf.text(`Payment Screenshot - Order ${order.order_number}`, pageWidth / 2, 15, { align: 'center' });
      
      // Add transaction ID if available
      if (paymentData.transaction_id) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Transaction ID: ${paymentData.transaction_id}`, margin, pageHeight - 10);
      }
      
      // Save the PDF with Order ID as filename
      pdf.save(`${order.order_number}.pdf`);
      
      // Cleanup
      URL.revokeObjectURL(img.src);
      
      toast({
        title: "Download Complete",
        description: `Payment screenshot saved as ${order.order_number}.pdf`
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

  if (!order || !paymentData) {
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
              <p className="text-muted-foreground">Order #{order.order_number}</p>
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
                  <span className="font-medium text-muted-foreground">Transaction ID</span>
                  <span className="font-mono text-sm bg-muted px-3 py-1 rounded">
                    {paymentData.transaction_id}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Payment Amount</span>
                  <span className="text-xl font-bold text-green-600">
                    ${paymentData.payment_amount.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-muted-foreground">Submitted At</span>
                  <span className="text-sm">
                    {new Date(paymentData.submitted_at).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="font-medium text-muted-foreground">Customer</span>
                  <div className="text-right">
                    {order.profiles ? (
                      <>
                        <p className="font-medium">
                          {order.profiles.first_name} {order.profiles.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.profiles.email}
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
              {paymentData.payment_screenshot_url ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden bg-muted/50">
                    <img
                      src={paymentData.payment_screenshot_url}
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
                      onClick={() => window.open(paymentData.payment_screenshot_url, '_blank')}
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
              <CardTitle>Payment Verification</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review the payment details above and verify or reject the payment.
              </p>
            </CardHeader>
            <CardContent>
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
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Processing payment verification...
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