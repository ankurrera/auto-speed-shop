import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  MessageCircle, 
  X, 
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Send
} from "lucide-react";

interface SupportTicket {
  id: string;
  ticket_number: string;
  user_email: string;
  user_name: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
}

const AdminCustomerSupport = ({ onBack }: { onBack: () => void }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch support tickets
  const { data: tickets, isLoading, refetch } = useQuery<SupportTicket[]>({
    queryKey: ['admin-support-tickets', statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_get_support_tickets', {
          requesting_user_id: user.id,
          ticket_status: statusFilter === 'all' ? null : statusFilter,
          limit_count: 100
        });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Update ticket status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, newStatus }: { ticketId: string, newStatus: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('admin_update_ticket_status', {
          requesting_user_id: user.id,
          ticket_id: ticketId,
          new_status: newStatus
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast({
            title: "Success",
            description: result.message,
          });
          queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add reply to ticket mutation
  const addReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string, message: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('add_ticket_message', {
          requesting_user_id: user.id,
          ticket_id: ticketId,
          message_text: message,
          is_internal_message: false
        });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        const result = data[0];
        if (result.success) {
          toast({
            title: "Success",
            description: "Reply sent successfully",
          });
          setReplyMessage("");
          // Update ticket status to in_progress if it was open
          if (selectedTicket?.status === 'open') {
            updateStatusMutation.mutate({
              ticketId: selectedTicket.id,
              newStatus: 'in_progress'
            });
          }
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'in_progress':
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case 'resolved':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case 'closed':
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case 'high':
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case 'medium':
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case 'low':
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    addReplyMutation.mutate({
      ticketId: selectedTicket.id,
      message: replyMessage.trim()
    });
  };

  if (isLoading) {
    return <p>Loading support tickets...</p>;
  }

  if (selectedTicket) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Ticket Details - {selectedTicket.ticket_number}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
            <X className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ticket Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedTicket.user_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedTicket.user_email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Subject</p>
                    <p className="font-semibold">{selectedTicket.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <Badge variant="outline" className="capitalize">
                      {selectedTicket.category}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(selectedTicket.status)}>
                      {getStatusIcon(selectedTicket.status)}
                      <span className="ml-1 capitalize">{selectedTicket.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <Badge className={getPriorityColor(selectedTicket.priority)}>
                      <span className="capitalize">{selectedTicket.priority}</span>
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p>{new Date(selectedTicket.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Original Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{selectedTicket.description}</p>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Update Status</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({
                      ticketId: selectedTicket.id,
                      newStatus: 'in_progress'
                    })}
                    disabled={selectedTicket.status === 'in_progress'}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({
                      ticketId: selectedTicket.id,
                      newStatus: 'resolved'
                    })}
                    disabled={selectedTicket.status === 'resolved'}
                  >
                    Mark Resolved
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({
                      ticketId: selectedTicket.id,
                      newStatus: 'closed'
                    })}
                    disabled={selectedTicket.status === 'closed'}
                  >
                    Close Ticket
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Send Reply</p>
                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply to the customer..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() || addReplyMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Customer Support
        </CardTitle>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={onBack}>
            <X className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Open</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {tickets?.filter(t => t.status === 'open').length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {tickets?.filter(t => t.status === 'in_progress').length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Resolved</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {tickets?.filter(t => t.status === 'resolved').length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <MessageCircle className="h-4 w-4 text-gray-500" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">
                        {tickets?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets Table */}
          {tickets && tickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      {ticket.ticket_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.user_name}</div>
                        <div className="text-sm text-muted-foreground">{ticket.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {ticket.subject}
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(ticket.status)}>
                        {getStatusIcon(ticket.status)}
                        <span className="ml-1 capitalize">{ticket.status.replace('_', ' ')}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {ticket.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No support tickets found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminCustomerSupport;