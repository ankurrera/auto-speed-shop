import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPaymentManagement from "@/components/AdminPaymentManagement";

interface PaymentManagementProps {
  onBack: () => void;
}

export const PaymentManagement = ({ onBack }: PaymentManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminPaymentManagement onBack={onBack} />
    </div>
  );
};