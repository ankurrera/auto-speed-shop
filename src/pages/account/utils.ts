import { supabase } from "@/integrations/supabase/client";
import { UserInfo, EmailSubscriptionState, AddressForm, Order } from "./types";
import { EmailSubscriptionService } from "@/services/emailSubscriptionService";
import { ORDER_STATUS } from "@/types/order";

// Categories for parts
export const categories = [
  "Engine Parts", "Valvetrain", "Fuel supply system", "Air intake and exhaust systems",
  "Turbochargers / Superchargers", "Ignition system", "Engine lubrication components",
  "Engine cooling system", "Engine electrical parts", "Differential", "Axle", "AD / ADAS",
  "Telematics / Car navigation", "Entertainment / Audio", "Keys", "ECU", "Motors",
  "Interior switch", "Sensor", "Electrical parts", "Cable / Connector", "Climate control system",
  "HVAC module", "Air conditioner", "Heater", "EV climate control parts", "Climate control peripherals",
  "Instrument panel", "Display", "Airbag", "Seat", "Seat belt", "Pedal", "Interior trim",
  "Interior parts", "Lighting", "Bumper", "Window glass", "Exterior parts", "Chassis module",
  "Brake", "Sub-brake", "ABS / TCS / ESC", "Steering", "Suspension", "Tire & wheel",
  "Body panel / Frame", "Body reinforcement and protector", "Door", "Hood", "Trunk lid",
  "Sunroof", "Convertible roof", "Wiper", "Window washer", "Fuel tank", "General Parts",
];

// Helper function to transform order status for user display
export const getUserDisplayStatus = (status: string) => {
  if (status === ORDER_STATUS.INVOICE_SENT) {
    return "Invoice Received";
  }
  return status;
};

// Helper function to check if user has admin access
export const hasAdminAccess = (userInfo: UserInfo) => {
  return userInfo.is_admin && 
         (userInfo.role === "admin" || 
          (userInfo.is_seller && userInfo.role === "admin"));
};

// Fetch user addresses
export const fetchUserAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!error) return data || [];
  throw error;
};

// Fetch user orders
export const fetchUserOrders = async (userId: string): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, order_number, status, total_amount")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  
  if (data) {
    return data.map((order) => ({
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      orderNumber: order.order_number,
      status: order.status,
      total: order.total_amount,
    }));
  }
  
  return [];
};

// Fetch user profile
export const fetchUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, is_admin, is_seller, role")
    .eq("user_id", userId)
    .single();
  
  if (!error && data) {
    const userInfo: UserInfo = {
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      phone: data.phone || "",
      is_admin: data.is_admin || false,
      is_seller: data.is_seller || false,
      role: data.role || "user",
    };

    // Fetch email subscription preferences
    let emailSubscription: EmailSubscriptionState;
    try {
      const subscription = await EmailSubscriptionService.getUserSubscription(userId);
      if (subscription) {
        emailSubscription = {
          subscribed: subscription.subscribed_to_new_products,
          loading: false,
          exists: true,
        };
      } else {
        emailSubscription = {
          subscribed: false,
          loading: false,
          exists: false,
        };
      }
    } catch (subscriptionError) {
      console.error("Error fetching email subscription:", subscriptionError);
      emailSubscription = {
        subscribed: false,
        loading: false,
        exists: false,
      };
    }

    return { userInfo, emailSubscription };
  } else {
    console.error("Account: Error fetching profile or no data:", error, "User ID:", userId);
    
    // If profile doesn't exist, try to create one from auth user data
    if (error && error.code === 'PGRST116') { // No rows returned
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { error: createError } = await supabase.from("profiles").upsert(
            {
              user_id: user.id,
              first_name: user.user_metadata?.first_name || "",
              last_name: user.user_metadata?.last_name || "",
              email: user.email || "",
              phone: user.user_metadata?.phone || "",
              is_admin: false,
              is_seller: false,
            },
            { onConflict: "user_id" }
          );
          
          if (!createError) {
            // Retry fetching the profile
            return await fetchUserProfile(userId);
          } else {
            console.error("Account: Failed to create profile:", createError);
          }
        }
      } catch (createProfileError) {
        console.error("Account: Error creating profile:", createProfileError);
      }
    }
    throw error;
  }
};

// Check if seller exists
export const checkSellerExists = async (userId: string) => {
  const { count, error } = await supabase
    .from("profiles")
    .select("is_seller", { count: "exact" })
    .eq("is_seller", true);
  
  if (error) throw error;
  
  const sellerExists = (count || 0) > 0;
  let sellerId = null;
  
  if (sellerExists) {
    const { data: sellerInfoData } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .single();
    if (sellerInfoData) sellerId = sellerInfoData.id;
  }
  
  return { sellerExists, sellerId };
};

// Save profile
export const saveProfile = async (userInfo: UserInfo) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");
  
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: userInfo.firstName,
      last_name: userInfo.lastName,
      phone: userInfo.phone,
    })
    .eq("user_id", session.user.id);
  
  if (error) throw error;
};

// Handle email subscription changes
export const updateEmailSubscription = async (
  subscribed: boolean, 
  emailSubscription: EmailSubscriptionState,
  userInfo: UserInfo
) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No session");

  if (emailSubscription.exists) {
    // Update existing subscription
    await EmailSubscriptionService.updateSubscription(session.user.id, subscribed);
  } else {
    // Create new subscription
    await EmailSubscriptionService.upsertSubscription(
      session.user.id, 
      userInfo.email, 
      subscribed
    );
  }

  return {
    subscribed,
    loading: false,
    exists: true,
  };
};

// Check if admin exists
export const checkAdminExists = async () => {
  const { count } = await supabase
    .from("profiles")
    .select("is_admin", { count: "exact" })
    .eq("is_admin", true);
  return (count || 0) > 0;
};

// Address operations
export const deleteAddress = async (id: string, userId: string) => {
  await supabase.from("addresses").delete().eq("id", id);
  return await fetchUserAddresses(userId);
};

export const setDefaultAddress = async (addressId: string, userId: string) => {
  await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId);
  await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId);
  return await fetchUserAddresses(userId);
};

export const saveAddress = async (formAddress: AddressForm, userId: string, editingAddressId?: string | null) => {
  if (formAddress.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", userId);
  }

  const toSave = { ...formAddress, user_id: userId };
  if (editingAddressId) {
    await supabase
      .from("addresses")
      .update(toSave)
      .eq("id", editingAddressId);
  } else {
    await supabase.from("addresses").insert([toSave]);
  }
  
  return await fetchUserAddresses(userId);
};

// Logout function
export const logout = async () => {
  await supabase.auth.signOut();
};