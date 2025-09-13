import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminUserManagement from "@/components/AdminUserManagement";

interface UserManagementProps {
  onBack: () => void;
}

export const UserManagement = ({ onBack }: UserManagementProps) => {
  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={onBack}>
        <X className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      <AdminUserManagement />
    </div>
  );
};