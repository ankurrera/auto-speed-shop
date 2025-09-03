// src/pages/ProductDetails.tsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Database } from "@/database.types";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";

type Product = Database['public']['Tables']['products']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [dominantColor, setDominantColor] = useState('bg-muted');

  const fetchProduct = async (productId: string) => {
    const { data: productData } = await supabase.from("products").select("*").eq("id", productId).single();
    if (productData) return { ...productData, type: 'product' };

    const { data: partData } = await supabase.from("parts").select("*").eq("id", productId).single();
    if (partData) return { ...partData, type: 'part' };
    
    throw new Error("Product not found");
  };

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id as string),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const getDominantColor = (imgSrc: string) => { /* ... (unchanged) ... */ };
  useEffect(() => { /* ... (unchanged) ... */ }, [product]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Loading product details...</h1>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">Oops, product not found.</h1>
        <p className="text-muted-foreground">The product you are looking for may have been removed or does not exist.</p>
      </div>
    );
  }
  
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image_urls[0],
    isPart: product.type === 'part', // 🆕 Corrected property name
    brand: 'brand' in product ? product.brand : undefined,
    category: 'category' in product ? product.category : undefined,
  };

  const handleAddToCart = () => {
    addToCart(productData, 1);
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleWishlist = () => {
    toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: product.image_urls[0],
      isPart: product.type === 'part',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <Carousel className="w-full">
            <CarouselContent>
              {product.image_urls?.map((url, index) => (
                <CarouselItem key={index}>
                  <Card className="rounded-none border-none">
                    <CardContent className="flex items-center justify-center p-0">
                      <div className="relative aspect-square w-full" style={{ backgroundColor: dominantColor }}>
                        <img
                          src={url}
                          alt={product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        {/* Product Details */}
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            {'brand' in product && <p className="text-muted-foreground font-medium">{product.brand}</p>}
            {'category' in product && <p className="text-muted-foreground font-medium">{product.category}</p>}
          </div>
          <h1 className="text-4xl font-bold">{product.name}</h1>
          <p className="text-3xl font-bold text-foreground">${product.price?.toFixed(2)}</p>
          <p className="text-muted-foreground">{product.description}</p>
          <Separator />
          
          <div className="flex items-center space-x-4">
            <Button className="w-full sm:w-auto" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleToggleWishlist}
              className={cn(isWishlisted(product.id, product.type === 'part') && "bg-destructive text-destructive-foreground hover:bg-destructive-hover")}
            >
              <Heart className={cn("h-4 w-4", isWishlisted(product.id, product.type === 'part') && "fill-current")} />
            </Button>
            {product.stock_quantity > 0 ? (
              <Badge variant="default">In Stock</Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Specifications</h2>
        <ul className="list-disc list-inside space-y-2">
          {product.type === 'part' && product.specifications && typeof product.specifications === 'object' && Object.entries(product.specifications).map(([key, value]) => (
            <li key={key}>
              <span className="font-semibold">{key}:</span> {String(value)}
            </li>
          ))}
          {product.type === 'product' && product.specifications && typeof product.specifications === 'string' && (
            <li>{product.specifications}</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProductDetails;