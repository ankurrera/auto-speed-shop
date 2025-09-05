// Custom hook for order management logic
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Order } from "@/types/account";

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchUserOrders = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, order_number, status, total_amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error.message);
    } else {
      setOrders(data.map(order => ({
        id: order.id,
        date: new Date(order.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }),
        orderNumber: order.order_number,
        status: order.status,
        total: order.total_amount
      })));
    }
  }, []);

  return {
    orders,
    setOrders,
    fetchUserOrders,
  };
};