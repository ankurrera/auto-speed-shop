import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Edit, 
  Trash2, 
  Archive, 
  TrendingUp,
  Package 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Database } from "@/database.types";

type Product = Database['public']['Tables']['products']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

interface PartSpecifications {
  category?: string;
  make?: string;
  model?: string;
  year?: string;
  vin?: string;
  additional?: string;
  [key: string]: unknown;
}

interface PartWithSpecs extends Omit<Part, 'specifications'> {
  specifications: PartSpecifications | null;
}

interface ProductListProps {
  products: Product[];
  parts: PartWithSpecs[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onEditProduct: (product: Product) => void;
  onEditPart: (part: PartWithSpecs) => void;
  onDeleteProduct: (productId: string) => void;
  onDeletePart: (partId: string) => void;
  onArchiveProduct: (productId: string, isActive: boolean) => void;
  onArchivePart: (partId: string, isActive: boolean) => void;
}

export const ProductList = ({
  products,
  parts,
  searchQuery,
  setSearchQuery,
  onEditProduct,
  onEditPart,
  onDeleteProduct,
  onDeletePart,
  onArchiveProduct,
  onArchivePart,
}: ProductListProps) => {
  const lowercasedQuery = searchQuery.toLowerCase();

  const filteredParts = parts.filter(part => {
    const partSpecs = JSON.stringify(part.specifications || {});
    const partString = `${part.name} ${part.brand} ${part.part_number} ${partSpecs}`.toLowerCase();
    return partString.includes(lowercasedQuery);
  });

  const filteredProducts = products.filter(product => {
    const productString = `${product.name} ${product.brand} ${product.category} ${product.part_number} ${product.sku} ${product.specifications || ''}`.toLowerCase();
    return productString.includes(lowercasedQuery);
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Inventory Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products and parts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Parts Section */}
      {filteredParts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Parts ({filteredParts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredParts.map((part) => (
                <div key={part.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{part.name}</h3>
                      <Badge variant={part.is_active ? "default" : "secondary"}>
                        {part.is_active ? "Active" : "Archived"}
                      </Badge>
                      {part.stock_quantity === 0 && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><span className="font-medium">Brand:</span> {part.brand}</p>
                      <p><span className="font-medium">Price:</span> ${part.price}</p>
                      <p><span className="font-medium">Stock:</span> {part.stock_quantity}</p>
                      {part.part_number && (
                        <p><span className="font-medium">Part #:</span> {part.part_number}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEditPart(part)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchivePart(part.id, part.is_active || false)}>
                          <Archive className="h-4 w-4 mr-2" />
                          {part.is_active ? "Archive" : "Unarchive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeletePart(part.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Section */}
      {filteredProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Products ({filteredProducts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{product.name}</h3>
                      <Badge variant={product.is_active ? "default" : "secondary"}>
                        {product.is_active ? "Active" : "Archived"}
                      </Badge>
                      {product.is_featured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                      {product.stock_quantity === 0 && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><span className="font-medium">Category:</span> {product.category}</p>
                      <p><span className="font-medium">Price:</span> ${product.price}</p>
                      <p><span className="font-medium">Stock:</span> {product.stock_quantity}</p>
                      {product.sku && (
                        <p><span className="font-medium">SKU:</span> {product.sku}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEditProduct(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onArchiveProduct(product.id, product.is_active || false)}>
                          <Archive className="h-4 w-4 mr-2" />
                          {product.is_active ? "Archive" : "Unarchive"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteProduct(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredProducts.length === 0 && filteredParts.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No results found" : "No products or parts listed"}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Start by adding your first product or part to your inventory"
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};