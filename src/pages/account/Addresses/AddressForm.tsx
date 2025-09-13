import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AddressForm as AddressFormType } from "../types";
import { saveAddress } from "../utils";

interface AddressFormProps {
  formAddress: AddressFormType;
  setFormAddress: (address: AddressFormType) => void;
  editingAddressId: string | null;
  userId: string;
  onSuccess: (addresses: any[]) => void;
  onCancel: () => void;
}

export const AddressForm = ({
  formAddress,
  setFormAddress,
  editingAddressId,
  userId,
  onSuccess,
  onCancel,
}: AddressFormProps) => {
  const handleAddressFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      const updatedAddresses = await saveAddress(formAddress, userId, editingAddressId);
      onSuccess(updatedAddresses);
    } catch (error) {
      console.error("Error saving address:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingAddressId ? "Edit Address" : "Add New Address"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddressFormSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={formAddress.first_name}
                onChange={(e) =>
                  setFormAddress({
                    ...formAddress,
                    first_name: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={formAddress.last_name}
                onChange={(e) =>
                  setFormAddress({
                    ...formAddress,
                    last_name: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address Line 1</Label>
            <Input
              value={formAddress.address_line_1}
              onChange={(e) =>
                setFormAddress({
                  ...formAddress,
                  address_line_1: e.target.value,
                })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Address Line 2</Label>
            <Input
              value={formAddress.address_line_2}
              onChange={(e) =>
                setFormAddress({
                  ...formAddress,
                  address_line_2: e.target.value,
                })
              }
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>City</Label>
              <Input
                value={formAddress.city}
                onChange={(e) =>
                  setFormAddress({ ...formAddress, city: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                value={formAddress.state}
                onChange={(e) =>
                  setFormAddress({ ...formAddress, state: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input
                value={formAddress.postal_code}
                onChange={(e) =>
                  setFormAddress({
                    ...formAddress,
                    postal_code: e.target.value,
                  })
                }
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={formAddress.phone}
              onChange={(e) =>
                setFormAddress({ ...formAddress, phone: e.target.value })
              }
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
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingAddressId ? "Save Changes" : "Add Address"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};