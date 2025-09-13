import AdminPayoutManagement from "@/components/AdminPayoutManagement";

interface PayoutsManagementProps {
  onBack: () => void;
}

export const PayoutsManagement = ({ onBack }: PayoutsManagementProps) => {
  return (
    <AdminPayoutManagement onBack={onBack} />
  );
};