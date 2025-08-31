import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Define the CartItem type to include a quantity
interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          quantity,
          products (
            id,
            name,
            brand,
            price,
            image_urls
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = data.map((cartItem: any) => ({
          id: cartItem.products.id,
          name: cartItem.products.name,
          brand: cartItem.products.brand,
          price: cartItem.products.price,
          image: cartItem.products.image_urls[0],
          quantity: cartItem.quantity,
        }));
        setCartItems(items);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to add to cart.", variant: "destructive" });
      return;
    }

    try {
      const existingItem = cartItems.find((cartItem) => cartItem.id === item.id);
      
      let upsertData;
      if (existingItem) {
        upsertData = {
          user_id: user.id,
          product_id: item.id,
          quantity: existingItem.quantity + quantity
        };
      } else {
        upsertData = {
          user_id: user.id,
          product_id: item.id,
          quantity: quantity
        };
      }

      const { error } = await supabase.from('cart_items').upsert(upsertData, { onConflict: 'user_id, product_id' });
      
      if (error) {
        throw error;
      }
      
      fetchCartItems(); // Re-fetch cart data to update the state
      toast({ title: "Success", description: `${item.name} added to cart.` });

    } catch (err) {
      console.error('Error adding to cart:', err.message, err.code, err.details);
      toast({ title: "Error", description: "Failed to add item to cart.", variant: "destructive" });
    }
  };

  const removeFromCart = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id).eq('product_id', id);

      if (error) {
        throw error;
      }
      
      fetchCartItems();
      toast({ title: "Success", description: "Item removed from cart." });

    } catch (err) {
      console.error('Error removing from cart:', err);
      toast({ title: "Error", description: "Failed to remove item from cart.", variant: "destructive" });
    }
  };

  const increaseQuantity = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existingItem = cartItems.find((cartItem) => cartItem.id === id);
    if (!existingItem) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + 1 })
        .eq('user_id', user.id)
        .eq('product_id', id);
      
      if (error) {
        throw error;
      }
      
      fetchCartItems();
    } catch (err) {
      console.error('Error increasing quantity:', err);
    }
  };

  const decreaseQuantity = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existingItem = cartItems.find((cartItem) => cartItem.id === id);
    if (!existingItem || existingItem.quantity <= 1) {
      removeFromCart(id);
      return;
    }

    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity - 1 })
        .eq('user_id', user.id)
        .eq('product_id', id);
      
      if (error) {
        throw error;
      }
      
      fetchCartItems();
    } catch (err) {
      console.error('Error decreasing quantity:', err);
    }
  };

  const clearCart = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase.from('cart_items').delete().eq('user_id', user.id);

      if (error) {
        throw error;
      }
      
      fetchCartItems();
      toast({ title: "Success", description: "Your cart has been cleared." });

    } catch (err) {
      console.error('Error clearing cart:', err);
      toast({ title: "Error", description: "Failed to clear cart.", variant: "destructive" });
    }
  };
  
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};