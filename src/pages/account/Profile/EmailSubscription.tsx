import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { EmailSubscriptionState, UserInfo } from "../types";
import { updateEmailSubscription } from "../utils";
import { useToast } from "@/components/ui/use-toast";

interface EmailSubscriptionProps {
  emailSubscription: EmailSubscriptionState;
  setEmailSubscription: (emailSubscription: EmailSubscriptionState) => void;
  userInfo: UserInfo;
}

export const EmailSubscription = ({ 
  emailSubscription, 
  setEmailSubscription, 
  userInfo 
}: EmailSubscriptionProps) => {
  const { toast } = useToast();

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
  );
};