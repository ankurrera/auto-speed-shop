import { useState } from "react";
import { User, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { UserInfo } from "./types";

interface ProfileContentProps {
  userInfo: UserInfo;
  setUserInfo: (userInfo: UserInfo) => void;
}

const ProfileContent = ({ userInfo, setUserInfo }: ProfileContentProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session found.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: userInfo.firstName,
        last_name: userInfo.lastName,
        phone: userInfo.phone,
      })
      .eq("user_id", session.user.id);

    if (error) {
      console.error("Error updating profile:", error.message);
      alert("Failed to update profile.");
    } else {
      console.log("Profile updated successfully!");
      setIsEditing(false);
    }
  };

  return (
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
};

export default ProfileContent;