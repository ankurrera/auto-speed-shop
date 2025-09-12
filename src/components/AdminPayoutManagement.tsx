import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { 
  DollarSign, 
  X, 
  RefreshCw,
  Plus,
  Check,
  Clock,
  AlertCircle,
  Calendar,
  Eye
} from "lucide-react";
import { PaymentVerificationTable } from "./PaymentVerificationTable";
import { verifyPayment } from "@/services/customOrderService";

interface PaymentVerificationOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_amount: number;
  tax_amount: number;
  total_amount: number;
  convenience_fee?: number;
  delivery_charge?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface Payout {
  id: string;
  payout_number: string;
  seller_name: string;
  seller_email: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string;
  period_start: string;
  period_end: string;
  created_at: string;
  processed_at: string | null;
}

interface PayoutCalculation {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  total_orders: number;
  total_revenue: number;
  commission_rate: number;
  payout_amount: number;
}

const AdminPayoutManagement = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCalculateForm, setShowCalculateForm] = useState(false);
  const [calculationPeriod, setCalculationPeriod] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0]
  });
  const [payoutCalculations, setPayoutCalculations] = useState<PayoutCalculation[]>([]);
  const [paymentOrders, setPaymentOrders] = useState<PaymentVerificationOrder[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Fetch payment verification orders
  const fetchPaymentOrders = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get orders that have payments to verify or that have been verified/rejected
      const { data: ordersData, error } = await supabase
        .rpc('get_invoice_orders_for_admin', {
          requesting_user_id: user.id
        });

      if (error) {
        console.warn('Payment orders fetch error:', error);
        // Use sample data in development mode
        const isDevelopment = import.meta.env.DEV;
        if (isDevelopment) {
          const samplePaymentOrders: PaymentVerificationOrder[] = [
            {
              id: 'sample-payment-order-1',
              order_number: 'ORD-PAY-001',
              user_id: 'sample-user-1',
              status: 'payment_submitted',
              payment_status: 'submitted',
              subtotal: 199.99,
              shipping_amount: 9.99,
              tax_amount: 16.50,
              total_amount: 226.48,
              created_at: new Date(Date.now() - 86400000).toISOString(),
              updated_at: new Date(Date.now() - 86400000).toISOString(),
              notes: JSON.stringify({
                transaction_id: 'TXN-SAMPLE-12345',
                payment_amount: 226.48,
                payment_screenshot_url: '#',
                submitted_at: new Date(Date.now() - 86400000).toISOString()
              }),
              profiles: {
                email: 'john.doe@example.com',
                first_name: 'John',
                last_name: 'Doe'
              }
            }
          ];
          setPaymentOrders(samplePaymentOrders);
          return;
        }
        throw error;
      }

      // Filter orders that are relevant for payment verification
      const relevantOrders = (ordersData || []).filter((order: any) => 
        order.status === 'payment_submitted' || 
        order.status === 'payment_verified' || 
        order.status === 'payment_rejected' ||
        order.status === 'confirmed'
      );

      const ordersWithProfiles = relevantOrders.map((order: any) => ({
        ...order,
        profiles: order.customer_first_name || order.customer_last_name || order.customer_email ? {
          first_name: order.customer_first_name,
          last_name: order.customer_last_name,
          email: order.customer_email
        } : null
      }));

      setPaymentOrders(ordersWithProfiles);
    } catch (error) {
      console.error('Error fetching payment orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment verification data",
        variant: "destructive"
      });
    } finally {
      setLoadingPayments(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPaymentOrders();
  }, [fetchPaymentOrders]);
  // Fetch payouts
  const { data: payouts, isLoading, refetch } = useQuery<Payout[]>({
    queryKey: ['admin-payouts', statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_get_all_payouts', {
          requesting_user_id: user.id,
          payout_status: statusFilter === 'all' ? null : statusFilter,
          limit_count: 100
        });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Handle payment verification
  const handleVerifyPayment = async (orderId: string, verified: boolean) => {
    setIsVerifyingPayment(true);
    try {
      await verifyPayment(orderId, verified);

      toast({
        title: verified ? "Payment Verified" : "Payment Rejected",
        description: verified 
          ? "Order has been confirmed and customer notified"
          : "Payment verification failed, customer will be notified"
      });

      // Refresh both payment orders and payouts
      fetchPaymentOrders();
      refetch();
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
  // Calculate payouts mutation
  const calculatePayoutsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_calculate_seller_payouts', {
          requesting_user_id: user.id,
          period_start_param: new Date(calculationPeriod.start).toISOString(),
          period_end_param: new Date(calculationPeriod.end + 'T23:59:59').toISOString()
        });
      
      if (error) throw error;
      return data || [];
    },
    onSuccess: (data) => {
      setPayoutCalculations(data);
      if (data.length === 0) {
        toast({
          title: "No Payouts",
          description: "No seller payouts found for the selected period",
        });
      } else {
        toast({
          title: "Calculation Complete",
          description: `Found payouts for ${data.length} sellers`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create payout mutation
  const createPayoutMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_create_seller_payout', {
          requesting_user_id: user.id,
          target_seller_id: sellerId,
          period_start_param: new Date(calculationPeriod.start).toISOString(),
          period_end_param: new Date(calculationPeriod.end + 'T23:59:59').toISOString(),
          payment_method_param: 'bank_transfer'
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        toast({
          title: "Success",
          description: `Payout ${result.payout_number} created for $${result.amount}`,
        });
        queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
        // Remove from calculations
        setPayoutCalculations(prev => prev.filter(calc => calc.seller_id !== data[0].payout_id));
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update payout status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ payoutId, newStatus }: { payoutId: string, newStatus: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_update_payout_status', {
          requesting_user_id: user.id,
          payout_id: payoutId,
          new_status: newStatus
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <Check className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 'processing':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 'completed':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'failed':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'cancelled':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Payout Management
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCalculateForm(!showCalculateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Calculate Payouts
          </Button>
          <Button variant="outline" size="sm" onClick={() => { refetch(); fetchPaymentOrders(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Payment Verification</TabsTrigger>
            <TabsTrigger value="payouts">Seller Payouts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments">
            <PaymentVerificationTable
              orders={paymentOrders}
              loading={loadingPayments}
              onVerifyPayment={handleVerifyPayment}
              isVerifying={isVerifyingPayment}
            />
          </TabsContent>
          
          <TabsContent value="payouts">
            {/* Calculate Payouts Form */}
            {showCalculateForm && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Calculate Seller Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Period Start</Label>
                        <Input
                          type="date"
                          value={calculationPeriod.start}
                          onChange={(e) => setCalculationPeriod(prev => ({ ...prev, start: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Period End</Label>
                        <Input
                          type="date"
                          value={calculationPeriod.end}
                          onChange={(e) => setCalculationPeriod(prev => ({ ...prev, end: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => calculatePayoutsMutation.mutate()}
                        disabled={calculatePayoutsMutation.isPending}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {calculatePayoutsMutation.isPending ? 'Calculating...' : 'Calculate Payouts'}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowCalculateForm(false);
                          setPayoutCalculations([]);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>

                  {/* Payout Calculations Results */}
                  {payoutCalculations.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold mb-4">Calculated Payouts</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Seller</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Commission Rate</TableHead>
                            <TableHead>Payout Amount</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payoutCalculations.map((calc) => (
                            <TableRow key={calc.seller_id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">{calc.seller_name}</div>
                                  <div className="text-sm text-muted-foreground">{calc.seller_email}</div>
                                </div>
                              </TableCell>
                              <TableCell>{calc.total_orders}</TableCell>
                              <TableCell>${calc.total_revenue.toFixed(2)}</TableCell>
                              <TableCell>{(calc.commission_rate * 100).toFixed(1)}%</TableCell>
                              <TableCell className="font-semibold">${calc.payout_amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  onClick={() => createPayoutMutation.mutate(calc.seller_id)}
                                  disabled={createPayoutMutation.isPending}
                                >
                                  Create Payout
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">Pending</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">
                          {payouts?.filter(p => p.status === 'pending').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">Processing</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">
                          {payouts?.filter(p => p.status === 'processing').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Check className="h-4 w-4 text-green-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">Completed</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">
                          {payouts?.filter(p => p.status === 'completed').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div className="ml-2">
                      <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold">
                          ${payouts?.reduce((sum, p) => sum + p.amount, 0).toFixed(0) || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter */}
            <div className="flex justify-between items-center mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payouts Table */}
            {payouts && payouts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payout #</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-mono text-sm">
                        {payout.payout_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payout.seller_name}</div>
                          <div className="text-sm text-muted-foreground">{payout.seller_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${payout.amount.toFixed(2)} {payout.currency}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payout.status)}>
                          {getStatusIcon(payout.status)}
                          <span className="ml-1 capitalize">{payout.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(payout.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {payout.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({
                                payoutId: payout.id,
                                newStatus: 'processing'
                              })}
                            >
                              Process
                            </Button>
                          )}
                          {payout.status === 'processing' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({
                                  payoutId: payout.id,
                                  newStatus: 'completed'
                                })}
                              >
                                Complete
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStatusMutation.mutate({
                                  payoutId: payout.id,
                                  newStatus: 'failed'
                                })}
                              >
                                Mark Failed
                              </Button>
                            </>
                          )}
                          {(payout.status === 'pending' || payout.status === 'processing') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({
                                payoutId: payout.id,
                                newStatus: 'cancelled'
                              })}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No payouts found. Calculate seller payouts to get started.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminPayoutManagement;