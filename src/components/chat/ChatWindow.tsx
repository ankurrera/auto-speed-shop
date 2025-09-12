import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ChatService, ChatMessage } from '@/services/chatService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatWindow = ({ isOpen, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Refs for managing subscriptions and cleanup
  const subscriptionRef = useRef<any>(null);
  const typingSubscriptionRef = useRef<any>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Also get user profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('user_id', user.id)
          .single();
        
        setCurrentUser({
          ...user,
          profile: profile || {}
        });
      }
    };

    if (isOpen) {
      getCurrentUser();
    }
  }, [isOpen]);

  // Load messages when chat opens
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    const loadMessages = async () => {
      setLoading(true);
      try {
        const chatMessages = await ChatService.getMessages(currentUser.id);
        setMessages(chatMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({
          title: 'Error',
          description: 'Failed to load chat messages',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [currentUser, isOpen, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!currentUser || !isOpen) return;

    // Subscribe to new messages
    subscriptionRef.current = ChatService.subscribeToMessages(
      currentUser.id,
      (newMessage: ChatMessage) => {
        setMessages(prev => [...prev, newMessage]);
      }
    );

    // Subscribe to typing indicators
    typingSubscriptionRef.current = ChatService.subscribeToTypingIndicators(
      currentUser.id,
      (indicators) => {
        const adminTyping = indicators.filter(ind => ind.is_admin && ind.user_id !== currentUser.id);
        setTypingUsers(adminTyping.length > 0 ? ['Admin'] : []);
      }
    );

    // Cleanup old typing indicators periodically
    const cleanupInterval = setInterval(() => {
      ChatService.cleanupTypingIndicators();
    }, 10000);

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
      if (typingSubscriptionRef.current) {
        supabase.removeChannel(typingSubscriptionRef.current);
      }
      clearInterval(cleanupInterval);
    };
  }, [currentUser, isOpen]);

  // Handle sending messages
  const handleSendMessage = useCallback(async (message: string) => {
    if (!currentUser || !message.trim()) return;

    try {
      await ChatService.sendMessage({
        userId: currentUser.id,
        message: message.trim(),
        isFromAdmin: false
      });
      
      // Remove typing indicator after sending
      await ChatService.removeTypingIndicator({
        userId: currentUser.id,
        conversationUserId: currentUser.id
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  }, [currentUser, toast]);

  // Handle typing indicator
  const handleTyping = useCallback(async () => {
    if (!currentUser) return;

    try {
      await ChatService.setTypingIndicator({
        userId: currentUser.id,
        conversationUserId: currentUser.id,
        isAdmin: false
      });

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to remove typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await ChatService.removeTypingIndicator({
            userId: currentUser.id,
            conversationUserId: currentUser.id
          });
        } catch (error) {
          console.error('Failed to remove typing indicator:', error);
        }
      }, 3000);
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50 shadow-2xl">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Support Chat
          </CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-hidden">
            <MessageList 
              messages={messages}
              loading={loading}
              currentUserId={currentUser?.id}
              typingUsers={typingUsers}
            />
          </div>
          <div className="border-t p-4">
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={!currentUser}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWindow;