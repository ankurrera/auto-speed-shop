import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package } from "lucide-react";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestock: (quantity: number) => Promise<void>;
  itemName: string;
  currentStock: number;
  isLoading?: boolean;
}

export const RestockModal = ({
  isOpen,
  onClose,
  onRestock,
  itemName,
  currentStock,
  isLoading = false,
}: RestockModalProps) => {
  const [quantity, setQuantity] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const numQuantity = parseInt(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    try {
      await onRestock(numQuantity);
      setQuantity("");
      setError("");
      onClose();
    } catch (error) {
      setError("Failed to restock item. Please try again.");
    }
  };

  const handleClose = () => {
    setQuantity("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restock Item
          </DialogTitle>
          <DialogDescription>
            Add stock quantity for "{itemName}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-stock">Current Stock</Label>
            <Input
              id="current-stock"
              value={currentStock}
              disabled
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="restock-quantity">Quantity to Add</Label>
            <Input
              id="restock-quantity"
              type="number"
              placeholder="Enter quantity to add"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              required
              disabled={isLoading}
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {quantity && !isNaN(parseInt(quantity)) && parseInt(quantity) > 0 && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                New stock will be: <span className="font-medium text-foreground">
                  {currentStock + parseInt(quantity)}
                </span>
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Restocking..." : "Restock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};