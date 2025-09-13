import AdminPaymentManagement from "@/components/AdminPaymentManagement";

interface PaymentManagementProps {
  onBack: () => void;
}

export const PaymentManagement = ({ onBack }: PaymentManagementProps) => {
  return (
    <AdminPaymentManagement onBack={onBack} />
  );
};