import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, User } from "lucide-react";

type ProfileSectionProps = {
  userInfo: any;
  setUserInfo: (info: any) => void;
  isEditing: boolean;
  setIsEditing: (edit: boolean) => void;
  handleSaveProfile: () => void;
};

const ProfileSection = ({
  userInfo,
  setUserInfo,
  isEditing,
  setIsEditing,
  handleSaveProfile,
}: ProfileSectionProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center">
        <User className="h-5 w-5 mr-2" />
        Profile Information
      </CardTitle>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(!isEditing)}
      >
        <Edit className="h-4 w-4 mr-2" />
        {isEditing ? "Cancel" : "Edit"}
      </Button>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={userInfo.firstName}
            disabled={!isEditing}
            onChange={(e) => setUserInfo({...userInfo, firstName: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={userInfo.lastName}
            disabled={!isEditing}
            onChange={(e) => setUserInfo({...userInfo, lastName: e.target.value})}
          />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={userInfo.email}
            disabled
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={userInfo.phone}
            disabled={!isEditing}
            onChange={(e) => setUserInfo({...userInfo, phone: e.target.value})}
          />
        </div>
      </div>
      {isEditing && (
        <div className="flex space-x-4">
          <Button onClick={handleSaveProfile}>
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);
export default ProfileSection;