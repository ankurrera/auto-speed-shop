import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminOrderManagement from "@/components/AdminOrderManagement";

interface OrderManagementProps {
  onBack: () => void;
}

export const OrderManagement = ({ onBack }: OrderManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminOrderManagement onBack={onBack} />
    </div>
  );
};