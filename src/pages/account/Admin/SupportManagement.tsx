import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminCustomerSupport from "@/components/AdminCustomerSupport";

interface SupportManagementProps {
  onBack: () => void;
}

const SupportManagement = ({ onBack }: SupportManagementProps) => {
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

export default SupportManagement;