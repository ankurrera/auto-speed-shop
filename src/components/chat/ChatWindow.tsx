import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ChatService, ChatMessage } from '@/services/chatService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const ChatWindow = ({ isOpen, onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingInfo, setTypingInfo] = useState<{ isAdmin: boolean; name: string } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Refs for managing subscriptions and cleanup
  const subscriptionRef = useRef<ReturnType<typeof ChatService.subscribeToInstantMessages> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.warn('Error getting current user:', userError.message);
          return;
        }
        
        if (user) {
          // Also get user profile data
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, email')
            .eq('user_id', user.id)
            .single();
          
          if (profileError) {
            console.warn('Error getting user profile:', profileError.message);
            // Still set user even if profile is missing
            setCurrentUser({
              id: user.id,
              profile: {}
            });
          } else {
            setCurrentUser({
              id: user.id,
              profile: profile || {}
            });
          }
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
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

    // Subscribe to instant messages and typing indicators
    subscriptionRef.current = ChatService.subscribeToInstantMessages(
      currentUser.id,
      (newMessage: ChatMessage) => {
        setMessages(prev => [...prev, newMessage]);
      },
      (isTypingNow: boolean, userInfo?: { isAdmin: boolean; name: string }) => {
        setIsTyping(isTypingNow);
        setTypingInfo(userInfo || null);
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
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
      await ChatService.setTypingIndicator(currentUser.id, false);
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
      await ChatService.setTypingIndicator(currentUser.id, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to remove typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await ChatService.setTypingIndicator(currentUser.id, false);
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
    <div className={`fixed z-50 shadow-2xl ${
      isMobile 
        ? 'inset-0 p-4' 
        : 'bottom-4 right-4 w-96 h-[500px]'
    }`}>
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
              isTyping={isTyping}
              typingInfo={typingInfo}
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