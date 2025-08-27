// src/pages/ProductDetails.tsx

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Define a TypeScript interface for the product data
interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  price: number;
  compare_at_price: number | null;
  image_urls: string[];
  is_featured: boolean;
  specifications: string;
}

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>(); // Get the product ID from the URL
  const [mainImage, setMainImage] = useState<string | null>(null);

  // Fetch product data from Supabase
  const { data: product, isLoading, isError } = useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      if (!id) throw new Error("Product ID is missing.");
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id, // Ensure the query only runs if an ID exists
  });

  // Use a useEffect hook to set the main image after data is fetched
  useEffect(() => {
    if (product && product.image_urls && product.image_urls.length > 0) {
      setMainImage(product.image_urls[0]);
    }
  }, [product]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading product details...</div>;
  }

  if (isError || !product) {
    return <div className="min-h-screen flex items-center justify-center">Oops! Product not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image Gallery */}
        <div className="flex flex-col gap-4">
          <img
            src={mainImage || '/placeholder.svg'}
            alt={product.name}
            className="w-full aspect-square object-contain rounded-lg border"
          />
          <div className="flex gap-2 overflow-x-auto">
            {product.image_urls?.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${product.name} angle ${index + 1}`}
                className={`w-24 h-24 object-cover rounded-md border cursor-pointer transition-all duration-200 ${mainImage === url ? 'border-primary-foreground scale-105' : 'border-transparent'}`}
                onClick={() => setMainImage(url)}
              />
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">{product.brand}</Badge>
            {product.is_featured && <Badge>Featured</Badge>}
          </div>
          <h1 className="text-4xl font-bold">{product.name}</h1>
          
          <div className="flex items-center space-x-2 text-muted-foreground">
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="ml-1">4.5</span>
            </div>
            <span>|</span>
            <span>(150 Reviews)</span>
          </div>
          
          <Separator />

          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-foreground">${product.price.toFixed(2)}</span>
            {product.compare_at_price && (
              <span className="text-lg text-muted-foreground line-through">${product.compare_at_price.toFixed(2)}</span>
            )}
          </div>
          
          <p className="text-lg text-muted-foreground">{product.description}</p>

          <Button size="lg" className="w-full">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>

          <Separator />
          
          {/* Product Specifications and Details */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Specifications</h3>
            <p className="text-sm text-muted-foreground">{product.specifications}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;