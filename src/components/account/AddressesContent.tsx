import { useState, useCallback, useEffect, FormEvent } from "react";
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { Address } from "./types";

interface AddressesContentProps {
  userId: string;
}

const AddressesContent = ({ userId }: AddressesContentProps) => {
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

  const fetchUserAddresses = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching addresses:", error.message);
    } else {
      setAddresses(data || []);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserAddresses(userId);
    }
  }, [userId, fetchUserAddresses]);

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
      fetchUserAddresses(userId);
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
      console.error("Error unsetting default addresses:", unsetError.message);
      alert("Failed to set default address.");
      return;
    }
  
    // Now set the selected address as default
    const { error: setError } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId);
  
    if (setError) {
      console.error("Error setting default address:", setError.message);
      alert("Failed to set default address.");
    } else {
      fetchUserAddresses(userId);
    }
  };

  const handleAddressFormSubmit = async (e: FormEvent) => {
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
        console.error("Error unsetting default addresses:", unsetError.message);
        alert("Failed to save address.");
        return;
      }
    }
  
    if (editingAddressId) {
      // Update existing address
      const { error } = await supabase
        .from("addresses")
        .update(formAddress)
        .eq("id", editingAddressId);
      if (error) {
        console.error("Error updating address:", error.message);
        alert("Failed to update address.");
      }
    } else {
      // Create new address
      const { error } = await supabase
        .from("addresses")
        .insert([{ ...formAddress, user_id: session.user.id }]);
      if (error) {
        console.error("Error adding address:", error.message);
        alert("Failed to add new address.");
      }
    }
  
    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormAddress({
      first_name: "", last_name: "", address_line_1: "", address_line_2: "",
      city: "", state: "", postal_code: "", country: "US", phone: "", type: "shipping", is_default: false
    });
    fetchUserAddresses(userId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Saved Addresses
        </h2>
        <Button onClick={() => {
          setShowAddressForm(true);
          setEditingAddressId(null);
          setFormAddress({
            first_name: "", last_name: "", address_line_1: "", address_line_2: "",
            city: "", state: "", postal_code: "", country: "US", phone: "", type: "shipping", is_default: false
          });
        }}>
          Add New Address
        </Button>
      </div>

      {showAddressForm ? (
        <Card>
          <CardHeader>
            <CardTitle>{editingAddressId ? "Edit Address" : "Add New Address"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddressFormSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address-first-name">First Name</Label>
                  <Input
                    id="address-first-name"
                    value={formAddress.first_name}
                    onChange={(e) => setFormAddress({...formAddress, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-last-name">Last Name</Label>
                  <Input
                    id="address-last-name"
                    value={formAddress.last_name}
                    onChange={(e) => setFormAddress({...formAddress, last_name: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-line-1">Address Line 1</Label>
                <Input
                  id="address-line-1"
                  value={formAddress.address_line_1}
                  onChange={(e) => setFormAddress({...formAddress, address_line_1: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-line-2">Address Line 2</Label>
                <Input
                  id="address-line-2"
                  value={formAddress.address_line_2}
                  onChange={(e) => setFormAddress({...formAddress, address_line_2: e.target.value})}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formAddress.city}
                    onChange={(e) => setFormAddress({...formAddress, city: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formAddress.state}
                    onChange={(e) => setFormAddress({...formAddress, state: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={formAddress.postal_code}
                    onChange={(e) => setFormAddress({...formAddress, postal_code: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-phone">Phone Number</Label>
                <Input
                  id="address-phone"
                  type="tel"
                  value={formAddress.phone}
                  onChange={(e) => setFormAddress({...formAddress, phone: e.target.value})}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={formAddress.is_default}
                  onCheckedChange={(checked) =>
                    setFormAddress({ ...formAddress, is_default: !!checked })
                  }
                />
                <Label htmlFor="is_default">Set as default address</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                <Button type="submit">{editingAddressId ? "Save Changes" : "Add Address"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <Card key={address.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{address.type} Address</CardTitle>
                    {address.is_default && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{address.first_name} {address.last_name}</p>
                    <p>{address.address_line_1}</p>
                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                    <p>{address.city}, {address.state} {address.postal_code}</p>
                    <p>{address.country}</p>
                    {address.phone && <p className="mt-2 text-muted-foreground">{address.phone}</p>}
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => handleEditAddress(address)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteAddress(address.id!)}>Delete</Button>
                    {!address.is_default && (
                      <Button variant="secondary" size="sm" onClick={() => handleSetDefaultAddress(address.id!)}>Set as Default</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-2 text-center text-muted-foreground py-8">
              You have no saved addresses yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressesContent;