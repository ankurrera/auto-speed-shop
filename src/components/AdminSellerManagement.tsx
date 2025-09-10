import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Edit, Plus, Store, Mail, Phone, MapPin, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/database.types";

type Seller = Database['public']['Tables']['sellers']['Row'];

interface SellerWithProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  user_id: string;
  created_at: string;
  profile_first_name: string | null;
  profile_last_name: string | null;
  profile_email: string | null;
}

const AdminSellerManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingSeller, setEditingSeller] = useState<SellerWithProfile | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  const { data: sellers, isLoading, error } = useQuery<SellerWithProfile[]>({
    queryKey: ['admin-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select(`
          id,
          name,
          email,
          phone,
          address,
          user_id,
          created_at,
          profiles!inner(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Flatten the profile data
      return (data || []).map(seller => ({
        ...seller,
        profile_first_name: seller.profiles?.first_name || null,
        profile_last_name: seller.profiles?.last_name || null,
        profile_email: seller.profiles?.email || null,
      })) as SellerWithProfile[];
    },
  });

  const updateSellerMutation = useMutation({
    mutationFn: async ({ sellerId, updates }: { sellerId: string, updates: Partial<Seller> }) => {
      const { error } = await supabase
        .from('sellers')
        .update(updates)
        .eq('id', sellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      toast({
        title: "Success",
        description: "Seller information updated successfully.",
      });
      setEditingSeller(null);
      setEditForm({ name: "", email: "", phone: "", address: "" });
    },
    onError: (err) => {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update seller information.",
        variant: "destructive",
      });
    },
  });

  const deleteSellerMutation = useMutation({
    mutationFn: async (sellerId: string) => {
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', sellerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sellers'] });
      toast({
        title: "Success",
        description: "Seller account deleted successfully.",
      });
    },
    onError: (err) => {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete seller account.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (seller: SellerWithProfile) => {
    setEditingSeller(seller);
    setEditForm({
      name: seller.name,
      email: seller.email,
      phone: seller.phone || "",
      address: seller.address || "",
    });
  };

  const handleSave = () => {
    if (!editingSeller) return;
    
    updateSellerMutation.mutate({
      sellerId: editingSeller.id,
      updates: editForm
    });
  };

  const handleDelete = (seller: SellerWithProfile) => {
    if (window.confirm(`Are you sure you want to delete seller "${seller.name}"? This action cannot be undone.`)) {
      deleteSellerMutation.mutate(seller.id);
    }
  };

  if (isLoading) {
    return <p>Loading sellers...</p>;
  }

  if (error) {
    return <p>Error loading sellers: {error.message}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Seller Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Total Sellers: {sellers?.length || 0}
            </p>
          </div>

          {sellers && sellers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Profile Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell className="font-medium">{seller.name}</TableCell>
                    <TableCell>{seller.email}</TableCell>
                    <TableCell>{seller.phone || "N/A"}</TableCell>
                    <TableCell>{seller.address || "N/A"}</TableCell>
                    <TableCell>
                      {seller.profile_first_name && seller.profile_last_name
                        ? `${seller.profile_first_name} ${seller.profile_last_name}`
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(seller)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Seller Information</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                  id="name"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  placeholder="Seller name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  placeholder="Email address"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                  id="phone"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  placeholder="Phone number"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                  id="address"
                                  value={editForm.address}
                                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                  placeholder="Business address"
                                />
                              </div>
                              <div className="flex gap-2 pt-4">
                                <Button onClick={handleSave} disabled={updateSellerMutation.isPending}>
                                  {updateSellerMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(seller)}
                          disabled={deleteSellerMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No sellers found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSellerManagement;