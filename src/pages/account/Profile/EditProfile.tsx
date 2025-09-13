import { UserIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { UserInfo, EmailSubscriptionState } from "../types";

interface EditProfileProps {
  userInfo: UserInfo;
  emailSubscription: EmailSubscriptionState;
  onUserInfoChange: (userInfo: UserInfo) => void;
  onEmailSubscriptionChange: (subscribed: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditProfile = ({ 
  userInfo, 
  emailSubscription, 
  onUserInfoChange, 
  onEmailSubscriptionChange, 
  onSave, 
  onCancel 
}: EditProfileProps) => {
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
          onClick={onCancel}
        >
          <Edit className="h-4 w-4 mr-2" />
          Cancel
        </Button>
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
        
        {/* Email Preferences Section */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Email Preferences</h3>
          <div className="flex items-start space-x-3">
            <Checkbox
              id="email-notifications"
              checked={emailSubscription.subscribed}
              disabled={emailSubscription.loading}
              onCheckedChange={(checked) => onEmailSubscriptionChange(!!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="email-notifications" className="text-sm font-medium cursor-pointer">
                Notify me about new products and parts
              </Label>
              <p className="text-xs text-muted-foreground">
                Get email notifications when sellers list new products and auto parts that might interest you.
              </p>
            </div>
          </div>
          {emailSubscription.loading && (
            <p className="text-xs text-muted-foreground">Updating preferences...</p>
          )}
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