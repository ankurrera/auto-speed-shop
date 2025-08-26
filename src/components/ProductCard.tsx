import { useState } from "react";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { Link } from "react-router-dom"; // <-- ADDED THIS IMPORT

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
  className?: string;
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
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    // Add to cart logic
    addToCart({ id, name, brand, price, image });
    console.log(`Added ${name} to cart`);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Card className={cn("overflow-hidden group", className)}>
      <div className="relative overflow-hidden">
        <Link to={`/product/${id}`}>
          <img src={image} alt={name} className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105" />
        </Link>
        {isOnSale && (
          <Badge variant="destructive" className="absolute top-2 left-2">Sale</Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={handleWishlist}
        >
          <Heart
            className={`h-4 w-4 ${
              isWishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }`}
          />
        </Button>
      </div>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{brand}</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center space-x-1 text-yellow-500 text-sm">
          <Star className="h-4 w-4 fill-current" />
          <span>{rating} ({reviews})</span>
        </div>
        <div className="flex items-baseline space-x-2 mt-2">
          <span className="text-xl font-bold">{`$${price.toFixed(2)}`}</span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">{`$${originalPrice.toFixed(2)}`}</span>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <Button className="w-full" onClick={handleAddToCart} disabled={!inStock}>
          <ShoppingCart className="h-4 w-4 mr-2" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;