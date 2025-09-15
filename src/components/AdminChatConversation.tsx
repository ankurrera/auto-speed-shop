import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatService, ChatMessage } from '@/services/chatService';

interface AdminChatConversationProps {
  userId: string;
  userName: string;
  userEmail: string;
  onBack: () => void;
}

const AdminChatConversation = ({ userId, userName, userEmail, onBack }: AdminChatConversationProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{id: string} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<ReturnType<typeof ChatService.subscribeToMessages> | null>(null);
  const { toast } = useToast();

  // Get current admin user
  useEffect(() => {
    const getCurrentAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentAdmin(user);
      }
    };
    getCurrentAdmin();
  }, []);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const chatMessages = await ChatService.getMessages(userId);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load conversation',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [userId, toast]);

  // Set up real-time subscription using the enhanced instant messages
  useEffect(() => {
    if (!currentAdmin) return;

    console.log('[AdminChatConversation] Setting up real-time subscription for user:', userId);

    // Use the enhanced subscription that handles both user and admin messages
    // This addresses the requirement to listen for 'newMessage' events regardless of sender type
    subscriptionRef.current = ChatService.subscribeToInstantMessages(
      userId,
      (newMessage: ChatMessage) => {
        console.log('[AdminChatConversation] Received', newMessage.sender_type, 'message:', {
          messageId: newMessage.id,
          isFromAdmin: newMessage.is_from_admin,
          senderType: newMessage.sender_type,
          messagePreview: newMessage.message.substring(0, 50)
        });

        // Check for duplicate messages to avoid showing the same message twice
        setMessages(prev => {
          const isDuplicate = prev.some(msg => msg.id === newMessage.id);
          if (isDuplicate) {
            console.log('[AdminChatConversation] Skipping duplicate message:', newMessage.id);
            return prev;
          }
          
          console.log('[AdminChatConversation] Adding new', newMessage.sender_type, 'message to conversation');
          return [...prev, newMessage];
        });
      }
    );

    return () => {
      if (subscriptionRef.current) {
        console.log('[AdminChatConversation] Cleaning up subscription for user:', userId);
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, currentAdmin]);

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Use a slight delay to ensure the DOM has updated
    const timeoutId = setTimeout(scrollToBottom, 100);
    
    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!newMessage.trim() || sending || !currentAdmin) return;

    console.log('[AdminChatConversation] Admin sending message:', {
      userId: userId,
      adminId: currentAdmin.id,
      messagePreview: newMessage.trim().substring(0, 50)
    });

    setSending(true);
    try {
      const sentMessage = await ChatService.sendMessage({
        userId: userId,
        message: newMessage.trim(),
        isFromAdmin: true,
        adminId: currentAdmin.id
      });
      
      console.log('[AdminChatConversation] Admin message sent successfully:', {
        messageId: sentMessage.id,
        senderType: sentMessage.sender_type
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('[AdminChatConversation] Failed to send admin message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSending(false);
    }
  }, [newMessage, sending, currentAdmin, userId, toast]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle className="text-lg">{userName}</CardTitle>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading conversation...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No messages in this conversation yet.</p>
            </div>
          ) : (
            <>
              {/* Render ALL messages without filtering - both user and admin messages are displayed */}
              {/* This addresses the requirement to "render both types of messages in the chat thread" */}
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`flex ${message.is_from_admin ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    message.is_from_admin 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                    <p className={`text-xs mt-1 ${
                      message.is_from_admin ? 'text-blue-100' : 'text-muted-foreground'
                    }`}>
                      {/* Display sender type and name clearly with email */}
                      {message.sender_type === 'admin' ? (
                        message.admin ? 
                          `Admin ${message.admin.first_name || 'Unknown'} ${message.admin.last_name || 'User'} (${message.admin.email || 'No email'})`.trim() :
                          'Admin (Unknown)'
                      ) : (
                        message.user ? 
                          `${message.user.first_name || 'Unknown'} ${message.user.last_name || 'User'} (${message.user.email || userEmail})`.trim() :
                          `${userName} (${userEmail})`
                      )} • {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message input */}
        <div className="border-t p-4 flex-shrink-0">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={sending}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminChatConversation;