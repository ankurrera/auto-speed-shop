import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface EmailSubscriptionProps {
  emailSubscription: {
    subscribed: boolean;
    loading: boolean;
    exists: boolean;
  };
  onSubscriptionChange: (checked: boolean) => void;
}

const EmailSubscription = ({ emailSubscription, onSubscriptionChange }: EmailSubscriptionProps) => {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Email Preferences</h3>
        <div className="flex items-start space-x-3">
          <Checkbox
            id="email-notifications"
            checked={emailSubscription.subscribed}
            disabled={emailSubscription.loading}
            onCheckedChange={(checked) => onSubscriptionChange(!!checked)}
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
    </>
  );
};

export default EmailSubscription;