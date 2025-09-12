import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Gift,
  Percent,
  Plus,
  Edit,
  Send,
  MoreHorizontal,
  Trash2,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CouponService, Coupon, UserCoupon } from "@/services/couponService";

interface User {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

interface DiscountCouponManagementProps {
  onBack: () => void;
}

const DiscountCouponManagement = ({ onBack }: DiscountCouponManagementProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponStats, setCouponStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    totalAssigned: 0,
    totalUsed: 0,
  });
  const { toast } = useToast();

  // Create coupon form state
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 0,
    min_order_amount: '',
    max_discount_amount: '',
    usage_limit: '',
    valid_until: ''
  });

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const [allCoupons, stats] = await Promise.all([
        CouponService.getAllCoupons(),
        CouponService.getCouponStats(),
      ]);
      
      setCoupons(allCoupons);
      setCouponStats(stats);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .eq('is_admin', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedUsers = (usersData || []).map(user => ({
        id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email
      }));

      setUsers(transformedUsers);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch users";
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleCreateCoupon = async () => {
    try {
      if (!couponForm.code.trim() || couponForm.discount_value <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const newCoupon = await CouponService.createCoupon({
        code: couponForm.code.trim(),
        description: couponForm.description.trim() || undefined,
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        min_order_amount: couponForm.min_order_amount ? parseFloat(couponForm.min_order_amount) : undefined,
        max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : undefined,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : undefined,
        valid_until: couponForm.valid_until || undefined,
        created_by: session.user.id,
      });

      toast({
        title: "Success",
        description: "Coupon created successfully"
      });

      setShowCreateDialog(false);
      setCouponForm({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: '',
        max_discount_amount: '',
        usage_limit: '',
        valid_until: ''
      });

      // Refresh coupons list
      fetchCoupons();

    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create coupon",
        variant: "destructive"
      });
    }
  };

  const handleEditCoupon = async () => {
    try {
      if (!editingCoupon || !couponForm.code.trim() || couponForm.discount_value <= 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive"
        });
        return;
      }

      await CouponService.updateCoupon(editingCoupon.id, {
        code: couponForm.code.trim(),
        description: couponForm.description.trim() || null,
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        min_order_amount: couponForm.min_order_amount ? parseFloat(couponForm.min_order_amount) : null,
        max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        valid_until: couponForm.valid_until || null,
      });

      toast({
        title: "Success",
        description: "Coupon updated successfully"
      });

      setShowEditDialog(false);
      setEditingCoupon(null);
      
      // Refresh coupons list
      fetchCoupons();

    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update coupon",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await CouponService.deleteCoupon(couponId);
      
      toast({
        title: "Success",
        description: "Coupon deleted successfully"
      });

      // Refresh coupons list
      fetchCoupons();

    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete coupon",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount?.toString() || '',
      max_discount_amount: coupon.max_discount_amount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      valid_until: coupon.valid_until || ''
    });
    setShowEditDialog(true);
  };

  const handleSendCoupons = async () => {
    try {
      if (!selectedCoupon || selectedUsers.length === 0) {
        toast({
          title: "Error",
          description: "Please select a coupon and at least one user",
          variant: "destructive"
        });
        return;
      }

      await CouponService.assignCouponToUsers(selectedCoupon, selectedUsers);

      toast({
        title: "Success",
        description: `Coupon assigned to ${selectedUsers.length} user(s) successfully`
      });

      setShowSendDialog(false);
      setSelectedUsers([]);
      setSelectedCoupon("");

    } catch (error) {
      console.error('Error assigning coupons:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to assign coupons",
        variant: "destructive"
      });
    }
  };

  const toggleCouponStatus = async (couponId: string) => {
    try {
      const coupon = coupons.find(c => c.id === couponId);
      if (!coupon) return;

      const newStatus = coupon.status === 'active' ? 'inactive' : 'active';
      
      await CouponService.updateCoupon(couponId, { status: newStatus });

      toast({
        title: "Success",
        description: "Coupon status updated successfully"
      });

      // Refresh coupons list
      fetchCoupons();

    } catch (error) {
      console.error('Error updating coupon status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update coupon status",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
    
    if (coupon.status !== 'active') {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    
    if (validUntil && validUntil < now) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return <Badge variant="secondary">Limit Reached</Badge>;
    }
    
    return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}%`;
    } else {
      return `$${coupon.discount_value.toFixed(2)}`;
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchCoupons(), fetchUsers()]).finally(() => setLoading(false));
  }, [fetchCoupons, fetchUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5" />
          Discount & Coupon Management
        </CardTitle>
        <div className="flex gap-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Coupon</DialogTitle>
                <DialogDescription>
                  Create a new discount coupon for your customers
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Coupon Code</Label>
                    <Input
                      id="code"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value }))}
                      placeholder="WELCOME10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount_type">Discount Type</Label>
                    <Select
                      value={couponForm.discount_type}
                      onValueChange={(value: 'percentage' | 'fixed') => 
                        setCouponForm(prev => ({ ...prev, discount_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={couponForm.description}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the coupon offer"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discount_value">
                      Discount Value {couponForm.discount_type === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      id="discount_value"
                      type="number"
                      value={couponForm.discount_value}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                      placeholder={couponForm.discount_type === 'percentage' ? '10' : '5.00'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_order">Min Order Amount ($)</Label>
                    <Input
                      id="min_order"
                      type="number"
                      value={couponForm.min_order_amount}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, min_order_amount: e.target.value }))}
                      placeholder="50.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="usage_limit">Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      value={couponForm.usage_limit}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valid_from">Valid From</Label>
                    <Input
                      id="valid_from"
                      type="datetime-local"
                      value={couponForm.valid_from}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, valid_from: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valid_until">Valid Until</Label>
                    <Input
                      id="valid_until"
                      type="datetime-local"
                      value={couponForm.valid_until}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, valid_until: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCoupon}>
                    Create Coupon
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Send className="h-4 w-4 mr-2" />
                Send Coupons
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Coupons to Users</DialogTitle>
                <DialogDescription>
                  Select a coupon and users to send it to
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Coupon</Label>
                  <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a coupon" />
                    </SelectTrigger>
                    <SelectContent>
                      {coupons.filter(c => c.status === 'active').map(coupon => (
                        <SelectItem key={coupon.id} value={coupon.id}>
                          {coupon.code} - {getDiscountDisplay(coupon)} off
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Select Users ({selectedUsers.length} selected)</Label>
                  <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
                    {users.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${user.id}`}
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(prev => [...prev, user.id]);
                            } else {
                              setSelectedUsers(prev => prev.filter(id => id !== user.id));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={`user-${user.id}`} className="flex-1 text-sm">
                          {user.first_name} {user.last_name} ({user.email})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendCoupons}>
                    Send Coupons
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {coupons.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                    <TableCell className="max-w-xs truncate">{coupon.description}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        {getDiscountDisplay(coupon)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{coupon.used_count} used</p>
                        {coupon.usage_limit && (
                          <p className="text-muted-foreground">of {coupon.usage_limit} limit</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(coupon.valid_until).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(coupon)}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => toggleCouponStatus(coupon.id)}>
                            {coupon.status === 'active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => handleDeleteCoupon(coupon.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Coupons Created</h3>
            <p className="text-muted-foreground mb-4">
              Create your first discount coupon to boost sales and reward customers.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Coupon
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscountCouponManagement;