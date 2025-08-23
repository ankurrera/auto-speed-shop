/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Grid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchFilters from "@/components/SearchFilters";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Shop = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({});

  // Fetch all products from Supabase
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand || 'Unknown',
        price: Number(product.price),
        originalPrice: product.compare_at_price ? Number(product.compare_at_price) : undefined,
        image: product.image_urls?.[0] || '/placeholder.svg',
        rating: 4.5, // Default rating since we don't have reviews yet
        reviews: Math.floor(Math.random() * 200) + 50, // Random reviews for now
        inStock: product.stock_quantity > 0,
        isOnSale: product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
      }));
    }
  });

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