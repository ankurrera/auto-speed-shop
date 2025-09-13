import { supabase } from "@/integrations/supabase/client";
import { UserInfo, AddressForm } from "./types";

// Helper function to check if user has admin access
export const hasAdminAccess = (userInfo: UserInfo) => {
  return userInfo.is_admin && 
         (userInfo.role === "admin" || 
          (userInfo.is_seller && userInfo.role === "admin"));
};

// Fetch user profile
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, is_admin, is_seller, role")
    .eq("user_id", userId)
    .single();
  
  if (!error && data) {
    return {
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      phone: data.phone || "",
      is_admin: data.is_admin || false,
      is_seller: data.is_seller || false,
      role: data.role || "user",
    };
  }
  return null;
};

// Fetch user addresses
export const fetchUserAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (!error) {
    return data || [];
  }
  return [];
};

// Fetch user orders
export const fetchUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, order_number, status, total_amount")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
    
  if (!error && data) {
    return data.map((order) => ({
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      orderNumber: order.order_number,
      status: order.status || "Pending",
      total: order.total_amount,
    }));
  }
  return [];
};

// Save user profile
export const saveUserProfile = async (userInfo: UserInfo) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: userInfo.firstName,
      last_name: userInfo.lastName,
      phone: userInfo.phone,
    })
    .eq("user_id", session.user.id);
    
  return !error;
};

// Save or update address
export const saveAddress = async (formAddress: AddressForm, editingAddressId?: string | null) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  if (formAddress.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", session.user.id);
  }

  const addressData = {
    ...formAddress,
    user_id: session.user.id,
  };

  if (editingAddressId) {
    const { error } = await supabase
      .from("addresses")
      .update(addressData)
      .eq("id", editingAddressId);
    return !error;
  } else {
    const { error } = await supabase
      .from("addresses")
      .insert(addressData);
    return !error;
  }
};

// Delete address
export const deleteAddress = async (addressId: string, userId: string) => {
  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId);
  
  return !error;
};

// Set default address
export const setDefaultAddress = async (addressId: string, userId: string) => {
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId);
    
  return !error;
};

// Authentication helpers
export const handleLogin = async (email: string, password: string, loginMode: "user" | "admin") => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
};

export const handleSignup = async (email: string, password: string, firstName: string, lastName: string, phone: string) => {
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
  
  if (error) throw error;
  return data;
};

export const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Product/Part helpers
export const toggleProductFeature = async (productId: string, isFeature: boolean, userInfo: UserInfo) => {
  if (!hasAdminAccess(userInfo)) {
    throw new Error("Only administrators can feature/unfeature products.");
  }
  
  const { data, error } = await supabase
    .from("products")
    .update({ is_featured: isFeature })
    .eq("id", productId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const togglePartFeature = async (partId: string, isFeature: boolean, userInfo: UserInfo) => {
  if (!hasAdminAccess(userInfo)) {
    throw new Error("Only administrators can feature/unfeature parts.");
  }
  
  const { data, error } = await supabase
    .from("parts")
    .update({ is_featured: isFeature })
    .eq("id", partId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

// Check if seller exists for user
export const checkSellerExists = async (userId: string) => {
  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .single();
  
  return !error && data;
};