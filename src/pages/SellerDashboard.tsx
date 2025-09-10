import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Store, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Save, 
  ArrowLeft,
  Building2,
  Package
} from "lucide-react";

interface SellerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  user_id: string;
}

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  is_seller: boolean;
}

const SellerDashboard = () => {
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchSellerData = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/account");
        return;
      }

      // Get user profile to check if they're a seller
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone, is_seller")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        toast({
          title: "Error",
          description: "Failed to fetch user profile",
          variant: "destructive",
        });
        return;
      }

      if (!profile.is_seller) {
        toast({
          title: "Access Denied",
          description: "You need to be a seller to access this dashboard",
          variant: "destructive",
        });
        navigate("/account");
        return;
      }

      setUserProfile(profile);

      // Get seller information
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (sellerError) {
        console.error("Seller fetch error:", sellerError);
        if (sellerError.code === 'PGRST116') { // No rows returned
          // Create a seller record if it doesn't exist
          const { data: newSeller, error: createError } = await supabase
            .from("sellers")
            .insert({
              user_id: session.user.id,
              name: `${profile.first_name} ${profile.last_name}`.trim(),
              email: profile.email,
              phone: profile.phone || "",
              address: "",
            })
            .select()
            .single();

          if (createError) {
            console.error("Seller creation error:", createError);
            toast({
              title: "Error",
              description: "Failed to create seller record",
              variant: "destructive",
            });
            return;
          }

          setSellerInfo(newSeller);
          setEditForm({
            name: newSeller.name,
            email: newSeller.email,
            phone: newSeller.phone || "",
            address: newSeller.address || "",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch seller information",
            variant: "destructive",
          });
          return;
        }
      } else {
        setSellerInfo(seller);
        setEditForm({
          name: seller.name,
          email: seller.email,
          phone: seller.phone || "",
          address: seller.address || "",
        });
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchSellerData();
  }, [fetchSellerData]);

  const handleSave = async () => {
    if (!sellerInfo) return;

    try {
      const { error } = await supabase
        .from("sellers")
        .update({
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone,
          address: editForm.address,
        })
        .eq("id", sellerInfo.id);

      if (error) {
        console.error("Update error:", error);
        toast({
          title: "Error",
          description: "Failed to update seller information",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setSellerInfo({
        ...sellerInfo,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        address: editForm.address,
      });

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Seller information updated successfully",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (sellerInfo) {
      setEditForm({
        name: sellerInfo.name,
        email: sellerInfo.email,
        phone: sellerInfo.phone || "",
        address: sellerInfo.address || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded w-1/3" />
            <div className="h-6 bg-muted rounded w-1/2" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/account")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                <Store className="h-8 w-8 text-primary" />
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your seller profile and business information
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Seller Information Card */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Seller Information
                </CardTitle>
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="seller-name">Business Name</Label>
                    <Input
                      id="seller-name"
                      value={editForm.name}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      placeholder="Enter business name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seller-email">Email</Label>
                    <Input
                      id="seller-email"
                      type="email"
                      value={editForm.email}
                      disabled={!isEditing}
                      onChange={(e) =>
                        setEditForm({ ...editForm, email: e.target.value })
                      }
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-phone">Phone Number</Label>
                  <Input
                    id="seller-phone"
                    type="tel"
                    value={editForm.phone}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seller-address">Business Address</Label>
                  <Textarea
                    id="seller-address"
                    value={editForm.address}
                    disabled={!isEditing}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                    placeholder="Enter business address"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Actions */}
          <div className="space-y-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Seller Account
                    </p>
                  </div>
                </div>
                {sellerInfo && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{sellerInfo.email}</span>
                    </div>
                    {sellerInfo.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{sellerInfo.phone}</span>
                      </div>
                    )}
                    {sellerInfo.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <span>{sellerInfo.address}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/account/admin-dashboard")}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Manage Products
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/account")}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;