import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Gift, 
  Calendar, 
  Percent,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CouponService, UserCoupon } from '@/services/couponService';

const UserCoupons = () => {
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadUserCoupons();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserCoupons = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userCoupons = await CouponService.getUserCoupons(session.user.id);
      setCoupons(userCoupons);
    } catch (error) {
      console.error('Error loading user coupons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your coupons',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (coupon: UserCoupon) => {
    if (coupon.status === 'used') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Used
        </Badge>
      );
    }
    
    if (coupon.status === 'expired') {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    // Check if coupon has expired
    if (coupon.coupon?.valid_until && new Date(coupon.coupon.valid_until) < new Date()) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="w-3 h-3 mr-1" />
        Available
      </Badge>
    );
  };

  const getDiscountDisplay = (coupon: UserCoupon) => {
    if (!coupon.coupon) return '';
    
    if (coupon.coupon.discount_type === 'percentage') {
      return `${coupon.coupon.discount_value}% off`;
    } else {
      return `$${coupon.coupon.discount_value} off`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: 'Copied!',
      description: 'Coupon code copied to clipboard',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Coupons</h2>
        <p className="text-muted-foreground">
          Your available coupons and discount codes
        </p>
      </div>

      {coupons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Coupons Available</h3>
            <p className="text-muted-foreground text-center">
              You don't have any coupons yet. Check back later for exclusive offers!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coupons.map((userCoupon) => (
            <Card key={userCoupon.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{userCoupon.coupon?.code}</CardTitle>
                  {getStatusBadge(userCoupon)}
                </div>
                {userCoupon.coupon?.description && (
                  <p className="text-sm text-muted-foreground">
                    {userCoupon.coupon.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center py-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center text-2xl font-bold text-primary">
                      {userCoupon.coupon?.discount_type === 'percentage' ? (
                        <Percent className="w-6 h-6 mr-1" />
                      ) : (
                        <DollarSign className="w-6 h-6 mr-1" />
                      )}
                      {getDiscountDisplay(userCoupon)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Assigned: {formatDate(userCoupon.assigned_at || userCoupon.created_at)}</span>
                  </div>
                  
                  {userCoupon.coupon?.valid_until && (
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>Expires: {formatDate(userCoupon.coupon.valid_until)}</span>
                    </div>
                  )}

                  {userCoupon.coupon?.min_order_amount && (
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Min order: ${userCoupon.coupon.min_order_amount}</span>
                    </div>
                  )}

                  {userCoupon.used_at && (
                    <div className="flex items-center text-muted-foreground">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      <span>Used: {formatDate(userCoupon.used_at)}</span>
                    </div>
                  )}
                </div>

                {userCoupon.status === 'assigned' && userCoupon.coupon?.code && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => copyCode(userCoupon.coupon!.code)}
                  >
                    Copy Code
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserCoupons;