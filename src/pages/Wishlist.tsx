import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useWishlist, type WishlistItem } from "@/contexts/WishlistContext";
import { Link } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const Wishlist = () => {
  const { wishlistItems, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleAddToCartFromWishlist = (product: WishlistItem) => {
    addToCart({
      id: product.item_id,
      name: product.name,
      brand: product.brand,
      price: 0, // Price will be fetched from database
      image: product.image,
      is_part: product.is_part
    });
    toast.success(`${product.name} added to cart!`);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <Heart className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
            <h1 className="text-2xl font-bold mb-4">Your wishlist is empty</h1>
            <p className="text-muted-foreground mb-8">
              Start adding products you love to your wishlist!
            </p>
            <Button asChild>
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Wishlist</h1>
        
        <div className="space-y-4">
          {wishlistItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6 flex items-center space-x-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-md"
                  loading="lazy"
                  decoding="async"
                  width="96"
                  height="96"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.name}</h2>
                  <p className="text-muted-foreground text-sm">{item.brand}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleAddToCartFromWishlist(item)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleWishlist({ 
                      id: item.item_id, 
                      name: item.name, 
                      brand: item.brand, 
                      image: item.image,
                      is_part: item.is_part
                    })}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;