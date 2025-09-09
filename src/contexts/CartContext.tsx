import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Define the CartItem type to handle both parts and products
interface CartItem {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  price: number;
  image: string;
  quantity: number;
  is_part: boolean;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeFromCart: (id: string, isPart: boolean) => void;
  increaseQuantity: (id: string, isPart: boolean) => void;
  decreaseQuantity: (id: string, isPart: boolean) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Corrected Supabase row types
type ProductCartRow = {
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_urls: string[];
    category: string;
  };
};

type PartCartRow = {
  quantity: number;
  parts: {
    id: string;
    name: string;
    price: number;
    image_urls: string[];
    brand: string;
  };
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Use a listener to update the userId whenever auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCartItems = useCallback(async (currentUserId: string | null) => {
    if (!currentUserId) {
      console.log("User not authenticated, not fetching cart.");
      setCartItems([]);
      return;
    }

    try {
      const [productsResponse, partsResponse] = await Promise.all([
        supabase
          .from("cart_items")
          .select(
            `
            quantity,
            products (
              id,
              name,
              price,
              image_urls,
              category
            )
          `
          )
          .eq("user_id", currentUserId)
          .not("product_id", "is", null),
        supabase
          .from("cart_items")
          .select(
            `
            quantity,
            parts (
              id,
              name,
              price,
              image_urls,
              brand
            )
          `
          )
          .eq("user_id", currentUserId)
          .not("part_id", "is", null),
      ]);

      const productsData = productsResponse.data as unknown as ProductCartRow[] | null;
      const partsData = partsResponse.data as unknown as PartCartRow[] | null;

      if (productsResponse.error) throw productsResponse.error;
      if (partsResponse.error) throw partsResponse.error;

      const productsItems: CartItem[] = (productsData || []).map((item) => ({
        id: item.products.id,
        name: item.products.name,
        price: item.products.price,
        image: item.products.image_urls[0],
        quantity: item.quantity,
        is_part: false,
        category: item.products.category,
      }));

      const partsItems: CartItem[] = (partsData || []).map((item) => ({
        id: item.parts.id,
        name: item.parts.name,
        price: item.parts.price,
        image: item.parts.image_urls[0],
        quantity: item.quantity,
        is_part: true,
        brand: item.parts.brand,
      }));

      setCartItems([...productsItems, ...partsItems]);
    } catch (err) {
      console.error("Error fetching cart:", err);
    }
  }, []);

  useEffect(() => {
    fetchCartItems(userId);
  }, [userId, fetchCartItems]);

  const addToCart = async (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    // In development mode, allow adding items without authentication
    if (!userId && !import.meta.env.DEV) {
      toast({
        title: "Error",
        description: "You must be logged in to add to cart.",
        variant: "destructive",
      });
      return;
    }

    // Development mode: add items to local state without database
    if (import.meta.env.DEV && !userId) {
      const existingItemIndex = cartItems.findIndex((cartItem) => cartItem.id === item.id && cartItem.is_part === item.is_part);
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...cartItems];
        updatedItems[existingItemIndex].quantity += quantity;
        setCartItems(updatedItems);
      } else {
        const newItem: CartItem = { ...item, quantity };
        setCartItems([...cartItems, newItem]);
      }
      
      toast({ title: "Success", description: `${item.name} added to cart (dev mode).` });
      return;
    }

    try {
      const existingItem = cartItems.find((cartItem) => cartItem.id === item.id && cartItem.is_part === item.is_part);

      let upsertData;
      const onConflictColumns = item.is_part ? "user_id, part_id" : "user_id, product_id";
      if (item.is_part) {
        upsertData = {
          user_id: userId,
          part_id: item.id,
          product_id: null,
          quantity: existingItem ? existingItem.quantity + quantity : quantity,
        };
      } else {
        upsertData = {
          user_id: userId,
          product_id: item.id,
          part_id: null,
          quantity: existingItem ? existingItem.quantity + quantity : quantity,
        };
      }

      const { error } = await supabase.from("cart_items").upsert(upsertData, {
        onConflict: onConflictColumns,
      });

      if (error) throw error;

      fetchCartItems(userId);
      toast({ title: "Success", description: `${item.name} added to cart.` });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Error adding to cart:", err.message, err.code, err.details);
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (id: string, isPart: boolean) => {
    if (!userId) return;

    try {
      const column = isPart ? "part_id" : "product_id";
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId)
        .eq(column, id);

      if (error) throw error;

      fetchCartItems(userId);
      toast({ title: "Success", description: "Item removed from cart." });
    } catch (err) {
      console.error("Error removing from cart:", err);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const increaseQuantity = async (id: string, isPart: boolean) => {
    if (!userId) return;

    const existingItem = cartItems.find((cartItem) => cartItem.id === id);
    if (!existingItem) return;

    try {
      const column = isPart ? "part_id" : "product_id";
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("user_id", userId)
        .eq(column, id);

      if (error) throw error;

      fetchCartItems(userId);
    } catch (err) {
      console.error("Error increasing quantity:", err);
    }
  };

  const decreaseQuantity = async (id: string, isPart: boolean) => {
    if (!userId) return;

    const existingItem = cartItems.find((cartItem) => cartItem.id === id);
    if (!existingItem || existingItem.quantity <= 1) {
      removeFromCart(id, isPart);
      return;
    }

    try {
      const column = isPart ? "part_id" : "product_id";
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity - 1 })
        .eq("user_id", userId)
        .eq(column, id);

      if (error) throw error;

      fetchCartItems(userId);
    } catch (err) {
      console.error("Error decreasing quantity:", err);
    }
  };

  const clearCart = async () => {
    // In development mode, clear local state
    if (import.meta.env.DEV && !userId) {
      setCartItems([]);
      toast({ title: "Success", description: "Your cart has been cleared (dev mode)." });
      return;
    }

    if (!userId) return;

    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
      if (error) throw error;

      fetchCartItems(userId);
      toast({ title: "Success", description: "Your cart has been cleared." });
    } catch (err) {
      console.error("Error clearing cart:", err);
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};