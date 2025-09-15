// Utility functions for handling image URLs and storage
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a given URL is a Supabase storage URL
 */
export const isSupabaseStorageUrl = (url: string): boolean => {
  return url.includes('.supabase.co/storage/');
};

/**
 * Checks if an image URL is accessible
 */
export const checkImageAccessibility = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Gets a fallback image URL when the primary image fails
 */
export const getFallbackImageUrl = (category?: string): string => {
  // Return a placeholder specific to the category if possible
  if (category) {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('brake')) {
      return '/placeholder-brake.svg';
    } else if (categoryLower.includes('engine')) {
      return '/placeholder-engine.svg';
    } else if (categoryLower.includes('exhaust')) {
      return '/placeholder-exhaust.svg';
    }
  }
  return '/placeholder.svg';
};

/**
 * Validates and cleans an array of image URLs
 */
export const validateImageUrls = (urls: string[] | null | undefined): string[] => {
  if (!urls || !Array.isArray(urls)) {
    return [];
  }
  
  return urls.filter(url => {
    if (!url || typeof url !== 'string') return false;
    // Basic URL validation
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });
};

/**
 * Gets the best available image from an array of URLs
 */
export const getBestImageUrl = (urls: string[] | null | undefined, category?: string): string => {
  const validUrls = validateImageUrls(urls);
  
  if (validUrls.length === 0) {
    return getFallbackImageUrl(category);
  }
  
  // Prefer external URLs (like Unsplash) over potentially broken Supabase storage URLs
  const externalUrls = validUrls.filter(url => !isSupabaseStorageUrl(url));
  if (externalUrls.length > 0) {
    return externalUrls[0];
  }
  
  // Fall back to Supabase storage URLs
  return validUrls[0];
};

/**
 * Checks if storage buckets exist and are accessible
 */
export const checkStorageBuckets = async (): Promise<{
  productsImagesBucket: boolean;
  partImagesBucket: boolean;
}> => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return {
        productsImagesBucket: false,
        partImagesBucket: false,
      };
    }
    
    const bucketIds = buckets?.map(bucket => bucket.id) || [];
    
    return {
      productsImagesBucket: bucketIds.includes('products_images'),
      partImagesBucket: bucketIds.includes('part_images'),
    };
  } catch (error) {
    console.error("Error checking storage buckets:", error);
    return {
      productsImagesBucket: false,
      partImagesBucket: false,
    };
  }
};

/**
 * Creates storage buckets if they don't exist (requires appropriate permissions)
 */
export const ensureStorageBuckets = async (): Promise<boolean> => {
  try {
    const bucketStatus = await checkStorageBuckets();
    
    // Try to create missing buckets
    if (!bucketStatus.productsImagesBucket) {
      const { error } = await supabase.storage.createBucket('products_images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.error("Failed to create products_images bucket:", error);
      }
    }
    
    if (!bucketStatus.partImagesBucket) {
      const { error } = await supabase.storage.createBucket('part_images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880, // 5MB
      });
      if (error) {
        console.error("Failed to create part_images bucket:", error);
      }
    }
    
    // Re-check status after creation attempts
    const newStatus = await checkStorageBuckets();
    return newStatus.productsImagesBucket && newStatus.partImagesBucket;
  } catch (error) {
    console.error("Error ensuring storage buckets:", error);
    return false;
  }
};