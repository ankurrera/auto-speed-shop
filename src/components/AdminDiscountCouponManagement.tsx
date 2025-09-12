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
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface DiscountCouponManagementProps {
  onBack: () => void;
}

const DiscountCouponManagement = ({ onBack }: DiscountCouponManagementProps) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<string>("");
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
    valid_from: '',
    valid_until: ''
  });

  const fetchCoupons = useCallback(async () => {
    try {
      // For now, we'll use a simple table structure. In a real app, you'd create a coupons table
      // This is a mock implementation to show the UI structure
      const mockCoupons: Coupon[] = [
        {
          id: '1',
          code: 'WELCOME10',
          description: 'Welcome discount for new customers',
          discount_type: 'percentage',
          discount_value: 10,
          min_order_amount: 50,
          max_discount_amount: 100,
          usage_limit: 100,
          used_count: 25,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          code: 'SUMMER25',
          description: 'Summer seasonal discount',
          discount_type: 'percentage',
          discount_value: 25,
          min_order_amount: 100,
          max_discount_amount: null,
          usage_limit: null,
          used_count: 150,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setCoupons(mockCoupons);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch coupons";
      console.error('Error fetching coupons:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
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
      // In a real implementation, you would create the coupon in the database
      const newCoupon: Coupon = {
        id: Date.now().toString(),
        code: couponForm.code.toUpperCase(),
        description: couponForm.description,
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        min_order_amount: couponForm.min_order_amount ? parseFloat(couponForm.min_order_amount) : null,
        max_discount_amount: couponForm.max_discount_amount ? parseFloat(couponForm.max_discount_amount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        used_count: 0,
        valid_from: couponForm.valid_from,
        valid_until: couponForm.valid_until,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCoupons(prev => [newCoupon, ...prev]);
      
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
        valid_from: '',
        valid_until: ''
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create coupon";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
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

      // In a real implementation, you would:
      // 1. Create notifications in a notifications table
      // 2. Send emails to users
      // 3. Track coupon distributions

      toast({
        title: "Success",
        description: `Coupon sent to ${selectedUsers.length} user(s)`
      });

      setShowSendDialog(false);
      setSelectedUsers([]);
      setSelectedCoupon("");

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send coupons";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const toggleCouponStatus = async (couponId: string) => {
    try {
      setCoupons(prev => prev.map(coupon => 
        coupon.id === couponId 
          ? { ...coupon, is_active: !coupon.is_active, updated_at: new Date().toISOString() }
          : coupon
      ));

      toast({
        title: "Success",
        description: "Coupon status updated successfully"
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update coupon";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteCoupon = async (couponId: string) => {
    try {
      setCoupons(prev => prev.filter(coupon => coupon.id !== couponId));
      
      toast({
        title: "Success",
        description: "Coupon deleted successfully"
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete coupon";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date();
    const validUntil = new Date(coupon.valid_until);
    
    if (!coupon.is_active) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
    }
    
    if (validUntil < now) {
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
                      {coupons.filter(c => c.is_active).map(coupon => (
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
                            {coupon.is_active ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => deleteCoupon(coupon.id)}
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