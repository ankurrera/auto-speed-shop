import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Download,
  User,
  Calendar,
  DollarSign
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const AdminPaymentManagement = ({ onBack }: { onBack: () => void }) => {
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch payments data
  const { data: paymentsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments', paymentFilter, searchTerm],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Use admin function to get order data
      const { data: orders, error } = await supabase
        .rpc('get_invoice_orders_for_admin', {
          requesting_user_id: user.id
        });

      if (error) {
        throw new Error(`Failed to fetch payments: ${error.message}`);
      }

      // Transform orders into payment records and filter by payment status
      const paymentRecords: PaymentRecord[] = orders
        .filter((order: {
          id: string;
          status: string;
          payment_status: string;
          notes?: string;
        }) => {
          // Only include orders that have payment submissions
          return order.status === ORDER_STATUS.PAYMENT_SUBMITTED || 
                 order.status === ORDER_STATUS.PAYMENT_VERIFIED ||
                 order.status === ORDER_STATUS.CONFIRMED ||
                 (order.payment_status === PAYMENT_STATUS.VERIFIED) ||
                 (order.payment_status === PAYMENT_STATUS.FAILED) ||
                 (order.notes && order.notes.includes('transaction_id'));
        })
        .map((order: {
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
        }) => {
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
            status: order.status,
            payment_status: order.payment_status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            updated_at: order.updated_at,
            notes: order.notes,
            customer_first_name: order.customer_first_name,
            customer_last_name: order.customer_last_name,
            customer_email: order.customer_email,
            payment_data: paymentData,
            rejection_reason: rejectionReason
          };
        });

      return paymentRecords;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Filter payments based on status and search term
  const filteredPayments = paymentsData?.filter((payment) => {
    const matchesFilter = paymentFilter === "all" || 
      (paymentFilter === "verified" && (payment.payment_status === PAYMENT_STATUS.VERIFIED || payment.status === ORDER_STATUS.CONFIRMED)) ||
      (paymentFilter === "rejected" && payment.payment_status === PAYMENT_STATUS.FAILED) ||
      (paymentFilter === "pending" && (payment.payment_status === PAYMENT_STATUS.SUBMITTED || payment.status === ORDER_STATUS.PAYMENT_SUBMITTED));

    const matchesSearch = !searchTerm || 
      payment.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_data?.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
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
    navigate(`/admin/view-payment/${payment.id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Management
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track and manage all payment submissions, verifications, and rejections
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number, email, or transaction ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter payments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Verified</p>
                  <p className="text-2xl font-bold">
                    {filteredPayments?.filter(p => p.payment_status === PAYMENT_STATUS.VERIFIED || p.status === ORDER_STATUS.CONFIRMED).length || 0}
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
                    {filteredPayments?.filter(p => p.payment_status === PAYMENT_STATUS.FAILED).length || 0}
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
                    {filteredPayments?.filter(p => p.payment_status === PAYMENT_STATUS.SUBMITTED || p.status === ORDER_STATUS.PAYMENT_SUBMITTED).length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ${(filteredPayments?.filter(p => p.payment_status === PAYMENT_STATUS.VERIFIED || p.status === ORDER_STATUS.CONFIRMED)
                      .reduce((sum, p) => sum + p.total_amount, 0) || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payments Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No payments found matching your criteria
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
                      <div>
                        <p className="font-medium">
                          {payment.customer_first_name} {payment.customer_last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{payment.customer_email}</p>
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
                        {payment.rejection_reason && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <XCircle className="h-4 w-4 text-red-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rejection Reason</DialogTitle>
                                <DialogDescription>
                                  Payment rejection details for order {payment.order_number}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Reason:</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {payment.rejection_reason}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Rejected At:</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {new Date(payment.updated_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
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

export default AdminPaymentManagement;