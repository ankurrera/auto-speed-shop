import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Plus, MessageSquare, Search, Send, Calendar, User } from 'lucide-react';
import { SupportTicketService, SupportTicketWithDetails, SupportTicketMessageWithProfile } from '../services/supportTicketService';
import { useToast } from '../hooks/use-toast';

const UserSupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithDetails | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportTicketMessageWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'medium',
  });
  const { toast } = useToast();

  // In a real implementation, this would come from auth context
  const currentUserId = 'current-user-id';

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const ticketsData = await SupportTicketService.getUserTickets(currentUserId);
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your support tickets. Please try again.',
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

  const handleCreateTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await SupportTicketService.createTicket({
        user_id: currentUserId,
        subject: newTicket.subject,
        description: newTicket.description,
        category: newTicket.category || null,
        priority: newTicket.priority,
      });

      toast({
        title: 'Success',
        description: 'Support ticket created successfully!',
      });

      setIsCreateDialogOpen(false);
      setNewTicket({
        subject: '',
        description: '',
        category: '',
        priority: 'medium',
      });
      loadTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to create support ticket. Please try again.',
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
        user_id: currentUserId,
        message: replyMessage,
        is_admin: false,
      });

      toast({
        title: 'Success',
        description: 'Message sent successfully!',
      });

      setReplyMessage('');
      // Reload ticket messages
      const messages = await SupportTicketService.getTicketMessages(selectedTicket.id);
      setTicketMessages(messages);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
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

  const filteredTickets = tickets.filter(ticket =>
    ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading your tickets...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Support Tickets</h1>
          <p className="text-muted-foreground">
            Get help with your orders, account, or general inquiries
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search your tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Support Tickets</h3>
            <p className="text-muted-foreground text-center mb-4">
              You haven't created any support tickets yet. Create one to get help from our team.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Ticket
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => loadTicketDetail(ticket)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{ticket.ticket_number}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(ticket.status)}>
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </div>
                </div>
                <CardDescription className="text-base font-medium">
                  {ticket.subject}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 mb-4">
                  {ticket.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-muted-foreground">
                    {ticket.category && (
                      <span className="inline-flex items-center gap-1">
                        Category: {ticket.category}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Updated: {new Date(ticket.updated_at).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Describe your issue and we'll help you resolve it as soon as possible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                value={newTicket.subject}
                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                placeholder="Brief description of your issue"
              />
            </div>
            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                placeholder="Provide detailed information about your issue"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newTicket.category}
                onValueChange={(value) => setNewTicket({ ...newTicket, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Order Issues</SelectItem>
                  <SelectItem value="payment">Payment Problems</SelectItem>
                  <SelectItem value="shipping">Shipping & Delivery</SelectItem>
                  <SelectItem value="product">Product Questions</SelectItem>
                  <SelectItem value="account">Account Issues</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={newTicket.priority}
                onValueChange={(value) => setNewTicket({ ...newTicket, priority: value })}
              >
                <SelectTrigger>
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTicket}>Create Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  Created: {new Date(selectedTicket.created_at).toLocaleString()} | 
                  Last updated: {new Date(selectedTicket.updated_at).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Original Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Request</CardTitle>
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
                            <span className="font-medium text-sm flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {message.is_admin ? 'Support Team' : 'You'}
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

                {/* Reply Form - only show if ticket is not closed */}
                {selectedTicket.status !== 'closed' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Add Message</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Textarea
                          placeholder="Type your message..."
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsTicketDetailOpen(false)}
                >
                  Close
                </Button>
                {selectedTicket.status !== 'closed' && (
                  <Button
                    onClick={handleReplySubmit}
                    disabled={!replyMessage.trim() || isSubmittingReply}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmittingReply ? 'Sending...' : 'Send Message'}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserSupportTickets;