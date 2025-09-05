// Custom hook for seller management logic
import { useState, useCallback, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSeller = () => {
  const [newSellerName, setNewSellerName] = useState("");
  const [newSellerAddress, setNewSellerAddress] = useState("");
  const [newSellerPhoneNumber, setNewSellerPhoneNumber] = useState("");
  const [newSellerEmail, setNewSellerEmail] = useState("");
  const [newSellerPassword, setNewSellerPassword] = useState("");
  const [sellerId, setSellerId] = useState<string | null>(null);

  const checkSellerExists = useCallback(async (userId: string) => {
    const { data, count, error } = await supabase
      .from('profiles')
      .select('is_seller', { count: 'exact' })
      .eq('is_seller', true);

    if (error) {
      console.error("Error checking seller status:", error.message);
      return false;
    } else {
      const sellerExists = count > 0;
      if (sellerExists) {
        const { data: sellerInfoData, error: sellerInfoError } = await supabase
          .from('sellers')
          .select('id')
          .eq('user_id', userId)
          .single();
        if (sellerInfoData) setSellerId(sellerInfoData.id);
      }
      return sellerExists;
    }
  }, []);

  const handleCreateSellerAccount = async (e: FormEvent, fetchAndSetUserData: (userId: string) => Promise<void>) => {
    e.preventDefault();

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
        alert("Failed to create seller account. User exists but profile could not be retrieved.");
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
          alert("A user with this email exists, but we couldn't sign in. Please log in directly.");
          return;
        }
        userId = signedInData.user.id;
      }
    } else if (signUpError) {
      console.error('Seller account creation error:', signUpError.message);
      alert("Failed to create seller account: " + signUpError.message);
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
            alert('Error updating profiles table. Please try again.');
            return;
        }
    } else {
        alert("User ID could not be determined. Seller creation failed.");
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
      alert('Error creating seller account. Please try again.');
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ is_seller: true })
      .eq('user_id', userId);

    if (profileUpdateError) {
      console.error("Error updating profile with seller status:", profileUpdateError.message);
    }

    alert(`Seller account created successfully for ${newSellerEmail}!`);
    setNewSellerName("");
    setNewSellerAddress("");
    setNewSellerEmail("");
    setNewSellerPassword("");
    setNewSellerPhoneNumber("");

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await fetchAndSetUserData(session.user.id);
    }
  };

  return {
    // State
    newSellerName,
    setNewSellerName,
    newSellerAddress,
    setNewSellerAddress,
    newSellerPhoneNumber,
    setNewSellerPhoneNumber,
    newSellerEmail,
    setNewSellerEmail,
    newSellerPassword,
    setNewSellerPassword,
    sellerId,
    setSellerId,
    
    // Actions
    checkSellerExists,
    handleCreateSellerAccount,
  };
};