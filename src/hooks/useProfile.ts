// Custom hook for profile management logic
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserInfo } from "@/types/account";

export const useProfile = () => {
  const [isEditing, setIsEditing] = useState(false);

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserInfo | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, last_name, email, phone, is_admin, is_seller")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error.message);
      return null;
    } else if (data) {
      return {
        firstName: data.first_name || "",
        lastName: data.last_name || "",
        email: data.email || "",
        phone: data.phone || "",
        is_admin: data.is_admin || false,
        is_seller: data.is_seller || false,
      };
    }
    return null;
  }, []);

  const handleSaveProfile = async (userInfo: UserInfo) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session found.");
      return false;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
        phone: userInfo.phone,
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error updating profile:", error.message);
      alert("Failed to update profile.");
      return false;
    } else {
      console.log("Profile updated successfully!");
      setIsEditing(false);
      return true;
    }
  };

  return {
    isEditing,
    setIsEditing,
    fetchUserProfile,
    handleSaveProfile,
  };
};