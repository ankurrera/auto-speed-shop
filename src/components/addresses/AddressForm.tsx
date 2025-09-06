import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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

interface AddressFormProps {
  formAddress: Address;
  setFormAddress: (address: Address) => void;
  editingAddressId: string | null;
  onSave: () => Promise<boolean>;
  onCancel: () => void;
}

export const AddressForm = ({ 
  formAddress, 
  setFormAddress, 
  editingAddressId, 
  onSave, 
  onCancel 
}: AddressFormProps) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {editingAddressId ? "Edit Address" : "Add New Address"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formAddress.first_name}
                onChange={(e) => setFormAddress({ ...formAddress, first_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formAddress.last_name}
                onChange={(e) => setFormAddress({ ...formAddress, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_1">Address Line 1</Label>
            <Input
              id="address_line_1"
              value={formAddress.address_line_1}
              onChange={(e) => setFormAddress({ ...formAddress, address_line_1: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
            <Input
              id="address_line_2"
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
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formAddress.postal_code}
                onChange={(e) => setFormAddress({ ...formAddress, postal_code: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formAddress.country} 
                onValueChange={(value) => setFormAddress({ ...formAddress, country: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formAddress.phone}
                onChange={(e) => setFormAddress({ ...formAddress, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Address Type</Label>
            <Select 
              value={formAddress.type} 
              onValueChange={(value) => setFormAddress({ ...formAddress, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shipping">Shipping</SelectItem>
                <SelectItem value="billing">Billing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_default"
              checked={formAddress.is_default}
              onCheckedChange={(checked) => 
                setFormAddress({ ...formAddress, is_default: checked as boolean })
              }
            />
            <Label htmlFor="is_default">Set as default address</Label>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit">
              {editingAddressId ? "Update Address" : "Add Address"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};