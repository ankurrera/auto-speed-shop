import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Search, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatService } from '@/services/chatService';
import AdminChatConversation from './AdminChatConversation';

interface Conversation {
  userId: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
  lastMessage: {
    message: string;
    created_at: string;
    is_from_admin: boolean;
  };
  unreadCount: number;
}

const AdminCustomerSupport = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  // Check if current user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('user_id', user.id)
        .single();

      setIsAdmin(profile?.is_admin || false);
    };

    checkAdminStatus();
  }, []);

  // Load conversations
  useEffect(() => {
    if (!isAdmin) return;

    const loadConversations = async () => {
      setLoading(true);
      try {
        const allConversations = await ChatService.getAllConversations();
        
        // Filter out conversations with null user data
        const validConversations = allConversations.filter(conv => conv.user != null);
        
        // Calculate unread count for each conversation (messages from users that admins haven't responded to)
        const conversationsWithUnread = await Promise.all(
          validConversations.map(async (conv) => {
            const { data: unreadMessages } = await supabase
              .from('chat_messages')
              .select('id')
              .eq('user_id', conv.userId)
              .eq('is_from_admin', false)
              .gt('created_at', conv.lastMessage?.created_at || '1970-01-01');
            
            return {
              ...conv,
              unreadCount: unreadMessages?.length || 0
            };
          })
        );

        setConversations(conversationsWithUnread);
      } catch (error) {
        console.error('Failed to load conversations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customer conversations',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadConversations();

    // Set up real-time subscription for new messages
    const subscription = ChatService.subscribeToAllMessages((newMessage) => {
      // Refresh conversations when new messages arrive
      loadConversations();
    });

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [isAdmin, toast]);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    // Skip conversations with null user data
    if (!conv.user) {
      return false;
    }
    
    const searchLower = searchQuery.toLowerCase();
    const userName = `${conv.user.first_name || ''} ${conv.user.last_name || ''}`.toLowerCase().trim();
    const userEmail = conv.user.email?.toLowerCase() || '';
    const lastMessage = conv.lastMessage?.message.toLowerCase() || '';
    
    return userName.includes(searchLower) || 
           userEmail.includes(searchLower) || 
           lastMessage.includes(searchLower);
  });

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = Math.abs(now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">You need admin privileges to access customer support.</p>
        </CardContent>
      </Card>
    );
  }

  if (selectedConversation) {
    return (
      <AdminChatConversation
        userId={selectedConversation.userId}
        userName={`${selectedConversation.user?.first_name || 'Unknown'} ${selectedConversation.user?.last_name || 'User'}`}
        userEmail={selectedConversation.user?.email || 'No email available'}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Customer Support Messages</CardTitle>
            {getTotalUnreadCount() > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {getTotalUnreadCount()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {conversations.length} conversations
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading conversations...</p>
            </div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No matches found' : 'No customer messages yet'}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Customer support messages will appear here when users start conversations.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.userId}
                className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {conversation.user?.first_name || 'Unknown'} {conversation.user?.last_name || 'User'}
                      </h4>
                      {conversation.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {conversation.user?.email || 'No email available'}
                    </p>
                    {conversation.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage.is_from_admin ? 'Admin: ' : ''}
                        {conversation.lastMessage.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {conversation.lastMessage && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(conversation.lastMessage.created_at)}
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      Open Chat
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCustomerSupport;