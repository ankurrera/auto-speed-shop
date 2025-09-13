import AdminPayoutManagement from "@/components/AdminPayoutManagement";

interface PayoutsManagementProps {
  onBack: () => void;
}

const PayoutsManagement = ({ onBack }: PayoutsManagementProps) => {
  return <AdminPayoutManagement onBack={onBack} />;
};

export default PayoutsManagement;