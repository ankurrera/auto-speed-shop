import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Mail, Check, Bell } from "lucide-react";

const EmailSubscriptionDemo = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscriptionChange = async (checked: boolean) => {
    setLoading(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSubscribed(checked);
    setLoading(false);

    // Show success message
    toast({
      title: "Preferences Updated",
      description: checked 
        ? "You will now receive email notifications about new products and parts!" 
        : "You have been unsubscribed from email notifications.",
    });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Email Subscription Feature Demo</h1>
          <p className="text-muted-foreground">
            This demonstrates the new email notification functionality for new products and parts.
          </p>
        </div>

        {/* Profile Card with Email Preferences */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Demo user info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>First Name</Label>
                <div className="p-3 bg-muted rounded-md">John</div>
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <div className="p-3 bg-muted rounded-md">Doe</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="p-3 bg-muted rounded-md">john.doe@example.com</div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="p-3 bg-muted rounded-md">+1 (555) 123-4567</div>
              </div>
            </div>
            
            {/* Email Preferences Section */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Preferences
              </h3>
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="email-notifications"
                  checked={subscribed}
                  disabled={loading}
                  onCheckedChange={(checked) => handleSubscriptionChange(!!checked)}
                />
                <div className="space-y-1">
                  <Label htmlFor="email-notifications" className="text-sm font-medium cursor-pointer">
                    Notify me about new products and parts
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get email notifications when sellers list new products and auto parts that might interest you.
                  </p>
                </div>
                {subscribed && (
                  <Check className="h-4 w-4 text-green-500 ml-2" />
                )}
              </div>
              {loading && (
                <p className="text-xs text-muted-foreground">Updating preferences...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo Notification Card */}
        {subscribed && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="text-green-800 dark:text-green-200 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Notifications Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-700 dark:text-green-300 text-sm">
                You're now subscribed to receive email notifications when new products and parts are listed by sellers. 
                You can unsubscribe at any time by unchecking the preference above.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Feature Summary */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Implemented Features</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Email subscription checkbox in user profiles
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Save preferences to email_subscriptions table in Supabase
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Show confirmation message when preferences are updated
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Preference persistence across sessions
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Email notification service for new products/parts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Automatic notifications when sellers list new items
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Unsubscribe by unchecking the preference
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Technical Implementation */}
        <Card>
          <CardHeader>
            <CardTitle>🔧 Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold">Database Table:</h4>
                <p className="text-muted-foreground">Created email_subscriptions table with user_id, email, subscribed_to_new_products fields</p>
              </div>
              <div>
                <h4 className="font-semibold">Services:</h4>
                <p className="text-muted-foreground">EmailSubscriptionService for managing preferences, EmailNotificationService for sending notifications</p>
              </div>
              <div>
                <h4 className="font-semibold">Integration:</h4>
                <p className="text-muted-foreground">Integrated into existing Account.tsx profile page and product/part creation workflow</p>
              </div>
              <div>
                <h4 className="font-semibold">Email Notifications:</h4>
                <p className="text-muted-foreground">Triggered automatically when sellers create new products or parts, sent to all subscribed users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailSubscriptionDemo;