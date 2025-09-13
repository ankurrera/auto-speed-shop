/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  payment_method: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  convenience_fee: number | null;
  delivery_charge: number | null;
  currency: string;
  notes: string | null;
  shipping_address: any;
  billing_address: any;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface PayoutManagementProps {
  onBack: () => void;
}

const PayoutManagement = ({ onBack }: PayoutManagementProps) => {
  const [pendingPayments, setPendingPayments] = useState<Order[]>([]);
  const [verifiedPayments, setVerifiedPayments] = useState<Order[]>([]);
  const [rejectedPayments, setRejectedPayments] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get orders with payment submissions
      const { data: ordersData, error } = await supabase
        .rpc('get_invoice_orders_for_admin', {
          requesting_user_id: user.id
        });

      if (error) {
        console.warn('PayoutManagement Supabase RPC error:', error);
        throw error;
      }

      // Transform and categorize orders
      const allOrders = await Promise.all(
        (ordersData || []).map(async (order: any) => {
          // Get user profile for each order
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', order.user_id)
            .single();

          return {
            ...order,
            profiles: profile
          };
        })
      );

      // Categorize orders based on payment status
      setPendingPayments(allOrders.filter(order => order.status === 'payment_submitted'));
      setVerifiedPayments(allOrders.filter(order => order.payment_status === 'verified'));
      setRejectedPayments(allOrders.filter(order => order.payment_status === 'failed'));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch payments";
      console.error('Error fetching payments:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleVerifyPayment = async (orderId: string, verified: boolean) => {
    setIsVerifyingPayment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.rpc('admin_verify_payment', {
        requesting_user_id: user.id,
        target_order_id: orderId,
        verified: verified
      });

      if (error) throw error;

      toast({
        title: verified ? "Payment Verified" : "Payment Rejected",
        description: verified 
          ? "Order has been confirmed and stock has been updated"
          : "Payment verification failed, customer will be notified"
      });

      fetchPayments();
    } catch (error: unknown) {
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

  const viewPaymentDetails = (order: Order) => {
    try {
      const paymentData = order.notes ? JSON.parse(order.notes) : null;
      setSelectedPayment({
        ...order,
        paymentData
      });
      setShowPaymentModal(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to parse payment details",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string, paymentStatus?: string) => {
    if (paymentStatus === 'verified') {
      return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
    }
    if (paymentStatus === 'failed') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    }
    if (status === 'payment_submitted') {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const renderPaymentTable = (orders: Order[], showActions: boolean = false) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const paymentData = order.notes ? JSON.parse(order.notes) : null;
          return (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>
                {order.profiles ? (
                  <div>
                    <p className="font-medium">{order.profiles.first_name} {order.profiles.last_name}</p>
                    <p className="text-xs text-muted-foreground">{order.profiles.email}</p>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Unknown</span>
                )}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">${order.total_amount.toFixed(2)}</p>
                  {paymentData && (
                    <p className="text-xs text-muted-foreground">
                      Paid: ${paymentData.payment_amount}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{getStatusBadge(order.status, order.payment_status)}</TableCell>
              <TableCell className="text-center">
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewPaymentDetails(order)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {showActions && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleVerifyPayment(order.id, true)}
                        disabled={isVerifyingPayment}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerifyPayment(order.id, false)}
                        disabled={isVerifyingPayment}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Payment Management
        </CardTitle>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingPayments.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({verifiedPayments.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({rejectedPayments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-6">
            {pendingPayments.length > 0 ? (
              <div className="overflow-x-auto">
                {renderPaymentTable(pendingPayments, true)}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Pending Payments</h3>
                <p className="text-muted-foreground">
                  There are currently no payments awaiting verification.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="verified" className="mt-6">
            {verifiedPayments.length > 0 ? (
              <div className="overflow-x-auto">
                {renderPaymentTable(verifiedPayments)}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Verified Payments</h3>
                <p className="text-muted-foreground">
                  No payments have been verified yet.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="rejected" className="mt-6">
            {rejectedPayments.length > 0 ? (
              <div className="overflow-x-auto">
                {renderPaymentTable(rejectedPayments)}
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Rejected Payments</h3>
                <p className="text-muted-foreground">
                  No payments have been rejected.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Details Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Details - {selectedPayment?.order_number}
              </DialogTitle>
              <DialogDescription>
                Review the payment submission details below
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Order Information</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Order #:</strong> {selectedPayment.order_number}</p>
                      <p><strong>Total Amount:</strong> ${selectedPayment.total_amount.toFixed(2)}</p>
                      <p><strong>Customer:</strong> {selectedPayment.profiles?.first_name} {selectedPayment.profiles?.last_name}</p>
                      <p><strong>Email:</strong> {selectedPayment.profiles?.email}</p>
                    </div>
                  </div>
                  
                  {selectedPayment.paymentData && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Payment Information</h4>
                      <div className="text-sm space-y-1">
                        <p><strong>Amount Paid:</strong> ${selectedPayment.paymentData.payment_amount}</p>
                        <p><strong>Method:</strong> {selectedPayment.paymentData.payment_method}</p>
                        {selectedPayment.paymentData.transaction_id && (
                          <p><strong>Transaction ID:</strong> {selectedPayment.paymentData.transaction_id}</p>
                        )}
                        <p><strong>Submitted:</strong> {new Date(selectedPayment.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedPayment.paymentData?.payment_proof && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Payment Proof
                    </h4>
                    <div className="border rounded-lg p-4">
                      <img 
                        src={selectedPayment.paymentData.payment_proof} 
                        alt="Payment Proof"
                        className="max-w-full max-h-96 mx-auto rounded border"
                      />
                    </div>
                  </div>
                )}
                
                {selectedPayment.status === 'payment_submitted' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      onClick={() => {
                        handleVerifyPayment(selectedPayment.id, true);
                        setShowPaymentModal(false);
                      }}
                      disabled={isVerifyingPayment}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify Payment
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleVerifyPayment(selectedPayment.id, false);
                        setShowPaymentModal(false);
                      }}
                      disabled={isVerifyingPayment}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject Payment
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default PayoutManagement;