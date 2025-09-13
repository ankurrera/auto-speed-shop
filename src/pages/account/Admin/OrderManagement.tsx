import AdminOrderManagement from "@/components/AdminOrderManagement";

interface OrderManagementProps {
  onBack: () => void;
}

const OrderManagement = ({ onBack }: OrderManagementProps) => {
  return <AdminOrderManagement onBack={onBack} />;
};

export default OrderManagement;