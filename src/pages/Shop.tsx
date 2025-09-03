// src/components/ProductCard.tsx
import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

// Update the ProductCardProps interface
export interface ProductCardProps {
  id: string;
  name: string;
  brand?: string;
  price: number;
  image_urls: string[];
  isPart: boolean;
  inStock: boolean;
  rating: number;
  reviews: number;
  isOnSale: boolean;
  // Add these new properties
  onToggleWishlist: () => void;
  isWishlisted: boolean;
}

const ProductCard = ({ 
  id,
  name,
  brand,
  price,
  image_urls,
  isPart,
  inStock,
  onToggleWishlist, // Destructure the new prop
  isWishlisted, // Destructure the new prop
}: ProductCardProps) => {

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <Link to={`/products/${id}`}>
        <div className="relative aspect-square w-full">
          <img
            src={image_urls[0]}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      </Link>
      <CardContent className="p-4 space-y-2">
        <h3 className="font-semibold text-lg line-clamp-1">{name}</h3>
        {brand && <p className="text-sm text-muted-foreground">{brand}</p>}
        <div className="flex items-center justify-between">
          <p className="font-bold text-xl">${price.toFixed(2)}</p>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleWishlist}
              className={cn(isWishlisted && "bg-destructive/10 text-destructive hover:bg-destructive/20")}
            >
              <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
            </Button>
            <Button variant="ghost" size="icon" disabled={!inStock}>
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;