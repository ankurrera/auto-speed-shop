import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  isOnSale?: boolean;
}

interface ProductGridProps {
  products?: Product[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  viewAllLink?: string;
  maxProducts?: number;
}

const defaultProducts: Product[] = [
  {
    id: "1",
    name: "Premium Brake Pads Set",
    brand: "AutoPro",
    price: 89.99,
    originalPrice: 119.99,
    image: "/api/placeholder/300/200",
    rating: 4.8,
    reviewCount: 127,
    inStock: true,
    isOnSale: true
  },
  {
    id: "2",
    name: "High Performance Air Filter",
    brand: "SpeedMax",
    price: 45.99,
    image: "/api/placeholder/300/200",
    rating: 4.6,
    reviewCount: 89,
    inStock: true
  },
  {
    id: "3",
    name: "LED Headlight Bulbs",
    brand: "BrightLite",
    price: 129.99,
    originalPrice: 159.99,
    image: "/api/placeholder/300/200",
    rating: 4.9,
    reviewCount: 203,
    inStock: true,
    isOnSale: true
  },
  {
    id: "4",
    name: "Engine Oil Filter",
    brand: "PurePower",
    price: 24.99,
    image: "/api/placeholder/300/200",
    rating: 4.7,
    reviewCount: 156,
    inStock: true
  }
];

const ProductGrid = ({
  products = defaultProducts,
  title = "Featured Products",
  subtitle = "Top-rated parts chosen by our experts for your car's best performance",
  showViewAll = true,
  viewAllLink = "/shop",
  maxProducts = 8
}: ProductGridProps) => {
  const displayProducts = maxProducts ? products.slice(0, maxProducts) : products;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {displayProducts.map((product) => (
            <div
              key={product.id}
              className="bg-card rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border overflow-hidden group"
            >
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {product.isOnSale && (
                  <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                    Sale
                  </Badge>
                )}
                {!product.inStock && (
                  <Badge variant="secondary" className="absolute top-3 right-3">
                    Out of Stock
                  </Badge>
                )}
              </div>

              <div className="p-4 space-y-3">
                {product.brand && (
                  <p className="text-sm text-muted-foreground font-medium">
                    {product.brand}
                  </p>
                )}
                
                <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                  {product.name}
                </h3>

                {product.rating && (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      ({product.reviewCount || 0})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl font-bold text-foreground">
                        {formatPrice(product.price)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary-hover text-primary-foreground"
                    disabled={!product.inStock}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showViewAll && (
          <div className="text-center">
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Link to={viewAllLink}>
                View All Products
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;