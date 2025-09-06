import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import type { User as SupabaseUser } from '@supabase/supabase-js';

export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
      setIsLoading(false);
    });

    const checkInitialAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
      }
      setIsLoading(false);
    };

    checkInitialAuth();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string, loginMode: string) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({ 
        title: "Login failed", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", data.user.id)
      .single();

    if (profileError) {
      toast({ 
        title: "Login failed", 
        description: "Could not retrieve profile information.", 
        variant: "destructive" 
      });
      await supabase.auth.signOut();
      return false;
    }

    if (profileData?.is_admin && loginMode === "admin") {
      return true;
    } else if (!profileData?.is_admin && loginMode === "user") {
      return true;
    } else {
      toast({ 
        title: "Invalid login mode", 
        description: "Please select the correct login type.", 
        variant: "destructive" 
      });
      await supabase.auth.signOut();
      return false;
    }
  }, [toast]);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string, phone: string, loginMode: string) => {
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
      toast({ 
        title: "Signup failed", 
        description: error.message, 
        variant: "destructive" 
      });
      return false;
    }

    if (loginMode === "admin") {
      await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('user_id', data.user.id);
      
      toast({ 
        title: "Admin account created", 
        description: "Please log in to your account page." 
      });
    } else {
      toast({ 
        title: "Account created", 
        description: "Please check your email to confirm your account!" 
      });
    }
    return true;
  }, [toast]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    navigate("/");
  }, [navigate]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      toast({ 
        title: "Error", 
        description: "Error sending password reset email: " + error.message, 
        variant: "destructive" 
      });
      return false;
    }
    
    toast({ 
      title: "Password reset email sent", 
      description: "Please check your inbox!" 
    });
    return true;
  }, [toast]);

  return {
    isLoggedIn,
    isLoading,
    user,
    login,
    signup,
    logout,
    resetPassword,
  };
};