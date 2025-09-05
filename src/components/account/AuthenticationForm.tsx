import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface AuthenticationFormProps {
  onLoginSuccess: (userId: string) => void;
}

const AuthenticationForm = ({ onLoginSuccess }: AuthenticationFormProps) => {
  const [view, setView] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loginMode, setLoginMode] = useState("user");
  const [adminExists, setAdminExists] = useState(true);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login failed:", error.message);
      alert("Login failed: " + error.message);
    } else {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", data.user.id)
        .single();

      const { data: sellerData, error: sellerError } = await supabase
        .from("sellers")
        .select("user_id")
        .eq("user_id", data.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        alert("Login failed: Could not retrieve profile information.");
        await supabase.auth.signOut();
      } else if (profileData?.is_admin && loginMode === "admin") {
        if (sellerData) {
          // Navigate to home if admin has seller account
          window.location.href = "/";
        } else {
          onLoginSuccess(data.user.id);
        }
      } else if (!profileData?.is_admin && loginMode === "user") {
        onLoginSuccess(data.user.id);
      } else {
        alert("Invalid login mode selected.");
        await supabase.auth.signOut();
      }
    }
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();

    if (loginMode === "admin" && adminExists) {
      alert("Admin account has already been created. Please log in.");
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        },
      },
    });

    if (error) {
      console.error('Signup error:', error.message);
      alert("Signup failed: " + error.message);
    } else {
      console.log('Signup successful, user:', data.user);

      if (loginMode === "admin") {
        await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('user_id', data.user.id);
        alert("Admin account created. Please log in to your account page.");
      } else {
        alert("Please check your email to confirm your account!");
      }
      setView("login");
    }
  };

  const handlePasswordReset = () => {
    const emailInput = prompt("Please enter your email address to reset your password:");
    if (emailInput) {
      supabase.auth.resetPasswordForEmail(emailInput, {
        redirectTo: `${window.location.origin}/reset-password`,
      }).then(({ error }) => {
        if (error) {
          alert("Error sending password reset email: " + error.message);
        } else {
          alert("Password reset email sent. Please check your inbox!");
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">
                {view === "login" && "Login to Your Account"}
                {view === "signup" && "Create a New Account"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {view === "login" ? (
                <>
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
                    <Button type="submit" className="w-full">
                      Login
                    </Button>
                  </form>

                  <div className="mt-6 text-center space-y-2">
                    <Button variant="link" className="text-sm" onClick={handlePasswordReset}>
                      Forgot your password?
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setView("signup")}>
                        Sign up here
                      </Button>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-first-name">First Name</Label>
                        <Input
                          id="signup-first-name"
                          placeholder="Enter your first name"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-last-name">Last Name</Label>
                        <Input
                          id="signup-last-name"
                          placeholder="Enter your last name"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
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
                    <Button type="submit" className="w-full">
                      Sign Up
                    </Button>
                  </form>

                  <div className="mt-6 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setView("login")}>
                        Log in here
                      </Button>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationForm;