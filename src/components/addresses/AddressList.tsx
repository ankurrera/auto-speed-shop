import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

interface AddressListProps {
  addresses: Address[];
  onEdit: (address: Address) => void;
  onDelete: (addressId: string) => void;
  onSetDefault: (addressId: string) => void;
}

export const AddressList = ({ addresses, onEdit, onDelete, onSetDefault }: AddressListProps) => {
  if (addresses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No addresses found</h3>
          <p className="text-muted-foreground text-center">
            Add your first address to get started with faster checkout.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <Card key={address.id}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">
                    {address.first_name} {address.last_name}
                  </h3>
                  <Badge variant={address.type === 'shipping' ? 'default' : 'secondary'}>
                    {address.type}
                  </Badge>
                  {address.is_default && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{address.address_line_1}</p>
                  {address.address_line_2 && <p>{address.address_line_2}</p>}
                  <p>
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                  {address.phone && <p>Phone: {address.phone}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(address)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                
                {!address.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => address.id && onSetDefault(address.id)}
                  >
                    Set Default
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (address.id && confirm("Are you sure you want to delete this address?")) {
                      onDelete(address.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};