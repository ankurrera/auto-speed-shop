import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminInventoryManagement from "@/components/AdminInventoryManagement";

interface InventoryManagementProps {
  onBack: () => void;
}

export const InventoryManagement = ({ onBack }: InventoryManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminInventoryManagement onBack={onBack} />
    </div>
  );
};