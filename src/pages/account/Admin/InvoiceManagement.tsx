import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminInvoiceManagement from "@/components/AdminInvoiceManagement";

interface InvoiceManagementProps {
  onBack: () => void;
}

export const InvoiceManagement = ({ onBack }: InvoiceManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminInvoiceManagement onBack={onBack} />
    </div>
  );
};