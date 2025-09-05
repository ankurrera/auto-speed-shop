// Custom hook for products and parts management logic
import { useState, useCallback, ChangeEvent, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { 
  Product, 
  Part, 
  PartWithSpecs, 
  ProductInfo, 
  VehicleMake, 
  VehicleModel, 
  ListingType,
  PartSpecifications 
} from "@/types/account";
import { defaultProductInfo } from "@/constants/account";

export const useProducts = (sellerId: string | null) => {
  const [listingType, setListingType] = useState<ListingType>("part");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo>(defaultProductInfo);
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Queries for Filter Dropdowns
  const { data: vehicleYears = [] } = useQuery({
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
    queryKey: ['vehicle-models', productInfo.make],
    queryFn: async () => {
      const makeId = vehicleMakes.find(make => make.name === productInfo.make)?.id;
      if (!makeId) return [];
      const { data, error } = await supabase.from('vehicle_models').select('name').eq('make_id', makeId).order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!productInfo.make,
  });

  // Queries for Products and Parts
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase.from('products').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const { data: parts = [] } = useQuery<PartWithSpecs[]>({
    queryKey: ['seller-parts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const { data, error } = await supabase.from('parts').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId,
  });

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setProductFiles(files);
    const imageUrls = files.map(file => URL.createObjectURL(file));
    setProductInfo(prev => ({
        ...prev,
        image_urls: [...prev.image_urls, ...imageUrls]
    }));
  };

  const removeImage = (index: number) => {
      setProductInfo(prev => {
          const newUrls = [...prev.image_urls];
          newUrls.splice(index, 1);
          return { ...prev, image_urls: newUrls };
      });
      setProductFiles(prev => {
          const newFiles = [...prev];
          newFiles.splice(index, 1);
          return newFiles;
      });
  };

  const handleEditProduct = (product: Product | Part) => {
    setEditingProductId(product.id);
    setListingType('seller_id' in product ? 'part' : 'product');

    let specs: PartSpecifications = {};
    if (product.specifications) {
        if (typeof product.specifications === 'string') {
            try {
                specs = JSON.parse(product.specifications);
            } catch (error) {
                console.error("Failed to parse specifications, treating as raw string:", error);
                specs = { additional: product.specifications };
            }
        } else if (typeof product.specifications === 'object') {
            if (product.specifications !== null) {
                specs = product.specifications as PartSpecifications;
            } else {
                specs = {};
            }
        }
    }

    setProductInfo({
        name: product.name,
        description: product.description || "",
        price: product.price?.toString() || "",
        stock_quantity: product.stock_quantity || 0,
        image_urls: product.image_urls || [],
        specifications: specs.additional || "",
        category: specs.category || ('category' in product ? product.category : "") || "",
        make: specs.make || "",
        model: specs.model || "",
        year: specs.year || "",
        vin: specs.vin || ""
    });
  };

  const handleEditPart = (part: PartWithSpecs) => {
    setEditingProductId(part.id);
    const specs = part.specifications;
    setProductInfo({
        name: part.name,
        description: part.description || "",
        price: part.price?.toString() || "",
        stock_quantity: part.stock_quantity || 0,
        image_urls: part.image_urls || [],
        specifications: specs?.additional || "",
        category: specs?.category || "",
        make: part.brand || "",
        model: specs?.model || "",
        year: specs?.year || "",
        vin: specs?.vin || ""
    });
    setListingType("part");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Product has been deleted." });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete product.", variant: "destructive" });
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase.from("parts").delete().eq("id", partId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Success!", description: "Part has been deleted." });
      queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to delete part.", variant: "destructive" });
    },
  });

  const archiveProductMutation = useMutation({
    mutationFn: async ({ productId, is_active }: { productId: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active: !is_active }).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `Product has been ${variables.is_active ? 'archived' : 'unarchived'}.` });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update product status.", variant: "destructive" });
    },
  });

  const archivePartMutation = useMutation({
    mutationFn: async ({ partId, is_active }: { partId: string; is_active: boolean }) => {
      const { error } = await supabase.from("parts").update({ is_active: !is_active }).eq("id", partId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast({ title: "Success!", description: `Part has been ${variables.is_active ? 'archived' : 'unarchived'}.` });
      queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: "Failed to update part status.", variant: "destructive" });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleDeletePart = (partId: string) => {
    if (window.confirm("Are you sure you want to delete this part?")) {
      deletePartMutation.mutate(partId);
    }
  };

  const handleArchiveProduct = (productId: string, is_active: boolean) => {
    archiveProductMutation.mutate({ productId, is_active });
  };

  const handleArchivePart = (partId: string, is_active: boolean) => {
    archivePartMutation.mutate({ partId, is_active });
  };

  const cleanupAndRefetch = () => {
    setEditingProductId(null);
    setProductInfo(defaultProductInfo);
    setProductFiles([]);
    queryClient.invalidateQueries({ queryKey: ['seller-products'] });
    queryClient.invalidateQueries({ queryKey: ['seller-parts'] });
  };

  // Filter logic
  const filteredParts = parts.filter(part => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const partSpecs = JSON.stringify(part.specifications || {});
    const partString = `${part.name} ${part.brand} ${part.part_number} ${partSpecs}`.toLowerCase();
    return partString.includes(lowercasedQuery);
  });

  const filteredProducts = products.filter(product => {
    const lowercasedQuery = searchQuery.toLowerCase();
    const productString = `${product.name} ${product.brand} ${product.category} ${product.part_number} ${product.sku} ${product.specifications || ''}`.toLowerCase();
    return productString.includes(lowercasedQuery);
  });

  return {
    // State
    listingType,
    setListingType,
    editingProductId,
    setEditingProductId,
    productInfo,
    setProductInfo,
    productFiles,
    setProductFiles,
    searchQuery,
    setSearchQuery,
    
    // Data
    vehicleYears,
    vehicleMakes,
    vehicleModels,
    products,
    parts,
    filteredParts,
    filteredProducts,
    
    // Actions
    handleImageUpload,
    removeImage,
    handleEditProduct,
    handleEditPart,
    handleDeleteProduct,
    handleDeletePart,
    handleArchiveProduct,
    handleArchivePart,
    cleanupAndRefetch,
  };
};