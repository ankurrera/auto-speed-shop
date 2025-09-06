import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Address {
  id?: string;
  first_name: string;
  last_name: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  type: string;
  is_default: boolean;
}

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formAddress, setFormAddress] = useState<Address>({
    first_name: "",
    last_name: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
    phone: "",
    type: "shipping",
    is_default: false,
  });
  const { toast } = useToast();

  const fetchAddresses = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching addresses:", error.message);
      toast({ 
        title: "Error", 
        description: "Failed to load addresses", 
        variant: "destructive" 
      });
    } else {
      setAddresses(data || []);
    }
  }, [toast]);

  const saveAddress = useCallback(async (userId: string) => {
    if (editingAddressId) {
      const { error } = await supabase
        .from("addresses")
        .update(formAddress)
        .eq("id", editingAddressId);

      if (error) {
        toast({ 
          title: "Error", 
          description: "Failed to update address", 
          variant: "destructive" 
        });
        return false;
      }
    } else {
      const { error } = await supabase
        .from("addresses")
        .insert([{ ...formAddress, user_id: userId }]);

      if (error) {
        toast({ 
          title: "Error", 
          description: "Failed to add address", 
          variant: "destructive" 
        });
        return false;
      }
    }

    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormAddress({
      first_name: "", last_name: "", address_line_1: "", address_line_2: "",
      city: "", state: "", postal_code: "", country: "US", phone: "", 
      type: "shipping", is_default: false
    });
    fetchAddresses(userId);
    toast({ 
      title: "Success", 
      description: `Address ${editingAddressId ? 'updated' : 'added'} successfully` 
    });
    return true;
  }, [editingAddressId, formAddress, fetchAddresses, toast]);

  const deleteAddress = useCallback(async (addressId: string, userId: string) => {
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete address", 
        variant: "destructive" 
      });
      return false;
    }

    fetchAddresses(userId);
    toast({ 
      title: "Success", 
      description: "Address deleted successfully" 
    });
    return true;
  }, [fetchAddresses, toast]);

  const setDefaultAddress = useCallback(async (addressId: string, userId: string) => {
    // First, set all other addresses to not be the default
    const { error: unsetError } = await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (unsetError) {
      toast({ 
        title: "Error", 
        description: "Failed to update default address", 
        variant: "destructive" 
      });
      return false;
    }

    // Then set the selected address as default
    const { error: setError } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);

    if (setError) {
      toast({ 
        title: "Error", 
        description: "Failed to set default address", 
        variant: "destructive" 
      });
      return false;
    }

    fetchAddresses(userId);
    toast({ 
      title: "Success", 
      description: "Default address updated" 
    });
    return true;
  }, [fetchAddresses, toast]);

  const editAddress = useCallback((address: Address) => {
    setEditingAddressId(address.id || null);
    setFormAddress(address);
    setShowAddressForm(true);
  }, []);

  return {
    addresses,
    showAddressForm,
    setShowAddressForm,
    editingAddressId,
    formAddress,
    setFormAddress,
    fetchAddresses,
    saveAddress,
    deleteAddress,
    setDefaultAddress,
    editAddress,
  };
};