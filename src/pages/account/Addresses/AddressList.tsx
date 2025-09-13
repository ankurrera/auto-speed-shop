import { useState } from "react";
import { MapPin, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressForm as AddressFormType } from "../types";
import { AddressForm } from "./AddressForm";
import { deleteAddress, setDefaultAddress } from "../utils";

interface AddressListProps {
  addresses: any[];
  onAddressesChange: (addresses: any[]) => void;
  userId: string;
}

export const AddressList = ({ addresses, onAddressesChange, userId }: AddressListProps) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formAddress, setFormAddress] = useState<AddressFormType>({
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

  const handleEditAddress = (address: any) => {
    setEditingAddressId(address.id);
    setFormAddress(address);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const updatedAddresses = await deleteAddress(id, userId);
      onAddressesChange(updatedAddresses);
    } catch (error) {
      console.error("Error deleting address:", error);
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const updatedAddresses = await setDefaultAddress(addressId, userId);
      onAddressesChange(updatedAddresses);
    } catch (error) {
      console.error("Error setting default address:", error);
    }
  };

  const handleAddressFormSuccess = (updatedAddresses: any[]) => {
    onAddressesChange(updatedAddresses);
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
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Saved Addresses
        </h2>
        <Button
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
        <AddressForm
          formAddress={formAddress}
          setFormAddress={setFormAddress}
          editingAddressId={editingAddressId}
          userId={userId}
          onSuccess={handleAddressFormSuccess}
          onCancel={() => setShowAddressForm(false)}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {addresses.length > 0 ? (
            addresses.map((address) => (
              <Card key={address.id}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg capitalize">
                    {address.type} Address
                  </CardTitle>
                  {address.is_default && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Default
                    </span>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">
                      {address.first_name} {address.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.address_line_1}
                    </p>
                    {address.address_line_2 && (
                      <p className="text-sm text-muted-foreground">
                        {address.address_line_2}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.postal_code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {address.phone}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefaultAddress(address.id)}
                      >
                        Set Default
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2">
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
                <p className="text-muted-foreground mb-4">
                  Add your first address to streamline your checkout experience.
                </p>
                <Button
                  onClick={() => {
                    setShowAddressForm(true);
                    setEditingAddressId(null);
                  }}
                >
                  Add Your First Address
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};