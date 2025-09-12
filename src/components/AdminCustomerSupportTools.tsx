import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ChatService, Conversation } from '@/services/chatService';
import { ChatWindow } from '@/components/ChatWindow';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Users, Clock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AdminCustomerSupportToolsProps {
  onBack?: () => void;
}

export const AdminCustomerSupportTools: React.FC<AdminCustomerSupportToolsProps> = ({ onBack }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkAdminStatus();
    loadConversations();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: 'Access Denied',
          description: 'You must be logged in to access this feature.',
          variant: 'destructive',
        });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin, role')
        .eq('user_id', session.user.id)
        .single();

      if (error || !profile?.is_admin) {
        toast({
          title: 'Access Denied',
          description: 'You must be an administrator to access customer support tools.',
          variant: 'destructive',
        });
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: 'Error',
        description: 'Failed to verify admin status.',
        variant: 'destructive',
      });
    }
  };

  const loadConversations = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const fetchedConversations = await ChatService.getAllConversations();
      setConversations(fetchedConversations);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p>You need administrator privileges to access customer support tools.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="outline" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Conversations
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={loadConversations} variant="outline" size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {loading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading conversations...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? 'No conversations match your search.' : 'No conversations yet.'}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full p-4 text-left hover:bg-muted transition-colors ${
                          selectedConversation === conversation.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm truncate">
                                {conversation.user_name || 'Unknown User'}
                              </span>
                              {conversation.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              {conversation.last_message}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(conversation.last_message_time)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2">
          {selectedConversation ? (
            <ChatWindow
              conversationId={selectedConversation}
              onClose={() => setSelectedConversation(null)}
            />
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                  <p>Choose a conversation from the list to start chatting with customers.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Conversations</p>
                <p className="text-2xl font-bold">{conversations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Active Users</p>
                <p className="text-2xl font-bold">{new Set(conversations.map(c => c.user_id)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Pending Responses</p>
                <p className="text-2xl font-bold">{conversations.filter(c => c.unread_count > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCustomerSupportTools;