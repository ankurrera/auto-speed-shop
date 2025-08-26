import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Define the type for the data returned from the Supabase query
interface SupabaseWishlistItem {
  id: string;
  product_id: string;
  products: {
    name: string;
    brand: string;
    image_urls: string[] | null;
  };
}

// Define the type for a single item in the wishlist, as used by the UI
export interface WishlistItem {
  id: string; // The ID of the wishlist item itself
  user_id: string;
  product_id: string;
  name: string;
  brand: string;
  image: string;
}

// Define the shape of our Wishlist Context
interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (product: { id: string; name: string; brand: string; price?: number; image: string }) => void;
}

// Create the context
const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

// Define the provider component
export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Use a query to fetch the wishlist items for the current user
  const { data: wishlistItems = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlistItems', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          id,
          product_id,
          products:product_id (
            name,
            brand,
            image_urls
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((item: any) => ({
        id: item.id,
        user_id: userId!,
        product_id: item.product_id,
        name: item.products.name,
        brand: item.products.brand,
        image: item.products.image_urls?.[0] || '/placeholder.svg',
      }));
    },
    enabled: !!userId,
  });

  const isWishlisted = (productId: string) => {
    return wishlistItems.some(item => item.product_id === productId);
  };
  
  const addMutation = useMutation({
    mutationFn: async (product_id: string) => {
      if (!userId) throw new Error('You must be logged in to add to your wishlist.');
      const { data, error } = await supabase
        .from('wishlist')
        .upsert(
          { user_id: userId, product_id },
          { onConflict: 'user_id,product_id' }
        )
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistItems'] });
    },
    onError: (error) => {
      console.error('Error adding to wishlist:', error);
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (product_id: string) => {
      if (!userId) throw new Error('You must be logged in to remove from your wishlist.');
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', product_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistItems'] });
    },
    onError: (error) => {
      console.error('Error removing from wishlist:', error);
    }
  });

  const toggleWishlist = (product: { id: string; name: string; brand: string; image: string }) => {
    if (!userId) {
      toast.error('You must be logged in to add to your wishlist.');
      return;
    }
    
    if (isWishlisted(product.id)) {
      removeMutation.mutate(product.id);
      toast.info(`${product.name} removed from wishlist`);
    } else {
      addMutation.mutate(product.id);
      toast.success(`${product.name} added to wishlist!`);
    }
  };

  const value = {
    wishlistItems,
    isLoading,
    isWishlisted,
    toggleWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};