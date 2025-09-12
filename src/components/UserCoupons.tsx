import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CouponService, UserCouponWithDetails } from '../services/couponService';
import { useToast } from '../hooks/use-toast';
import { Copy, Gift, CalendarDays, DollarSign, ShoppingCart } from 'lucide-react';

const UserCoupons: React.FC = () => {
  const [userCoupons, setUserCoupons] = useState<UserCouponWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserCoupons();
  }, []);

  const loadUserCoupons = async () => {
    try {
      setLoading(true);
      // In a real implementation, you would get the user ID from context/auth
      const userId = 'current-user-id'; // This should be the actual logged-in user's ID
      const coupons = await CouponService.getUserCoupons(userId);
      setUserCoupons(coupons);
    } catch (error) {
      console.error('Error loading user coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your coupons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: 'Copied!',
        description: 'Coupon code copied to clipboard.',
      });
    }).catch(() => {
      toast({
        title: 'Failed to copy',
        description: 'Unable to copy coupon code.',
        variant: 'destructive',
      });
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isUsed = (usedAt: string | null) => {
    return !!usedAt;
  };

  const formatDiscount = (coupon: UserCouponWithDetails['coupons']) => {
    if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else {
      return `$${coupon.discount_value} OFF`;
    }
  };

  const getCouponStatus = (userCoupon: UserCouponWithDetails) => {
    if (isUsed(userCoupon.used_at)) {
      return { text: 'Used', variant: 'secondary' as const };
    }
    if (isExpired(userCoupon.coupons.expires_at)) {
      return { text: 'Expired', variant: 'destructive' as const };
    }
    if (!userCoupon.coupons.is_active) {
      return { text: 'Inactive', variant: 'outline' as const };
    }
    return { text: 'Available', variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your coupons...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">My Coupons</h1>
        <p className="text-muted-foreground">
          View and manage your available discount coupons
        </p>
      </div>

      {userCoupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Coupons Available</h3>
            <p className="text-muted-foreground text-center">
              You don't have any coupons yet. Check back later for exciting offers!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCoupons.map((userCoupon) => {
            const status = getCouponStatus(userCoupon);
            const canUse = status.text === 'Available';
            
            return (
              <Card
                key={userCoupon.id}
                className={`relative overflow-hidden ${
                  canUse ? 'border-green-200 bg-gradient-to-br from-green-50 to-white' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={status.variant}>{status.text}</Badge>
                    {canUse && (
                      <div className="flex items-center text-green-600">
                        <Gift className="h-4 w-4 mr-1" />
                        <span className="text-sm font-medium">Ready to use</span>
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl">
                    {formatDiscount(userCoupon.coupons)}
                  </CardTitle>
                  {userCoupon.coupons.description && (
                    <CardDescription>{userCoupon.coupons.description}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Coupon Code */}
                  <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                    <span className="font-mono font-bold text-lg">
                      {userCoupon.coupons.code}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(userCoupon.coupons.code)}
                      disabled={!canUse}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Coupon Details */}
                  <div className="space-y-2 text-sm">
                    {userCoupon.coupons.min_order_amount > 0 && (
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        <span>Minimum order: ${userCoupon.coupons.min_order_amount}</span>
                      </div>
                    )}
                    
                    {userCoupon.coupons.expires_at && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Expires: {new Date(userCoupon.coupons.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Assigned: {new Date(userCoupon.assigned_at).toLocaleDateString()}
                      </span>
                    </div>

                    {userCoupon.used_at && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Used: {new Date(userCoupon.used_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Usage Information */}
                  {userCoupon.coupons.max_uses && (
                    <div className="text-xs text-muted-foreground">
                      Total uses: {userCoupon.coupons.uses_count} / {userCoupon.coupons.max_uses}
                    </div>
                  )}

                  {/* Action Button */}
                  {canUse && (
                    <Button className="w-full" disabled={!canUse}>
                      Use This Coupon
                    </Button>
                  )}
                </CardContent>

                {/* Decorative elements for active coupons */}
                {canUse && (
                  <>
                    <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-b-[20px] border-l-transparent border-b-green-500"></div>
                    <div className="absolute top-1 right-1 text-white text-xs">★</div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {userCoupons.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Coupon Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {userCoupons.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Coupons</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {userCoupons.filter(uc => getCouponStatus(uc).text === 'Available').length}
                </div>
                <div className="text-sm text-muted-foreground">Available</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600">
                  {userCoupons.filter(uc => isUsed(uc.used_at)).length}
                </div>
                <div className="text-sm text-muted-foreground">Used</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {userCoupons.filter(uc => isExpired(uc.coupons.expires_at)).length}
                </div>
                <div className="text-sm text-muted-foreground">Expired</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserCoupons;