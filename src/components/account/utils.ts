import { supabase } from "@/integrations/supabase/client";

export type PartSpecifications = {
  category?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  additional?: string;
  [key: string]: unknown;
};

export const fetchUserAddresses = async (userId: string, setAddresses: any) => {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!error) setAddresses(data);
};

export const fetchUserOrders = async (userId: string, setOrders: any) => {
  const { data, error } = await supabase
    .from("orders")
    .select("id, created_at, order_number, status, total_amount")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!error) {
    setOrders(data.map(order => ({
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
      orderNumber: order.order_number,
      status: order.status,
      total: order.total_amount
    })));
  }
};

export const fetchUserProfile = async (
  userId: string, setUserInfo: any, setAdminExists: any
) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, phone, is_admin, is_seller")
    .eq("user_id", userId)
    .single();

  if (!error && data) {
    setUserInfo({
      firstName: data.first_name || "",
      lastName: data.last_name || "",
      email: data.email || "",
      phone: data.phone || "",
      is_admin: data.is_admin || false,
      is_seller: data.is_seller || false,
    });
    setAdminExists(data.is_admin || false);
  }
};

export const checkSellerExists = async (userId: string) => {
  // implement as needed
};