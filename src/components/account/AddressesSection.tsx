import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

type Address = {
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
};

type AddressesSectionProps = {
  addresses: Address[];
  showAddressForm: boolean;
  setShowAddressForm: (show: boolean) => void;
  editingAddressId: string | null;
  setEditingAddressId: (id: string | null) => void;
  formAddress: Address;
  setFormAddress: (addr: Address) => void;
  setAddresses: (addrs: Address[]) => void;
  toast: any;
  supabase: any;
};

const AddressesSection = ({
  addresses,
  showAddressForm,
  setShowAddressForm,
  editingAddressId,
  setEditingAddressId,
  formAddress,
  setFormAddress,
  setAddresses,
  toast,
  supabase,
}: AddressesSectionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle edit button
  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id ?? null);
    setFormAddress(address);
    setShowAddressForm(true);
  };

  // Handle delete button
  const handleDeleteAddress = async (addressId?: string) => {
    if (!addressId) return;
    setIsSubmitting(true);
    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete address.", variant: "destructive" });
    } else {
      setAddresses(addresses.filter((addr) => addr.id !== addressId));
      toast({ title: "Deleted", description: "Address deleted." });
    }
    setIsSubmitting(false);
  };

  // Handle set default address
  const handleSetDefaultAddress = async (addressId?: string) => {
    if (!addressId) return;
    setIsSubmitting(true);
    // Set all to not default
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", addressId);
    // Refetch addresses
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    if (!error) setAddresses(data);
    toast({ title: "Updated", description: "Default address set." });
    setIsSubmitting(false);
  };

  // Handle form submit for add/edit
  const handleAddressFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();
    const addressToSave = { ...formAddress, user_id: session.user.id };

    if (formAddress.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    }

    if (editingAddressId) {
      await supabase.from("addresses").update(addressToSave).eq("id", editingAddressId);
    } else {
      await supabase.from("addresses").insert([addressToSave]);
    }
    // Refetch addresses
    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setAddresses(data);
    setShowAddressForm(false);
    setEditingAddressId(null);
    setFormAddress({
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
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Saved Addresses
        </h2>
        <Button
          disabled={isSubmitting}
          onClick={() => {
            setShowAddressForm(true);
            setEditingAddressId(null);
            setFormAddress({
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
          }}
        >
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
                    onChange={(e) => setFormAddress({ ...formAddress, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address-last-name">Last Name</Label>
                  <Input
                    id="address-last-name"
                    value={formAddress.last_name}
                    onChange={(e) => setFormAddress({ ...formAddress, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-line-1">Address Line 1</Label>
                <Input
                  id="address-line-1"
                  value={formAddress.address_line_1}
                  onChange={(e) => setFormAddress({ ...formAddress, address_line_1: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address-line-2">Address Line 2</Label>
                <Input
                  id="address-line-2"
                  value={formAddress.address_line_2}
                  onChange={(e) => setFormAddress({ ...formAddress, address_line_2: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formAddress.city}
                    onChange={(e) => setFormAddress({ ...formAddress, city: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formAddress.state}
                    onChange={(e) => setFormAddress({ ...formAddress, state: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal-code">Postal Code</Label>
                  <Input
                    id="postal-code"
                    value={formAddress.postal_code}
                    onChange={(e) => setFormAddress({ ...formAddress, postal_code: e.target.value })}
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
                  onChange={(e) => setFormAddress({ ...formAddress, phone: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_default"
                  checked={formAddress.is_default}
                  onCheckedChange={(checked) => setFormAddress({ ...formAddress, is_default: !!checked })}
                />
                <Label htmlFor="is_default">Set as default address</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {editingAddressId ? "Save Changes" : "Add Address"}
                </Button>
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
                    <p className="font-medium">
                      {address.first_name} {address.last_name}
                    </p>
                    <p>{address.address_line_1}</p>
                    {address.address_line_2 && <p>{address.address_line_2}</p>}
                    <p>
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p>{address.country}</p>
                    {address.phone && <p className="mt-2 text-muted-foreground">{address.phone}</p>}
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                      disabled={isSubmitting}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleSetDefaultAddress(address.id)}
                        disabled={isSubmitting}
                      >
                        Set as Default
                      </Button>
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

export default AddressesSection;