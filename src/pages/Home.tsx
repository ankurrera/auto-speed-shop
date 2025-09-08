import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Search, Wrench, Truck, Shield, Star, Sparkles, ArrowRight } from "lucide-react";
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
import BrandCarousel from "@/components/BrandCarousel";

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

  const yearSelectRef = useRef<HTMLDivElement>(null);
  const makeSelectRef = useRef<HTMLDivElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

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
        isOnSale: product.compare_at_price && Number(product.compare_at_price) > Number(product.price),
        className: "hover:scale-105 transition-transform duration-300 animate-fade-in-up" // Add this line
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

  const handleMouseEnter = (ref: React.RefObject<HTMLDivElement>) => {
    if (ref.current) {
      let scrollAmount = 0;
      const scrollStep = 1;
      let frame: number;

      const scroll = () => {
        ref.current!.scrollTop += scrollStep;
        scrollAmount += scrollStep;
        if (scrollAmount < ref.current!.scrollHeight - ref.current!.clientHeight) {
          frame = window.requestAnimationFrame(scroll);
        }
      };

      frame = window.requestAnimationFrame(scroll);

      ref.current.addEventListener("mouseleave", () => {
        window.cancelAnimationFrame(frame);
        ref.current!.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Auto Parts Hero"
            className="w-full h-full object-cover opacity-60" 
          />
          <div className="absolute inset-0 bg-gradient-hero"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center z-10">
          <div className="animate-fade-in-up">
            <h1 className="text-6xl md:text-8xl font-black leading-none mb-8">
              <span className="block text-white mb-2">Your Ultimate</span>
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Auto Parts
              </span>
              <span className="block text-white text-4xl md:text-6xl font-light">
                Destination
              </span>
            </h1>
            <p className="text-xl md:text-2xl mt-8 max-w-4xl mx-auto text-white/90 leading-relaxed">
              Discover premium parts and accessories for a ride that reflects your style and performance needs.
            </p>
          </div>
            
          {/* Modern Vehicle Search Card */}
          <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Card className="glass max-w-5xl mx-auto border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                    Find Your Perfect Match
                  </h3>
                  <p className="text-muted-foreground">
                    Search by your vehicle specifications
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="h-14 text-lg font-medium glass border-0 hover-lift">
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent
                      ref={yearSelectRef}
                      onMouseEnter={() => handleMouseEnter(yearSelectRef)}
                      className="glass"
                    >
                      {vehicleYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedMake} onValueChange={setSelectedMake}>
                    <SelectTrigger className="h-14 text-lg font-medium glass border-0 hover-lift">
                      <SelectValue placeholder="Select Make" />
                    </SelectTrigger>
                    <SelectContent
                      ref={makeSelectRef}
                      onMouseEnter={() => handleMouseEnter(makeSelectRef)}
                      className="glass"
                    >
                      {vehicleMakes.map(make => (
                        <SelectItem key={make.name} value={make.name}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-14 text-lg font-medium glass border-0 hover-lift">
                      <SelectValue placeholder="Select Model" />
                    </SelectTrigger>
                    <SelectContent
                      ref={modelSelectRef}
                      onMouseEnter={() => handleMouseEnter(modelSelectRef)}
                      className="glass"
                    >
                      {vehicleModels.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                    
                  <Button 
                    size="lg" 
                    className="h-14 text-lg font-semibold hover-glow transition-all duration-300" 
                    onClick={handleSearch}
                  >
                    <Search className="h-5 w-5 mr-2" />
                    Search Parts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

        {/* 2. Add the Brand Carousel component here */}
        <BrandCarousel />

        {/* Features */}
        <section className="py-32 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 animate-fade-in-up">
              <Badge variant="secondary" className="mb-6 px-6 py-2 text-primary font-semibold">
                Why Choose AutoParts Pro?
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Driven by Quality,
                <br />
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Delivered with Speed
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Experience the perfect blend of premium quality, expert support, and lightning-fast delivery.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="glass text-center p-8 hover-lift border-0 shadow-lg animate-fade-in-up">
                <CardHeader className="p-0">
                  <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 hover-glow">
                    <Truck className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="font-bold text-xl mb-4">Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground leading-relaxed">
                    Free express shipping on orders over $75. Most parts delivered within 24-48 hours nationwide.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass text-center p-8 hover-lift border-0 shadow-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <CardHeader className="p-0">
                  <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 hover-glow">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="font-bold text-xl mb-4">Premium Quality</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground leading-relaxed">
                    Every part backed by comprehensive warranty. OEM quality standards with lifetime support guarantee.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="glass text-center p-8 hover-lift border-0 shadow-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <CardHeader className="p-0">
                  <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 hover-glow">
                    <Wrench className="h-10 w-10 text-white" />
                  </div>
                  <CardTitle className="font-bold text-xl mb-4">Expert Support</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground leading-relaxed">
                    24/7 professional consultation from certified automotive technicians and parts specialists.
                  </p>
                </CardContent>
              </Card>
              
              <Link to="/new-arrivals" className="group">
                <Card className="glass text-center p-8 hover-lift border-0 shadow-lg animate-fade-in-up group-hover:bg-primary/5 transition-all duration-300" style={{ animationDelay: '0.3s' }}>
                  <CardHeader className="p-0">
                    <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 hover-glow">
                      <Sparkles className="h-10 w-10 text-white" />
                    </div>
                    <CardTitle className="font-bold text-xl mb-4 group-hover:text-primary transition-colors">
                      Latest Arrivals
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-muted-foreground leading-relaxed group-hover:text-muted-foreground/80">
                      Discover cutting-edge automotive technology and latest performance enhancements.
                    </p>
                    <ArrowRight className="h-5 w-5 mx-auto mt-4 text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-2" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-32 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 animate-fade-in-up">
              <Badge variant="secondary" className="mb-6 px-6 py-2 text-primary font-semibold">
                Handpicked Excellence
              </Badge>
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                Featured 
                <span className="bg-gradient-primary bg-clip-text text-transparent"> Products</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Carefully curated by our automotive experts. Premium parts that deliver exceptional performance and reliability.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              {featuredProducts.map((product, index) => (
                <div 
                  key={product.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ProductCard 
                    {...product} 
                    className="hover-lift hover-glow transition-all duration-300 glass border-0 shadow-lg"
                  />
                </div>
              ))}
            </div>
            
            <div className="text-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <Link to="/shop">
                <Button 
                  size="lg" 
                  className="text-lg px-12 py-6 rounded-full hover-glow transition-all duration-300 group"
                >
                  Explore All Products
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  };
  
  export default Home;