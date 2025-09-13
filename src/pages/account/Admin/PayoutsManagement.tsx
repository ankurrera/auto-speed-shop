import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPayoutManagement from "@/components/AdminPayoutManagement";

interface PayoutsManagementProps {
  onBack: () => void;
}

export const PayoutsManagement = ({ onBack }: PayoutsManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminPayoutManagement onBack={onBack} />
    </div>
  );
};