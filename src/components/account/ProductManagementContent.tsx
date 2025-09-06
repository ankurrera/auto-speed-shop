/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, ChangeEvent, FormEvent } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Edit, Archive, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import {
  PartSpecifications,
  PartWithSpecs,
  Product,
  ProductInfo,
  categories,
} from "./types";

interface ProductManagementContentProps {
  userInfo: any;
}

const ProductManagementContent = ({ userInfo }: ProductManagementContentProps) => {
  // State management
  const [listingType, setListingType] = useState("part");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productInfo, setProductInfo] = useState<ProductInfo>({
    name: "",
    description: "",
    price: "",
    stock_quantity: 0,
    image_urls: [],
    specifications: "",
    category: "",
    make: "",
    model: "",
    year: "",
    vin: "",
  });
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  // Fetch seller ID
  const { data: sellerData } = useQuery({
    queryKey: ['seller-id', userInfo?.id],
    queryFn: async () => {
      if (!userInfo?.id) return null;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;
      
      const { data, error } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error('Error fetching seller ID:', error);
        return null;
      }
      
      // Update local state for backward compatibility with form submissions
      setSellerId(data.id);
      return data;
    },
    enabled: !!userInfo?.id,
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['seller-products', sellerData?.id],
    queryFn: async () => {
      if (!sellerData?.id) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', sellerData.id);
      
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!sellerData?.id,
  });

  // Fetch parts
  const { data: parts = [] } = useQuery({
    queryKey: ['seller-parts', sellerData?.id],
    queryFn: async () => {
      if (!sellerData?.id) return [];
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('seller_id', sellerData.id);
      
      if (error) throw error;
      return data as PartWithSpecs[];
    },
    enabled: !!sellerData?.id,
  });

  // Fetch vehicle data
  const { data: vehicleYears = [] } = useQuery({
    queryKey: ['vehicle-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_years')
        .select('year')
        .order('year', { ascending: false });
      
      if (error) throw error;
      return data.map(item => item.year);
    },
  });

  const { data: vehicleMakes = [] } = useQuery({
    queryKey: ['vehicle-makes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_makes')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: vehicleModels = [] } = useQuery({
    queryKey: ['vehicle-models', productInfo.make],
    queryFn: async () => {
      if (!productInfo.make) return [];
      const makeId = vehicleMakes.find(m => m.name === productInfo.make)?.id;
      if (!makeId) return [];
      
      const { data, error } = await supabase
        .from('vehicle_models')
        .select('name')
        .eq('make_id', makeId)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!productInfo.make && vehicleMakes.length > 0,
  });

  // Product submission handler
  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("You must be logged in to list a product.");
      return;
    }

    let currentSellerId = sellerId;
    if (!currentSellerId) {
      console.log("Seller ID not found in state, fetching...");
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', session.user.id)
        .single();
      if (sellerError) {
        console.error('Error fetching seller ID:', sellerError);
        toast.error("Could not find seller ID. Please check your account settings.");
        return;
      }
      currentSellerId = sellerData.id;
      setSellerId(currentSellerId);
    }
    console.log("Using Seller ID:", currentSellerId);

    const imageUrls: string[] = [];
    try {
      if (productFiles.length > 0) {
        const bucketName = listingType === 'part' ? 'part_images' : 'products_images';
        for (const file of productFiles) {
          const fileExtension = file.name.split('.').pop();
          const filePath = `${session.user.id}/${uuidv4()}.${fileExtension}`;
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file, { upsert: true });
          if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);
          imageUrls.push(publicUrlData.publicUrl);
        }
      }
    } catch (uploadError) {
      console.error('Image upload failed:', uploadError);
      toast.error("Image upload failed. Please try again.");
      return;
    }

    const finalImageUrls = editingProductId ? [...productInfo.image_urls, ...imageUrls] : imageUrls;

    let vehicleId: string | null = null;
    if (productInfo.year && productInfo.make && productInfo.model) {
      try {
        const makeId = vehicleMakes.find(m => m.name === productInfo.make)?.id;
        if (!makeId) {
          console.error("Error: Could not find make ID for name:", productInfo.make);
          toast.error("Selected vehicle make not found in database.");
          return;
        }

        const { data: yearIdRow, error: yearError } = await supabase
          .from('vehicle_years')
          .select('id')
          .eq('year', parseInt(productInfo.year, 10))
          .single();
        if (yearError) {
          console.error("Error fetching vehicle year ID:", yearError);
          toast.error("Selected vehicle year not found in database.");
          return;
        }

        const { data: modelIdRow, error: modelError } = await supabase
          .from('vehicle_models')
          .select('id')
          .eq('name', productInfo.model)
          .eq('make_id', makeId)
          .single();
        if (modelError) {
          console.error("Error fetching vehicle model ID:", modelError);
          toast.error("Selected vehicle model not found in database.");
          return;
        }

        const { data: existingVehicle, error: existingVehicleError } = await supabase
          .from('vehicles_new')
          .select('id')
          .eq('make_id', makeId)
          .eq('model_id', modelIdRow.id)
          .eq('year_id', yearIdRow.id)
          .single();

        if (existingVehicleError && existingVehicleError.code !== 'PGRST116') {
          console.error('Error checking for existing vehicle:', existingVehicleError);
          throw new Error(`Error checking for existing vehicle: ${existingVehicleError.message}`);
        }

        if (existingVehicle) {
          vehicleId = existingVehicle.id;
          console.log("Existing vehicle found:", vehicleId);
        } else {
          console.log("No existing vehicle found, attempting to create new one.");
          const { data: newVehicle, error: newVehicleError } = await supabase
            .from('vehicles_new')
            .insert({ make_id: makeId, model_id: modelIdRow.id, year_id: yearIdRow.id })
            .select('id')
            .single();

          if (newVehicleError) {
            console.error(`Failed to create new vehicle:`, newVehicleError);
            throw new Error(`Failed to create new vehicle: ${newVehicleError.message}`);
          }
          vehicleId = newVehicle.id;
          console.log("New vehicle created:", vehicleId);
        }
      } catch (e: any) {
        console.error("Vehicle compatibility logic failed:", e);
        toast.error(`Failed to process vehicle compatibility. Details: ${e.message}`);
        return;
      }
    }

    const cleanupAndRefetch = () => {
      setEditingProductId(null);
      setProductInfo({
        name: "", description: "", price: "", stock_quantity: 0, image_urls: [],
        specifications: "", category: "", make: "", model: "", year: "", vin: "",
      });
      setProductFiles([]);
      queryClient.invalidateQueries({ queryKey: ['seller-products', sellerData?.id] });
      queryClient.invalidateQueries({ queryKey: ['seller-parts', sellerData?.id] });
    };

    try {
      const isPart = listingType === 'part';
      const specificationsPayload = {
        category: productInfo.category,
        make: productInfo.make,
        model: productInfo.model,
        year: productInfo.year,
        vin: productInfo.vin,
        additional: productInfo.specifications
      };

      const priceValue = parseFloat(productInfo.price);
      const stockValue = Number(productInfo.stock_quantity);

      if (isNaN(priceValue) || isNaN(stockValue)) {
        toast.error("Price and Quantity must be valid numbers.");
        return;
      }

      const table = isPart ? 'parts' : 'products';
      let payload: any = {};

      if (isPart) {
        payload = {
          name: productInfo.name,
          description: productInfo.description,
          price: priceValue,
          stock_quantity: stockValue,
          brand: productInfo.make, // Use the vehicle make as the brand for parts
          seller_id: currentSellerId,
          specifications: specificationsPayload,
          image_urls: finalImageUrls,
          is_active: stockValue > 0,
        };
      } else {
        payload = {
          name: productInfo.name,
          description: productInfo.description,
          price: priceValue,
          stock_quantity: stockValue,
          seller_id: currentSellerId,
          image_urls: finalImageUrls,
          is_active: stockValue > 0,
          is_featured: false,
          category: productInfo.category,
          product_type: 'GENERIC',
        };
      }

      console.log("Final Payload:", payload);

      const { data: itemData, error } = editingProductId
        ? await supabase.from(table).update(payload).eq('id', editingProductId).select().single()
        : await supabase.from(table).insert([payload]).select().single();

      if (error) {
        console.error(`Supabase Insert/Update Error:`, error.message, error.code, error.hint);
        toast.error(`Database error: ${error.message}`);
        return;
      }
      console.log("Supabase operation successful:", itemData);

      if (itemData && vehicleId) {
        const fitmentTable = isPart ? 'part_fitments' : 'product_fitments';
        const fitmentPayload = isPart 
          ? { part_id: itemData.id, vehicle_id: vehicleId } 
          : { product_id: itemData.id, vehicle_id: vehicleId };

        const { error: fitmentError } = await supabase
          .from(fitmentTable)
          .upsert([fitmentPayload], { 
            onConflict: isPart ? 'part_id, vehicle_id' : 'product_id, vehicle_id' 
          });
        if (fitmentError) {
          console.error(`Error inserting into ${fitmentTable}:`, fitmentError);
          toast.error(`Item listed, but vehicle fitment failed to save: ${fitmentError.message}`);
        }
      }

      toast.success(`${isPart ? 'Part' : 'Product'} ${editingProductId ? 'updated' : 'listed'} successfully.`);
      cleanupAndRefetch();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error(`An unexpected error occurred: ${error.message}`);
    }
  };

  // Edit handlers
  const handleEditProduct = (product: Product | Part) => {
    setEditingProductId(product.id);
    // Check if it's a product by looking for product_type field
    setListingType('product_type' in product ? 'product' : 'part');

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

  // Delete mutations
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product has been deleted.");
      queryClient.invalidateQueries({ queryKey: ['seller-products', sellerData?.id] });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete product.");
    },
  });

  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const { error } = await supabase.from("parts").delete().eq("id", partId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Part has been deleted.");
      queryClient.invalidateQueries({ queryKey: ['seller-parts', sellerData?.id] });
    },
    onError: (error: Error) => {
      toast.error("Failed to delete part.");
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

  // Archive mutations
  const archiveProductMutation = useMutation({
    mutationFn: async ({ productId, is_active }: { productId: string; is_active: boolean }) => {
      const { error } = await supabase.from("products").update({ is_active: !is_active }).eq("id", productId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Product has been ${variables.is_active ? 'archived' : 'unarchived'}.`);
      queryClient.invalidateQueries({ queryKey: ['seller-products', sellerData?.id] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update product status.");
    },
  });

  const handleArchiveProduct = (productId: string, is_active: boolean) => {
    archiveProductMutation.mutate({ productId, is_active });
  };

  const archivePartMutation = useMutation({
    mutationFn: async ({ partId, is_active }: { partId: string; is_active: boolean }) => {
      const { error } = await supabase.from("parts").update({ is_active: !is_active }).eq("id", partId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Part has been ${variables.is_active ? 'archived' : 'unarchived'}.`);
      queryClient.invalidateQueries({ queryKey: ['seller-parts', sellerData?.id] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update part status.");
    },
  });

  const handleArchivePart = (partId: string, is_active: boolean) => {
    archivePartMutation.mutate({ partId, is_active });
  };

  // Image upload handler
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

  // Filter data for search
  const lowercasedQuery = searchQuery.toLowerCase();

  const filteredParts = parts.filter(part => {
    const partSpecs = JSON.stringify(part.specifications || {});
    const partString = `${part.name} ${part.brand} ${part.part_number || ''} ${partSpecs}`.toLowerCase();
    return partString.includes(lowercasedQuery);
  });

  const filteredProducts = products.filter(product => {
    const productString = `${product.name} ${product.brand || ''} ${product.category || ''} ${product.part_number || ''} ${product.sku || ''} ${product.specifications || ''}`.toLowerCase();
    return productString.includes(lowercasedQuery);
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">{editingProductId ? 'Edit' : 'List a New...'}</h2>
            <Button variant={listingType === "part" ? "default" : "outline"} onClick={() => setListingType("part")}>Part</Button>
            <Button variant={listingType === "product" ? "default" : "outline"} onClick={() => setListingType("product")}>Product</Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProductSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product-name">{listingType === "part" ? "Part Name" : "Product Name"}</Label>
              <Input 
                id="product-name" 
                value={productInfo.name} 
                onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea 
                id="product-description" 
                value={productInfo.description} 
                onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })} 
                rows={4} 
                required 
              />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price ($)</Label>
                <Input 
                  id="product-price" 
                  type="number" 
                  step="0.01" 
                  value={productInfo.price} 
                  onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-quantity">Quantity</Label>
                <Input 
                  id="product-quantity" 
                  type="number" 
                  value={productInfo.stock_quantity.toString()} 
                  onChange={(e) => setProductInfo({ ...productInfo, stock_quantity: parseInt(e.target.value, 10) || 0 })} 
                  required 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-category">Category</Label>
              {listingType === 'product' ? (
                <Input
                  id="product-category"
                  placeholder="e.g., 'Performance Tuning', 'Exterior Accessories'"
                  value={productInfo.category}
                  onChange={(e) => setProductInfo({ ...productInfo, category: e.target.value })}
                />
              ) : (
                <Select value={productInfo.category} onValueChange={(value) => setProductInfo({ ...productInfo, category: value })}>
                  <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-images">Product Images</Label>
              <Input id="product-images" type="file" multiple onChange={handleImageUpload} />
            </div>
            {productInfo.image_urls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {productInfo.image_urls.map((url, index) => (
                  <div key={index} className="relative w-24 h-24 border rounded overflow-hidden">
                    <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 w-6 h-6 p-0"
                      onClick={() => removeImage(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {listingType === 'part' && (
              <>
                <Separator className="my-8" />
                <h3 className="text-lg font-semibold">Vehicle Compatibility</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="part-year">Vehicle Year</Label>
                    <Select value={productInfo.year} onValueChange={(value) => setProductInfo({ ...productInfo, year: value, make: '', model: '' })}>
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="part-make">Vehicle Make</Label>
                    <Select value={productInfo.make} onValueChange={(value) => setProductInfo({ ...productInfo, make: value, model: '' })}>
                      <SelectTrigger>
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="part-model">Vehicle Model</Label>
                    <Select value={productInfo.model} onValueChange={(value) => setProductInfo({ ...productInfo, model: value })} disabled={!productInfo.make}>
                      <SelectTrigger>
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehicleModels.map(model => (
                          <SelectItem key={model.name} value={model.name}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="product-specs">Specifications</Label>
              <Textarea 
                id="product-specs" 
                value={productInfo.specifications} 
                onChange={(e) => setProductInfo({ ...productInfo, specifications: e.target.value })} 
                rows={4} 
                placeholder={listingType === "part" ? "Additional specifications, e.g., 'Color: Black'" : "List specifications here."} 
              />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">{editingProductId ? "Update" : "List"} {listingType === "part" ? "Part" : "Product"}</Button>
              {editingProductId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingProductId(null);
                  setProductInfo({
                    name: "", description: "", price: "", stock_quantity: 0, image_urls: [],
                    specifications: "", category: "", make: "", model: "", year: "", vin: "",
                  });
                }}>Cancel Edit</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <div className="flex items-center space-x-4 mb-4">
        <h2 className="text-2xl font-bold">Your Listed Parts and Products</h2>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search parts or products..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-4">
        {filteredParts.length === 0 && filteredProducts.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No items found matching your search.</div>
        ) : (
          <>
            {filteredParts.map((part) => (
              <Card key={part.id}>
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg">{part.name} (Part)</h3>
                    <p className="text-muted-foreground text-sm">{part.brand}</p>
                    <p className="text-lg font-bold">${part.price}</p>
                    <p className="text-sm">In Stock: {part.stock_quantity}</p>
                    <p className={`text-sm font-medium ${part.is_active ? 'text-green-500' : 'text-yellow-500'}`}>
                      Status: {part.is_active ? 'Active' : 'Archived'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditPart(part)}>
                      <Edit className="h-4 w-4 mr-2" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleArchivePart(part.id, part.is_active)}>
                      <Archive className="h-4 w-4 mr-2" />
                      {part.is_active ? 'Archive' : 'Unarchive'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeletePart(part.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.map((product) => (
              <Card key={product.id}>
                <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg">{product.name} (Product)</h3>
                    <p className="text-muted-foreground text-sm">{product.category}</p>
                    <p className="text-lg font-bold">${product.price}</p>
                    <p className="text-sm">In Stock: {product.stock_quantity}</p>
                    <p className={`text-sm font-medium ${product.is_active ? 'text-green-500' : 'text-yellow-500'}`}>
                      Status: {product.is_active ? 'Active' : 'Archived'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                      <Edit className="h-4 w-4 mr-2" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleArchiveProduct(product.id, product.is_active)}>
                      <Archive className="h-4 w-4 mr-2" />
                      {product.is_active ? 'Archive' : 'Unarchive'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id)}>
                      <Trash2 className="h-4 w-4 mr-2" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductManagementContent;