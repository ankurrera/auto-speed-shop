import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Package,
  AlertTriangle,
  Search,
  Settings,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RestockModal } from "@/components/RestockModal";
import { getStockStatus, getStockRowClasses, STOCK_THRESHOLD } from "@/lib/stockUtils";

interface Product {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  stock_quantity: number;
  min_stock_level: number | null;
  is_active: boolean;
  is_featured: boolean;
  sku: string | null;
  part_number: string | null;
  created_at: string;
  updated_at: string;
}

interface Part {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  sku: string | null;
  part_number: string | null;
  created_at: string;
  updated_at: string;
}

interface InventoryManagementProps {
  onBack: () => void;
}

const InventoryManagement = ({ onBack }: InventoryManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [restockModal, setRestockModal] = useState<{
    isOpen: boolean;
    item: (Product | Part) | null;
    isProduct: boolean;
  }>({
    isOpen: false,
    item: null,
    isProduct: true
  });
  const [isRestocking, setIsRestocking] = useState(false);
  const { toast } = useToast();

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, brand, price, stock_quantity, min_stock_level, is_active, is_featured, sku, part_number, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch parts
      const { data: partsData, error: partsError } = await supabase
        .from('parts')
        .select('id, name, brand, price, stock_quantity, is_active, is_featured, sku, part_number, created_at, updated_at')
        .order('updated_at', { ascending: false });

      if (partsError) throw partsError;

      setProducts(productsData || []);
      setParts(partsData || []);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch inventory";
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleRestock = async (quantity: number) => {
    if (!restockModal.item) return;

    try {
      setIsRestocking(true);
      const table = restockModal.isProduct ? 'products' : 'parts';
      const newStockQuantity = restockModal.item.stock_quantity + quantity;
      
      const { error } = await supabase
        .from(table)
        .update({ 
          stock_quantity: newStockQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', restockModal.item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${restockModal.isProduct ? 'Product' : 'Part'} restocked successfully. Added ${quantity} units.`
      });

      // Refresh inventory data
      await fetchInventory();

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to restock item";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsRestocking(false);
    }
  };

  const openRestockModal = (item: Product | Part, isProduct: boolean) => {
    setRestockModal({
      isOpen: true,
      item,
      isProduct
    });
  };

  const closeRestockModal = () => {
    setRestockModal({
      isOpen: false,
      item: null,
      isProduct: true
    });
  };

  const filterItems = (items: (Product | Part)[]) => {
    if (!searchTerm) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.part_number && item.part_number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const renderInventoryTable = (items: (Product | Part)[], isProduct: boolean) => {
    const filteredItems = filterItems(items);
    const outOfStockCount = items.filter(item => item.stock_quantity === 0).length;
    const lowStockCount = items.filter(item => {
      const hasMinLevel = 'min_stock_level' in item && item.min_stock_level !== null;
      const minLevel = hasMinLevel ? (item as Product).min_stock_level! : STOCK_THRESHOLD;
      return item.stock_quantity > 0 && item.stock_quantity <= minLevel;
    }).length;

    return (
      <div className="space-y-4">
        {/* Stock Alerts Summary */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                  <p className="text-2xl font-bold text-green-600">{items.length}</p>
                </div>
                <Package className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {!isProduct && <TableHead>Brand</TableHead>}
                <TableHead>Stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item.stock_quantity);
                const rowClasses = getStockRowClasses(item.stock_quantity);
                
                return (
                  <TableRow key={item.id} className={rowClasses}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{item.name}</p>
                        {item.part_number && (
                          <p className="text-xs text-muted-foreground">Part: {item.part_number}</p>
                        )}
                      </div>
                    </TableCell>
                    {!isProduct && (
                      <TableCell>{item.brand || 'N/A'}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${stockStatus.color}`}>
                          {item.stock_quantity}
                        </span>
                        <Badge 
                          variant={stockStatus.level === 'out-of-stock' ? 'destructive' : 
                                 stockStatus.level === 'low-stock' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {stockStatus.label}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openRestockModal(item, isProduct)}
                        className="flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        Restock
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? `No ${isProduct ? 'products' : 'parts'} match your search.` : `No ${isProduct ? 'products' : 'parts'} available.`}
            </p>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Inventory Management
        </CardTitle>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, brand, SKU, or part number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Parts ({parts.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="products" className="mt-6">
            {renderInventoryTable(products, true)}
          </TabsContent>
          
          <TabsContent value="parts" className="mt-6">
            {renderInventoryTable(parts, false)}
          </TabsContent>
        </Tabs>

        {/* Restock Modal */}
        <RestockModal
          isOpen={restockModal.isOpen}
          onClose={closeRestockModal}
          onRestock={handleRestock}
          itemName={restockModal.item?.name || ""}
          currentStock={restockModal.item?.stock_quantity || 0}
          isLoading={isRestocking}
        />
      </CardContent>
    </Card>
  );
};

export default InventoryManagement;