import { FormEvent } from "react";
import { Edit, Archive, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PartWithSpecs, Product, ProductInfo, VehicleMake, VehicleModel, ListingType } from "@/types/account";
import { categories } from "@/constants/account";

interface AdminDashboardProps {
  // Product form state
  listingType: ListingType;
  setListingType: (type: ListingType) => void;
  editingProductId: string | null;
  productInfo: ProductInfo;
  setProductInfo: (info: ProductInfo) => void;
  productFiles: File[];
  
  // Vehicle data
  vehicleYears: number[];
  vehicleMakes: VehicleMake[];
  vehicleModels: VehicleModel[];
  
  // Product and part lists
  filteredParts: PartWithSpecs[];
  filteredProducts: Product[];
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Actions
  onSubmitProduct: (e: FormEvent) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onEditPart: (part: PartWithSpecs) => void;
  onEditProduct: (product: Product) => void;
  onDeletePart: (partId: string) => void;
  onDeleteProduct: (productId: string) => void;
  onArchivePart: (partId: string, isActive: boolean) => void;
  onArchiveProduct: (productId: string, isActive: boolean) => void;
  onCancelEdit: () => void;
}

const AdminDashboard = ({
  listingType,
  setListingType,
  editingProductId,
  productInfo,
  setProductInfo,
  productFiles,
  vehicleYears,
  vehicleMakes,
  vehicleModels,
  filteredParts,
  filteredProducts,
  searchQuery,
  setSearchQuery,
  onSubmitProduct,
  onImageUpload,
  onRemoveImage,
  onEditPart,
  onEditProduct,
  onDeletePart,
  onDeleteProduct,
  onArchivePart,
  onArchiveProduct,
  onCancelEdit,
}: AdminDashboardProps) => {
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
          <form onSubmit={onSubmitProduct} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="product-name">{listingType === "part" ? "Part Name" : "Product Name"}</Label>
              <Input id="product-name" value={productInfo.name} onChange={(e) => setProductInfo({ ...productInfo, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-description">Description</Label>
              <Textarea id="product-description" value={productInfo.description} onChange={(e) => setProductInfo({ ...productInfo, description: e.target.value })} rows={4} required />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product-price">Price ($)</Label>
                <Input id="product-price" type="number" step="0.01" value={productInfo.price} onChange={(e) => setProductInfo({ ...productInfo, price: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-quantity">Quantity</Label>
                <Input id="product-quantity" type="number" value={productInfo.stock_quantity.toString()} onChange={(e) => setProductInfo({ ...productInfo, stock_quantity: parseInt(e.target.value, 10) || 0 })} required />
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
                    {categories.map((category) => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-images">Product Images</Label>
              <Input id="product-images" type="file" multiple onChange={onImageUpload} />
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
                                onClick={() => onRemoveImage(index)}
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
              <Textarea id="product-specs" value={productInfo.specifications} onChange={(e) => setProductInfo({ ...productInfo, specifications: e.target.value })} rows={4} placeholder={listingType === "part" ? "Additional specifications, e.g., 'Color: Black'" : "List specifications here."} />
            </div>
            <div className="flex space-x-2">
              <Button type="submit">{editingProductId ? "Update" : "List"} {listingType === "part" ? "Part" : "Product"}</Button>
              {editingProductId && (
                <Button type="button" variant="outline" onClick={onCancelEdit}>Cancel Edit</Button>
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
                    <Button variant="outline" size="sm" onClick={() => onEditPart(part)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => onArchivePart(part.id, part.is_active)}>
                      <Archive className="h-4 w-4 mr-2" />
                      {part.is_active ? 'Archive' : 'Unarchive'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeletePart(part.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
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
                    <p className={`text-sm font-medium ${product.is_active ? 'text-green-500' : 'text-yellow-500'}`}>Status: {product.is_active ? 'Active' : 'Archived'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onEditProduct(product)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => onArchiveProduct(product.id, product.is_active)}><Archive className="h-4 w-4 mr-2" />{product.is_active ? 'Archive' : 'Unarchive'}</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDeleteProduct(product.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>
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

export default AdminDashboard;