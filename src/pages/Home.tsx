import { useState, useEffect } from "react";
import { Search, Wrench, Truck, Shield, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/ProductCard";
import heroImage from "@/assets/hero-auto-parts.jpg";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");

  // Fetch featured products from Supabase
  const { data: featuredProducts = [] } = useQuery({
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
        image: product.image_urls?.[0] || '/placeholder.svg',
        rating: 4.5, // Default rating since we don't have reviews yet
        reviews: Math.floor(Math.random() * 200) + 50, // Random reviews for now
        inStock: product.stock_quantity > 0,
        isOnSale: product.compare_at_price && Number(product.compare_at_price) > Number(product.price)
      }));
    }
  });

  // Fetch vehicle data from Supabase
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

  const { data: vehicleMakes = [] } = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_makes')
        .select('name')
        .order('name');
      
      if (error) throw error;
      return data.map(item => item.name);
    }
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ['vehicle-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select('name')
        .order('name');
      
      if (error) throw error;
      return data.map(item => item.name);
    }
  });

  const categories = [
    { name: "Engine", icon: "🔧" },
    { name: "Brakes", icon: "🛞" },
    { name: "Suspension", icon: "🚗" },
    { name: "Electrical", icon: "⚡" },
    { name: "Cooling", icon: "❄️" },
    { name: "Exhaust", icon: "💨" },
    { name: "Filters", icon: "🌪️" },
    { name: "Tools", icon: "🔧" }
  ];


  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-[600px] bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Auto Parts Hero"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-3xl text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Premium Auto Parts
              <br />
              <span className="text-primary">For Every Ride</span>
            </h1>
            <p className="text-xl mb-8 text-gray-200 leading-relaxed">
              Quality parts, competitive prices, and expert support for professionals and enthusiasts.
            </p>
            
            {/* Vehicle Search */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Find Parts for Your Vehicle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Make" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicleMakes.map(make => (
                        <SelectItem key={make} value={make}>
                          {make}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
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
                  
                  <Button size="lg" className="h-10">
                    <Search className="h-4 w-4 mr-2" />
                    Search Parts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Fast Shipping</h3>
              <p className="text-muted-foreground text-sm">Free shipping on orders over $75</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Quality Guarantee</h3>
              <p className="text-muted-foreground text-sm">All parts backed by warranty</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Wrench className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Expert Support</h3>
              <p className="text-muted-foreground text-sm">Professional installation advice</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Top Rated</h3>
              <p className="text-muted-foreground text-sm">Trusted by thousands of customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find the exact parts you need with our organized categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {categories.map((category) => (
              <Card key={category.name} className="hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="text-3xl mb-3">{category.icon}</div>
                  <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Products</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Top-rated parts chosen by our experts
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" variant="outline">
              View All Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;