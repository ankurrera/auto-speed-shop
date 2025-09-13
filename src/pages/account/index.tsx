import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import AnalyticsDashboard from "../AnalyticsDashboard";
import { EmailSubscriptionService } from "@/services/emailSubscriptionService";

// Import all our modular components
import { Login, Signup } from "./Auth";
import { ViewProfile, EditProfile, Logout } from "./Profile";
import { AddressList, AddressForm } from "./Addresses";
import { OrderList } from "./Orders";
import { 
  AdminDashboard, 
  UserManagement, 
  OrderManagement, 
  InvoiceManagement, 
  PaymentManagement, 
  PayoutsManagement, 
  InventoryManagement, 
  SupportManagement 
} from "./Admin";

// Import types and utilities
import { 
  UserInfo, 
  AuthView, 
  LoginMode, 
  AddressForm as AddressFormType, 
  EmailSubscriptionState 
} from "./types";
import { 
  hasAdminAccess, 
  fetchUserProfile, 
  fetchUserAddresses, 
  fetchUserOrders, 
  saveUserProfile, 
  saveAddress, 
  deleteAddress, 
  setDefaultAddress, 
  handleLogout as utilHandleLogout,
  checkSellerExists 
} from "./utils";

const Account = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [isEditing, setIsEditing] = useState(false);
  const [adminExists, setAdminExists] = useState(true);
  const [showSellerCreationAfterAdmin, setShowSellerCreationAfterAdmin] = useState(false);

  // User data
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
    role: "user",
  });

  // Email subscription state
  const [emailSubscription, setEmailSubscription] = useState<EmailSubscriptionState>({
    subscribed: false,
    loading: false,
    exists: false,
  });

  // Addresses state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formAddress, setFormAddress] = useState<AddressFormType>({
    first_name: "",
    last_name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
    type: "shipping",
    is_default: false,
  });

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin panel states
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  const [showPaymentManagement, setShowPaymentManagement] = useState(false);
  const [showPayoutManagement, setShowPayoutManagement] = useState(false);
  const [showInventoryManagement, setShowInventoryManagement] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);
  const [showManageProducts, setShowManageProducts] = useState(false);

  // Seller state
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [sellerExistsForAdmin, setSellerExistsForAdmin] = useState(false);

  // Hooks
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Admin metrics query
  const { data: adminMetrics } = useQuery({
    queryKey: ["admin-metrics"],
    enabled: hasAdminAccess(userInfo),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [{ count: orderItemsCount }, productRes, partRes, allOrdersRes] =
        await Promise.all([
          supabase.from("order_items").select("*", { count: "exact", head: true }),
          supabase.from("products").select("id, price, stock_quantity, is_active"),
          supabase.from("parts").select("id, price, stock_quantity, is_active"),
          supabase.rpc('get_all_orders_for_admin', {
            requesting_user_id: user.id
          })
        ]);

      let revenue = 0;
      if (allOrdersRes.data) {
        revenue = allOrdersRes.data
          .filter((row: { status: string }) => row.status === 'confirmed')
          .reduce(
            (sum: number, row: { total_amount: number }) => sum + (row.total_amount || 0),
            0
          );
      }

      return {
        orders: orderItemsCount ?? 0,
        productsActive: [
          ...(productRes.data || []),
          ...(partRes.data || []),
        ].filter((p: any) => p.is_active).length,
        revenue,
      };
    },
  });

  // Fetch and set user data
  const fetchAndSetUserData = useCallback(async (userId: string) => {
    const [profileData, addressesData, ordersData, sellerExists] = await Promise.all([
      fetchUserProfile(userId),
      fetchUserAddresses(userId),
      fetchUserOrders(userId),
      checkSellerExists(userId)
    ]);

    if (profileData) {
      setUserInfo(profileData);
    }
    setAddresses(addressesData);
    setOrders(ordersData);
    setSellerExistsForAdmin(!!sellerExists);
    setIsLoading(false);
  }, []);

  // Authentication effect
  useEffect(() => {
    const authListener = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsLoggedIn(true);
          fetchAndSetUserData(session.user.id);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setUserInfo({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            is_admin: false,
            is_seller: false,
            role: "user",
          });
          setAddresses([]);
          setOrders([]);
          setIsLoading(false);
        }
      }
    );

    const checkAdminExists = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("is_admin", { count: "exact" })
        .eq("is_admin", true);
      setAdminExists((count || 0) > 0);
    };

    const initial = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };

    initial();
    checkAdminExists();

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, [fetchAndSetUserData]);

  // Handler functions
  const handleLogin = (userId: string, loginMode: LoginMode) => {
    setIsLoggedIn(true);
    fetchAndSetUserData(userId);
    if (loginMode === "admin") {
      navigate("/account/admin-dashboard");
    }
  };

  const handleSignup = (userId: string, loginMode: LoginMode) => {
    if (loginMode === "admin") {
      setShowSellerCreationAfterAdmin(true);
    } else {
      setView("login");
    }
  };

  const handleLogout = async () => {
    try {
      await utilHandleLogout();
      setIsLoggedIn(false);
      navigate("/account");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSaveProfile = async () => {
    const success = await saveUserProfile(userInfo);
    if (success) {
      setIsEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmailSubscriptionChange = async (subscribed: boolean) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setEmailSubscription(prev => ({ ...prev, loading: true }));

    try {
      if (emailSubscription.exists) {
        await EmailSubscriptionService.updateSubscription(session.user.id, subscribed);
      } else {
        await EmailSubscriptionService.upsertSubscription(
          session.user.id, 
          userInfo.email, 
          subscribed
        );
        setEmailSubscription(prev => ({ ...prev, exists: true }));
      }
      
      setEmailSubscription(prev => ({ 
        ...prev, 
        subscribed, 
        loading: false 
      }));

      toast({
        title: subscribed ? "Subscribed" : "Unsubscribed",
        description: subscribed 
          ? "You will receive email notifications about new products."
          : "You will no longer receive email notifications.",
      });
    } catch (error) {
      console.error("Email subscription error:", error);
      setEmailSubscription(prev => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Failed to update email preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Address handlers
  const handleAddNewAddress = () => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    setFormAddress({
      first_name: "",
      last_name: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "US",
      phone: "",
      type: "shipping",
      is_default: false,
    });
  };

  const handleEditAddress = (address: any) => {
    setShowAddressForm(true);
    setEditingAddressId(address.id);
    setFormAddress({
      first_name: address.first_name,
      last_name: address.last_name,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone,
      type: address.type,
      is_default: address.is_default,
    });
  };

  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const success = await saveAddress(formAddress, editingAddressId);
    if (success) {
      setShowAddressForm(false);
      const addressesData = await fetchUserAddresses(session.user.id);
      setAddresses(addressesData);
      toast({
        title: editingAddressId ? "Address updated" : "Address added",
        description: "Your address has been successfully saved.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const success = await deleteAddress(addressId, session.user.id);
    if (success) {
      const addressesData = await fetchUserAddresses(session.user.id);
      setAddresses(addressesData);
      toast({
        title: "Address deleted",
        description: "Address has been successfully removed.",
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const success = await setDefaultAddress(addressId, session.user.id);
    if (success) {
      const addressesData = await fetchUserAddresses(session.user.id);
      setAddresses(addressesData);
      toast({
        title: "Default address updated",
        description: "Your default address has been changed.",
      });
    }
  };

  // Content rendering logic
  const renderContent = () => {
    // Admin panel states
    if (showUserManagement) {
      return <UserManagement onBack={() => setShowUserManagement(false)} />;
    }
    if (showOrderManagement) {
      return <OrderManagement onBack={() => setShowOrderManagement(false)} />;
    }
    if (showInvoiceManagement) {
      return <InvoiceManagement onBack={() => setShowInvoiceManagement(false)} />;
    }
    if (showPaymentManagement) {
      return <PaymentManagement onBack={() => setShowPaymentManagement(false)} />;
    }
    if (showPayoutManagement) {
      return <PayoutsManagement onBack={() => setShowPayoutManagement(false)} />;
    }
    if (showInventoryManagement) {
      return <InventoryManagement onBack={() => setShowInventoryManagement(false)} />;
    }
    if (showCustomerSupport) {
      return <SupportManagement onBack={() => setShowCustomerSupport(false)} />;
    }

    // Route-based content
    const currentPath = location.pathname.split("/").pop();
    switch (currentPath) {
      case "addresses":
        return showAddressForm ? (
          <AddressForm
            formAddress={formAddress}
            editingAddressId={editingAddressId}
            onFormAddressChange={setFormAddress}
            onSubmit={handleAddressFormSubmit}
            onCancel={() => setShowAddressForm(false)}
          />
        ) : (
          <AddressList
            addresses={addresses}
            onAddNew={handleAddNewAddress}
            onEdit={handleEditAddress}
            onDelete={handleDeleteAddress}
            onSetDefault={handleSetDefaultAddress}
          />
        );
      case "orders":
        return <OrderList orders={orders} />;
      case "admin-dashboard":
        return (
          <AdminDashboard
            userInfo={userInfo}
            adminMetrics={adminMetrics}
            sellerId={sellerId}
            sellerExistsForAdmin={sellerExistsForAdmin}
            onShowUserManagement={() => setShowUserManagement(true)}
            onShowOrderManagement={() => setShowOrderManagement(true)}
            onShowInvoiceManagement={() => setShowInvoiceManagement(true)}
            onShowPaymentManagement={() => setShowPaymentManagement(true)}
            onShowInventoryManagement={() => setShowInventoryManagement(true)}
            onShowCustomerSupport={() => setShowCustomerSupport(true)}
            onShowManageProducts={() => setShowManageProducts(true)}
          />
        );
      case "analytics-dashboard":
        return <AnalyticsDashboard />;
      default:
        return isEditing ? (
          <EditProfile
            userInfo={userInfo}
            emailSubscription={emailSubscription}
            onUserInfoChange={setUserInfo}
            onEmailSubscriptionChange={handleEmailSubscriptionChange}
            onSave={handleSaveProfile}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <ViewProfile
            userInfo={userInfo}
            emailSubscription={emailSubscription}
            onEdit={() => setIsEditing(true)}
            onEmailSubscriptionChange={handleEmailSubscriptionChange}
          />
        );
    }
  };

  // Loading state
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

  // Unauthenticated screens
  if (!isLoggedIn) {
    if (showSellerCreationAfterAdmin) {
      // This would show the seller creation form - placeholder for now
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-md mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Create Seller Account</h2>
              <p className="text-muted-foreground mb-4">
                Admin account created successfully! You can now create a seller account.
              </p>
              <Button onClick={() => setShowSellerCreationAfterAdmin(false)}>
                Continue to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return view === "login" ? (
      <Login onLogin={handleLogin} onSwitchToSignup={() => setView("signup")} />
    ) : (
      <Signup 
        onSignup={handleSignup} 
        onSwitchToLogin={() => setView("login")} 
        adminExists={adminExists}
      />
    );
  }

  // Main authenticated layout
  const currentPath = location.pathname.split("/").pop();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your account information and orders
            </p>
          </div>
          <div className="flex items-center gap-3">
            {hasAdminAccess(userInfo) && currentPath !== "admin-dashboard" && (
              <Button 
                variant="outline" 
                onClick={() => navigate("/account/admin-dashboard")}
                className="flex items-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Admin Dashboard
              </Button>
            )}
            <Logout onLogout={handleLogout} />
          </div>
        </div>

        <div className="space-y-8">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Account;