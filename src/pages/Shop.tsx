import { useState } from "react";
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

// Define types for the vehicle data
interface VehicleMake {
  id: string;
  name: string;
}

interface VehicleModel {
  name: string;
}

// ✅ UPDATED HELPER FUNCTION
// This function now safely handles items that may not have a 'compare_at_price' field.
const formatCardData = (item: Product | Part) => {
  // Check if 'compare_at_price' exists and has a value
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

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMake, setSelectedMake] = useState(initialMake);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [searchText, setSearchText] = useState(searchParams.get('query') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');

  // Query 1: Fetch from the 'parts' table using a many-to-many relationship
  const { data: parts = [], isLoading: isLoadingParts, isError: isErrorParts } = useQuery({
    queryKey: ['shop-parts', selectedYear, selectedMake, selectedModel, searchQuery],
    queryFn: async () => {
      let query = supabase.from('parts').select(`
        *,
        part_fitments!inner (
          vehicles!inner (
            make,
            model,
            year
          )
        )
      `).eq('is_active', true);

      if (selectedYear) query = query.eq('part_fitments.vehicles.year', parseInt(selectedYear));
      if (selectedMake) query = query.eq('part_fitments.vehicles.make', selectedMake);
      if (selectedModel) query = query.eq('part_fitments.vehicles.model', selectedModel);
      if (searchQuery) query = query.textSearch('fts', `'${searchQuery}'`);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Query 2: Fetch 'products' that do NOT have vehicle fitments
  const { data: generalProducts = [], isLoading: isLoadingProducts, isError: isErrorProducts } = useQuery({
    queryKey: ['shop-general-products', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_fitments!left(product_id)')
        .eq('is_active', true)
        .is('product_fitments.product_id', null);
        
      if (searchQuery) {
        query = query.textSearch('name_description_tsv', `'${searchQuery}'`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // --- Queries for Filter Dropdowns (Unchanged) ---
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
    queryKey: ['vehicle-models', selectedMake],
    queryFn: async () => {
      const makeId = vehicleMakes.find(make => make.name === selectedMake)?.id;
      if (!makeId) return [];
      const { data, error } = await supabase.from('vehicle_models').select('name').eq('make_id', makeId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMake,
  });

  // --- Event Handlers (Unchanged) ---
  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSearchParams(prev => { prev.set('year', value); return prev; });
  };

  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    setSelectedModel('');
    setSearchParams(prev => { prev.set('make', value); prev.delete('model'); return prev; });
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setSearchParams(prev => { prev.set('model', value); return prev; });
  };
  
  const handleTextSearch = () => {
    setSearchQuery(searchText);
    setSearchParams(prev => { prev.set('query', searchText); return prev; });
  };
  
  // Format data using the generic helper
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
            <Select value={selectedMake} onValueChange={handleMakeChange}>
              <SelectTrigger id="make-filter"><SelectValue placeholder="All Makes" /></SelectTrigger>
              <SelectContent>
                {vehicleMakes.map(make => <SelectItem key={make.id} value={make.name}>{make.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="model-filter">Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedMake}>
              <SelectTrigger id="model-filter"><SelectValue placeholder="All Models" /></SelectTrigger>
              <SelectContent>
                {vehicleModels.map(model => <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-1 md:grid-cols-2">
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