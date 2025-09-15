import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChatMessage } from '@/services/chatService';
import { format } from 'date-fns';

interface MessageListProps {
  messages: ChatMessage[];
  loading: boolean;
  currentUserId?: string;
  isTyping?: boolean;
  typingInfo?: { isAdmin: boolean; name: string } | null;
}

const MessageList = ({ messages, loading, currentUserId, isTyping, typingInfo }: MessageListProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  const getMessageAlignment = (isFromAdmin: boolean, isOwn: boolean) => {
    if (isOwn && !isFromAdmin) return 'justify-end'; // User's own messages on the right
    return 'justify-start'; // Admin messages and other users' messages on the left
  };

  const getMessageBgColor = (isFromAdmin: boolean, isOwn: boolean) => {
    if (isOwn && !isFromAdmin) {
      return 'bg-primary text-primary-foreground'; // User's own messages
    }
    if (isFromAdmin) {
      return 'bg-blue-500 text-white'; // Admin messages
    }
    return 'bg-muted'; // Other messages
  };

  const getUserInitials = (user?: ChatMessage['user']) => {
    if (!user || !user.first_name && !user.last_name) return 'U';
    return `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  const getUserName = (message: ChatMessage) => {
    if (message.is_from_admin) return 'Admin';
    if (message.user && (message.user.first_name || message.user.last_name)) {
      return `${message.user.first_name || ''} ${message.user.last_name || ''}`.trim() || 'User';
    }
    return 'User';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full p-4 flex-1" ref={scrollAreaRef}>
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No messages yet.</p>
            <p className="text-xs mt-1">Start a conversation with our support team!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user_id === currentUserId;
            const userName = getUserName(message);
            const userInitials = getUserInitials(message.user);
            
            return (
              <div 
                key={message.id} 
                className={`flex items-end gap-2 ${getMessageAlignment(message.is_from_admin, isOwn)}`}
              >
                {/* Avatar - show on left for others, hide for own messages */}
                {(!isOwn || message.is_from_admin) && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className={message.is_from_admin ? 'bg-blue-100 text-blue-600' : 'bg-muted'}>
                      {message.is_from_admin ? 'A' : userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`max-w-[75%] flex-1 min-w-0 ${isOwn && !message.is_from_admin ? 'order-first' : ''}`}>
                  {/* Message bubble */}
                  <div className={`rounded-lg px-3 py-2 ${getMessageBgColor(message.is_from_admin, isOwn)}`}>
                    {/* Sender name for non-own messages */}
                    {(!isOwn || message.is_from_admin) && (
                      <p className="text-xs opacity-75 mb-1 font-medium">
                        {userName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                  </div>
                  
                  {/* Timestamp */}
                  <p className={`text-xs text-muted-foreground mt-1 ${
                    isOwn && !message.is_from_admin ? 'text-right' : 'text-left'
                  }`}>
                    {formatMessageTime(message.created_at)}
                  </p>
                </div>

                {/* Avatar - show on right for own messages */}
                {isOwn && !message.is_from_admin && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })
        )}
        
        {/* Typing indicators */}
        {isTyping && typingInfo && (
          <div className="flex items-end gap-2 justify-start">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarFallback className={typingInfo.isAdmin ? "bg-blue-100 text-blue-600" : "bg-muted"}>
                {typingInfo.isAdmin ? 'A' : typingInfo.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  {typingInfo.isAdmin ? 'Admin' : typingInfo.name} is typing
                </span>
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

export default MessageList;