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

  const yearSelectRef = useRef<HTMLDivElement>(null);
  const makeSelectRef = useRef<HTMLDivElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

  // Fetch featured products and parts from Supabase
  // We use the new Product type to ensure the data is correctly structured
  const { data: featuredProducts = [] } = useQuery<Product[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      // Fetch featured products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(2);
      
      if (productsError) throw productsError;

      // Fetch featured parts
      const { data: parts, error: partsError } = await supabase
        .from('parts')
        .select('*')
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(2);
      
      if (partsError) throw partsError;
      
      // Transform products data
      const transformedProducts = (products || []).map(product => ({
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
        className: "hover:scale-105 transition-transform duration-300 animate-fade-in-up"
      }));

      // Transform parts data to match Product interface
      const transformedParts = (parts || []).map(part => ({
        id: part.id,
        name: part.name,
        brand: part.brand || 'Unknown',
        price: Number(part.price),
        originalPrice: undefined, // Parts don't have compare_at_price
        image_urls: part.image_urls || [],
        rating: 4.5,
        reviews: Math.floor(Math.random() * 200) + 50,
        inStock: part.stock_quantity > 0,
        isOnSale: false, // Parts don't have sales in current schema
        className: "hover:scale-105 transition-transform duration-300 animate-fade-in-up"
      }));

      // Combine and return up to 4 items
      return [...transformedProducts, ...transformedParts].slice(0, 4);
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section - Redesigned with prominent image and clean text block */}
      <section className="relative min-h-[80vh] flex items-center bg-background overflow-hidden">
        <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <div className="space-y-8 lg:order-1">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                <span className="text-foreground">Premium</span>
                <br />
                <span className="text-primary">Auto Parts</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Discover high-quality automotive parts and accessories engineered for performance, reliability, and style.
              </p>
            </div>
            
            <Button size="lg" className="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-3 text-lg font-medium shadow-lg">
              Explore Products
            </Button>
          </div>
          
          {/* Right: Hero Image */}
          <div className="lg:order-2">
            <div className="relative">
              <img
                src={heroImage}
                alt="Premium Auto Parts"
                className="w-full h-[500px] object-cover rounded-lg shadow-lg" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
            </div>
          </div>
        </div>
        
        {/* Vehicle Search Tool - Clean horizontal module */}
        <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white dark:bg-card rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                Find the Perfect Fit
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-11 bg-secondary/50">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent
                    ref={yearSelectRef}
                    onMouseEnter={() => handleMouseEnter(yearSelectRef)}
                  >
                    {vehicleYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger className="h-11 bg-secondary/50">
                    <SelectValue placeholder="Make" />
                  </SelectTrigger>
                  <SelectContent
                    ref={makeSelectRef}
                    onMouseEnter={() => handleMouseEnter(makeSelectRef)}
                  >
                    {vehicleMakes.map(make => (
                      <SelectItem key={make.name} value={make.name}>
                        {make.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger className="h-11 bg-secondary/50">
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent
                    ref={modelSelectRef}
                    onMouseEnter={() => handleMouseEnter(modelSelectRef)}
                  >
                    {vehicleModels.map(model => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                  
                <Button size="lg" className="h-11 bg-primary hover:bg-primary-hover shadow-md" onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Parts
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Carousel */}
      <BrandCarousel />

      {/* Why Choose Us - Two-column layout with image and features */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left: Large Image */}
            <div className="space-y-6">
              <div className="relative">
                <img
                  src={heroImage}
                  alt="Quality Auto Parts"
                  className="w-full h-[400px] object-cover rounded-lg shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg"></div>
              </div>
            </div>
            
            {/* Right: Features List */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="mb-2 text-primary bg-primary/10">Why Choose Us?</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Driven by Quality, Delivered with Excellence
                </h2>
                <p className="text-muted-foreground text-lg">
                  Experience the difference with our premium automotive solutions.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Fast Shipping</h3>
                    <p className="text-muted-foreground">Free shipping on orders over $75, with nationwide delivery.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Quality Guarantee</h3>
                    <p className="text-muted-foreground">All parts backed by comprehensive warranty and quality assurance.</p>
                  </div>
                </div>
                
                <Link to="/contact" className="block">
                  <div className="flex items-start space-x-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Wrench className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Expert Support</h3>
                      <p className="text-muted-foreground">Professional advice from our experienced automotive team.</p>
                    </div>
                  </div>
                </Link>
                
                <Link to="/new-arrivals" className="block">
                  <div className="flex items-start space-x-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">New Arrivals</h3>
                      <p className="text-muted-foreground">Latest automotive innovations and cutting-edge products.</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Collections - Enhanced product section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="secondary" className="mb-2 text-primary bg-primary/10">Featured</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Curated Collections</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Handpicked parts and accessories chosen by our experts for superior performance and reliability.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product} 
                className="hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-lg bg-white dark:bg-card border border-border hover:border-primary/20"
              />
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300" asChild>
              <Link to="/shop">View All Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
  };
  
  export default Home;