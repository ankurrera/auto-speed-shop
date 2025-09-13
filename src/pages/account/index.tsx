import { useState, useEffect, useCallback } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Import types
import { 
  UserInfo, 
  EmailSubscriptionState, 
  AddressForm, 
  Order, 
  AuthView,
  AdminMetrics 
} from "./types";

// Import utilities
import { 
  hasAdminAccess, 
  fetchUserProfile, 
  fetchUserAddresses, 
  fetchUserOrders, 
  checkSellerExists,
  checkAdminExists,
  logout
} from "./utils";

// Import components
import { Login, Signup, SellerOnboarding } from "./Auth";
import { ViewProfile } from "./Profile";
import { AddressList } from "./Addresses";
import { OrderList } from "./Orders";
import { 
  UserManagement, 
  OrderManagement, 
  InvoiceManagement, 
  PaymentManagement, 
  PayoutsManagement, 
  InventoryManagement, 
  SupportManagement 
} from "./Admin";
import AnalyticsDashboard from "../AnalyticsDashboard";

const Account = () => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(true);
  const [adminExists, setAdminExists] = useState(true);
  const [showSellerCreationAfterAdmin, setShowSellerCreationAfterAdmin] = useState(false);

  // User state
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

  // Data state
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);

  // Admin modal states
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showOrderManagement, setShowOrderManagement] = useState(false);
  const [showInvoiceManagement, setShowInvoiceManagement] = useState(false);
  const [showPaymentManagement, setShowPaymentManagement] = useState(false);
  const [showPayoutManagement, setShowPayoutManagement] = useState(false);
  const [showInventoryManagement, setShowInventoryManagement] = useState(false);
  const [showCustomerSupport, setShowCustomerSupport] = useState(false);

  // Router
  const navigate = useNavigate();
  const location = useLocation();

  // Admin metrics query
  const { data: adminMetrics } = useQuery({
    queryKey: ["admin-metrics"],
    enabled: hasAdminAccess(userInfo),
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

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
          .reduce((sum: number, row: { total_amount: number }) => sum + (row.total_amount || 0), 0);
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
    setIsLoading(true);
    try {
      const { userInfo: profileData, emailSubscription: emailData } = await fetchUserProfile(userId);
      setUserInfo(profileData);
      setEmailSubscription(emailData);

      const addressData = await fetchUserAddresses(userId);
      setAddresses(addressData);

      const orderData = await fetchUserOrders(userId);
      setOrders(orderData);

      const { sellerExists, sellerId: sellerIdData } = await checkSellerExists(userId);
      setSellerId(sellerIdData);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auth listener
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setIsLoggedIn(true);
          fetchAndSetUserData(session.user.id);
        } else {
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

    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoading(false);
      }

      const adminExistsCheck = await checkAdminExists();
      setAdminExists(adminExistsCheck);
    };

    initialize();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSetUserData]);

  // Auth handlers
  const handleLoginSuccess = (userId: string) => {
    setIsLoggedIn(true);
    fetchAndSetUserData(userId);
  };

  const handleSignupSuccess = (userId: string) => {
    setIsLoggedIn(true);
    fetchAndSetUserData(userId);
  };

  const handleShowSellerCreation = () => {
    setShowSellerCreationAfterAdmin(true);
  };

  const handleSellerCreationSuccess = () => {
    setShowSellerCreationAfterAdmin(false);
    setView("login");
  };

  const handleSellerCreationSkip = () => {
    setShowSellerCreationAfterAdmin(false);
    setView("login");
  };

  const handleLogout = async () => {
    await logout();
  };

  // Determine current section by URL
  const currentPath = location.pathname.split("/").pop();

  // Render content based on current path and state
  const renderContent = () => {
    // Admin modal states take precedence
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

    // Route-based content
    switch (currentPath) {
      case "addresses":
        return (
          <AddressList 
            addresses={addresses} 
            onAddressesChange={setAddresses}
            userId={userInfo.email} // Using email as fallback, should use proper user ID
          />
        );
      case "orders":
        return <OrderList orders={orders} />;
      case "admin-dashboard":
        return renderAdminDashboard();
      case "analytics-dashboard":
        return <AnalyticsDashboard />;
      default:
        return (
          <ViewProfile
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            emailSubscription={emailSubscription}
            setEmailSubscription={setEmailSubscription}
          />
        );
    }
  };

  // Admin dashboard content
  const renderAdminDashboard = () => {
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

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-10">
            <Button onClick={() => setShowUserManagement(true)}>
              User Management
            </Button>
            <Button onClick={() => setShowOrderManagement(true)}>
              Order Management  
            </Button>
            <Button onClick={() => setShowInvoiceManagement(true)}>
              Invoice Management
            </Button>
            <Button onClick={() => setShowPaymentManagement(true)}>
              Payment Management
            </Button>
            <Button onClick={() => setShowPayoutManagement(true)}>
              Payout Management
            </Button>
            <Button onClick={() => setShowInventoryManagement(true)}>
              Inventory Management
            </Button>
            <Button onClick={() => setShowCustomerSupport(true)}>
              Customer Support
            </Button>
          </div>

          {/* Stats */}
          {adminMetrics && (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-muted/60 rounded-lg p-4">
                <h3 className="font-medium">Total Orders</h3>
                <p className="text-2xl font-bold">{adminMetrics.orders}</p>
              </div>
              <div className="bg-muted/60 rounded-lg p-4">
                <h3 className="font-medium">Active Products</h3>
                <p className="text-2xl font-bold">{adminMetrics.productsActive}</p>
              </div>
              <div className="bg-muted/60 rounded-lg p-4">
                <h3 className="font-medium">Revenue</h3>
                <p className="text-2xl font-bold">${adminMetrics.revenue.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated state
  if (!isLoggedIn) {
    if (showSellerCreationAfterAdmin) {
      return (
        <SellerOnboarding
          onSuccess={handleSellerCreationSuccess}
          onSkip={handleSellerCreationSkip}
          showSellerCreationAfterAdmin={true}
        />
      );
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            {view === "login" ? (
              <Login
                onSwitchToSignup={() => setView("signup")}
                onLoginSuccess={handleLoginSuccess}
              />
            ) : (
              <Signup
                onSwitchToLogin={() => setView("login")}
                onSignupSuccess={handleSignupSuccess}
                onShowSellerCreation={handleShowSellerCreation}
                adminExists={adminExists}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Authenticated state
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
            <Button variant="outline" onClick={handleLogout}>
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