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
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
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
      if (session) {
        console.log('User is authenticated. User ID:', session.user.id);
      } else {
        console.log('User is not authenticated.');
      }
    });

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const { data: cartItems = [], isLoading } = useQuery<CartItem[]>({
    queryKey: ['cartItems', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('No user ID, skipping cart fetch.');
        return [];
      }
      
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

      if (error) {
        console.error('Error fetching cart:', error);
        throw error;
      }
      
      console.log('Cart fetched successfully:', data);

      // Fix: Correctly map the returned data using a type assertion
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
          { onConflict: 'user_id,product_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
      console.log(`Successfully added product ${variables.product_id} to cart.`);
    },
    onError: (error) => {
      console.error('Error adding to cart:', error);
    }
  });

  const addToCart = (product: { id: string; name: string; brand: string; price: number; image: string }) => {
    if (!userId) {
      console.error('Add to cart failed: User not authenticated.');
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === product.id);
    if (existingItem) {
      addMutation.mutate({ product_id: product.id, quantity: existingItem.quantity + 1 });
    } else {
      addMutation.mutate({ product_id: product.id, quantity: 1 });
    }
  };

  const increaseQuantityMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      if (!userId) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
    onError: (error) => {
      console.error('Error increasing quantity:', error);
    }
  });

  const increaseQuantity = (id: string) => {
    const item = cartItems.find(cartItem => cartItem.id === id);
    if (item) {
      increaseQuantityMutation.mutate({ id, newQuantity: item.quantity + 1 });
    }
  };

  const decreaseQuantityMutation = useMutation({
    mutationFn: async ({ id, newQuantity }: { id: string; newQuantity: number }) => {
      if (!userId) throw new Error('User not authenticated');
      
      if (newQuantity <= 0) {
        removeFromCart(id);
        return;
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cartItems'] });
    },
    onError: (error) => {
      console.error('Error decreasing quantity:', error);
    }
  });

  const decreaseQuantity = (id: string) => {
    const item = cartItems.find(cartItem => cartItem.id === id);
    if (item) {
      decreaseQuantityMutation.mutate({ id, newQuantity: item.quantity - 1 });
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
      console.log('Item removed from cart successfully.');
    },
    onError: (error) => {
      console.error('Error removing from cart:', error);
    }
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
      console.log('Cart cleared successfully.');
    },
    onError: (error) => {
      console.error('Error clearing cart:', error);
    }
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
    increaseQuantity,
    decreaseQuantity,
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