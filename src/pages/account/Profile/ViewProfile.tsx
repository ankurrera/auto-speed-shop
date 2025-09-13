import { useState } from "react";
import { UserIcon, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { UserInfo, EmailSubscriptionState } from "../types";
import { saveProfile, updateEmailSubscription } from "../utils";
import { useToast } from "@/components/ui/use-toast";

interface ViewProfileProps {
  userInfo: UserInfo;
  setUserInfo: (userInfo: UserInfo) => void;
  emailSubscription: EmailSubscriptionState;
  setEmailSubscription: (emailSubscription: EmailSubscriptionState) => void;
}

export const ViewProfile = ({ 
  userInfo, 
  setUserInfo, 
  emailSubscription, 
  setEmailSubscription 
}: ViewProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleSaveProfile = async () => {
    try {
      await saveProfile(userInfo);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save profile: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleEmailSubscriptionChange = async (subscribed: boolean) => {
    setEmailSubscription({ ...emailSubscription, loading: true });

    try {
      const updatedSubscription = await updateEmailSubscription(subscribed, emailSubscription, userInfo);
      setEmailSubscription(updatedSubscription);

      // Show success message
      toast({
        title: "Preferences Updated",
        description: subscribed 
          ? "You will now receive email notifications about new products and parts!" 
          : "You have been unsubscribed from email notifications.",
      });

    } catch (error: any) {
      console.error("Error updating email subscription:", error);
      setEmailSubscription({ ...emailSubscription, loading: false });
      
      toast({
        title: "Error",
        description: "Failed to update email preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          onClick={() => setIsEditing((p) => !p)}
        >
          <Edit className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel" : "Edit"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>First Name</Label>
            <Input
              value={userInfo.firstName}
              disabled={!isEditing}
              onChange={(e) =>
                setUserInfo({ ...userInfo, firstName: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Last Name</Label>
            <Input
              value={userInfo.lastName}
              disabled={!isEditing}
              onChange={(e) =>
                setUserInfo({ ...userInfo, lastName: e.target.value })
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
              disabled={!isEditing}
              onChange={(e) =>
                setUserInfo({ ...userInfo, phone: e.target.value })
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
              onCheckedChange={(checked) => handleEmailSubscriptionChange(!!checked)}
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

        {isEditing && (
          <div className="flex space-x-4">
            <Button onClick={handleSaveProfile}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};