import { useState, useEffect, useCallback, FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import ProfileSection from "@/components/account/ProfileSection";
import AddressesSection from "@/components/account/AddressesSection";
import OrdersSection from "@/components/account/OrdersSection";
import AdminDashboardSection from "@/components/account/AdminDashboardSection";
import AnalyticsDashboard from "./AnalyticsDashboard";
import {
  fetchUserAddresses,
  fetchUserOrders,
  fetchUserProfile,
  checkSellerExists,
} from "@/components/account/utils";

// Add any type imports as needed

const Account = () => {
  // ---- State ----
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMode, setLoginMode] = useState("user");
  const [adminExists, setAdminExists] = useState(true);
  const [userInfo, setUserInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
  });
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
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
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // ---- Fetch and Session logic ----
  const fetchAndSetUserData = useCallback(async (userId) => {
    setIsLoading(true);
    await fetchUserProfile(userId, setUserInfo, setAdminExists);
    await fetchUserAddresses(userId, setAddresses);
    await fetchUserOrders(userId, setOrders);
    await checkSellerExists(userId);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setView("reset");
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false, is_seller: false });
        setAddresses([]);
        setOrders([]);
        setIsLoading(false);
      }
    });

    const initialCheck = async () => {
      const { data: { session } = {} } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoading(false);
      }
    };
    initialCheck();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSetUserData]);

  // ---- Auth Handlers (simplified for brevity, can be expanded as needed) ----
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false, is_seller: false });
    navigate("/");
  };

  // ---- Render logic ----
  if (!isLoggedIn) {
    // You can extract login/signup to a separate component if desired
    return <div>Login or Signup forms here...</div>;
  }
  if (isLoading) {
    return <div>Loading...</div>;
  }
  const currentPath = location.pathname.split('/').pop();
  const renderContent = () => {
    switch (currentPath) {
      case 'addresses':
        return (
          <AddressesSection
            addresses={addresses}
            showAddressForm={showAddressForm}
            setShowAddressForm={setShowAddressForm}
            editingAddressId={editingAddressId}
            setEditingAddressId={setEditingAddressId}
            formAddress={formAddress}
            setFormAddress={setFormAddress}
            setAddresses={setAddresses}
            toast={toast}
            supabase={supabase}
          />
        );
      case 'orders':
        return <OrdersSection orders={orders} />;
      case 'admin-dashboard':
        return (
          <AdminDashboardSection
            userInfo={userInfo}
            queryClient={queryClient}
            toast={toast}
            supabase={supabase}
          />
        );
      case 'analytics-dashboard':
        return <AnalyticsDashboard />;
      default:
        return (
          <ProfileSection
            userInfo={userInfo}
            setUserInfo={setUserInfo}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleSaveProfile={async () => {
              // Implement your save profile logic, or pass as prop
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground">
              Manage your account information and orders
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        <div className="space-y-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Account;