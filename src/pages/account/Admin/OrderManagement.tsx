import AdminOrderManagement from "@/components/AdminOrderManagement";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface OrderManagementProps {
  onBack: () => void;
}

export const OrderManagement = ({ onBack }: OrderManagementProps) => {
  return (
    <AdminOrderManagement onBack={onBack} />
  );
};