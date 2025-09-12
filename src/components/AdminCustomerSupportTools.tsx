import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Search, MessageSquare, Clock, CheckCircle, AlertCircle, User, MessageCircle } from 'lucide-react';
import { SupportTicketService, SupportTicketWithDetails, SupportTicketMessageWithProfile } from '../services/supportTicketService';
import { useToast } from '../hooks/use-toast';

const AdminCustomerSupportTools: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithDetails | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [stats, setStats] = useState({
    total_tickets: 0,
    open_tickets: 0,
    in_progress_tickets: 0,
    resolved_tickets: 0,
    closed_tickets: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ticketsData, statsData] = await Promise.all([
        SupportTicketService.getAllTickets(),
        SupportTicketService.getTicketStats(),
      ]);
      setTickets(ticketsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load support tickets. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetail = async (ticket: SupportTicketWithDetails) => {
    try {
      const messages = await SupportTicketService.getTicketMessages(ticket.id);
      setTicketMessages(messages);
      setSelectedTicket(ticket);
      setIsTicketDetailOpen(true);
    } catch (error) {
      console.error('Error loading ticket details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      await SupportTicketService.updateTicket(ticketId, { status: newStatus });
      toast({
        title: 'Success',
        description: 'Ticket status updated successfully!',
      });
      loadData();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePriorityUpdate = async (ticketId: string, newPriority: string) => {
    try {
      await SupportTicketService.updateTicket(ticketId, { priority: newPriority });
      toast({
        title: 'Success',
        description: 'Ticket priority updated successfully!',
      });
      loadData();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, priority: newPriority });
      }
    } catch (error) {
      console.error('Error updating ticket priority:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket priority. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    try {
      setIsSubmittingReply(true);
      await SupportTicketService.addMessage({
        ticket_id: selectedTicket.id,
        user_id: 'admin-user-id', // This should be the current admin user ID
        message: replyMessage,
        is_admin: true,
      });
      
      toast({
        title: 'Success',
        description: 'Reply sent successfully!',
      });
      
      setReplyMessage('');
      // Reload ticket messages
      const messages = await SupportTicketService.getTicketMessages(selectedTicket.id);
      setTicketMessages(messages);
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'resolved':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const StatCard = ({ title, value, icon: Icon, className = '' }: {
    title: string;
    value: number;
    icon: React.ElementType;
    className?: string;
  }) => (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading support tickets...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Customer Support</h1>
          <p className="text-muted-foreground">Manage customer support tickets and inquiries</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="Total Tickets"
          value={stats.total_tickets}
          icon={MessageSquare}
        />
        <StatCard
          title="Open"
          value={stats.open_tickets}
          icon={AlertCircle}
          className="border-red-200"
        />
        <StatCard
          title="In Progress"
          value={stats.in_progress_tickets}
          icon={Clock}
          className="border-yellow-200"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved_tickets}
          icon={CheckCircle}
          className="border-green-200"
        />
        <StatCard
          title="Closed"
          value={stats.closed_tickets}
          icon={MessageCircle}
          className="border-gray-200"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Manage customer support requests and inquiries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                onClick={() => loadTicketDetail(ticket)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{ticket.ticket_number}</h3>
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <h4 className="font-medium mb-1">{ticket.subject}</h4>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {ticket.description}
                  </p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {ticket.profiles?.email || 'Unknown User'}
                    </span>
                    <span>
                      Created: {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      Updated: {new Date(ticket.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusUpdate(ticket.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={ticket.priority}
                    onValueChange={(value) => handlePriorityUpdate(ticket.id, value)}
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No tickets found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={isTicketDetailOpen} onOpenChange={setIsTicketDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTicket.ticket_number} - {selectedTicket.subject}
                  <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                  <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Customer: {selectedTicket.profiles?.email} | 
                  Created: {new Date(selectedTicket.created_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Original Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Original Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{selectedTicket.description}</p>
                  </CardContent>
                </Card>

                {/* Messages */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Conversation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {ticketMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg ${
                            message.is_admin
                              ? 'bg-blue-50 border-l-4 border-blue-500 ml-8'
                              : 'bg-gray-50 border-l-4 border-gray-500 mr-8'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">
                              {message.is_admin ? 'Support Team' : message.profiles?.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Reply Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Send Reply</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsTicketDetailOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={handleReplySubmit}
                  disabled={!replyMessage.trim() || isSubmittingReply}
                >
                  {isSubmittingReply ? 'Sending...' : 'Send Reply'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomerSupportTools;