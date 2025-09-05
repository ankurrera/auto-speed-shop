// src/pages/Account.tsx
import { useState, useEffect, useCallback } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import PasswordResetForm from "@/components/PasswordResetForm";
import AnalyticsDashboard from "./AnalyticsDashboard";
import {
  AuthenticationForm,
  ProfileContent,
  AddressesContent,
  OrdersContent,
  AdminDashboardContent,
  UserInfo
} from "@/components/account";

const Account = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState("login");
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  const navigate = useNavigate();
  const location = useLocation();

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, is_admin, is_seller")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("Error fetching profile:", error.message);
    } else {
      setUserInfo({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        is_admin: data.is_admin || false,
        is_seller: data.is_seller || false,
      });
    }
  }, []);

  const fetchAndSetUserData = useCallback(async (userId: string) => {
    setUserId(userId);
    await fetchUserProfile(userId);
    setIsLoading(false);
  }, [fetchUserProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false, is_seller: false });
    navigate("/");
  };

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView("reset");
      }
      if (session) {
        setIsLoggedIn(true);
        fetchAndSetUserData(session.user.id);
      } else {
        setIsLoggedIn(false);
        setUserInfo({ firstName: "", lastName: "", email: "", phone: "", is_admin: false, is_seller: false });
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

  // Password reset view
  if (view === "reset") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <PasswordResetForm />
          </div>
        </div>
      </div>
    );
  }

  // Authentication view
  if (!isLoggedIn) {
    return <AuthenticationForm onLoginSuccess={fetchAndSetUserData} />;
  }

  // Loading view
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-gray-200 rounded-md animate-pulse"></div>
              <div className="h-5 w-80 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
            <div className="h-10 w-24 bg-gray-200 rounded-md animate-pulse"></div>
          </div>
          <div className="h-12 w-full bg-gray-200 rounded-md animate-pulse mb-8"></div>
          <div className="h-[200px] w-full bg-gray-200 rounded-md animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Determine which view to render based on the URL path
  const currentPath = location.pathname.split('/').pop();

  const renderContent = () => {
    switch (currentPath) {
      case 'addresses':
        return <AddressesContent userId={userId} />;
      case 'orders':
        return <OrdersContent userId={userId} />;
      case 'admin-dashboard':
        return <AdminDashboardContent userInfo={userInfo} />;
      case 'analytics-dashboard':
        return <AnalyticsDashboard />;
      default:
        return <ProfileContent userInfo={userInfo} setUserInfo={setUserInfo} />;
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