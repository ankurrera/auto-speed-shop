// Custom hook for authentication logic
import { useState, useCallback, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { UserInfo, LoginMode, ViewType } from "@/types/account";
import { defaultUserInfo } from "@/constants/account";

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState<ViewType>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMode, setLoginMode] = useState<LoginMode>("user");
  const [adminExists, setAdminExists] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo>(defaultUserInfo);
  const [sellerExistsForAdmin, setSellerExistsForAdmin] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent, fetchAndSetUserData: (userId: string) => Promise<void>) => {
    e.preventDefault();

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      alert("Login failed: " + error.message);
    } else {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", data.user.id)
        .single();

      const { data: sellerData, error: sellerError } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        alert("Login failed: Could not retrieve profile information.");
        await supabase.auth.signOut();
      } else if (profileData?.is_admin && loginMode === "admin") {
        if (sellerData) {
          navigate("/");
        } else {
          setIsLoggedIn(true);
          fetchAndSetUserData(data.user.id);
        }
      } else if (!profileData?.is_admin && loginMode === "user") {
        setIsLoggedIn(true);
        fetchAndSetUserData(data.user.id);
      } else {
        alert("Invalid login mode selected.");
        await supabase.auth.signOut();
      }
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (loginMode === "admin" && adminExists) {
      alert("Admin account has already been created. Please log in.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      alert("Signup failed: " + error.message);
    } else {
      console.log('Signup successful, user:', data.user);

      if (loginMode === "admin") {
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('user_id', data.user.id);
        setAdminExists(true);
        alert("Admin account created. Please log in to your account page.");
      } else {
        alert("Please check your email to confirm your account!");
      }
      setView("login");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserInfo(defaultUserInfo);
    setSellerExistsForAdmin(false);
    navigate("/");
  };

  const checkAdminExists = useCallback(async () => {
    const { data, count } = await supabase
      .from('profiles')
      .select('is_admin', { count: 'exact' })
      .eq('is_admin', true);
    if (count > 0) {
      setAdminExists(true);
    } else {
      setAdminExists(false);
    }
  }, []);

  const resetPasswordForEmail = async (emailInput: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      alert("Error sending password reset email: " + error.message);
    } else {
      alert("Password reset email sent. Please check your inbox!");
    }
  };

  return {
    // State
    isLoggedIn,
    setIsLoggedIn,
    view,
    setView,
    showPassword,
    setShowPassword,
    email,
    setEmail,
    password,
    setPassword,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    loginMode,
    setLoginMode,
    adminExists,
    setAdminExists,
    userInfo,
    setUserInfo,
    sellerExistsForAdmin,
    setSellerExistsForAdmin,
    
    // Actions
    handleLogin,
    handleSignup,
    handleLogout,
    checkAdminExists,
    resetPasswordForEmail,
  };
};