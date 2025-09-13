/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import AnalyticsDashboard from "../AnalyticsDashboard";

// Import components
import { Login, Signup, PasswordReset, SellerOnboarding } from "./Auth";
import { ViewProfile, EditProfile, EmailSubscription, Logout } from "./Profile";
import { AddressList, AddressForm } from "./Addresses";
import { OrderList, OrderDetails } from "./Orders";
import { 
  UserManagement, 
  OrderManagement, 
  InvoiceManagement, 
  PaymentManagement, 
  PayoutsManagement, 
  InventoryManagement, 
  SupportManagement 
} from "./Admin";

// Import utilities and types
import {
  hasAdminAccess,
  fetchAndSetUserData,
  handleSaveProfile,
  handleEmailSubscriptionChange,
  handleLogout,
  handleEditAddress,
  handleDeleteAddress,
  handleSetDefaultAddress,
  handleAddressFormSubmit
} from "./utils";

const Account = () => {
  // Auth / profile state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<"login" | "signup" | "reset">("login");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const [showSellerCreationAfterAdmin, setShowSellerCreationAfterAdmin] = useState(false);

  // Admin dashboard state
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  const [showPaymentManagement, setShowPaymentManagement] = useState(false);
  const [showPayoutManagement, setShowPayoutManagement] = useState(false);
  const [showInventoryManagement, setShowInventoryManagement] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);

  // User info
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
    role: "user",
  });

  // Email subscription state
  const [emailSubscription, setEmailSubscription] = useState({
    subscribed: false,
    loading: false,
    exists: false,
  });

  // Addresses
  const [addresses, setAddresses] = useState<any[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formAddress, setFormAddress] = useState({
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

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Routing / utilities
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();

  // Admin metrics (totals)
  const { data: adminMetrics } = useQuery({
    queryKey: ["admin-metrics"],
    enabled: hasAdminAccess(userInfo),
    queryFn: async () => {
      // Get current user for admin functions
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const [{ count: orderItemsCount }, productRes, partRes, allOrdersRes] =
        await Promise.all([
          // Count from order_items table instead of orders table
          supabase.from("order_items").select("*", { count: "exact", head: true }),
          supabase.from("products").select("id, price, stock_quantity, is_active"),
          supabase.from("parts").select("id, price, stock_quantity, is_active"),
          // Use admin function to get all orders for revenue calculation
          supabase.rpc('get_all_orders_for_admin', {
            requesting_user_id: user.id
          })
        ]);

      let revenue = 0;
      if (allOrdersRes.data) {
        // Only include confirmed orders in revenue calculation
        revenue = allOrdersRes.data
          .filter((row: { status: string }) => row.status === 'confirmed')
          .reduce(
            (sum: number, row: { total_amount: number }) => sum + (row.total_amount || 0),
            0
          );
      }

      return {
        orders: orderItemsCount ?? 0, // Now showing count from order_items table
        productsActive: [
          ...(productRes.data || []),
          ...(partRes.data || []),
        ].filter((p: any) => p.is_active).length,
        revenue,
      };
    },
  });

  // Check if user is logged in on component mount
  useEffect(() => {
    const checkAdminExists = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("is_admin", { count: "exact" })
        .eq("is_admin", true);
      setAdminExists((count || 0) > 0);
    };

    const initial = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        await fetchAndSetUserData(
          session.user.id,
          setIsLoading,
          setUserInfo,
          (exists: boolean) => {/* setSellerExistsForAdmin not needed here */},
          setEmailSubscription,
          setAddresses,
          setOrders,
          setSellerId
        );
      } else {
        setIsLoading(false);
        checkAdminExists();
      }
    };

    initial();
  }, []);

  const handleLoginSuccess = async (userId: string) => {
    setIsLoggedIn(true);
    await fetchAndSetUserData(
      userId,
      setIsLoading,
      setUserInfo,
      (exists: boolean) => {/* setSellerExistsForAdmin not needed here */},
      setEmailSubscription,
      setAddresses,
      setOrders,
      setSellerId
    );
  };

  const handleAdminCreated = () => {
    setAdminExists(true);
    setShowSellerCreationAfterAdmin(true);
  };

  const handleSellerOnboardingComplete = () => {
    setShowSellerCreationAfterAdmin(false);
    setView("login");
    alert("Seller account created! Please log in with your admin credentials to access the admin dashboard.");
  };

  const handleSellerOnboardingSkip = () => {
    setShowSellerCreationAfterAdmin(false);
    setView("login");
  };

  // Profile handlers
  const handleProfileSave = async () => {
    await handleSaveProfile(userInfo, setIsEditing);
  };

  const handleEmailSubscriptionUpdate = async (subscribed: boolean) => {
    await handleEmailSubscriptionChange(subscribed, emailSubscription, userInfo, setEmailSubscription);
  };

  // Address handlers
  const handleAddressEdit = (address: any) => {
    handleEditAddress(address, setEditingAddressId, setFormAddress, setShowAddressForm);
  };

  const handleAddressDelete = async (id: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await handleDeleteAddress(id, () => {}, session.user.id);
      // Refetch addresses
      await fetchAndSetUserData(
        session.user.id,
        setIsLoading,
        setUserInfo,
        (exists: boolean) => {/* setSellerExistsForAdmin not needed here */},
        setEmailSubscription,
        setAddresses,
        setOrders,
        setSellerId
      );
    }
  };

  const handleAddressSetDefault = async (id: string) => {
    await handleSetDefaultAddress(id, () => {});
    // Refetch addresses
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await fetchAndSetUserData(
        session.user.id,
        setIsLoading,
        setUserInfo,
        (exists: boolean) => {/* setSellerExistsForAdmin not needed here */},
        setEmailSubscription,
        setAddresses,
        setOrders,
        setSellerId
      );
    }
  };

  const handleAddressFormSubmitWrapper = async (e: any) => {
    await handleAddressFormSubmit(
      e,
      formAddress,
      editingAddressId,
      setShowAddressForm,
      setEditingAddressId,
      setFormAddress,
      () => {} // fetchUserAddresses will be called after
    );
    
    // Refetch addresses
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      await fetchAndSetUserData(
        session.user.id,
        setIsLoading,
        setUserInfo,
        (exists: boolean) => {/* setSellerExistsForAdmin not needed here */},
        setEmailSubscription,
        setAddresses,
        setOrders,
        setSellerId
      );
    }
  };

  const handleLogoutClick = async () => {
    await handleLogout(setIsLoggedIn, navigate);
  };

  // Unauthenticated screens
  if (!isLoggedIn) {
    if (showSellerCreationAfterAdmin) {
      return (
        <SellerOnboarding 
          onComplete={handleSellerOnboardingComplete}
          onSkip={handleSellerOnboardingSkip}
        />
      );
    }

    if (view === "signup") {
      return (
        <Signup
          onSwitchToLogin={() => setView("login")}
          adminExists={adminExists}
          onAdminCreated={handleAdminCreated}
        />
      );
    }

    if (view === "reset") {
      return (
        <PasswordReset onSwitchToLogin={() => setView("login")} />
      );
    }

    return (
      <Login
        onSwitchToSignup={() => setView("signup")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

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

  // Determine section by URL (still preserve old routes)
  const currentPath = location.pathname.split("/").pop();

  const renderContent = () => {
    // Admin management views
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
    if (showUserManagement) {
      return <UserManagement onBack={() => setShowUserManagement(false)} />;
    }

    // URL-based routing
    switch (currentPath) {
      case "addresses":
        return showAddressForm ? (
          <AddressForm
            formAddress={formAddress}
            editingAddressId={editingAddressId}
            onFormAddressChange={setFormAddress}
            onSubmit={handleAddressFormSubmitWrapper}
            onCancel={() => setShowAddressForm(false)}
          />
        ) : (
          <AddressList
            addresses={addresses}
            onAddNew={() => {
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
            }}
            onEdit={handleAddressEdit}
            onDelete={handleAddressDelete}
            onSetDefault={handleAddressSetDefault}
          />
        );
      case "orders":
        return <OrderList orders={orders} />;
      case "admin-dashboard":
        return renderAdminDashboardContent();
      case "analytics-dashboard":
        return <AnalyticsDashboard />;
      default:
        return renderProfileContent();
    }
  };

  const renderProfileContent = () => {
    if (isEditing) {
      return (
        <div className="space-y-6">
          <EditProfile
            userInfo={userInfo}
            onUserInfoChange={setUserInfo}
            onSave={handleProfileSave}
            onCancel={() => setIsEditing(false)}
          />
          <EmailSubscription
            emailSubscription={emailSubscription}
            onSubscriptionChange={handleEmailSubscriptionUpdate}
          />
          <Logout onLogout={handleLogoutClick} />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <ViewProfile
          userInfo={userInfo}
          onEdit={() => setIsEditing(true)}
        />
        <EmailSubscription
          emailSubscription={emailSubscription}
          onSubscriptionChange={handleEmailSubscriptionUpdate}
        />
        <Logout onLogout={handleLogoutClick} />
      </div>
    );
  };

  // Admin Dashboard - simplified for now, keeping existing admin components
  const renderAdminDashboardContent = () => {
    return (
      <div className="space-y-10">
        <div className="bg-card text-card-foreground rounded-xl border border-border p-6 lg:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-primary" />
                Admin Dashboard
              </h2>
              <p className="text-sm text-muted-foreground">
                Welcome, {userInfo.firstName || "Administrator"} - Administrative controls and overview
              </p>
            </div>
          </div>

          {/* Quick Actions - simplified to avoid complex state management */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                onClick={() => setShowUserManagement(true)}
                className="p-4 h-auto flex flex-col items-start"
              >
                <div className="font-medium">Manage Users</div>
                <div className="text-xs text-muted-foreground">View and edit user accounts</div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowOrderManagement(true)}
                className="p-4 h-auto flex flex-col items-start"
              >
                <div className="font-medium">Manage Orders</div>
                <div className="text-xs text-muted-foreground">Process and track orders</div>
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCustomerSupport(true)}
                className="p-4 h-auto flex flex-col items-start"
              >
                <div className="font-medium">Customer Support</div>
                <div className="text-xs text-muted-foreground">Handle customer inquiries</div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            <Button variant="outline" onClick={handleLogoutClick}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="space-y-8">{renderContent()}</div>
      </div>
    </div>
  );
};

export default Account;