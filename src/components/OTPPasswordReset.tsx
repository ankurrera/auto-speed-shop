import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OTPPasswordResetProps {
  onBackToLogin?: () => void;
  email?: string;
  onSuccess?: (email: string, password: string) => void;
}

const OTPPasswordReset = ({ onBackToLogin, email: initialEmail, onSuccess }: OTPPasswordResetProps) => {
  const [step, setStep] = useState<'email' | 'otp' | 'password'>('email');
  const [email, setEmail] = useState(initialEmail || "");
  const [otp, setOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp-email', {
        body: { 
          email, 
          type: 'password_reset' 
        }
      });

      if (error) {
        console.error('Error sending OTP:', error);
        toast({
          title: "Error",
          description: "Failed to send OTP. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });

      setStep('otp');
      setCountdown(300); // 5 minutes countdown
      
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setStep('password');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data: updateData, error: updateError } = await supabase.functions.invoke('verify-otp-and-reset-password', {
        body: { 
          email, 
          otp, 
          newPassword 
        }
      });

      if (updateError) {
        console.error('Error resetting password:', updateError);
        toast({
          title: "Error",
          description: "Failed to reset password. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully!",
      });
      
      // ✅ FIX: Call onSuccess with the email and new password
      if (onSuccess) {
        onSuccess(email, newPassword);
      }
      
      // Reset form state
      setStep('email');
      setEmail('');
      setOTP('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {step === 'email' && 'Reset Password'}
          {step === 'otp' && 'Enter Verification Code'}
          {step === 'password' && 'Set New Password'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'email' && (
          <form onSubmit={handleSendOTP} className="space-y-4">
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
              {loading ? "Sending..." : "Send Verification Code"}
            </Button>
            {onBackToLogin && (
              <Button variant="link" className="w-full" onClick={onBackToLogin}>
                Back to Login
              </Button>
            )}
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-2xl font-mono tracking-wider"
                required
              />
              <p className="text-sm text-muted-foreground text-center">
                Code sent to {email}
                {countdown > 0 && (
                  <span className="block text-primary">
                    Expires in {formatTime(countdown)}
                  </span>
                )}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={otp.length !== 6}>
              Verify Code
            </Button>
            <Button variant="link" className="w-full" onClick={() => setStep('email')}>
              Use Different Email
            </Button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
            <Button variant="link" className="w-full" onClick={() => setStep('otp')}>
              Back to Verification
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default OTPPasswordReset;