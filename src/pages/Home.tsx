import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Wrench, Truck, Shield, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import heroImage from "@/assets/McLaren_Home_Hero.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import BrandCarousel from "@/components/BrandCarousel"; // 1. Import the new component

// Define the type for a product object to ensure type safety
interface Product {
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
}

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const navigate = useNavigate();

  // Fetch featured products from Supabase
  // We use the new Product type to ensure the data is correctly structured
  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(4);
      
      if (error) throw error;
      
      return data.map(product => ({
        id: product.id,
        name: product.name,
        brand: product.brand || 'Unknown',
        price: Number(product.price),
        originalPrice: product.compare_at_price ? Number(product.compare_at_price) : undefined,
        image_urls: product.image_urls || [],
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 50,
        inStock: product.stock_quantity > 0,
        isOnSale: product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
      }));
    }
  });

  // Fetch vehicle years from Supabase
  const { data: vehicleYears = [] } = useQuery({
    queryKey: ['vehicle-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_years')
        .select('year')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data.map(item => item.year);
    }
  });

  // Fetch vehicle makes from Supabase
  const { data: vehicleMakes = [] } = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_makes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch vehicle models from Supabase, dependent on selectedMake
  const { data: vehicleModels = [] } = useQuery({
    queryKey: ['vehicle-models', selectedMake],
    queryFn: async () => {
      const makeId = vehicleMakes.find(make => make.name === selectedMake)?.id;
      
      if (!makeId) {
        return [];
      }

      const { data, error } = await supabase
        .from('vehicle_models')
        .select('name')
        .eq('make_id', makeId)
        .order('name');
      
      if (error) throw error;
      return data.map(item => item.name);
    },
    enabled: !!selectedMake,
  });

  // Updated function to handle the search button click
  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    if (searchQuery) searchParams.append("query", searchQuery);
    if (selectedYear) searchParams.append("year", selectedYear);
    if (selectedMake) searchParams.append("make", selectedMake);
    if (selectedModel) searchParams.append("model", selectedModel);
    
    // Navigate to the shop page with the search parameters
    navigate(`/shop?${searchParams.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimalist Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-background overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Auto Parts Hero"
            className="w-full h-full object-cover opacity-20" 
          />
          <div className="absolute inset-0 bg-background bg-opacity-60"></div>
        </div>
        <div className="relative container mx-auto px-6 text-center z-10 max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-semibold text-foreground leading-tight mb-6">
            <span className="text-foreground">Your Ultimate</span>
            <br />
            <span className="text-primary">Auto Parts Destination</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Discover premium parts and accessories for a ride that reflects your style and performance needs.
          </p>
            
          {/* Minimalist Vehicle Search */}
          <Card className="w-full max-w-3xl mx-auto bg-card border border-border shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-lg font-medium text-foreground mb-6">
                Find the Perfect Fit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-11 border-border">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger className="h-11 border-border">
                    <SelectValue placeholder="Make" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleMakes.map(make => (
                      <SelectItem key={make.name} value={make.name}>
                        {make.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-11 border-border">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicleModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  
                <Button size="lg" className="h-11 transition-colors" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Items
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Minimalist Brand Carousel */}
      <BrandCarousel />

      {/* Simplified Features */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm text-primary font-medium mb-3">Why Choose Us?</p>
            <h2 className="text-3xl font-semibold text-foreground">Driven by Quality, Delivered with Speed</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-8 border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-medium text-lg">Fast Shipping</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <p className="text-muted-foreground text-sm">Free shipping on orders over $75, nationwide.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8 border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-medium text-lg">Quality Guarantee</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <p className="text-muted-foreground text-sm">All parts are backed by a comprehensive warranty.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8 border border-border hover:border-primary/50 transition-colors">
              <CardHeader className="p-0">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="font-medium text-lg">Expert Support</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-3">
                <p className="text-muted-foreground text-sm">Get professional advice from our experienced team.</p>
              </CardContent>
            </Card>
            <Link to="/new-arrivals">
              <Card className="text-center p-8 border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="p-0">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="font-medium text-lg">New Arrivals</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-3">
                  <p className="text-muted-foreground text-sm">Always the latest and greatest products in stock.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Minimalist Featured Products */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-foreground">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
              Top-rated parts chosen by our experts for your car's best performance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product} 
                className="hover:border-primary/50 transition-colors"
              />
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button size="lg" variant="default" className="px-8 py-3 transition-colors">
              Explore All Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
  };
  
  export default Home;