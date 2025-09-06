import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

interface LoginFormProps {
  onLogin: (email: string, password: string, loginMode: string) => Promise<boolean>;
  onSwitchToSignup: () => void;
  onForgotPassword: (email: string) => Promise<boolean>;
}

export const LoginForm = ({ onLogin, onSwitchToSignup, onForgotPassword }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState("user");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const success = await onLogin(email, password, loginMode);
    if (success) {
      setEmail("");
      setPassword("");
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    const emailInput = prompt("Please enter your email address to reset your password:");
    if (emailInput) {
      onForgotPassword(emailInput);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Login to Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>

              <div className="mt-6 text-center space-y-2">
                <Button variant="link" className="text-sm" onClick={handleForgotPassword}>
                  Forgot your password?
                </Button>
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Button variant="link" className="p-0 h-auto text-primary" onClick={onSwitchToSignup}>
                    Sign up here
                  </Button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};