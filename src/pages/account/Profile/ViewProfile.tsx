import { UserIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ViewProfileProps {
  userInfo: any;
  onEdit: () => void;
}

const ViewProfile = ({ userInfo, onEdit }: ViewProfileProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Profile Information
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={userInfo.firstName}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={userInfo.lastName}
              disabled
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={userInfo.email} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={userInfo.phone}
              disabled
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ViewProfile;