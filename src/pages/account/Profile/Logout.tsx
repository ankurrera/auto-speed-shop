import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutProps {
  onLogout: () => void;
}

export const Logout = ({ onLogout }: LogoutProps) => {
  return (
    <Button variant="outline" onClick={onLogout}>
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  );
};