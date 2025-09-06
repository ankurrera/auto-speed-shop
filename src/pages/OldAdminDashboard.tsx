// Placeholder for OldAdminDashboard - to be extracted properly in next phase
import { UserInfo } from "@/components/account/types";

interface OldAdminDashboardProps {
  userInfo: UserInfo;
}

export const OldAdminDashboard = ({ userInfo }: OldAdminDashboardProps) => {
  return (
    <div className="text-center p-8">
      <h2 className="text-xl font-bold">Admin Dashboard</h2>
      <p className="text-muted-foreground mt-2">
        Admin dashboard functionality will be extracted to a separate component in the next phase.
      </p>
      <p className="text-sm mt-4">
        User: {userInfo.firstName} {userInfo.lastName} (Admin: {userInfo.is_admin ? 'Yes' : 'No'})
      </p>
    </div>
  );
};