import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  is_admin: boolean;
  is_seller: boolean;
}

export const useProfile = () => {
  const [userInfo, setUserInfo] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    is_admin: false,
    is_seller: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, is_admin, is_seller")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      toast({ 
        title: "Error", 
        description: "Failed to load profile", 
        variant: "destructive" 
      });
    } else if (data) {
      setUserInfo({
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        is_admin: data.is_admin || false,
        is_seller: data.is_seller || false,
      });
    }
  }, [toast]);

  const updateProfile = useCallback(async (userId: string, updates: Partial<UserProfile>) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Error updating profile:", error.message);
      toast({ 
        title: "Error", 
        description: "Failed to update profile", 
        variant: "destructive" 
      });
      return false;
    }

    setUserInfo(prev => ({ ...prev, ...updates }));
    setIsEditing(false);
    toast({ 
      title: "Success", 
      description: "Profile updated successfully" 
    });
    return true;
  }, [toast]);

  return {
    userInfo,
    setUserInfo,
    isEditing,
    setIsEditing,
    fetchUserProfile,
    updateProfile,
  };
};