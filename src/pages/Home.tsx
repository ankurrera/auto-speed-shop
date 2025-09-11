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
    <div className="min-h-screen bg-gradient-to-br from-western-sand via-background to-western-tan text-foreground">
      {/* Western Hero Section */}
      <section className="relative h-screen flex items-center justify-center bg-gradient-to-b from-western-sand to-western-tan overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Auto Parts Hero"
            className="w-full h-full object-cover opacity-30" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-western-leather/20 via-transparent to-western-leather/40"></div>
        </div>
        <div className="relative container mx-auto px-6 text-center z-10 max-w-6xl">
          <h1 className="text-5xl md:text-8xl font-sooner font-black text-western-leather leading-tight mb-8 tracking-wide drop-shadow-2xl">
            <span className="text-western-leather drop-shadow-lg">YOUR ULTIMATE</span>
            <br />
            <span className="text-primary font-sooner text-6xl md:text-9xl drop-shadow-xl">AUTO PARTS</span>
            <br />
            <span className="text-western-rust font-sooner drop-shadow-lg">DESTINATION</span>
          </h1>
          <p className="text-xl md:text-2xl text-western-leather font-medium max-w-3xl mx-auto mb-12 drop-shadow-md">
            Discover premium parts and accessories for a ride that reflects your style and performance needs.
          </p>
            
          {/* Western Vehicle Search */}
          <Card className="w-full max-w-4xl mx-auto bg-western-sand/90 border-2 border-western-tan shadow-xl backdrop-blur-sm">
            <CardContent className="p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-sooner font-bold text-western-leather mb-8 text-center tracking-wide">
                FIND THE PERFECT FIT
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="h-12 border-2 border-western-tan bg-western-sand/50 text-western-leather font-medium hover:bg-western-sand transition-colors">
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
                  <SelectTrigger className="h-12 border-2 border-western-tan bg-western-sand/50 text-western-leather font-medium hover:bg-western-sand transition-colors">
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
                  <SelectTrigger className="h-12 border-2 border-western-tan bg-western-sand/50 text-western-leather font-medium hover:bg-western-sand transition-colors">
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
                  
                <Button size="lg" className="h-12 bg-western-rust hover:bg-western-sunset text-white font-sooner font-bold text-lg tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-western-leather/20" onClick={handleSearch}>
                  <Search className="h-5 w-5 mr-2" />
                  SEARCH ITEMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Western Brand Carousel */}
      <BrandCarousel />

      {/* Western Features */}
      <section className="py-20 bg-gradient-to-b from-western-sand/30 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-lg text-western-rust font-sooner font-bold mb-3 tracking-wide">WHY RIDE WITH US?</p>
            <h2 className="text-4xl font-sooner font-black text-western-leather tracking-wide">DRIVEN BY QUALITY, DELIVERED WITH SPEED</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center p-8 bg-western-sand/60 border-2 border-western-tan hover:border-western-rust transition-all duration-300 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="w-16 h-16 bg-western-rust rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-sooner font-bold text-xl text-western-leather tracking-wide">FAST SHIPPING</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <p className="text-western-leather font-medium">Free shipping on orders over $75, nationwide.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8 bg-western-sand/60 border-2 border-western-tan hover:border-western-rust transition-all duration-300 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="w-16 h-16 bg-western-rust rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-sooner font-bold text-xl text-western-leather tracking-wide">QUALITY GUARANTEE</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <p className="text-western-leather font-medium">All parts are backed by a comprehensive warranty.</p>
              </CardContent>
            </Card>
            <Card className="text-center p-8 bg-western-sand/60 border-2 border-western-tan hover:border-western-rust transition-all duration-300 hover:shadow-xl">
              <CardHeader className="p-0">
                <div className="w-16 h-16 bg-western-rust rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="font-sooner font-bold text-xl text-western-leather tracking-wide">EXPERT SUPPORT</CardTitle>
              </CardHeader>
              <CardContent className="p-0 pt-4">
                <p className="text-western-leather font-medium">Get professional advice from our experienced team.</p>
              </CardContent>
            </Card>
            <Link to="/new-arrivals">
              <Card className="text-center p-8 bg-western-sand/60 border-2 border-western-tan hover:border-western-rust transition-all duration-300 hover:shadow-xl cursor-pointer group">
                <CardHeader className="p-0">
                  <div className="w-16 h-16 bg-western-rust rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:bg-western-sunset transition-colors">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="font-sooner font-bold text-xl text-western-leather tracking-wide">NEW ARRIVALS</CardTitle>
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <p className="text-western-leather font-medium">Always the latest and greatest products in stock.</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* Western Featured Products */}
      <section className="py-20 bg-gradient-to-b from-background to-western-sand/20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-sooner font-black text-western-leather tracking-wide">FEATURED PRODUCTS</h2>
            <p className="text-western-leather font-medium max-w-3xl mx-auto mt-6 text-lg">
              Top-rated parts chosen by our experts for your car's best performance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product} 
                className="hover:border-western-rust transition-all duration-300 hover:shadow-xl bg-western-sand/30"
              />
            ))}
          </div>
          
          <div className="text-center mt-16">
            <Button size="lg" variant="default" className="px-10 py-4 bg-western-rust hover:bg-western-sunset text-white font-sooner font-bold text-lg tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-western-leather/20">
              EXPLORE ALL PRODUCTS
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
  };
  
  export default Home;