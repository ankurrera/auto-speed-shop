import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, Edit, Trash2, Search, Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { CouponService, CouponStats } from '../services/couponService';
import { Database } from '../database.types';
import { useToast } from '../hooks/use-toast';

type Coupon = Database['public']['Tables']['coupons']['Row'];
type CouponInsert = Database['public']['Tables']['coupons']['Insert'];

const AdminDiscountCouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponInsert>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    max_uses: null,
    expires_at: null,
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [couponsData, statsData] = await Promise.all([
        CouponService.getAllCoupons(),
        CouponService.getCouponStats(),
      ]);
      setCoupons(couponsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coupons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async () => {
    try {
      await CouponService.createCoupon(formData);
      toast({
        title: 'Success',
        description: 'Coupon created successfully!',
      });
      setIsCreateDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to create coupon. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      await CouponService.updateCoupon(selectedCoupon.id, formData);
      toast({
        title: 'Success',
        description: 'Coupon updated successfully!',
      });
      setIsEditDialogOpen(false);
      setSelectedCoupon(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error updating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to update coupon. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      await CouponService.deleteCoupon(couponId);
      toast({
        title: 'Success',
        description: 'Coupon deleted successfully!',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete coupon. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_order_amount: 0,
      max_uses: null,
      expires_at: null,
      is_active: true,
    });
  };

  const openEditDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_uses: coupon.max_uses,
      expires_at: coupon.expires_at,
      is_active: coupon.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StatCard = ({ title, value, icon: Icon, className = '' }: {
    title: string;
    value: number;
    icon: React.ElementType;
    className?: string;
  }) => (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading coupons...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Manage discount coupons and promotional offers</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Coupon
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Coupons"
            value={stats.total_coupons}
            icon={ShoppingCart}
          />
          <StatCard
            title="Active Coupons"
            value={stats.active_coupons}
            icon={TrendingUp}
            className="border-green-200"
          />
          <StatCard
            title="Used Coupons"
            value={stats.used_coupons}
            icon={Users}
          />
          <StatCard
            title="Total Uses"
            value={stats.total_uses}
            icon={DollarSign}
          />
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
          <CardDescription>
            Manage your discount coupons and promotional offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredCoupons.map((coupon) => (
              <div
                key={coupon.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{coupon.code}</h3>
                    <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {coupon.expires_at && new Date(coupon.expires_at) < new Date() && (
                      <Badge variant="destructive">Expired</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {coupon.description}
                  </p>
                  <div className="flex gap-4 text-sm">
                    <span>
                      <strong>Discount:</strong> {coupon.discount_value}
                      {coupon.discount_type === 'percentage' ? '%' : '$'}
                    </span>
                    <span>
                      <strong>Min Order:</strong> ${coupon.min_order_amount}
                    </span>
                    {coupon.max_uses && (
                      <span>
                        <strong>Uses:</strong> {coupon.uses_count} / {coupon.max_uses}
                      </span>
                    )}
                    {coupon.expires_at && (
                      <span>
                        <strong>Expires:</strong> {new Date(coupon.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(coupon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filteredCoupons.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No coupons found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount coupon for your customers
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter coupon code"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter coupon description"
              />
            </div>
            <div>
              <Label htmlFor="discount_type">Discount Type</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discount_value">Discount Value</Label>
              <Input
                id="discount_value"
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                placeholder="Enter discount value"
              />
            </div>
            <div>
              <Label htmlFor="min_order_amount">Minimum Order Amount</Label>
              <Input
                id="min_order_amount"
                type="number"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter minimum order amount"
              />
            </div>
            <div>
              <Label htmlFor="max_uses">Maximum Uses (optional)</Label>
              <Input
                id="max_uses"
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Enter maximum uses"
              />
            </div>
            <div>
              <Label htmlFor="expires_at">Expiry Date (optional)</Label>
              <Input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>
              Update the coupon details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_code">Coupon Code</Label>
              <Input
                id="edit_code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Enter coupon code"
              />
            </div>
            <div>
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter coupon description"
              />
            </div>
            <div>
              <Label htmlFor="edit_discount_type">Discount Type</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_discount_value">Discount Value</Label>
              <Input
                id="edit_discount_value"
                type="number"
                step="0.01"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                placeholder="Enter discount value"
              />
            </div>
            <div>
              <Label htmlFor="edit_min_order_amount">Minimum Order Amount</Label>
              <Input
                id="edit_min_order_amount"
                type="number"
                step="0.01"
                value={formData.min_order_amount}
                onChange={(e) => setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter minimum order amount"
              />
            </div>
            <div>
              <Label htmlFor="edit_max_uses">Maximum Uses (optional)</Label>
              <Input
                id="edit_max_uses"
                type="number"
                value={formData.max_uses || ''}
                onChange={(e) => setFormData({ ...formData, max_uses: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Enter maximum uses"
              />
            </div>
            <div>
              <Label htmlFor="edit_expires_at">Expiry Date (optional)</Label>
              <Input
                id="edit_expires_at"
                type="datetime-local"
                value={formData.expires_at ? new Date(formData.expires_at).toISOString().slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <Label htmlFor="edit_is_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCoupon}>Update Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDiscountCouponManagement;