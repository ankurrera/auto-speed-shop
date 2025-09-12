import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, DollarSign, Clock } from "lucide-react";
import { ScreenshotModalViewer } from "./ScreenshotModalViewer";
import { useState } from "react";

interface PaymentData {
  transaction_id: string;
  payment_amount: number;
  payment_screenshot_url: string;
  submitted_at: string;
}

interface PaymentVerificationOrder {
  id: string;
  order_number: string;
  status: string;
  notes?: string;
  total_amount: number;
  created_at: string;
  profiles?: {
    email: string;
    first_name: string;
    last_name: string;
  };
}

interface PaymentVerificationTableProps {
  orders: PaymentVerificationOrder[];
  loading: boolean;
  onVerifyPayment: (orderId: string, verified: boolean, rejectionReason?: string) => Promise<void>;
  isVerifying: boolean;
}

export const PaymentVerificationTable = ({ 
  orders, 
  loading, 
  onVerifyPayment,
  isVerifying 
}: PaymentVerificationTableProps) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleRejectPayment = async () => {
    if (selectedOrderId && rejectionReason.trim()) {
      await onVerifyPayment(selectedOrderId, false, rejectionReason.trim());
      setIsRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedOrderId(null);
    }
  };

  const openRejectionDialog = (orderId: string) => {
    setSelectedOrderId(orderId);
    setRejectionReason('');
    setIsRejectionDialogOpen(true);
  };
  const getPaymentData = (order: PaymentVerificationOrder): PaymentData | null => {
    if (!order.notes) return null;
    try {
      return JSON.parse(order.notes) as PaymentData;
    } catch {
      return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_submitted':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'payment_verified':
      case 'confirmed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
      case 'payment_rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'payment_submitted');
  const verifiedOrders = orders.filter(order => order.status === 'payment_verified' || order.status === 'confirmed');
  const rejectedOrders = orders.filter(order => order.status === 'payment_rejected');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading payment verification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payments Pending Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Payments Pending Verification ({pendingOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Screenshot</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrders.map((order) => {
                    const paymentData = getPaymentData(order);
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
                          <span className="font-semibold text-green-600">
                            ${paymentData?.payment_amount?.toFixed(2) || order.total_amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {paymentData?.transaction_id ? (
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                              {paymentData.transaction_id}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {paymentData?.submitted_at ? 
                            new Date(paymentData.submitted_at).toLocaleDateString() : 
                            new Date(order.created_at).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          {paymentData?.payment_screenshot_url ? (
                            <ScreenshotModalViewer
                              screenshotUrl={paymentData.payment_screenshot_url}
                              transactionId={paymentData.transaction_id}
                              triggerClassName="w-full"
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm">No screenshot</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  disabled={isVerifying}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Verify
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Verify Payment</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to verify this payment? This will confirm the order and notify the customer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => onVerifyPayment(order.id, true)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    Verify Payment
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isVerifying}
                              onClick={() => openRejectionDialog(order.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payments pending verification</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verified Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Verified Payments ({verifiedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {verifiedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedOrders.map((order) => {
                    const paymentData = getPaymentData(order);
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
                          <span className="font-semibold text-green-600">
                            ${paymentData?.payment_amount?.toFixed(2) || order.total_amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No verified payments yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejected Payments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Rejected Payments ({rejectedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rejectedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedOrders.map((order) => {
                    const paymentData = getPaymentData(order);
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
                          <span className="font-semibold">
                            ${paymentData?.payment_amount?.toFixed(2) || order.total_amount.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No rejected payments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rejection Reason Dialog */}
      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this payment. This will be included in the notification sent to the customer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why this payment is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectionDialogOpen(false);
                setRejectionReason('');
                setSelectedOrderId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPayment}
              disabled={!rejectionReason.trim() || isVerifying}
            >
              Reject Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};