import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { 
  DollarSign, 
  X, 
  RefreshCw,
  Plus,
  Check,
  Clock,
  AlertCircle,
  Calendar
} from "lucide-react";

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

  if (isLoading) {
    return <p>Loading payouts...</p>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Payout Management
        </CardTitle>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
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
          <Button 
            onClick={() => setShowCalculateForm(!showCalculateForm)}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Calculate Payouts
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
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
        {/* Calculate Payouts Form */}
        {showCalculateForm && (
          <Card>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </CardContent>
    </Card>
  );
};

export default AdminPayoutManagement;