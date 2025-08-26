/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the type for the raw data returned from the Supabase query
interface SupabaseCartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    brand: string;
    image_urls: string[] | null;
  };
}

// Define the type for a single product in the cart, as used by the UI
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

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['cartItems', userId],
    queryFn: async () => {
      if (!userId) return [];
      
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

      // Fix 2: Use a specific type for the map function's item
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
  
  const addMutation = useMutation({
    mutationFn: async ({ product_id, quantity = 1 }: { product_id: string; quantity?: number }) => {
      if (!userId) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: userId, product_id, quantity },
          // Fix 3: Change `onConflict` to a single string
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

  const addToCart = (product: { id: string; name: string; brand: string; price: number; image: string }) => {
    const existingItem = cartItems.find(item => item.product_id === product.id);
    if (existingItem) {
      addMutation.mutate({ product_id: product.id, quantity: existingItem.quantity + 1 });
    } else {
      addMutation.mutate({ product_id: product.id, quantity: 1 });
    }
  };

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

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};