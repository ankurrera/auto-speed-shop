import { UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditProfileProps {
  userInfo: any;
  onUserInfoChange: (userInfo: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const EditProfile = ({ userInfo, onUserInfoChange, onSave, onCancel }: EditProfileProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Edit Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={userInfo.firstName}
              onChange={(e) =>
                onUserInfoChange({ ...userInfo, firstName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={userInfo.lastName}
              onChange={(e) =>
                onUserInfoChange({ ...userInfo, lastName: e.target.value })
              }
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
              onChange={(e) =>
                onUserInfoChange({ ...userInfo, phone: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <Button onClick={onSave}>Save Changes</Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EditProfile;