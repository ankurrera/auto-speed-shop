import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Package, 
  X, 
  RefreshCw,
  AlertTriangle,
  Bell,
  Edit,
  Check,
  TrendingDown
} from "lucide-react";

interface LowStockItem {
  item_type: string;
  id: string;
  name: string;
  current_stock: number;
  min_stock_level: number;
  seller_name: string;
  seller_email: string;
}

const AdminInventoryManagement = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingStock, setEditingStock] = useState<{id: string, type: string, stock: number} | null>(null);
  const [newStockValue, setNewStockValue] = useState("");

  // Fetch low stock items
  const { data: lowStockItems, isLoading: loadingLowStock, refetch: refetchLowStock } = useQuery<LowStockItem[]>({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('get_low_stock_items', {
          requesting_user_id: user.id,
          threshold_percentage: 20.0
        });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Auto-disable out of stock products mutation
  const autoDisableMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .rpc('auto_disable_out_of_stock_products');
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        toast({
          title: "Auto-disable Complete",
          description: `Disabled ${result.disabled_products} products and ${result.disabled_parts} parts`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['admin-low-stock'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send stock alert notifications mutation
  const sendAlertsMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('send_stock_alert_notifications', {
          requesting_user_id: user.id
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        toast({
          title: "Alerts Sent",
          description: `Sent ${result.notifications_sent} stock alert notifications`,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: async ({ itemType, itemId, newStock }: { itemType: string, itemId: string, newStock: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_update_stock', {
          requesting_user_id: user.id,
          item_type: itemType,
          item_id: itemId,
          new_stock_quantity: newStock
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          setEditingStock(null);
          setNewStockValue("");
          queryClient.invalidateQueries({ queryKey: ['admin-low-stock'] });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpdateStock = (item: LowStockItem) => {
    setEditingStock({
      id: item.id,
      type: item.item_type,
      stock: item.current_stock
    });
    setNewStockValue(item.current_stock.toString());
  };

  const handleSaveStock = () => {
    if (!editingStock || !newStockValue) return;
    
    const newStock = parseInt(newStockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid stock quantity",
        variant: "destructive",
      });
      return;
    }

    updateStockMutation.mutate({
      itemType: editingStock.type,
      itemId: editingStock.id,
      newStock
    });
  };

  const getStockStatusColor = (current: number, min: number) => {
    if (current === 0) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (current <= min) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (current <= min * 2) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  };

  const getStockStatusText = (current: number, min: number) => {
    if (current === 0) return "Out of Stock";
    if (current <= min) return "Critical";
    if (current <= min * 2) return "Low";
    return "Good";
  };

  if (loadingLowStock) {
    return <p>Loading inventory data...</p>;
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5" />
          Inventory Management
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => sendAlertsMutation.mutate()}
            disabled={sendAlertsMutation.isPending}
          >
            <Bell className="h-4 w-4 mr-2" />
            Send Alerts
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => autoDisableMutation.mutate()}
            disabled={autoDisableMutation.isPending}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Auto-Disable
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchLowStock()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Stock Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {lowStockItems?.filter(item => item.current_stock === 0).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Critical Stock</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {lowStockItems?.filter(item => item.current_stock > 0 && item.current_stock <= item.min_stock_level).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-yellow-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {lowStockItems?.filter(item => item.current_stock > item.min_stock_level && item.current_stock <= item.min_stock_level * 2).length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-4 w-4 text-blue-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {lowStockItems?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems && lowStockItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((item) => (
                      <TableRow key={`${item.item_type}-${item.id}`}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.item_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          {editingStock?.id === item.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={newStockValue}
                                onChange={(e) => setNewStockValue(e.target.value)}
                                className="w-20"
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveStock}
                                disabled={updateStockMutation.isPending}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingStock(null);
                                  setNewStockValue("");
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <span className="font-semibold">{item.current_stock}</span>
                          )}
                        </TableCell>
                        <TableCell>{item.min_stock_level}</TableCell>
                        <TableCell>
                          <Badge 
                            className={getStockStatusColor(item.current_stock, item.min_stock_level)}
                          >
                            {getStockStatusText(item.current_stock, item.min_stock_level)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.seller_name}</div>
                            <div className="text-sm text-muted-foreground">{item.seller_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingStock?.id !== item.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateStock(item)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Update
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No low stock items found. All inventory levels are good!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminInventoryManagement;