import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ChatWindow from './ChatWindow';

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      
      // Close chat if user logs out
      if (!session) {
        setIsOpen(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't show chat if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* Floating chat button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg z-40 hover:scale-105 transition-transform"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
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