import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface PasswordResetFormProps {
  onBackToLogin: () => void;
}

const PasswordResetForm = ({ onBackToLogin }: PasswordResetFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://auto-speed-shop-qsal.vercel.app/account/reset-password',
    });

    if (error) {
      setMessage(`Error: ${error.message}`);
      console.error("Password reset failed:", error.message);
    } else {
      setMessage("Check your email for the password reset link!");
    }
    setLoading(false);
  };

  return (
    <CardContent>
      <form onSubmit={handlePasswordReset} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending..." : "Send Password Reset Email"}
        </Button>
      </form>

      {message && (
        <div className="mt-4 text-center">
          <p className="text-sm text-primary">{message}</p>
        </div>
      )}

      <div className="mt-6 text-center">
        <Button variant="link" className="text-sm" onClick={onBackToLogin}>
          Back to Login
        </Button>
      </div>
    </CardContent>
  );
};

export default PasswordResetForm;