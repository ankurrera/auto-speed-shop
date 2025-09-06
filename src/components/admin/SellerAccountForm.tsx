import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SellerAccountFormProps {
  onSellerCreated: () => void;
}

export const SellerAccountForm = ({ onSellerCreated }: SellerAccountFormProps) => {
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerAddress, setNewSellerAddress] = useState("");
  const [newSellerPhoneNumber, setNewSellerPhoneNumber] = useState("");
  const [newSellerEmail, setNewSellerEmail] = useState("");
  const [newSellerPassword, setNewSellerPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { toast } = useToast();

  const handleCreateSellerAccount = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let userId = null;
      let signUpError = null;

      const { data: newUserData, error: userSignUpError } = await supabase.auth.signUp({
        email: newSellerEmail,
        password: newSellerPassword,
        options: {
          data: {
            first_name: newSellerName,
            is_seller: true,
          },
        },
      });
      signUpError = userSignUpError;

      if (signUpError && signUpError.message.includes("User already registered")) {
        const { data: existingProfileData, error: profileError } = await supabase
          .from('profiles')
          .select('user_id, email')
          .eq('email', newSellerEmail)
          .maybeSingle();

        if (profileError) {
          console.error("Error retrieving existing user profile:", profileError.message);
          toast({
            title: "Error",
            description: "Failed to create seller account. User exists but profile could not be retrieved.",
            variant: "destructive",
          });
          return;
        }
        if (existingProfileData) {
          userId = existingProfileData.user_id;
        } else {
          const { data: signedInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: newSellerEmail,
            password: newSellerPassword
          });
          if (signInError) {
            console.error("Failed to sign in existing user:", signInError.message);
            toast({
              title: "Error",
              description: "A user with this email exists, but we couldn't sign in. Please log in directly.",
              variant: "destructive",
            });
            return;
          }
          userId = signedInData.user.id;
        }
      } else if (signUpError) {
        console.error('Seller account creation error:', signUpError.message);
        toast({
          title: "Error",
          description: "Failed to create seller account: " + signUpError.message,
          variant: "destructive",
        });
        return;
      } else {
        userId = newUserData?.user?.id;
      }

      if (userId) {
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            is_seller: true,
            email: newSellerEmail,
            first_name: newSellerName
          }, { onConflict: 'user_id' });

        if (upsertError) {
          console.error('Error upserting profiles table:', upsertError.message);
          toast({
            title: "Error",
            description: 'Error updating profiles table. Please try again.',
            variant: "destructive",
          });
          return;
        }
      } else {
        toast({
          title: "Error",
          description: "User ID could not be determined. Seller creation failed.",
          variant: "destructive",
        });
        return;
      }

      const { error: sellerInsertError } = await supabase
        .from('sellers')
        .insert({
          user_id: userId,
          name: newSellerName,
          address: newSellerAddress,
          email: newSellerEmail,
          phone: newSellerPhoneNumber,
        });

      if (sellerInsertError) {
        console.error('Error inserting into sellers table:', sellerInsertError.message);
        toast({
          title: "Error",
          description: 'Error creating seller account. Please try again.',
          variant: "destructive",
        });
        return;
      }

      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ is_seller: true })
        .eq('user_id', userId);

      if (profileUpdateError) {
        console.error("Error updating profile with seller status:", profileUpdateError.message);
      }

      toast({
        title: "Success",
        description: `Seller account created successfully for ${newSellerEmail}!`,
      });
      
      setNewSellerName("");
      setNewSellerAddress("");
      setNewSellerEmail("");
      setNewSellerPassword("");
      setNewSellerPhoneNumber("");
      
      onSellerCreated();
    } catch (error) {
      console.error("Unexpected error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Seller Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateSellerAccount} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seller-name">Seller Name</Label>
            <Input
              id="seller-name"
              value={newSellerName}
              onChange={(e) => setNewSellerName(e.target.value)}
              placeholder="Enter seller name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seller-email">Email</Label>
            <Input
              id="seller-email"
              type="email"
              value={newSellerEmail}
              onChange={(e) => setNewSellerEmail(e.target.value)}
              placeholder="Enter seller email"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seller-password">Password</Label>
            <Input
              id="seller-password"
              type="password"
              value={newSellerPassword}
              onChange={(e) => setNewSellerPassword(e.target.value)}
              placeholder="Enter seller password"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seller-phone">Phone Number</Label>
            <Input
              id="seller-phone"
              value={newSellerPhoneNumber}
              onChange={(e) => setNewSellerPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seller-address">Address</Label>
            <Textarea
              id="seller-address"
              value={newSellerAddress}
              onChange={(e) => setNewSellerAddress(e.target.value)}
              placeholder="Enter seller address"
              rows={3}
              required
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Seller Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};