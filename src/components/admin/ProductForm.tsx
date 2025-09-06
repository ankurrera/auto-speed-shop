import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";

const categories = [
  "Engine Parts", "Valvetrain", "Fuel supply system", "Air intake and exhaust systems",
  "Turbochargers / Superchargers", "Ignition system", "Engine lubrication components",
  "Engine cooling system", "Engine electrical parts", "Differential", "Axle", "AD / ADAS",
  "Telematics / Car navigation", "Entertainment / Audio", "Keys", "ECU", "Motors",
  "Interior switch", "Sensor", "Electrical parts", "Cable / Connector", "Climate control system",
  "HVAC module", "Air conditioner", "Heater", "EV climate control parts", "Climate control peripherals",
  "Instrument panel", "Display", "Airbag", "Seat", "Seat belt", "Pedal", "Interior trim",
  "Interior parts", "Lighting", "Bumper", "Window glass", "Exterior parts", "Chassis module",
  "Brake", "Sub-brake", "ABS / TCS / ESC", "Steering", "Suspension", "Tire & wheel",
  "Body panel / Frame", "Body reinforcement and protector", "Door", "Hood", "Trunk lid",
  "Sunroof", "Convertible roof", "Wiper", "Window washer", "Fuel tank", "General Parts",
];

interface ProductInfo {
  name: string;
  description: string;
  price: string;
  stock_quantity: number;
  image_urls: string[];
  specifications: string;
  category: string;
  make: string;
  model: string;
  year: string;
  vin: string;
}

interface ProductFormProps {
  listingType: string;
  setListingType: (type: string) => void;
  editingProductId: string | null;
  productInfo: ProductInfo;
  setProductInfo: (info: ProductInfo) => void;
  vehicleYears: number[];
  vehicleMakes: { id: string; name: string; }[];
  vehicleModels: { name: string; }[];
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
}

export const ProductForm = ({
  listingType,
  setListingType,
  editingProductId,
  productInfo,
  setProductInfo,
  vehicleYears,
  vehicleMakes,
  vehicleModels,
  onImageUpload,
  onRemoveImage,
  onSubmit
}: ProductFormProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">{editingProductId ? 'Edit' : 'List a New...'}</h2>
          <Button 
            variant={listingType === "part" ? "default" : "outline"} 
            onClick={() => setListingType("part")}
          >
            Part
          </Button>
          <Button 
            variant={listingType === "product" ? "default" : "outline"} 
            onClick={() => setListingType("product")}
          >
            Product
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
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
                  <Select 
                    value={productInfo.year} 
                    onValueChange={(value) => setProductInfo({ ...productInfo, year: value, make: '', model: '' })}
                  >
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
                  <Select 
                    value={productInfo.make} 
                    onValueChange={(value) => setProductInfo({ ...productInfo, make: value, model: '' })}
                  >
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
                  <Select 
                    value={productInfo.model} 
                    onValueChange={(value) => setProductInfo({ ...productInfo, model: value })} 
                    disabled={!productInfo.make}
                  >
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
              placeholder="Enter detailed specifications..."
              value={productInfo.specifications}
              onChange={(e) => setProductInfo({ ...productInfo, specifications: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            {editingProductId ? "Update" : "List"} {listingType === "part" ? "Part" : "Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};