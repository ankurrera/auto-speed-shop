import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Define the type for the data returned from the Supabase query
interface SupabaseWishlistItem {
  id: string;
  user_id: string;
  product_id: string | null;
  part_id: string | null;
  // Corrected types to handle the array returned by Supabase
  products: {
    name: string;
    brand: string;
    image_urls: string[] | null;
}

// Define the type for a single item in the wishlist, as used by the UI
export interface WishlistItem {
  is_part: boolean;
  id: string; // The ID of the wishlist item itself
  user_id: string;
  item_id: string; // This can be either product_id or part_id
  name: string;
  brand: string;
  image: string;


// Define the shape of our Wishlist Context
interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;


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



    if (error) throw error;
    
    return data.map((item: SupabaseWishlistItem) => {
      const product = item.products?.[0];
      if (item.product_id && product) {
        return {
          id: item.id,
          user_id: item.user_id,
          item_id: item.product_id,
          name: product.name,
          brand: product.brand,
          image: product.image_urls?.[0] || '/placeholder.svg',
          is_part: false,
        };
      }
      

    enabled: !!userId,
  });

  const isWishlisted = (itemId: string) => {
    return wishlistItems.some(item => item.item_id === itemId);
  };
  
  const addMutation = useMutation({

      if (!userId) throw new Error('You must be logged in to add to your wishlist.');
      
      const payload = item.is_part
        ? { user_id: userId, part_id: item.id, product_id: null }
        : { user_id: userId, product_id: item.id, part_id: null };

      const onConflictColumns = item.is_part ? 'user_id,part_id' : 'user_id,product_id';

      const { data, error } = await supabase
        .from('wishlist')

        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistItems'] });
    },
    onError: (error) => {
      console.error("Error adding to wishlist:", error.message || error);
    }
  });

  const removeMutation = useMutation({
    mutationFn: async (item: { id: string; is_part: boolean }) => {
      if (!userId) throw new Error('You must be logged in to remove from your wishlist.');

      const query = supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        
      if (item.is_part) {
        query.eq('part_id', item.id);
      } else {
        query.eq('product_id', item.id);
      }
      
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistItems'] });
    },
    onError: (error) => {
      console.error('Error removing from wishlist:', error);
    }
  });


    if (!userId) {
      toast.error('You must be logged in to add to your wishlist.');
      return;
    }
    
    if (isWishlisted(item.id)) {
      removeMutation.mutate({ id: item.id, is_part: item.is_part });
      toast.info(`${item.name} removed from wishlist`);
    } else {

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