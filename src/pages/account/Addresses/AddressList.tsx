import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AddressListProps {
  addresses: any[];
  onAddNew: () => void;
  onEdit: (address: any) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}

const AddressList = ({ addresses, onAddNew, onEdit, onDelete, onSetDefault }: AddressListProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Saved Addresses
        </h2>
        <Button onClick={onAddNew}>
          Add New Address
        </Button>
      </div>

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
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {address.first_name} {address.last_name}
                  </p>
                  <p>{address.address_line_1}</p>
                  {address.address_line_2 && (
                    <p>{address.address_line_2}</p>
                  )}
                  <p>
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p>{address.country}</p>
                  {address.phone && (
                    <p className="mt-2 text-muted-foreground">
                      {address.phone}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(address)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(address.id)}
                  >
                    Delete
                  </Button>
                  {!address.is_default && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onSetDefault(address.id)}
                    >
                      Set Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2 text-center text-muted-foreground py-8">
            No saved addresses yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressList;