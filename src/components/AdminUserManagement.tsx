import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy, Crown, Medal, Trash2, ShieldCheck, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/database.types";

type Profile = Database['public']['Tables']['profiles']['Row'];

// Define a new type that matches the fields selected in the query
type UserWithOrderCount = {
  user_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean | null;
  is_seller: boolean | null;
  order_count: number;
  rank: number;
};

const AdminUserManagement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading, error } = useQuery<UserWithOrderCount[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get users with their order counts
      const { data, error } = await supabase.rpc('get_users_with_order_count');
      
      if (error) {
        // Fallback to simple query if the function doesn't exist
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select(`
            user_id, 
            email, 
            first_name, 
            last_name, 
            is_admin, 
            is_seller
          `)
          .eq('is_admin', false)
          .eq('is_seller', false)
          .order('created_at', { ascending: false });
        
        if (fallbackError) throw fallbackError;
        
        // Add order_count and rank manually for fallback
        return (fallbackData || []).map((user, index) => ({
          ...user,
          order_count: 0,
          rank: index + 1
        })) as UserWithOrderCount[];
      }
      
      // Add rank based on order count
      return (data || []).map((user: any, index: number) => ({
        ...user,
        rank: index + 1
      })) as UserWithOrderCount[];
    },
  });

  const updateAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string, isAdmin: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: isAdmin }) // Use boolean directly
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    },
    onError: (err) => {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (error) throw error;
      // In a real-world scenario, you would also delete the user from Supabase auth.
      // `await supabase.auth.admin.deleteUser(userId);`
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Success",
        description: "User deleted successfully.",
      });
    },
    onError: (err) => {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-1 text-yellow-500 font-bold">
          <Crown className="h-4 w-4" />
          #{rank}
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-1 text-gray-400 font-bold">
          <Trophy className="h-4 w-4" />
          #{rank}
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-1 text-amber-600 font-bold">
          <Medal className="h-4 w-4" />
          #{rank}
        </div>
      );
    }
    return (
      <div className="font-medium text-muted-foreground">
        #{rank}
      </div>
    );
  };

  const handleDeleteUser = (userId: string) => {
    // Replaced window.confirm with a toast-based message as per instructions
    toast({
      title: "Confirm Deletion",
      description: "Are you sure you want to delete this user? This action cannot be undone.",
      action: (
        <Button
          variant="destructive"
          onClick={() => deleteUserMutation.mutate(userId)}
        >
          Confirm
        </Button>
      ),
    });
  };

  if (isLoading) {
    return <p>Loading users...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error loading users: {error.message}</p>;
  }

  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <User className="h-5 w-5" />
          Manage Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Is Admin</TableHead>
              <TableHead>Is Seller</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="font-medium text-center">
                  {getRankBadge(user.rank)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.email?.split('@')[0] || 'Unknown User'}
                    </span>
                    {user.first_name && user.last_name && (
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {user.first_name && user.last_name ? user.email : '-'}
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-primary">{user.order_count}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`admin-switch-${user.user_id}`}
                      checked={user.is_admin === true}
                      onCheckedChange={(checked) => updateAdminStatusMutation.mutate({ userId: user.user_id, isAdmin: checked })}
                    />
                    <Label htmlFor={`admin-switch-${user.user_id}`} className="sr-only">Toggle Admin</Label>
                  </div>
                </TableCell>
                <TableCell>{user.is_seller === true ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.user_id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete User</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminUserManagement;
