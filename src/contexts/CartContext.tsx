/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the type for a single product in the cart, including details from the 'products' table
export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  name: string;
  price: number;
  image: string;
  brand: string;
}

// Define the shape of our Cart Context
interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (product: { id: string; name: string; brand: string; price: number; image: string }) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Define the provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for user authentication state changes
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      // Fix 1: Correctly unsubscribe from the auth listener
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Use a query to fetch the cart items for the current user
  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cartItems', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Fix 2: Use a specific type instead of 'any'
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          products:product_id (
            name,
            price,
            brand,
            image_urls
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return data.map((item: any) => ({
        id: item.id,
        user_id: userId,
        product_id: item.product_id,
        quantity: item.quantity,
        name: item.products.name,
        price: item.products.price,
        brand: item.products.brand,
        image: item.products.image_urls?.[0] || '/placeholder.svg',
      }));
    },
    enabled: !!userId,
  });
  
  // Use a mutation for adding or updating an item in the cart
  const addMutation = useMutation({
    mutationFn: async ({ product_id, quantity = 1 }: { product_id: string; quantity?: number }) => {
      if (!userId) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('cart_items')
        // Fix 3: Change `onConflict` to a single string
        .upsert(
          { user_id: userId, product_id, quantity },
          { onConflict: 'user_id,product_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
  });

  // Function to add a product to the cart (handles existing items)
  const addToCart = (product: { id: string; name: string; brand: string; price: number; image: string }) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    if (existingItem) {
      addMutation.mutate({ product_id: product.id, quantity: existingItem.quantity + 1 });
    } else {
      addMutation.mutate({ product_id: product.id, quantity: 1 });
    }
  };

  // Use a mutation for removing an item from the cart
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
  });

  const removeFromCart = (id: string) => {
    removeMutation.mutate(id);
  };
  
  // Use a mutation for clearing the entire cart
  const clearMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
  });

  const clearCart = () => {
    clearMutation.mutate();
  };

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use the cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};