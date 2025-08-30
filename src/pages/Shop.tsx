import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Database } from "@/database.types";

// Define the specific types from your generated database types
type Product = Database['public']['Tables']['products']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

// Create a type that includes the joined data
type PartWithVehicles = Part & {
  part_vehicle_compatibility: {
    vehicles: {
      make: string;
      model: string;
      year: number;
    } | null;
  }[];
};

type ProductWithFitments = Product & {
  product_fitments: {
    vehicles: {
      make: string;
      model: string;
      year: number;
    } | null;
  }[];
};

// Define types for the vehicle data
interface VehicleMake {
  id: string;
  name: string;
}

interface VehicleModel {
  name: string;
}

// Helper function to format data for the ProductCard
const formatCardData = (item: Product | Part) => {
  const compareAtPrice = 'compare_at_price' in item && item.compare_at_price 
    ? Number(item.compare_at_price) 
    : undefined;

  return {
    id: item.id,
    name: item.name,
    brand: item.brand || 'Unknown',
    price: Number(item.price),
    originalPrice: compareAtPrice,
    image_urls: item.image_urls || [],
    rating: 4.5, // Dummy data
    reviews: Math.floor(Math.random() * 200) + 50, // Dummy data
    inStock: item.stock_quantity > 0,
    isOnSale: compareAtPrice ? compareAtPrice > Number(item.price) : false,
  };
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialYear = searchParams.get('year') || '';
  const initialMake = searchParams.get('make') || '';
  const initialModel = searchParams.get('model') || '';
  const initialQuery = searchParams.get('query') || '';

  const [searchText, setSearchText] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [selectedMakeId, setSelectedMakeId] = useState('');
  const [selectedMakeName, setSelectedMakeName] = useState(initialMake);

  // Queries for Filter Dropdowns
  const { data: vehicleYears = [] } = useQuery<number[]>({
    queryKey: ['vehicle-years'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicle_years').select('year').order('year', { ascending: false });
      if (error) throw error;
      return data.map(item => item.year);
    }
  });

  const { data: vehicleMakes = [] } = useQuery<VehicleMake[]>({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicle_makes').select('id, name').order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: vehicleModels = [] } = useQuery<VehicleModel[]>({
    queryKey: ['vehicle-models', selectedMakeId],
    queryFn: async () => {
      const { data, error } = await supabase.from('vehicle_models').select('name').eq('make_id', selectedMakeId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMakeId,
  });
  
  useEffect(() => {
    if (initialMake && vehicleMakes.length > 0) {
      const makeId = vehicleMakes.find(make => make.name === initialMake)?.id;
      if (makeId) {
        setSelectedMakeId(makeId);
      }
    }
  }, [initialMake, vehicleMakes]);


  // --- Queries for Parts and Products ---

  const { data: parts = [], isLoading: isLoadingParts, isError: isErrorParts } = useQuery<PartWithVehicles[]>({
    queryKey: ['shop-parts', selectedYear, selectedMakeName, selectedModel, searchQuery],
    queryFn: async () => {
      const hasVehicleFilter = !!(selectedYear || selectedMakeName || selectedModel);
      
      let query = supabase.from('parts').select(`
        *,
        part_vehicle_compatibility!inner(
          vehicles!inner(make, model, year)
        )
      `);
      
      if (hasVehicleFilter) {
        if (selectedYear) query = query.filter('part_vehicle_compatibility.vehicles.year', 'eq', selectedYear);
        if (selectedMakeName) query = query.filter('part_vehicle_compatibility.vehicles.make', 'eq', selectedMakeName);
        if (selectedModel) query = query.filter('part_vehicle_compatibility.vehicles.model', 'eq', selectedModel);
      }
      
      if (searchQuery) query = query.textSearch('fts', `'${searchQuery}'`);
      
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching parts:", error);
        throw error;
      }
      return (data || []) as unknown as PartWithVehicles[];
    },
  });

  const { data: generalProducts = [], isLoading: isLoadingProducts, isError: isErrorProducts } = useQuery<ProductWithFitments[]>({
    queryKey: ['shop-general-products', selectedYear, selectedMakeName, selectedModel, searchQuery],
    queryFn: async () => {
      const hasVehicleFilter = !!(selectedYear || selectedMakeName || selectedModel);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          product_fitments!inner(
            vehicles!inner(make, model, year)
          )
        `)
        .eq('is_active', true);
        
      if (hasVehicleFilter) {
        if (selectedYear) query = query.filter('product_fitments.vehicles.year', 'eq', selectedYear);
        if (selectedMakeName) query = query.filter('product_fitments.vehicles.make', 'eq', selectedMakeName);
        if (selectedModel) query = query.filter('product_fitments.vehicles.model', 'eq', selectedModel);
      }

      if (searchQuery) {
        query = query.textSearch('name_description_tsv', `'${searchQuery}'`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSearchParams(prev => { prev.set('year', value); return prev; }, { replace: true });
  };

  const handleMakeChange = (makeId: string) => {
    const makeName = vehicleMakes.find(m => m.id === makeId)?.name || '';
    setSelectedMakeId(makeId);
    setSelectedMakeName(makeName);
    setSelectedModel('');
    setSearchParams(prev => { 
      prev.set('make', makeName); 
      prev.delete('model'); 
      return prev; 
    }, { replace: true });
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setSearchParams(prev => { prev.set('model', value); return prev; }, { replace: true });
  };
  
  const handleTextSearch = () => {
    setSearchQuery(searchText);
    setSearchParams(prev => { prev.set('query', searchText); return prev; }, { replace: true });
  };
  
  const formattedParts = parts.map(formatCardData);
  const formattedGeneralProducts = generalProducts.map(formatCardData);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Shop</h1>
      
      <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-2">
            <Label htmlFor="year-filter">Year</Label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger id="year-filter"><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent>
                {vehicleYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="make-filter">Make</Label>
            <Select value={selectedMakeId} onValueChange={handleMakeChange}>
              <SelectTrigger id="make-filter"><SelectValue placeholder="All Makes" /></SelectTrigger>
              <SelectContent>
                {vehicleMakes.map(make => <SelectItem key={make.id} value={make.id}>{make.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model-filter">Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedMakeId}>
              <SelectTrigger id="model-filter"><SelectValue placeholder="All Models" /></SelectTrigger>
              <SelectContent>
                {vehicleModels.map(model => <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-1 md:col-span-2">
            <Label htmlFor="search-filter">Search Parts & Products</Label>
            <div className="flex space-x-2">
              <Input
                id="search-filter"
                placeholder="Search by keyword..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSearch()}
              />
              <Button onClick={handleTextSearch}><Search className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>
      
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6">Shop All Parts</h2>
        {isLoadingParts && <p>Loading parts...</p>}
        {isErrorParts && <p className="text-red-500">Error fetching parts.</p>}
        {!isLoadingParts && !isErrorParts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {formattedParts.length > 0 ? (
              formattedParts.map((part) => <ProductCard key={part.id} {...part} />)
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No parts found matching your criteria.</p>
            )}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="text-3xl font-semibold mb-6">Shop All Products</h2>
        {isLoadingProducts && <p>Loading products...</p>}
        {isErrorProducts && <p className="text-red-500">Error fetching products.</p>}
        {!isLoadingProducts && !isErrorProducts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {formattedGeneralProducts.length > 0 ? (
              formattedGeneralProducts.map((product) => <ProductCard key={product.id} {...product} />)
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No general products found.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Shop;