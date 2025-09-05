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

  products: {
    name: string;
    brand: string;
    image_urls: string[] | null;
  } | null;
  parts: {
    name: string;
    brand: string;
    image_urls: string[] | null;
  } | null;
}

// Define the type for a single item in the wishlist, as used by the UI
export interface WishlistItem {
  id: string; // The ID of the wishlist item itself
  user_id: string;
  item_id: string; // This can be either product_id or part_id
  name: string;
  brand: string;
  image: string;
  is_part: boolean;
}

// Define the shape of our Wishlist Context
interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  isWishlisted: (itemId: string) => boolean;
  toggleWishlist: (item: { id: string; name: string; brand: string; price?: number; image: string; is_part: boolean }) => void;
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

  const fetchWishlistItems = async (): Promise<WishlistItem[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        id,
        user_id,
        product_id,
        part_id,
        products:product_id (
          name,
          brand,
          image_urls
        ),
        parts:part_id (
          name,
          brand,
          image_urls
        )
      `)
      .eq('user_id', userId);

    if (error) throw error;
    
    return data.map((item: any) => {
      const product = item.products;
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
      
      const part = item.parts;
      if (item.part_id && part) {
        return {
          id: item.id,
          user_id: item.user_id,
          item_id: item.part_id,
          name: part.name,
          brand: part.brand,
          image: part.image_urls?.[0] || '/placeholder.svg',
          is_part: true,
        };
      }
      
      return null;
    }).filter(Boolean) as WishlistItem[];
  };

  const { data: wishlistItems = [], isLoading } = useQuery<WishlistItem[]>({
    queryKey: ['wishlistItems', userId],
    queryFn: fetchWishlistItems,
    enabled: !!userId,
  });

  const isWishlisted = (itemId: string) => {
    return wishlistItems.some(item => item.item_id === itemId);
  };
  
  const addMutation = useMutation({
    mutationFn: async (item: { id: string; is_part: boolean }) => {
      if (!userId) throw new Error('You must be logged in to add to your wishlist.');
      
      const payload = item.is_part
        ? { user_id: userId, part_id: item.id, product_id: null }
        : { user_id: userId, product_id: item.id, part_id: null };

      const onConflictColumns = item.is_part ? 'user_id,part_id' : 'user_id,product_id';

      const { data, error } = await supabase
        .from('wishlist')
        .upsert(payload, { onConflict: onConflictColumns })
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

  const toggleWishlist = (item: { id: string; name: string; brand: string; price?: number; image: string; is_part: boolean }) => {
    if (!userId) {
      toast.error('You must be logged in to add to your wishlist.');
      return;
    }
    
    if (isWishlisted(item.id)) {
      removeMutation.mutate({ id: item.id, is_part: item.is_part });
      toast.info(`${item.name} removed from wishlist`);
    } else {
      addMutation.mutate({ id: item.id, is_part: item.is_part });
      toast.success(`${item.name} added to wishlist!`);
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

// eslint-disable-next-line react-refresh/only-export-components
export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};