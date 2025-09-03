// src/contexts/WishlistContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Database } from '@/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type PartRow = Database['public']['Tables']['parts']['Row'];
type WishlistRow = Database['public']['Tables']['wishlist']['Row'];

// Define the type for a single item in the wishlist, as used by the UI
interface WishlistItem {
  id: string;
  productId: string | null;
  partId: string | null;
  name: string;
  brand: string | null;
  image: string;
  isPart: boolean;
  price: number | null;
}

// Define the shape of our Wishlist Context
interface WishlistContextType {
  wishlistItems: WishlistItem[];
  isLoading: boolean;
  isWishlisted: (id: string, isPart: boolean) => boolean;
  toggleWishlist: (item: {
    id: string;
    name: string;
    brand?: string | null;
    image: string;
    isPart: boolean;
    price?: number | null;
  }) => void;
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
      authListener.subscription.unsubscribe();
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
          part_id,
          products:product_id (name, brand, image_urls, price),
          parts:part_id (name, brand, image_urls, price)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching wishlist:', error.message);
        throw error;
      }

      return data.flatMap((item): WishlistItem[] => {
        if (item.product_id && item.products && Array.isArray(item.products) && item.products.length > 0) {
          const product = item.products[0] as ProductRow;
          return [
            {
              id: item.id,
              productId: item.product_id,
              partId: null,
              name: product.name,
              brand: product.brand,
              image: product.image_urls?.[0] || '/placeholder.svg',
              isPart: false,
              price: product.price,
            },
          ];
        }

        if (item.part_id && item.parts && Array.isArray(item.parts) && item.parts.length > 0) {
          const part = item.parts[0] as PartRow;
          return [
            {
              id: item.id,
              productId: null,
              partId: item.part_id,
              name: part.name,
              brand: part.brand,
              image: part.image_urls?.[0] || '/placeholder.svg',
              isPart: true,
              price: part.price,
            },
          ];
        }

        return [];
      });
    },
    enabled: !!userId,
  });

  const isWishlisted = (id: string, isPart: boolean) => {
    return wishlistItems.some(
      (item) => (isPart && item.partId === id) || (!isPart && item.productId === id),
    );
  };

  const addMutation = useMutation({
    mutationFn: async ({ id, isPart }: { id: string; isPart: boolean }) => {
      if (!userId) throw new Error('You must be logged in to add to your wishlist.');

      const upsertData: Partial<WishlistRow> = {
        user_id: userId,
        product_id: isPart ? null : id,
        part_id: isPart ? id : null,
      };

      const { data, error } = await supabase
        .from('wishlist')
        .upsert(upsertData, {
          onConflict: isPart ? 'user_id,part_id' : 'user_id,product_id',
          ignoreDuplicates: true,
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistItems'] });
    },
    onError: (error) => {
      console.error('Error adding to wishlist:', error.message || error);
      toast.error('Failed to add item to wishlist.');
    },
  });

  const removeMutation = useMutation({
    mutationFn: async ({ id, isPart }: { id: string; isPart: boolean }) => {
      if (!userId) throw new Error('You must be logged in to remove from your wishlist.');

      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', userId)
        .eq(isPart ? 'part_id' : 'product_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistItems'] });
    },
    onError: (error) => {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove item from wishlist.');
    },
  });

  const toggleWishlist = (item: {
    id: string;
    name: string;
    brand?: string | null;
    image: string;
    isPart: boolean;
    price?: number | null;
  }) => {
    if (!userId) {
      toast.error('You must be logged in to add to your wishlist.');
      return;
    }

    if (isWishlisted(item.id, item.isPart)) {
      removeMutation.mutate({ id: item.id, isPart: item.isPart });
      toast.info(`${item.name} removed from wishlist.`);
    } else {
      addMutation.mutate({ id: item.id, isPart: item.isPart });
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
