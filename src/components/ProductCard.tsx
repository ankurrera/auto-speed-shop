import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  image: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  isOnSale?: boolean;
  className?: string; // <-- ADDED THIS LINE
}

const ProductCard = ({
  id,
  name,
  brand,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  inStock,
  isOnSale,
  className
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const handleAddToCart = () => {
    addToCart({ id, name, brand, price, image });
    toast.success(`${name} added to cart!`);
  };

  const handleWishlist = () => {
    toggleWishlist({ id, name, brand, image });
  };

  return (
    <Card className={cn("group hover:shadow-md transition-all duration-300 border-border", className)}>
      <CardContent className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
          <Link to={`/product/${id}`}>
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
          
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
  );
};

export default ProductCard;