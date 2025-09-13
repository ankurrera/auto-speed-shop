import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LoginMode } from "../types";

interface LoginProps {
  onLogin: (userId: string, loginMode: LoginMode) => void;
  onSwitchToSignup: () => void;
}

export const Login = ({ onLogin, onSwitchToSignup }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("user");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert("Login failed: " + error.message);
      return;
    }
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", data.user.id)
      .single();

    if (profileError) {
      alert("Could not retrieve profile info");
      await supabase.auth.signOut();
      return;
    }
    if (profileData?.is_admin && loginMode === "admin") {
      onLogin(data.user.id, loginMode);
      navigate("/account/admin-dashboard");
    } else if (!profileData?.is_admin && loginMode === "user") {
      onLogin(data.user.id, loginMode);
    } else {
      alert("Invalid login mode for this account.");
      await supabase.auth.signOut();
    }
  };

  const handlePasswordReset = () => {
    const emailInput = prompt("Enter your email:");
    if (emailInput) {
      supabase.auth
        .resetPasswordForEmail(emailInput, {
          redirectTo: `${window.location.origin}/reset-password`,
        })
        .then(({ error }) => {
          if (error)
            alert("Failed: " + error.message);
          else
            alert("Password reset email sent. Check inbox.");
        });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Login to Your Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="flex justify-center space-x-2">
                  <Button
                    type="button"
                    variant={loginMode === "user" ? "default" : "outline"}
                    onClick={() => setLoginMode("user")}
                  >
                    User Login
                  </Button>
                  <Button
                    type="button"
                    variant={loginMode === "admin" ? "default" : "outline"}
                    onClick={() => setLoginMode("admin")}
                  >
                    Admin Login
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <div className="text-center mt-4 space-y-2 text-sm">
                  <Button
                    type="button"
                    variant="link"
                    onClick={handlePasswordReset}
                  >
                    Forgot Password?
                  </Button>
                  <div>
                    <span className="text-muted-foreground">
                      Don't have an account?{" "}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto"
                      onClick={onSwitchToSignup}
                    >
                      Sign up
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};