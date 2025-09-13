import AdminInvoiceManagement from "@/components/AdminInvoiceManagement";

interface InvoiceManagementProps {
  onBack: () => void;
}

const InvoiceManagement = ({ onBack }: InvoiceManagementProps) => {
  return <AdminInvoiceManagement onBack={onBack} />;
};

export default InvoiceManagement;