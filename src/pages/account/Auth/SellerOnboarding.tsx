import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface SellerOnboardingProps {
  onSuccess: () => void;
  onSkip: () => void;
  fetchAndSetUserData?: (userId: string) => void;
  showSellerCreationAfterAdmin?: boolean;
}

export const SellerOnboarding = ({ 
  onSuccess, 
  onSkip, 
  fetchAndSetUserData,
  showSellerCreationAfterAdmin = false
}: SellerOnboardingProps) => {
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerAddress, setNewSellerAddress] = useState("");
  const [newSellerPhoneNumber, setNewSellerPhoneNumber] = useState("");
  const [newSellerEmail, setNewSellerEmail] = useState("");
  const [newSellerPassword, setNewSellerPassword] = useState("");

  const handleCreateSellerAccount = async (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!newSellerName || !newSellerEmail || !newSellerPassword) {
      alert("Please fill in all required fields (Name, Email, Password).");
      return;
    }
    
    if (newSellerPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }
    
    try {
      let userId: string | null = null;

      const { data: newUserData, error: signUpError } = await supabase.auth.signUp(
        {
          email: newSellerEmail,
          password: newSellerPassword,
          options: {
            data: { first_name: newSellerName, is_seller: true },
          },
        }
      );

      if (signUpError) {
        console.error("Seller signup error:", signUpError);
        
        if (signUpError.message.includes("User already registered")) {
          // Check if user exists in profiles table
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("user_id, is_seller")
            .eq("email", newSellerEmail)
            .maybeSingle();
            
          if (existingProfile) {
            if (existingProfile.is_seller) {
              alert("This email is already associated with a seller account.");
              return;
            }
            userId = existingProfile.user_id;
            console.log("Found existing user profile, will update to seller status");
          } else {
            // Try to authenticate to get user ID
            const { data: signInData, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: newSellerEmail,
                password: newSellerPassword,
              });
            if (signInError) {
              alert("User exists but authentication failed. Please check the password or use a different email.");
              return;
            }
            userId = signInData.user.id;
            // Sign out immediately since we were just testing the credentials
            await supabase.auth.signOut();
          }
        } else {
          alert("Seller account creation failed: " + signUpError.message);
          return;
        }
      } else {
        userId = newUserData?.user?.id || null;
      }

      if (!userId) {
        alert("Could not resolve user ID. Please try again.");
        return;
      }

      // Update or create profile with seller status
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: userId,
          is_seller: true,
          email: newSellerEmail,
          first_name: newSellerName,
          role: "seller",
        },
        { onConflict: "user_id" }
      );
      
      if (upsertError) {
        console.error("Profile upsert error:", upsertError);
        alert("Failed to update user profile: " + upsertError.message);
        return;
      }

      // Create seller record
      const { error: sellerInsertError } = await supabase.from("sellers").insert({
        user_id: userId,
        name: newSellerName,
        address: newSellerAddress || "",
        email: newSellerEmail,
        phone: newSellerPhoneNumber || "",
      });
      
      if (sellerInsertError) {
        console.error("Seller insert error:", sellerInsertError);
        
        // Handle specific seller creation errors
        if (sellerInsertError.code === "23505") { // Unique constraint violation
          alert("A seller account with this information already exists.");
        } else {
          alert("Failed to create seller record: " + sellerInsertError.message);
        }
        return;
      }

      // Ensure profile is marked as seller (redundant but safe)
      await supabase
        .from("profiles")
        .update({ is_seller: true })
        .eq("user_id", userId);

      alert("Seller account created successfully!");
      
      // Clear form
      setNewSellerName("");
      setNewSellerAddress("");
      setNewSellerEmail("");
      setNewSellerPassword("");
      setNewSellerPhoneNumber("");

      // If this was after admin creation, redirect to login
      if (showSellerCreationAfterAdmin) {
        onSuccess();
        alert("Seller account created! Please log in with your admin credentials to access the admin dashboard.");
      } else {
        // Refresh user data if admin is logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (session && fetchAndSetUserData) {
          fetchAndSetUserData(session.user.id);
        }
        onSuccess();
      }
      
    } catch (error: any) {
      console.error("Unexpected seller creation error:", error);
      
      // Handle network/connection errors
      if (error.message && error.message.includes("Failed to fetch")) {
        alert("Network error: Please check your internet connection and try again.");
      } else {
        alert("An unexpected error occurred while creating seller account: " + (error.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Create Seller Account
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Now that you've created an admin account, create a seller account to manage products and inventory.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSellerAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={newSellerName}
                    onChange={(e) => setNewSellerName(e.target.value)}
                    placeholder="Enter seller name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newSellerEmail}
                    onChange={(e) => setNewSellerEmail(e.target.value)}
                    placeholder="Enter seller email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newSellerPassword}
                    onChange={(e) => setNewSellerPassword(e.target.value)}
                    placeholder="Enter seller password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address (Optional)</Label>
                  <Input
                    value={newSellerAddress}
                    onChange={(e) => setNewSellerAddress(e.target.value)}
                    placeholder="Enter seller address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone (Optional)</Label>
                  <Input
                    type="tel"
                    value={newSellerPhoneNumber}
                    onChange={(e) => setNewSellerPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1">
                    Create Seller
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onSkip}
                    className="flex-1"
                  >
                    Skip for Now
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