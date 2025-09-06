import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, User } from "lucide-react";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  is_admin: boolean;
  is_seller: boolean;
}

interface ProfileFormProps {
  userInfo: UserProfile;
  setUserInfo: (info: UserProfile) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onSave: (updates: Partial<UserProfile>) => Promise<boolean>;
}

export const ProfileForm = ({ userInfo, setUserInfo, isEditing, setIsEditing, onSave }: ProfileFormProps) => {
  const handleSave = async () => {
    const success = await onSave({
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      phone: userInfo.phone,
    });
    
    if (success) {
      setIsEditing(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <CardTitle>Profile Information</CardTitle>
        </div>
        {!isEditing && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input
              id="first-name"
              value={userInfo.firstName}
              onChange={(e) => setUserInfo({ ...userInfo, firstName: e.target.value })}
              disabled={!isEditing}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input
              id="last-name"
              value={userInfo.lastName}
              onChange={(e) => setUserInfo({ ...userInfo, lastName: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={userInfo.email}
            disabled
            className="bg-muted"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={userInfo.phone}
            onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
            disabled={!isEditing}
          />
        </div>

        {isEditing && (
          <div className="flex space-x-2 pt-4">
            <Button onClick={handleSave}>Save Changes</Button>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};