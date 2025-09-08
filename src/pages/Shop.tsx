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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from "@/database.types";
import { useCart } from "@/contexts/CartContext";
import { Search } from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedYear, setSelectedYear] = useState(searchParams.get("year") || "all");
  const [selectedMake, setSelectedMake] = useState(searchParams.get("make") || "all");
  const [selectedModel, setSelectedModel] = useState(searchParams.get("model") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "all");
  
  const yearSelectRef = useRef<HTMLDivElement>(null);
  const makeSelectRef = useRef<HTMLDivElement>(null);
  const modelSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedYear(searchParams.get("year") || "all");
    setSelectedMake(searchParams.get("make") || "all");
    setSelectedModel(searchParams.get("model") || (searchParams.get("make") ? "all" : ""));
    setSelectedBrand(searchParams.get("brand") || "all");
    setFilterMode((searchParams.get("filterMode") as "all" | "parts" | "products") || "all");
    setSortOrder(searchParams.get("sortOrder") || "newest");
    setPriceRange(searchParams.get("priceRange") || "all");
    setSearchQuery(searchParams.get("q") || "");
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
      if (!selectedMake || selectedMake === 'all') return [];
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
    enabled: !!selectedMake && selectedMake !== 'all',
  });

  // Automotive brands for brand filtering
  const automotiveBrands = [
    "Audi", "BMW", "Chevrolet", "Ford", "Honda", "Mazda", 
    "Mercedes", "Nissan", "Subaru", "Toyota"
  ];


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

    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply vehicle fitment filters
    if (selectedYear && selectedYear !== 'all') {
      items = items.filter(item => {
        if (isPart(item)) {
          const specs = item.specifications as { year?: string };
          return specs?.year === selectedYear;
        }
        return true; // Keep products in the list
      });
    }

    if (selectedMake && selectedMake !== 'all') {
      items = items.filter(item => {
        if (isPart(item)) {
          return item.brand === selectedMake;
        }
        return true; // Keep products in the list
      });
    }

    if (selectedModel && selectedModel !== 'all') {
      items = items.filter(item => {
        if (isPart(item)) {
          const specs = item.specifications as { model?: string };
          return specs?.model === selectedModel;
        }
        return true; // Keep products in the list
      });
    }

    // Apply brand filtering (separate from vehicle make filtering)
    if (selectedBrand && selectedBrand !== 'all') {
      items = items.filter(item => {
        if (isPart(item)) {
          return item.brand === selectedBrand;
        }
        return true; // Keep products in the list
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
  }, [allItems, filterMode, priceRange, sortOrder, selectedMake, selectedModel, selectedYear, selectedBrand, searchQuery]);

  const priceRanges = [
    { value: "all", label: "All Prices" },
    { value: "0-50", label: "$0 - $50" },
    { value: "51-100", label: "$51 - $100" },
    { value: "101-200", label: "$101 - $200" },
    { value: "201-", label: "$201+" },
  ];

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setSearchParams(prev => {
      if (query) {
        prev.set("q", query);
      } else {
        prev.delete("q");
      }
      return prev;
    });
  };

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
      if (value && value !== 'all') {
        prev.set(paramName, value);
      } else {
        prev.delete(paramName);
      }
      return prev;
    });
  };
  
  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    const newModel = value === 'all' ? '' : 'all';
    setSelectedModel(newModel);
    setSearchParams(prev => {
      if (value === 'all') {
        prev.delete("make");
        prev.delete("model");
      } else {
        prev.set("make", value);
        prev.set("model", "all");
      }
      return prev;
    });
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSearchParams(prev => {
      if (value === 'all') {
        prev.delete("brand");
      } else {
        prev.set("brand", value);
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
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Shop All Items</h1>
        <div className="relative w-full md:w-1/3 mt-4 md:mt-0">
          <Input
            type="search"
            placeholder="Search for items..."
            className="pl-10"
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </span>
        </div>
      </div>

      {/* Find the Perfect Fit Box */}
      <Card className="mt-6 w-full mx-auto bg-card backdrop-blur-md shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-foreground mb-4">
            Find the Perfect Fit
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedYear} onValueChange={(value) => handleSelectChange(setSelectedYear, "year", value)}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent
                ref={yearSelectRef}
                onMouseEnter={() => handleMouseEnter(yearSelectRef)}
              >
                <SelectItem value="all">All Years</SelectItem>
                {vehicleYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedMake} onValueChange={handleMakeChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent
                ref={makeSelectRef}
                onMouseEnter={() => handleMouseEnter(makeSelectRef)}
              >
                <SelectItem value="all">All Makes</SelectItem>
                {vehicleMakes.map(make => (
                  <SelectItem key={make.name} value={make.name}>
                    {make.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedModel} 
              onValueChange={(value) => handleSelectChange(setSelectedModel, "model", value)}
              disabled={!selectedMake || selectedMake === 'all'}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent
                ref={modelSelectRef}
                onMouseEnter={() => handleMouseEnter(modelSelectRef)}
              >
                <SelectItem value="all">All Models</SelectItem>
                {vehicleModels.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Label>Brand:</Label>
          <Select value={selectedBrand} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {automotiveBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
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