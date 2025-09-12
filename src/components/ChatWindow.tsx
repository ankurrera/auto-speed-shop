import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatService } from '@/services/chatService';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/database.types';
import { Send, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];

interface ChatWindowProps {
  conversationId?: string;
  onClose?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId) return;
    
    setLoading(true);
    try {
      const fetchedMessages = await ChatService.getMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !userId) return;

    setSending(true);
    try {
      let currentConversationId = conversationId;
      
      // If no conversation ID, create a new conversation
      if (!currentConversationId) {
        currentConversationId = await ChatService.createConversation(userId, newMessage);
      } else {
        await ChatService.sendMessage(currentConversationId, newMessage, userId, false);
      }

      setNewMessage('');
      await loadMessages();
      
      toast({
        title: 'Message sent',
        description: 'Your message has been sent successfully.',
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="w-full max-w-md h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Support
          </CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-4">
        <ScrollArea className="flex-1 w-full pr-4">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="text-sm text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-20">
              <div className="text-sm text-muted-foreground">No messages yet. Start a conversation!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.user_id === userId ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                      message.user_id === userId
                        ? 'bg-primary text-primary-foreground'
                        : message.is_admin
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <div className="break-words">{message.message}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.user_id === userId || message.is_admin
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatMessageTime(message.created_at)}
                      {message.is_admin && ' • Admin'}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <form onSubmit={handleSendMessage} className="flex gap-2 mt-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending || !userId}
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={sending || !newMessage.trim() || !userId}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
        
        {!userId && (
          <div className="text-xs text-muted-foreground mt-2 text-center">
            Please log in to send messages
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChatWindow;