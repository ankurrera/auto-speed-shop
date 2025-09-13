import { useState, FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { LoginMode } from "../types";

interface SignupProps {
  onSignup: (userId: string, loginMode: LoginMode) => void;
  onSwitchToLogin: () => void;
  adminExists: boolean;
}

export const Signup = ({ onSignup, onSwitchToLogin, adminExists }: SignupProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>("user");

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      alert("Please fill in all required fields.");
      return;
    }
    
    if (password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    if (loginMode === "admin" && adminExists) {
      alert("Admin already exists.");
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { first_name: firstName, last_name: lastName, phone: phone || "" },
        },
      });
      
      if (error) {
        console.error("Signup error:", error);
        
        // Handle specific error cases
        if (error.message && error.message.includes("User already registered")) {
          alert("An account with this email already exists. Please try logging in instead, or use a different email address.");
          onSwitchToLogin();
          return;
        } else if (error.message && error.message.includes("Email rate limit exceeded")) {
          alert("Too many signup attempts. Please wait a moment before trying again.");
          return;
        } else if (error.message && error.message.includes("Invalid email")) {
          alert("Please enter a valid email address.");
          return;
        } else {
          alert("Signup failed: " + error.message);
          return;
        }
      }

      // Create profile record in profiles table with retry logic
      if (data.user) {
        let profileCreated = false;
        let retryCount = 0;
        const maxRetries = 3;

        while (!profileCreated && retryCount < maxRetries) {
          try {
            const { error: profileError } = await supabase.from("profiles").upsert(
              {
                user_id: data.user.id,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || "",
                is_admin: loginMode === "admin",
                is_seller: false,
              },
              { onConflict: "user_id" }
            );
            
            if (profileError) {
              console.error(`Profile creation attempt ${retryCount + 1} failed:`, profileError);
              
              // Handle specific profile creation errors
              if (profileError.code === "23505") { // Unique constraint violation
                console.log("Profile already exists, continuing...");
                profileCreated = true;
              } else if (profileError.code === "42501") { // RLS policy violation
                console.error("Profile creation denied by RLS policy:", profileError);
                throw new Error("Profile creation failed due to permissions. Please contact support.");
              } else if (retryCount === maxRetries - 1) {
                throw new Error(`Profile creation failed after ${maxRetries} attempts: ${profileError.message}`);
              }
            } else {
              profileCreated = true;
              console.log("Profile created successfully");
            }
          } catch (profileCreateError: any) {
            console.error("Profile creation error:", profileCreateError);
            if (retryCount === maxRetries - 1) {
              throw new Error(`Profile creation failed: ${profileCreateError.message}`);
            }
          }
          
          retryCount++;
          if (!profileCreated && retryCount < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }

        if (loginMode === "admin" && data.user) {
          // For admin signup, show seller creation form
          alert("Admin account created successfully! Please create a seller account now.");
          // This would trigger the seller creation flow in the parent component
          onSignup(data.user.id, loginMode);
        } else {
          alert("Account created successfully! You can now log in.");
          onSwitchToLogin();
        }
      } else {
        alert("Signup failed - no user data returned");
      }
    } catch (error: any) {
      console.error("Overall signup error:", error);
      alert(`Signup failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Create Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="flex justify-center space-x-2 mb-4">
                  <Button
                    type="button"
                    variant={loginMode === "user" ? "default" : "outline"}
                    onClick={() => setLoginMode("user")}
                  >
                    User Signup
                  </Button>
                  {!adminExists && (
                    <Button
                      type="button"
                      variant={loginMode === "admin" ? "default" : "outline"}
                      onClick={() => setLoginMode("admin")}
                    >
                      Admin Signup
                    </Button>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
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
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter your phone number"
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
                  Sign Up
                </Button>
                <div className="text-center text-sm mt-4">
                  Already have an account?{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto"
                    onClick={onSwitchToLogin}
                  >
                    Login
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};