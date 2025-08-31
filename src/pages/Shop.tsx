import { useState, useEffect, useMemo } from "react";
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
type Vehicle = Database['public']['Tables']['vehicles']['Row'];

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
  const [filterMode, setFilterMode] = useState<'all' | 'parts' | 'products'>('all');

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


  // --- NEW: Memoized IDs for queries to avoid multiple lookups ---
  const filterIds = useMemo(async () => {
    let yearId = null;
    let makeId = null;
    let modelId = null;

    if (selectedYear) {
      const { data } = await supabase.from('vehicle_years').select('id').eq('year', parseInt(selectedYear, 10)).maybeSingle();
      if (data) yearId = data.id;
    }

    if (selectedMakeName) {
      const foundMake = vehicleMakes.find(m => m.name === selectedMakeName);
      if (foundMake) makeId = foundMake.id;
    }

    if (selectedModel && makeId) {
      const { data } = await supabase.from('vehicle_models').select('id').eq('name', selectedModel).eq('make_id', makeId).maybeSingle();
      if (data) modelId = data.id;
    }

    return { yearId, makeId, modelId };
  }, [selectedYear, selectedMakeName, selectedModel, vehicleMakes]);


  // --- UPDATED useQuery Hooks ---
  const { data: parts = [], isLoading: isLoadingParts } = useQuery<Part[]>({
    queryKey: ['shop-parts', filterIds, searchQuery],
    queryFn: async () => {
        const { yearId, makeId, modelId } = await filterIds;

        const { data: rpcData, error } = await supabase.rpc('search_parts_with_fitment', {
            search_query: searchQuery,
            year_id_param: yearId,
            make_id_param: makeId,
            model_id_param: modelId
        });
        if (error) {
            console.error('Error with RPC for parts:', error);
            return [];
        }
        const partIds = rpcData.map(row => row.part_id);
        if (partIds.length === 0) return [];
        const { data: partsData, error: partsError } = await supabase
            .from('parts')
            .select('*')
            .in('id', partIds);
        if (partsError) throw partsError;
        return partsData;
    },
    enabled: !!filterIds,
});

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ['shop-products', filterIds, searchQuery],
    queryFn: async () => {
        const { yearId, makeId, modelId } = await filterIds;

        const { data: rpcData, error } = await supabase.rpc('search_products_with_fitment', {
            search_query: searchQuery,
            year_id_param: yearId,
            make_id_param: makeId,
            model_id_param: modelId
        });
        if (error) {
            console.error('Error with RPC for products:', error);
            return [];
        }
        const productIds = rpcData.map(row => row.product_id);
        if (productIds.length === 0) return [];
        const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('*')
            .in('id', productIds);
        if (productsError) throw productsError;
        return productsData;
    },
    enabled: !!filterIds,
});

  const allResults = useMemo(() => {
    const combined = [];
    if (filterMode === 'all' || filterMode === 'parts') {
      combined.push(...(parts || []).map(p => ({ ...p, type: 'part' })));
    }
    if (filterMode === 'all' || filterMode === 'products') {
      combined.push(...(products || []).map(p => ({ ...p, type: 'product' })));
    }
    return combined;
  }, [parts, products, filterMode]);

  const isLoading = isLoadingParts || isLoadingProducts;

  const handleYearChange = (value: string) => {
    setSelectedYear(value);
    setSearchParams(prev => { prev.set('year', value); return prev; }, { replace: true });
  };

  const handleMakeChange = (value: string) => {
    setSelectedMakeName(value);
    setSelectedModel('');
    setSearchParams(prev => { 
      prev.set('make', value); 
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Shop</h1>
      
      <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-center items-end md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Year Filter */}
          <div className="space-y-2">
            <Label htmlFor="year-filter">Year</Label>
            <Select value={selectedYear} onValueChange={handleYearChange}>
              <SelectTrigger id="year-filter"><SelectValue placeholder="All Years" /></SelectTrigger>
              <SelectContent>
                {vehicleYears.map(year => <SelectItem key={year} value={year.toString()}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Make Filter */}
          <div className="space-y-2">
            <Label htmlFor="make-filter">Make</Label>
            <Select value={selectedMakeName} onValueChange={handleMakeChange}>
              <SelectTrigger id="make-filter"><SelectValue placeholder="All Makes" /></SelectTrigger>
              <SelectContent>
                {vehicleMakes.map(make => <SelectItem key={make.name} value={make.name}>{make.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {/* Model Filter */}
          <div className="space-y-2">
            <Label htmlFor="model-filter">Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange} disabled={!selectedMakeId}>
              <SelectTrigger id="model-filter"><SelectValue placeholder="All Models" /></SelectTrigger>
              <SelectContent>
                {vehicleModels.map(model => <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-8 justify-center">
        <Button
          variant={filterMode === 'all' ? 'default' : 'outline'}
          onClick={() => setFilterMode('all')}
        >
          All Items
        </Button>
        <Button
          variant={filterMode === 'parts' ? 'default' : 'outline'}
          onClick={() => setFilterMode('parts')}
        >
          Parts
        </Button>
        <Button
          variant={filterMode === 'products' ? 'default' : 'outline'}
          onClick={() => setFilterMode('products')}
        >
          Products
        </Button>
      </div>

      <section>
        {isLoading && <p>Loading items...</p>}
        {!isLoading && allResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allResults.map((item) => (
              <ProductCard key={item.id} {...formatCardData(item)} />
            ))}
          </div>
        ) : (
          !isLoading && <p className="col-span-full text-center text-muted-foreground">No items found matching your criteria.</p>
        )}
      </section>
    </div>
  );
};

export default Shop;