import AdminPaymentManagement from "@/components/AdminPaymentManagement";

interface PaymentManagementProps {
  onBack: () => void;
}

const PaymentManagement = ({ onBack }: PaymentManagementProps) => {
  return <AdminPaymentManagement onBack={onBack} />;
};

export default PaymentManagement;