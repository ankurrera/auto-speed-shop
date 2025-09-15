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
  isAuthenticated?: boolean;
}

interface User {
  id: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const ChatWindow = ({ isOpen, onClose, isAuthenticated = false }: ChatWindowProps) => {
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

  // Get current user only if authenticated
  useEffect(() => {
    const getCurrentUser = async () => {
      if (!isAuthenticated) {
        setCurrentUser(null);
        return;
      }

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
  }, [isOpen, isAuthenticated]);

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
        console.log('[ChatWindow] User received new message:', {
          messageId: newMessage.id,
          isFromAdmin: newMessage.is_from_admin,
          senderType: newMessage.sender_type,
          messagePreview: newMessage.message.substring(0, 50) + (newMessage.message.length > 50 ? '...' : ''),
          userProfile: newMessage.user
        });
        
        // Check for duplicate messages to avoid showing the same message twice
        setMessages(prev => {
          const isDuplicate = prev.some(msg => msg.id === newMessage.id);
          if (isDuplicate) {
            console.log('[ChatWindow] Skipping duplicate message:', newMessage.id);
            return prev;
          }
          
          console.log('[ChatWindow] Adding new', newMessage.sender_type, 'message');
          return [...prev, newMessage];
        });
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

    console.log('[ChatWindow] User sending message:', {
      userId: currentUser.id,
      messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      isFromAdmin: false,
      senderType: 'user'
    });

    try {
      await ChatService.sendMessage({
        userId: currentUser.id,
        message: message.trim(),
        isFromAdmin: false
      });
      
      console.log('[ChatWindow] User message sent successfully');
      
      // Remove typing indicator after sending
      await ChatService.setTypingIndicator(currentUser.id, false);
    } catch (error) {
      console.error('[ChatWindow] Failed to send user message:', error);
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

  // Show authentication prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <div className={`fixed z-50 shadow-2xl ${
        isMobile 
          ? 'inset-0 p-4' 
          : 'bottom-4 right-4 w-96 h-[400px]'
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
          <CardContent className="flex-1 flex flex-col p-4">
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-4">
              <MessageCircle className="h-16 w-16 text-muted-foreground" />
              <div className="space-y-2 max-w-sm">
                <h3 className="text-lg font-semibold">Welcome to Customer Support</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign in to your account to start a conversation with our support team.
                  We're here to help with any questions about your orders, products, or account.
                </p>
              </div>
              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={() => window.location.href = '/account'}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors font-medium"
                >
                  Sign In to Chat
                </button>
                <p className="text-xs text-muted-foreground">
                  Don't have an account? <a href="/account" className="text-primary hover:underline font-medium">Sign up here</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`fixed z-50 shadow-2xl ${
      isMobile 
        ? 'inset-0 p-4' 
        : 'bottom-4 right-4 w-96 h-[500px]'
    }`}>
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-2 flex-shrink-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Support Chat
          </CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none p-1"
            aria-label="Close chat"
          >
            ✕
          </button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <div className="flex-1 overflow-hidden min-h-0">
            <MessageList 
              messages={messages}
              loading={loading}
              currentUserId={currentUser?.id}
              isTyping={isTyping}
              typingInfo={typingInfo}
            />
          </div>
          <div className="border-t p-4 flex-shrink-0">
            <MessageInput 
              onSendMessage={handleSendMessage}
              onTyping={handleTyping}
              disabled={!isAuthenticated || !currentUser}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatWindow;