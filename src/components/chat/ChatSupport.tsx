import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ChatService } from '@/services/chatService';
import ChatWindow from './ChatWindow';

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const subscriptionRef = useRef<ReturnType<typeof ChatService.subscribeToInstantMessages> | null>(null);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Auth session error:', error.message);
          setAuthError(true);
          setIsLoggedIn(false);
          setCurrentUserId(null);
          return;
        }
        
        setIsLoggedIn(!!session);
        setCurrentUserId(session?.user?.id || null);
        setAuthError(false);
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setAuthError(true);
        setIsLoggedIn(false);
        setCurrentUserId(null);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setCurrentUserId(session?.user?.id || null);
      setAuthError(false);
      
      // Close chat if user logs out
      if (!session) {
        setIsOpen(false);
        setHasUnreadMessages(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up notification system for logged in users
  useEffect(() => {
    if (!isLoggedIn || !currentUserId || isOpen) {
      // Clear unread indicator when chat is open or user is not logged in
      setHasUnreadMessages(false);
      return;
    }

    // Subscribe to new messages to show notification badge
    subscriptionRef.current = ChatService.subscribeToInstantMessages(
      currentUserId,
      (newMessage) => {
        // Only show notification for admin messages when chat is closed
        if (newMessage.is_from_admin && !isOpen) {
          setHasUnreadMessages(true);
          
          // Optional: Auto-open chat for admin messages
          // setIsOpen(true);
        }
      }
    );

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [isLoggedIn, currentUserId, isOpen]);

  // Clear unread messages when chat is opened
  const handleOpenChat = () => {
    setIsOpen(true);
    setHasUnreadMessages(false);
  };

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <Button
          onClick={handleOpenChat}
          className={`fixed shadow-lg z-40 hover:scale-105 transition-transform relative ${
            isMobile 
              ? 'bottom-6 right-6 h-16 w-16 rounded-full' 
              : 'bottom-4 right-4 h-14 w-14 rounded-full'
          }`}
          size="icon"
        >
          <MessageCircle className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'}`} />
          
          {/* Notification badge */}
          {hasUnreadMessages && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="h-2 w-2 bg-white rounded-full animate-pulse"></span>
            </span>
          )}
        </Button>
      )}

      {/* Chat window */}
      <ChatWindow 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        isAuthenticated={isLoggedIn && !authError}
      />
    </>
  );
};

export default ChatSupport;