// Custom hook for address management logic
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Address } from "@/types/account";
import { defaultFormAddress } from "@/constants/account";

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formAddress, setFormAddress] = useState<Address>(defaultFormAddress);
  const { toast } = useToast();

  const fetchUserAddresses = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching addresses:", error.message);
    } else {
      setAddresses(data);
    }
  }, []);

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id || null);
    setFormAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      console.error("Error deleting address:", error.message);
      alert("Failed to delete address.");
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        fetchUserAddresses(session.user.id);
      }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // First, set all other addresses to not be the default
    const { error: unsetError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', session.user.id);

    if (unsetError) {
      toast({ title: "Error", description: "Could not unset other default addresses.", variant: "destructive" });
      return;
    }

    // Then, set the selected address as the default
    const { error: setError } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);

    if (setError) {
      toast({ title: "Error", description: "Could not set the new default address.", variant: "destructive" });
    } else {
      toast({ title: "Success!", description: "Default address updated." });
      fetchUserAddresses(session.user.id);
    }
  };

  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (formAddress.is_default) {
      // If the new address is set to default, unset all other addresses for the user
      const { error: unsetError } = await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', session.user.id);

      if (unsetError) {
        toast({ title: "Error", description: "Could not unset other default addresses.", variant: "destructive" });
        return;
      }
    }

    const addressToSave = { ...formAddress, user_id: session.user.id };

    if (editingAddressId) {
      const { error } = await supabase
        .from("addresses")
        .update(addressToSave)
        .eq("id", editingAddressId);

      if (error) {
        console.error("Error updating address:", error.message);
        alert("Failed to update address.");
      }
    } else {
      const { error } = await supabase
        .from("addresses")
        .insert([addressToSave]);

      if (error) {
        console.error("Error adding address:", error.message);
        alert("Failed to add new address.");
      }
    }

    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormAddress(defaultFormAddress);
    fetchUserAddresses(session.user.id);
  };

  const resetForm = () => {
    setShowAddressForm(true);
    setEditingAddressId(null);
    setFormAddress(defaultFormAddress);
  };

  return {
    addresses,
    setAddresses,
    showAddressForm,
    setShowAddressForm,
    editingAddressId,
    setEditingAddressId,
    formAddress,
    setFormAddress,
    fetchUserAddresses,
    handleEditAddress,
    handleDeleteAddress,
    handleSetDefaultAddress,
    handleAddressFormSubmit,
    resetForm,
  };
};