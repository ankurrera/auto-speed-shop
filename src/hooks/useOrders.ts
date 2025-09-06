import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Order {
  id: string;
  date: string;
  orderNumber: string;
  status: string;
  total: number;
}

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  const fetchOrders = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, created_at, order_number, status, total_amount")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error.message);
      toast({ 
        title: "Error", 
        description: "Failed to load orders", 
        variant: "destructive" 
      });
    } else {
      const formattedOrders = data.map(order => ({
        id: order.id,
        date: new Date(order.created_at).toLocaleDateString("en-US", { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        orderNumber: order.order_number,
        status: order.status,
        total: order.total_amount
      }));
      setOrders(formattedOrders);
    }
  }, [toast]);

  return {
    orders,
    fetchOrders,
  };
};