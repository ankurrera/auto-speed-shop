import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Headphones,
  MessageCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatService, ChatMessage } from "@/services/chatService";
import { SupportTicketService, SupportTicket } from "@/services/supportTicketService";
import AdminChatConversation from "./AdminChatConversation";

interface CustomerSupportToolsProps {
  onBack: () => void;
}

const CustomerSupportTools = ({ onBack }: CustomerSupportToolsProps) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tickets");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0,
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
  });
  const { toast } = useToast();

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      };
      
      const [allTickets, stats] = await Promise.all([
        SupportTicketService.getAllTickets(filters),
        SupportTicketService.getTicketStats(),
      ]);
      
      setTickets(allTickets);
      setTicketStats(stats);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch support tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, toast]);

  const handleUpdateTicket = async (ticketId: string, updates: {
    status?: string;
    priority?: string;
    admin_response?: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      await SupportTicketService.updateTicket(ticketId, {
        ...updates,
        admin_id: session.user.id,
      });

      toast({
        title: 'Success',
        description: 'Ticket updated successfully',
      });

      // Refresh tickets
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to update ticket',
        variant: 'destructive',
      });
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ticket.user?.first_name + ' ' + ticket.user?.last_name).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const fetchChatMessages = useCallback(async () => {
    try {
      const conversations = await ChatService.getAllConversations();
      const allMessages: ChatMessage[] = [];
      
      conversations.forEach(conv => {
        allMessages.push(...conv.messages);
      });
      
      setChatMessages(allMessages);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch messages";
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: status as any, updated_at: new Date().toISOString() }
          : ticket
      ));

      toast({
        title: "Success",
        description: "Ticket status updated successfully"
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update ticket";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge variant="secondary" className="bg-orange-600">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const groupMessagesByUser = (messages: ChatMessage[]) => {
    const grouped = messages.reduce((acc, message) => {
      const key = message.user_id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(message);
      return acc;
    }, {} as Record<string, ChatMessage[]>);

    return Object.entries(grouped).map(([userId, userMessages]) => ({
      userId,
      user: userMessages[0].user,
      messages: userMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      lastMessage: userMessages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    }));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTickets(), fetchChatMessages()]).finally(() => setLoading(false));
  }, [fetchTickets, fetchChatMessages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading support data...</p>
        </div>
      </div>
    );
  }

  const groupedMessages = groupMessagesByUser(chatMessages);

  // If viewing a conversation, show that instead
  if (selectedConversation) {
    return (
      <AdminChatConversation
        userId={selectedConversation.userId}
        userName={selectedConversation.userName}
        userEmail={selectedConversation.userEmail}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Headphones className="h-5 w-5" />
          Customer Support Tools
        </CardTitle>
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tickets" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Support Tickets ({tickets.length})
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Chat Messages ({groupedMessages.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tickets" className="mt-6">
            {/* Filters and Search */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tickets Table */}
            {filteredTickets.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket #</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-mono font-medium">{ticket.ticket_number}</TableCell>
                        <TableCell className="max-w-xs">
                          <div>
                            <p className="font-medium truncate">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground">{ticket.category}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {ticket.user ? (
                            <div>
                              <p className="font-medium">{ticket.user.first_name} {ticket.user.last_name}</p>
                              <p className="text-xs text-muted-foreground">{ticket.user.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Unknown</span>
                          )}
                        </TableCell>
                        <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                        <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                        <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => setSelectedTicket(ticket)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {ticket.status !== 'resolved' && (
                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, 'resolved')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              )}
                              {ticket.status === 'open' && (
                                <DropdownMenuItem onClick={() => updateTicketStatus(ticket.id, 'in_progress')}>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Start Progress
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Headphones className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Tickets Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? "No tickets match your current filters." 
                    : "No support tickets available."
                  }
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="messages" className="mt-6">
            {groupedMessages.length > 0 ? (
              <div className="space-y-4">
                {groupedMessages.map(({ userId, user, messages, lastMessage }) => (
                  <Card key={userId} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                          <p className="text-sm text-muted-foreground">{user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>Last message</p>
                        <p>{new Date(lastMessage.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm">
                        <span className={`font-medium ${lastMessage.is_from_admin ? 'text-blue-600' : 'text-green-600'}`}>
                          {lastMessage.is_from_admin ? 'Admin' : user?.first_name}:
                        </span>
                        {' '}{lastMessage.message}
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedConversation({
                          userId,
                          userName: `${user?.first_name} ${user?.last_name}`,
                          userEmail: user?.email || ''
                        })}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        View Conversation
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Messages</h3>
                <p className="text-muted-foreground">
                  No customer chat messages available.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ticket Details - {selectedTicket?.ticket_number}</DialogTitle>
              <DialogDescription>
                Review and manage this support ticket
              </DialogDescription>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Customer</Label>
                    <p className="text-sm">{selectedTicket.user?.first_name} {selectedTicket.user?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTicket.user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-sm">{selectedTicket.category}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <div className="mt-1">{getPriorityBadge(selectedTicket.priority)}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm mt-1">{selectedTicket.subject}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm mt-1 p-3 bg-muted rounded">{selectedTicket.description}</p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  {selectedTicket.status !== 'resolved' && (
                    <Button 
                      onClick={() => {
                        updateTicketStatus(selectedTicket.id, 'resolved');
                        setSelectedTicket(null);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Resolved
                    </Button>
                  )}
                  {selectedTicket.status === 'open' && (
                    <Button 
                      variant="outline"
                      onClick={() => {
                        updateTicketStatus(selectedTicket.id, 'in_progress');
                        setSelectedTicket(null);
                      }}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Start Progress
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CustomerSupportTools;