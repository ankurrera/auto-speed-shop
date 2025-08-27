import { useState, useEffect } from "react";
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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const navigate = useNavigate();

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
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-background overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Auto Parts Hero"
            className="w-full h-full object-cover opacity-80" 
          />
          {/* Semi-transparent overlay for text contrast */}
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-tight animate-fade-in-up">
            <span className="text-black dark:text-white">Your Ultimate</span>
            <br />
            <span className="bg-gradient-primary bg-clip-text text-transparent">Auto Parts Destination</span>
          </h1>
          <p className="text-lg md:text-xl mt-4 max-w-3xl mx-auto animate-fade-in-up delay-100 text-white">
            Discover premium parts and accessories for a ride that reflects your style and performance needs.
          </p>
            
          {/* Vehicle Search */}
          <Card className="mt-12 w-full max-w-4xl mx-auto bg-card/70 backdrop-blur-md shadow-lg animate-fade-in-up delay-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Find the Perfect Fit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-12">
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
                  <SelectTrigger className="h-12">
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
                  <SelectTrigger className="h-12">
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
                  
                  <Button size="lg" className="h-12 shadow-primary hover:shadow-lg transition-all duration-300" onClick={handleSearch}>
                    <Search className="h-5 w-5 mr-2" />
                    Search Parts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="secondary" className="mb-4 text-primary">Why Choose Us?</Badge>
              <h2 className="text-4xl font-bold">Driven by Quality, Delivered with Speed</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center p-6 transition-all duration-300 hover:shadow-lg hover:border-primary border-transparent hover:scale-105 animate-fade-in-up">
                <CardHeader className="p-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-semibold text-lg">Fast Shipping</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <p className="text-muted-foreground text-sm">Free shipping on orders over $75, nationwide.</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6 transition-all duration-300 hover:shadow-lg hover:border-primary border-transparent hover:scale-105 animate-fade-in-up delay-100">
                <CardHeader className="p-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-semibold text-lg">Quality Guarantee</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <p className="text-muted-foreground text-sm">All parts are backed by a comprehensive warranty.</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6 transition-all duration-300 hover:shadow-lg hover:border-primary border-transparent hover:scale-105 animate-fade-in-up delay-200">
                <CardHeader className="p-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-semibold text-lg">Expert Support</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <p className="text-muted-foreground text-sm">Get professional advice from our experienced team.</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6 transition-all duration-300 hover:shadow-lg hover:border-primary border-transparent hover:scale-105 animate-fade-in-up delay-300">
                <CardHeader className="p-0">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="font-semibold text-lg">New Arrivals</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                  <p className="text-muted-foreground text-sm">Always the latest and greatest products in stock.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-24 bg-secondary">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 animate-fade-in-up">
              <h2 className="text-4xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mt-4">
                Top-rated parts chosen by our experts for your car's best performance.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  {...product} 
                  className="hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                />
              ))}
            </div>
            
            <div className="text-center mt-16 animate-fade-in-up delay-400">
              <Button size="lg" variant="default" className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300">
                Explore All Products
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  };
  
  export default Home;