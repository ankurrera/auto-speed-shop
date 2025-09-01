// src/components/ProductCard.tsx
import { useState, useEffect } from "react";
import { Heart, ShoppingCart, Star, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image_urls: string[];
  rating: number;
  reviews: number;
  inStock: boolean;
  isOnSale?: boolean;
  className?: string;
  category?: string;
}

const ProductCard = ({
  id,
  name,
  brand,
  price,
  originalPrice,
  image_urls,
  rating,
  reviews,
  inStock,
  isOnSale,
  className,
  category,
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dominantColor, setDominantColor] = useState('bg-muted');

  // Function to handle image change on hover
  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index);
  };
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the Link from navigating
    const isPart = !!brand && !category;
    addToCart({ 
      id, 
      name, 
      price, 
      image: image_urls[0], 
      is_part: isPart,
      brand,
      category 
    });
    toast.success(`${name} added to cart!`);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents the Link from navigating
    toggleWishlist({ id, name, brand, price, image: image_urls[0] });
  };
  
  // Choose the image to display. Default to the first one if the array is valid.
  const displayImage = image_urls && image_urls.length > 0 ? image_urls[currentImageIndex] : '/placeholder.svg';

  // Function to extract the dominant color from an image using a temporary canvas
  const getDominantColor = (imgSrc: string) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required to prevent CORS errors on the canvas
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw a small version of the image to sample a color
      canvas.width = 1;
      canvas.height = 1;
      ctx.drawImage(img, 0, 0, 1, 1);
      const pixelData = ctx.getImageData(0, 0, 1, 1).data;
      
      const r = pixelData[0];
      const g = pixelData[1];
      const b = pixelData[2];
      
      setDominantColor(`rgb(${r}, ${g}, ${b})`);
    };
    img.onerror = () => {
      // Fallback to the default muted background on error
      setDominantColor('bg-muted');
    };
    img.src = imgSrc;
  };

  // Run the color extraction whenever the display image changes
  useEffect(() => {
    getDominantColor(displayImage);
  }, [displayImage]);

  return (
    <Link to={`/products/${id}`} className={cn("block", className)}>
      <Card className={cn("group hover:shadow-md transition-all duration-300 border-border")}>
        <CardContent className="p-0">
          <div 
            className="relative aspect-square overflow-hidden rounded-t-lg transition-colors duration-300"
            style={{ backgroundColor: dominantColor }}
          >
            {/* Main product image with lazy loading */}
            <img
              src={displayImage}
              alt={name}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            
            {/* Gallery thumbnails on hover */}
            {image_urls && image_urls.length > 1 && (
              <div className="absolute bottom-2 left-2 right-2 flex justify-center gap-1">
                {image_urls.map((_, index) => (
                  <button
                    key={index}
                    className={cn(
                      "h-1 w-8 rounded-full transition-colors",
                      currentImageIndex === index ? "bg-white" : "bg-gray-400"
                    )}
                    onMouseEnter={() => handleImageChange(index)}
                  />
                ))}
              </div>
            )}
            
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isOnSale && (
                <Badge variant="destructive" className="text-xs">
                  Sale
                </Badge>
              )}
              {!inStock && (
                <Badge variant="secondary" className="text-xs">
                  Out of Stock
                </Badge>
              )}
            </div>
            
            {/* Wishlist button */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/80 hover:bg-background"
              onClick={handleWishlist}
            >
              <Heart
                className={`h-4 w-4 ${
                  isWishlisted(id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                }`}
              />
            </Button>
          </div>

          <div className="p-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{brand}</p>
              <h3 className="font-medium text-foreground line-clamp-2 leading-tight">
                {name}
              </h3>
              {category && <p className="text-sm text-muted-foreground">{category}</p>}
              
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.floor(rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({reviews})
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-foreground">
                  ${price.toFixed(2)}
                </span>
                {originalPrice && originalPrice > price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={!inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;