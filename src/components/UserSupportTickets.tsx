import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Calendar,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SupportTicketService, SupportTicket } from '@/services/supportTicketService';

const UserSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();

  // Form state for creating new ticket
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
  });

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'order', label: 'Order Issue' },
    { value: 'product', label: 'Product Question' },
    { value: 'shipping', label: 'Shipping & Delivery' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'technical', label: 'Technical Support' },
    { value: 'refund', label: 'Refund Request' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    { value: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-800', icon: MessageSquare },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  ];

  // Load user tickets
  useEffect(() => {
    loadTickets();
    
    // Subscribe to real-time updates
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        loadTickets();
        
        // Subscribe to ticket updates
        const ticketSubscription = SupportTicketService.subscribeToTicketUpdates(
          session.user.id,
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              loadTickets(); // Refresh the tickets list
              if (payload.eventType === 'UPDATE' && payload.new.admin_response) {
                toast({
                  title: 'Ticket Updated',
                  description: `Admin responded to your ticket: ${payload.new.subject}`,
                });
              }
            }
          }
        );

        return () => {
          ticketSubscription.unsubscribe();
        };
      }
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, [toast]);

  const loadTickets = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const userTickets = await SupportTicketService.getUserTickets(session.user.id);
      setTickets(userTickets);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      await SupportTicketService.createTicket({
        userId: session.user.id,
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category,
        priority: newTicket.priority,
      });

      toast({
        title: 'Success',
        description: 'Support ticket created successfully',
      });

      // Reset form and close dialog
      setNewTicket({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
      });
      setIsCreateDialogOpen(false);
      
      // Reload tickets
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create support ticket',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statuses.find(s => s.value === status);
    if (!statusConfig) return null;
    
    const Icon = statusConfig.icon;
    return (
      <Badge className={statusConfig.color} variant="secondary">
        <Icon className="w-3 h-3 mr-1" />
        {statusConfig.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = priorities.find(p => p.value === priority);
    if (!priorityConfig) return null;
    
    return (
      <Badge className={priorityConfig.color} variant="secondary">
        {priorityConfig.label}
      </Badge>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filter === 'all') return true;
    return ticket.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
          <p className="text-muted-foreground">
            Get help with your orders, products, or account
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
              <DialogDescription>
                Describe your issue and we'll help you resolve it as quickly as possible.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTicket.priority} onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          {priority.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Please provide detailed information about your issue..."
                  className="min-h-[120px]"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateTicket} disabled={creating}>
                {creating ? 'Creating...' : 'Create Ticket'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filter:</span>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ticket className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground text-center">
              {filter === 'all' 
                ? "You haven't created any support tickets yet. Click 'Create Ticket' to get started."
                : `No tickets with status '${filter}' found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Support Tickets ({filteredTickets.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">
                      {ticket.ticket_id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.subject}</div>
                        {ticket.admin_response && (
                          <div className="text-sm text-muted-foreground mt-1">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Admin responded
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{ticket.category}</span>
                    </TableCell>
                    <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                    <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(ticket.updated_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSupportTickets;