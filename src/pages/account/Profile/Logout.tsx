import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogoutProps {
  onLogout: () => void;
}

const Logout = ({ onLogout }: LogoutProps) => {
  return (
    <div className="mt-6 pt-6 border-t">
      <Button variant="outline" onClick={onLogout} className="w-full">
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
};

export default Logout;