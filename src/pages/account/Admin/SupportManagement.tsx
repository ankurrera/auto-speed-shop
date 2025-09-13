import AdminCustomerSupport from "@/components/AdminCustomerSupport";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SupportManagementProps {
  onBack: () => void;
}

export const SupportManagement = ({ onBack }: SupportManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminCustomerSupport />
    </div>
  );
};