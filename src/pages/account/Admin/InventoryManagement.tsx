import AdminInventoryManagement from "@/components/AdminInventoryManagement";

interface InventoryManagementProps {
  onBack: () => void;
}

const InventoryManagement = ({ onBack }: InventoryManagementProps) => {
  return <AdminInventoryManagement onBack={onBack} />;
};

export default InventoryManagement;