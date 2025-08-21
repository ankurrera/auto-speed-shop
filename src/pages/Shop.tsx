import { useState } from "react";
import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchFilters from "@/components/SearchFilters";
import ProductCard from "@/components/ProductCard";

const Shop = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({});

  // Sample products data
  const products = Array.from({ length: 12 }, (_, i) => ({
    id: `product-${i + 1}`,
    name: `Auto Part ${i + 1}`,
    brand: ["ACDelco", "Bosch", "Monroe", "Moog"][i % 4],
    price: 29.99 + (i * 10),
    originalPrice: i % 3 === 0 ? 39.99 + (i * 10) : undefined,
    image: "/placeholder.svg",
    rating: 4.2 + (i % 8) * 0.1,
    reviews: 50 + (i * 15),
    inStock: i % 7 !== 0,
    isOnSale: i % 3 === 0
  }));

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    // Apply filters logic here
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Auto Parts & Accessories</h1>
          <p className="text-muted-foreground">
            Browse our complete selection of high-quality automotive parts
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <SearchFilters onFilterChange={handleFilterChange} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 p-4 bg-secondary/50 rounded-lg">
              <div className="text-sm text-muted-foreground">
                Showing {products.length} products
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className={`grid gap-6 ${
              viewMode === "grid" 
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                : "grid-cols-1"
            }`}>
              {products.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-12">
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="default" size="sm">1</Button>
                <Button variant="outline" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;