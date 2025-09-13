import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "../utils";

interface LogoutProps {
  onLogout?: () => void;
}

export const Logout = ({ onLogout }: LogoutProps) => {
  const handleLogout = async () => {
    try {
      await logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <Button variant="outline" onClick={handleLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
};