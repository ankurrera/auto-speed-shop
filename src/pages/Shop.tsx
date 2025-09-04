/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Database } from "@/database.types";
import { useCart } from "@/contexts/CartContext";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

// Define the specific types from your generated database types
type Product = Database["public"]["Tables"]["products"]["Row"];
type Part = Database["public"]["Tables"]["parts"]["Row"];
type ShopItem =
  | (Product & { type: "product" })
  | (Part & { type: "part" });


// Define types for the vehicle data
interface VehicleMake {
  id: string;
  name: string;
}

interface VehicleModel {
  name: string;
}

// --- Type Guards ---
function isProduct(item: Product | Part): item is Product {
  return (item as Product).category !== undefined;
}

function isPart(item: Product | Part): item is Part {
  return (item as Part).specifications !== undefined;
}

// Helper function to format data for the ProductCard
const formatCardData = (item: Product | Part) => {
  const commonData = {
    id: item.id,
    name: item.name,
    price: Number(item.price),
    image_urls: item.image_urls || [],
    inStock: item.stock_quantity > 0,
    rating: 4.5, // Placeholder value
    reviews: 10,  // Placeholder value
    isOnSale: false, // Placeholder value
  };

  if (isProduct(item)) {
    return {
      ...commonData,
      brand: "Generic", // Placeholder for products without a brand column
      category: item.category || "General",
      is_part: false,
    };
  } else {
    return {
      ...commonData,
      brand: item.brand || "Generic",
      category: undefined, // Parts don't have a category in the same way
      is_part: true,
    };
  }
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const [filterMode, setFilterMode] = useState<"all" | "parts" | "products">(
    (searchParams.get("filterMode") as "all" | "parts" | "products") || "all"
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "newest"
  );
  const [priceRange, setPriceRange] = useState(
    searchParams.get("priceRange") || "all"
  );
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") || "");
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || "");
  const [selectedMake, setSelectedMake] = useState(searchParams.get("make") || "");
  const [selectedModel, setSelectedModel] = useState(searchParams.get("model") || "");
  
  const yearSelectRef = useRef<HTMLDivElement>(null);
  const makeSelectRef = useRef<HTMLDivElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedYear(searchParams.get("year") || "");
    setSelectedMake(searchParams.get("make") || "");
    setSelectedModel(searchParams.get("model") || "");
    setSearchQuery(searchParams.get("query") || "");
    setFilterMode((searchParams.get("filterMode") as "all" | "parts" | "products") || "all");
    setSortOrder(searchParams.get("sortOrder") || "newest");
    setPriceRange(searchParams.get("priceRange") || "all");
  }, [searchParams]);

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


  const fetchParts = async () => {
    const { data, error } = await supabase.from("parts").select("*");
    if (error) throw error;
    return data.map(item => ({ ...item, type: "part" })) as ShopItem[];
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase.from("products").select("*");
    if (error) throw error;
    return data.map(item => ({ ...item, type: "product" })) as ShopItem[];
  };

  const { data: allItems = [], isLoading } = useQuery<ShopItem[]>({
    queryKey: ["shopItems"],
    queryFn: async () => {
      const [parts, products] = await Promise.all([fetchParts(), fetchProducts()]);
      return [...parts, ...products];
    },
    staleTime: 1000 * 60, // 1 minute
  });


  const filteredItems = useMemo(() => {
    let items = allItems;
    
    // Apply vehicle fitment filters
    if (selectedYear) {
      items = items.filter(item => {
        if (isPart(item)) {
          const specs = item.specifications as { year?: string };
          return specs?.year === selectedYear;
        }
        return false;
      });
    }

    if (selectedMake) {
      items = items.filter(item => {
        if (isPart(item)) {
          return item.brand === selectedMake;
        }
        return false;
      });
    }

    if (selectedModel) {
      items = items.filter(item => {
        if (isPart(item)) {
          const specs = item.specifications as { model?: string };
          return specs?.model === selectedModel;
        }
        return false;
      });
    }

    // Apply general filters
    if (filterMode === "parts") {
      items = items.filter(item => item.type === "part");
    } else if (filterMode === "products") {
      items = items.filter(item => item.type === "product");
    }

    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number);
      items = items.filter(item => {
        const itemPrice = Number(item.price);
        return itemPrice >= min && itemPrice <= (max || Infinity);
      });
    }

    if (sortOrder === "newest") {
      items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOrder === "price-asc") {
      items.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortOrder === "price-desc") {
      items.sort((a, b) => Number(b.price) - Number(a.price));
    }
    
    return items;
  }, [allItems, filterMode, priceRange, sortOrder, selectedMake, selectedModel, selectedYear]);

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-50", label: "$0 - $50" },
    { value: "51-100", label: "$51 - $100" },
    { value: "101-200", label: "$101 - $200" },
    { value: "201-", label: "$201+" },
  ];

  const handleFilterModeChange = (mode: "all" | "parts" | "products") => {
    setFilterMode(mode);
    setSearchParams(prev => {
      prev.set("filterMode", mode);
      return prev;
    });
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    setSearchParams(prev => {
      prev.set("sortOrder", value);
      return prev;
    });
  };

  const handlePriceRangeChange = (value: string) => {
    setPriceRange(value);
    setSearchParams(prev => {
      prev.set("priceRange", value);
      return prev;
    });
  };

  const handleSelectChange = (setter: React.Dispatch<React.SetStateAction<string>>, paramName: string, value: string) => {
    setter(value);
    setSearchParams(prev => {
      if (value) {
        prev.set(paramName, value);
      } else {
        prev.delete(paramName);
      }
      return prev;
    });
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Shop All Items</h1>

      {/* Find the Perfect Fit Box */}
      <Card className="mt-6 w-full mx-auto bg-card backdrop-blur-md shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">
            Find the Perfect Fit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedYear} onValueChange={(value) => handleSelectChange(setSelectedYear, "year", value)}>
              <SelectTrigger className="h-12">
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
            
            <Select value={selectedMake} onValueChange={(value) => handleSelectChange(setSelectedMake, "make", value)}>
              <SelectTrigger className="h-12">
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
            
            <Select value={selectedModel} onValueChange={(value) => handleSelectChange(setSelectedModel, "model", value)}>
              <SelectTrigger className="h-12">
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
              
            <Button size="lg" className="h-12 shadow-primary hover:shadow-lg transition-all duration-300">
                <Search className="h-5 w-5 mr-2" />
                Search Items
              </Button>
            </div>
          </CardContent>
        </Card>
      
      {/* Filters and Sorting */}
      <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4 my-8">
        <div className="flex items-center space-x-2">
          <Label>Sort by:</Label>
          <Select value={sortOrder} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Label>Price Range:</Label>
          <Select value={priceRange} onValueChange={handlePriceRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter Mode Buttons */}
      <div className="flex justify-center space-x-4 mb-8">
        <Button
          variant={filterMode === "all" ? "default" : "outline"}
          onClick={() => handleFilterModeChange("all")}
        >
          All Items
        </Button>
        <Button
          variant={filterMode === "parts" ? "default" : "outline"}
          onClick={() => handleFilterModeChange("parts")}
        >
          Parts
        </Button>
        <Button
          variant={filterMode === "products" ? "default" : "outline"}
          onClick={() => handleFilterModeChange("products")}
        >
          Products
        </Button>
      </div>

      {/* Results */}
      <section>
        {isLoading && <p>Loading items...</p>}
        {!isLoading && filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredItems.map((item) => (
              <ProductCard
                key={item.id}
                {...formatCardData(item)}
                onAddToCart={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  addToCart(
                    {
                      id: item.id,
                      name: item.name,
                      price: Number(item.price),
                      image: item.image_urls[0],
                      is_part: item.type === "part",
                      brand: "brand" in item ? (item as Part).brand : undefined,
                      category: "category" in item ? (item as Product).category : undefined,
                    }
                  )
                }}
              />
            ))}
          </div>
        ) : (
          !isLoading && (
            <p className="col-span-full text-center text-muted-foreground">
              No items found matching your criteria.
            </p>
          )
        )}
      </section>
    </div>
  );
};
export default Shop;