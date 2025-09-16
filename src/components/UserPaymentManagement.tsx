import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/types/order";

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
  payment_data?: {
    transaction_id: string;
    payment_amount: number;
    payment_screenshot_url: string;
    submitted_at: string;
  };
  rejection_reason?: string;
}

const UserPaymentManagement = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user's payment data
  const { data: paymentsData, isLoading, refetch, error } = useQuery({
    queryKey: ['user-payments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get user's orders with payment information
      let { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          status,
          payment_status,
          total_amount,
          created_at,
          updated_at,
          notes
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }

      // Transform orders into payment records
      const paymentRecords: PaymentRecord[] = (orders || [])
        .filter((order: any) => {
          // Include orders that have payment data or payment status
          const hasPaymentData = order.notes && order.notes !== '';
          const hasPaymentStatus = order.payment_status && order.payment_status !== '';
          const hasAmount = order.total_amount && order.total_amount > 0;
          
          return (hasPaymentData || hasPaymentStatus) && hasAmount;
        })
        .map((order: any) => {
          let paymentData = null;
          let rejectionReason = null;

          // Parse payment data from notes
          if (order.notes) {
            try {
              const parsed = JSON.parse(order.notes);
              if (parsed.transaction_id) {
                paymentData = parsed;
              }
              if (parsed.rejection_reason) {
                rejectionReason = parsed.rejection_reason;
              }
            } catch (e) {
              // If notes isn't JSON, it might be a rejection reason
              if (order.payment_status === PAYMENT_STATUS.FAILED) {
                rejectionReason = order.notes;
              }
            }
          }

          return {
            id: order.id,
            order_number: order.order_number,
            user_id: order.user_id,
            status: order.status || '',
            payment_status: order.payment_status || '',
            total_amount: parseFloat(order.total_amount) || 0,
            created_at: order.created_at,
            updated_at: order.updated_at,
            notes: order.notes,
            payment_data: paymentData,
            rejection_reason: rejectionReason
          };
        });

      return paymentRecords;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Filter payments by tab
  const getPaymentsByTab = (tab: string) => {
    if (!paymentsData) return [];
    
    if (tab === "all") return paymentsData;
    if (tab === "verified") return paymentsData.filter(p => p.payment_status === PAYMENT_STATUS.VERIFIED || p.status === ORDER_STATUS.CONFIRMED);
    if (tab === "rejected") return paymentsData.filter(p => p.payment_status === PAYMENT_STATUS.FAILED);
    if (tab === "pending") return paymentsData.filter(p => p.payment_status === PAYMENT_STATUS.SUBMITTED || p.status === ORDER_STATUS.PAYMENT_SUBMITTED);
    return paymentsData;
  };

  const currentTabPayments = getPaymentsByTab(activeTab);

  // Pagination
  const totalPages = Math.ceil(currentTabPayments.length / itemsPerPage);
  const paginatedPayments = currentTabPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get payment status badge
  const getPaymentStatusBadge = (payment: PaymentRecord) => {
    if (payment.payment_status === PAYMENT_STATUS.VERIFIED || payment.status === ORDER_STATUS.CONFIRMED) {
      return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    } else if (payment.payment_status === PAYMENT_STATUS.FAILED) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    } else if (payment.payment_status === PAYMENT_STATUS.SUBMITTED || payment.status === ORDER_STATUS.PAYMENT_SUBMITTED) {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const handleViewPayment = (payment: PaymentRecord) => {
    // Navigate to ViewPayment page with user context
    navigate(`/user/view-payment/${payment.id}`, { 
      state: { 
        paymentRecord: payment,
        isUserView: true
      } 
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            My Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading payments...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            My Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-red-600 mb-4">
              <p className="font-semibold">Error loading payment data</p>
              <p className="text-sm">{error.message}</p>
            </div>
            <Button onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              My Payments
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              View and manage your payment history and transaction details
            </p>
          </div>
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Account
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Verified</p>
                  <p className="text-2xl font-bold">
                    {paymentsData?.filter(p => p.payment_status === PAYMENT_STATUS.VERIFIED || p.status === ORDER_STATUS.CONFIRMED).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Rejected</p>
                  <p className="text-2xl font-bold">
                    {paymentsData?.filter(p => p.payment_status === PAYMENT_STATUS.FAILED).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Pending</p>
                  <p className="text-2xl font-bold">
                    {paymentsData?.filter(p => p.payment_status === PAYMENT_STATUS.SUBMITTED || p.status === ORDER_STATUS.PAYMENT_SUBMITTED).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Payments</p>
                  <p className="text-2xl font-bold">
                    ${(paymentsData?.filter(p => p.payment_status === PAYMENT_STATUS.VERIFIED || p.status === ORDER_STATUS.CONFIRMED)
                      .reduce((sum, p) => sum + p.total_amount, 0) || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Payment Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({paymentsData?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Verified ({getPaymentsByTab("verified").length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({getPaymentsByTab("rejected").length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({getPaymentsByTab("pending").length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-6">
            {/* Payments Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPayments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No payments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.order_number}</p>
                            <p className="text-sm text-muted-foreground">#{payment.id.slice(0, 8)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">${payment.total_amount.toFixed(2)}</p>
                          {payment.payment_data?.payment_amount && 
                            payment.payment_data.payment_amount !== payment.total_amount && (
                            <p className="text-sm text-orange-600">
                              Paid: ${payment.payment_data.payment_amount.toFixed(2)}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{getPaymentStatusBadge(payment)}</TableCell>
                        <TableCell>
                          {payment.payment_data?.transaction_id ? (
                            <p className="font-mono text-sm">{payment.payment_data.transaction_id}</p>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {payment.payment_data?.submitted_at ? (
                            <div className="text-sm">
                              <p>{new Date(payment.payment_data.submitted_at).toLocaleDateString()}</p>
                              <p className="text-muted-foreground">{new Date(payment.payment_data.submitted_at).toLocaleTimeString()}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, currentTabPayments.length)} of {currentTabPayments.length} payments
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserPaymentManagement;