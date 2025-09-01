import { useState, useEffect, useMemo } from "react";
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
import { Label } from "@/components/ui/label";
import { Database } from "@/database.types";
import { useCart } from "@/contexts/CartContext";

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
  const compareAtPrice =
    "compare_at_price" in item && item.compare_at_price
      ? Number(item.compare_at_price)
      : undefined;

  let category: string | null = null;
  let brand: string = "Unknown";

  if (isPart(item)) {
    brand = item.brand || "Unknown";
    if (
      item.specifications &&
      typeof item.specifications === "object" &&
      item.specifications !== null &&
      "category" in item.specifications
    ) {
      const specCategory = item.specifications.category;
      if (typeof specCategory === "string") {
        category = specCategory;
      }
    }
  } else if (isProduct(item)) {
    if (typeof item.category === "string") {
      category = item.category;
    }
    brand = category || "Product";
  }

  return {
    id: item.id,
    name: item.name,
    brand,
    price: Number(item.price),
    originalPrice: compareAtPrice,
    image_urls: item.image_urls || [],
    rating: 4.5,
    reviews: Math.floor(Math.random() * 200) + 50,
    inStock: item.stock_quantity > 0,
    isOnSale: compareAtPrice ? compareAtPrice > Number(item.price) : false,
    category,
  };
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialYear = searchParams.get("year") || "";
  const initialMake = searchParams.get("make") || "";
  const initialModel = searchParams.get("model") || "";
  const initialQuery = searchParams.get("query") || "";

  const [searchText, setSearchText] = useState(initialQuery);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedModel, setSelectedModel] = useState(initialModel);
  const [selectedMakeId, setSelectedMakeId] = useState("");
  const [selectedMakeName, setSelectedMakeName] = useState(initialMake);
  const [filterMode, setFilterMode] = useState<"all" | "parts" | "products">("all");

  const { addToCart } = useCart();

  // Vehicle Queries
  const { data: vehicleYears = [] } = useQuery<number[]>({
    queryKey: ["vehicle-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_years")
        .select("year")
        .order("year", { ascending: false });
      if (error) throw error;
      return data.map((item) => item.year);
    },
  });

  const { data: vehicleMakes = [] } = useQuery<VehicleMake[]>({
    queryKey: ["vehicle-makes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_makes")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicleModels = [] } = useQuery<VehicleModel[]>({
    queryKey: ["vehicle-models", selectedMakeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicle_models")
        .select("name")
        .eq("make_id", selectedMakeId)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedMakeId,
  });

  useEffect(() => {
    if (initialMake && vehicleMakes.length > 0) {
      const makeId = vehicleMakes.find((make) => make.name === initialMake)?.id;
      if (makeId) {
        setSelectedMakeId(makeId);
      }
    }
  }, [initialMake, vehicleMakes]);

  // --- Parts Query ---
  const { data: parts = [], isLoading: isLoadingParts } = useQuery<Part[]>({
    queryKey: ["shop-parts", selectedYear, selectedMakeName, selectedModel, searchQuery],
    queryFn: async () => {
      let yearId = null;
      let makeId = null;
      let modelId = null;

      if (selectedYear) {
        const { data } = await supabase
          .from("vehicle_years")
          .select("id")
          .eq("year", parseInt(selectedYear, 10))
          .maybeSingle();
        if (data) yearId = data.id;
      }

      if (selectedMakeName) {
        const foundMake = vehicleMakes.find((m) => m.name === selectedMakeName);
        if (foundMake) makeId = foundMake.id;
      }

      if (selectedModel && makeId) {
        const { data } = await supabase
          .from("vehicle_models")
          .select("id")
          .eq("name", selectedModel)
          .eq("make_id", makeId)
          .maybeSingle();
        if (data) modelId = data.id;
      }

      if ((selectedYear || selectedMakeName || selectedModel) && (!yearId && !makeId && !modelId)) {
        return [];
      }

      const { data: rpcData, error } = await supabase.rpc("search_parts_with_fitment", {
        search_query: searchQuery,
        year_id_param: yearId,
        make_id_param: makeId,
        model_id_param: modelId,
      });

      if (error) {
        console.error("Error with RPC for parts:", error);
        return [];
      }
      const partIds = rpcData.map((row) => row.part_id);
      if (partIds.length === 0) return [];
      const { data: partsData, error: partsError } = await supabase
        .from("parts")
        .select("*")
        .in("id", partIds);
      if (partsError) throw partsError;
      return partsData;
    },
  });

  // --- Products Query ---
  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["shop-products", selectedYear, selectedMakeName, selectedModel, searchQuery],
    queryFn: async () => {
      let yearId = null;
      let makeId = null;
      let modelId = null;

      if (selectedYear) {
        const { data } = await supabase
          .from("vehicle_years")
          .select("id")
          .eq("year", parseInt(selectedYear, 10))
          .maybeSingle();
        if (data) yearId = data.id;
      }

      if (selectedMakeName) {
        const foundMake = vehicleMakes.find((m) => m.name === selectedMakeName);
        if (foundMake) makeId = foundMake.id;
      }

      if (selectedModel && makeId) {
        const { data } = await supabase
          .from("vehicle_models")
          .select("id")
          .eq("name", selectedModel)
          .eq("make_id", makeId)
          .maybeSingle();
        if (data) modelId = data.id;
      }

      if ((selectedYear || selectedMakeName || selectedModel) && (!yearId && !makeId && !modelId)) {
        return [];
      }

      const { data: rpcData, error } = await supabase.rpc("search_products_with_fitment", {
        search_query: searchQuery,
        year_id_param: yearId,
        make_id_param: makeId,
        model_id_param: modelId,
      });

      if (error) {
        console.error("Error with RPC for products:", error);
        return [];
      }
      const productIds = rpcData.map((row) => row.product_id);
      if (productIds.length === 0) return [];
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);
      if (productsError) throw productsError;
      return productsData;
    },
  });

  const allResults: ShopItem[] = useMemo(() => {
  const combined: ShopItem[] = [];

  if (filterMode === "all" || filterMode === "parts") {
    combined.push(...(parts || []).map((p) => ({ ...p, type: "part" as const })));
  }
  if (filterMode === "all" || filterMode === "products") {
    combined.push(...(products || []).map((p) => ({ ...p, type: "product" as const })));
  }

  return combined;
}, [parts, products, filterMode]);

  const isLoading = isLoadingParts || isLoadingProducts;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">Shop</h1>

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
        {/* Year/Make/Model Filters (unchanged) */}
        {/* ... */}
      </div>

      {/* Filter Mode Buttons */}
      <div className="flex space-x-4 mb-8 justify-center">
        <Button
          variant={filterMode === "all" ? "default" : "outline"}
          onClick={() => setFilterMode("all")}
        >
          All Items
        </Button>
        <Button
          variant={filterMode === "parts" ? "default" : "outline"}
          onClick={() => setFilterMode("parts")}
        >
          Parts
        </Button>
        <Button
          variant={filterMode === "products" ? "default" : "outline"}
          onClick={() => setFilterMode("products")}
        >
          Products
        </Button>
      </div>

      {/* Results */}
      <section>
        {isLoading && <p>Loading items...</p>}
        {!isLoading && allResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {allResults.map((item) => (
              <ProductCard
                key={item.id}
                {...formatCardData(item)}
                onAddToCart={() =>
                  addToCart(
                    {
                      id: item.id,
                      name: item.name,
                      price: Number(item.price),
                      image: item.image_urls[0],
                      is_part: item.type === "part",
                      brand: "brand" in item ? (item as Part).brand : undefined,
                      category: "category" in item ? (item as Product).category : undefined,
                    },
                    1
                  )
                }
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
