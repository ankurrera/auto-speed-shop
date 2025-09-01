// src/contexts/CartContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Define the CartItem type to handle both parts and products
interface CartItem {
  id: string;
  name: string;
  brand?: string; // Optional for products
  category?: string; // Optional for parts
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

// --- Supabase row types ---
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

  const fetchCartItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("User not authenticated, not fetching cart.");
      setCartItems([]);
      return;
    }

    try {
      // Fetch cart items for products
      const { data: productsData, error: productsError } = (await supabase
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
        .eq("user_id", user.id)
        .not("product_id", "is", null)) as unknown as {
        data: ProductCartRow[];
        error: any;
      };

      if (productsError) throw productsError;

      // Fetch cart items for parts
      const { data: partsData, error: partsError } = (await supabase
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
        .eq("user_id", user.id)
        .not("part_id", "is", null)) as unknown as {
        data: PartCartRow[];
        error: any;
      };

      if (partsError) throw partsError;

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
    fetchCartItems();
  }, [fetchCartItems]);

  const addToCart = async (item: Omit<CartItem, "quantity">, quantity: number = 1) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add to cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);

      let upsertData;
      if (item.is_part) {
        upsertData = {
          user_id: user.id,
          part_id: item.id,
          quantity: existingItem ? existingItem.quantity + quantity : quantity,
        };
      } else {
        upsertData = {
          user_id: user.id,
          product_id: item.id,
          quantity: existingItem ? existingItem.quantity + quantity : quantity,
        };
      }

      const { error } = await supabase.from("cart_items").upsert(upsertData, {
        onConflict: `user_id, ${item.is_part ? "part_id" : "product_id"}`,
      });

      if (error) throw error;

      fetchCartItems();
      toast({ title: "Success", description: `${item.name} added to cart.` });
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const column = isPart ? "part_id" : "product_id";
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq(column, id);

      if (error) throw error;

      fetchCartItems();
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existingItem = cartItems.find((cartItem) => cartItem.id === id);
    if (!existingItem) return;

    try {
      const column = isPart ? "part_id" : "product_id";
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: existingItem.quantity + 1 })
        .eq("user_id", user.id)
        .eq(column, id);

      if (error) throw error;

      fetchCartItems();
    } catch (err) {
      console.error("Error increasing quantity:", err);
    }
  };

  const decreaseQuantity = async (id: string, isPart: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
        .eq("user_id", user.id)
        .eq(column, id);

      if (error) throw error;

      fetchCartItems();
    } catch (err) {
      console.error("Error decreasing quantity:", err);
    }
  };

  const clearCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id);
      if (error) throw error;

      fetchCartItems();
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

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};