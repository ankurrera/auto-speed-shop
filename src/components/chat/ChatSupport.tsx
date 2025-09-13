import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import ChatWindow from './ChatWindow';

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authError, setAuthError] = useState(false);
  const isMobile = useIsMobile();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.warn('Auth session error:', error.message);
          setAuthError(true);
          setIsLoggedIn(false);
          return;
        }
        
        setIsLoggedIn(!!session);
        setAuthError(false);
      } catch (error) {
        console.error('Failed to check auth status:', error);
        setAuthError(true);
        setIsLoggedIn(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      setAuthError(false);
      
      // Close chat if user logs out
      if (!session) {
        setIsOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show chat if user is not logged in or has auth errors
  if (!isLoggedIn || authError) {
    return null;
  }

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className={`fixed shadow-lg z-40 hover:scale-105 transition-transform ${
            isMobile 
              ? 'bottom-6 right-6 h-16 w-16 rounded-full' 
              : 'bottom-4 right-4 h-14 w-14 rounded-full'
          }`}
          size="icon"
        >
          <MessageCircle className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'}`} />
        </Button>
      )}

      {/* Chat window */}
      <ChatWindow 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
};

export default ChatSupport;