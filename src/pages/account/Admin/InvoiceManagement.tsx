import AdminInvoiceManagement from "@/components/AdminInvoiceManagement";

interface InvoiceManagementProps {
  onBack: () => void;
}

export const InvoiceManagement = ({ onBack }: InvoiceManagementProps) => {
  return (
    <AdminInvoiceManagement onBack={onBack} />
  );
};