import { FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type ProductFormProps = {
  listingType: string;
  editingProductId: string | null;
  setEditingProductId: (id: string | null) => void;
  productInfo: any;
  setProductInfo: (info: any) => void;
  productFiles: File[];
  setProductFiles: (files: File[]) => void;
  sellerId: string | null;
  setSellerId: (id: string | null) => void;
  supabase: any;
  toast: any;
  queryClient: any;
  setModalOpen: (open: boolean) => void;
  userInfo: any;
  categories: string[];
};

const ProductForm = ({
  listingType,
  editingProductId,
  setEditingProductId,
  productInfo,
  setProductInfo,
  productFiles,
  setProductFiles,
  sellerId,
  setSellerId,
  supabase,
  toast,
  queryClient,
  setModalOpen,
  userInfo,
  categories,
}: ProductFormProps) => {
  // Add your vehicle years, makes, models queries as you did in original code

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleProductSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Copy your full product/part submit logic here, including:
    // - Image upload to Supabase storage
    // - Vehicle compatibility logic
    // - Insert/update to products/parts table
    // - Fitment upsert
    // - Toasts, queryClient.invalidateQueries, etc.
  };

  return (
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
      {/* Add price, quantity, category, images, compatibility, etc. fields as per your original code */}
      <div className="flex space-x-2">
        <Button type="submit">
          {editingProductId ? "Update" : "List"} {listingType === "part" ? "Part" : "Product"}
        </Button>
        {editingProductId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditingProductId(null);
              setProductInfo({
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
            }}
          >
            Cancel Edit
          </Button>
        )}
      </div>
    </form>
  );
};

export default ProductForm;