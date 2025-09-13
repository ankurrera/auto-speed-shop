import AdminInventoryManagement from "@/components/AdminInventoryManagement";

interface InventoryManagementProps {
  onBack: () => void;
}

export const InventoryManagement = ({ onBack }: InventoryManagementProps) => {
  return (
    <AdminInventoryManagement onBack={onBack} />
  );
};